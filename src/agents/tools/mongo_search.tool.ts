// @ts-nocheck
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { MongoClient, Db, ObjectId } from "mongodb";
import config from "../../config/config";
import logger from "../../utils/logger";

let mongoClient: MongoClient | null = null;

async function getDb(): Promise<Db> {
  if (!mongoClient) {
    mongoClient = new MongoClient(config.MONGO_URI);
    await mongoClient.connect();
  }
  return mongoClient.db(config.DB_NAME);
}

// ==========================================
// Read-Only Guard
// Prevents any write operations from being
// executed through this tool, regardless of
// what the LLM generates.
// ==========================================
const BLOCKED_STAGES = ["$out", "$merge", "$indexStats", "$currentOp"];
const BLOCKED_OPERATORS = ["$set", "$unset", "$push", "$pull", "$addToSet", "$rename", "$inc"];

function assertReadOnly(pipeline?: any[], query?: any): void {
  if (pipeline) {
    for (const stage of pipeline) {
      for (const blockedStage of BLOCKED_STAGES) {
        if (stage[blockedStage] !== undefined) {
          throw new Error(
            `BLOCKED: '${blockedStage}' is a write operation and is not allowed. This tool is strictly READ-ONLY.`
          );
        }
      }
    }
  }
  if (query) {
    for (const blockedOp of BLOCKED_OPERATORS) {
      if (query[blockedOp] !== undefined) {
        throw new Error(
          `BLOCKED: '${blockedOp}' is a write operator and is not allowed. This tool is strictly READ-ONLY.`
        );
      }
    }
  }
}

// Recursively convert string IDs to ObjectIds in aggregation pipelines and queries
function convertIds(obj: any): any {
  if (!obj || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(convertIds);

  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (key === "_id" || key.endsWith("Id") || key.endsWith("_id")) {
      if (typeof value === "string" && ObjectId.isValid(value)) {
        result[key] = new ObjectId(value);
      } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        result[key] = convertIds(value);
      } else if (Array.isArray(value)) {
        result[key] = value.map((v) =>
          typeof v === "string" && ObjectId.isValid(v) ? new ObjectId(v) : convertIds(v)
        );
      } else {
        result[key] = value;
      }
    } else {
      result[key] = convertIds(value);
    }
  }
  return result;
}

function trimStringValues(obj: any): any {
  if (!obj) return obj;
  if (typeof obj === "string") return obj.trim();
  if (Array.isArray(obj)) return obj.map(trimStringValues);
  if (typeof obj === "object") {
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = trimStringValues(value);
    }
    return result;
  }
  return obj;
}

export const mongoSearchTool = new DynamicStructuredTool({
  name: "mongo_database_search",
  description: `READ-ONLY tool to query the CPW MongoDB database. Supports 'find' and 'aggregate' operations.

STRICT RULES:
- NEVER use this tool to create, update, or delete any data. It is physically blocked.
- Use 'aggregate' with $lookup for cross-collection joins (e.g. donations by fundraiser, donors of a campaign).
- Use relationships: projects ↔ fundraisers (projectId), donations ↔ projects (projectId), donations ↔ users (userId), donations ↔ donors (donorId), fundraisers ↔ users (userId).
- Always apply a reasonable limit (default: 10, max: 50).
- Prefer aggregate with $lookup when the user asks cross-collection questions.`,
  schema: z.object({
    collection: z.string().describe("The MongoDB collection to query (e.g. 'projects', 'fundraisers', 'donations', 'users', 'donor', 'ambassadors')"),
    operation: z
      .enum(["find", "aggregate"])
      .default("find")
      .describe("'find' for simple filter queries, 'aggregate' for joins/grouping/complex pipelines"),
    query: z
      .any()
      .optional()
      .describe("MongoDB filter object for 'find' operations. Example: { 'status': 'active' }"),
    pipeline: z
      .array(z.any())
      .optional()
      .describe("MongoDB aggregation pipeline array. Use $lookup for joins. Example: [{ $match: {...} }, { $lookup: {...} }]"),
    sort: z
      .any()
      .optional()
      .describe("MongoDB sort object for 'find' operations. Default: {'createdAt': -1} to show newest first. Example: { 'createdAt': -1 }"),
    limit: z
      .number()
      .max(50)
      .default(10)
      .describe("Max number of results to return (default 10, max 50)"),
  }),
  func: async ({ collection, operation, query, pipeline, sort, limit }) => {
    try {
      logger.info(`Mongo ${operation} on '${collection}'`);

      // Trim leading/trailing spaces recursively
      const trimmedQuery = query ? trimStringValues(query) : query;
      const trimmedPipeline = pipeline ? trimStringValues(pipeline) : pipeline;

      // ⛔ Enforce read-only before any DB interaction
      assertReadOnly(trimmedPipeline, trimmedQuery);

      const db = await getDb();
      const col = db.collection(collection);

      let results: any[] = [];

      if (operation === "aggregate") {
        if (!trimmedPipeline) {
          return JSON.stringify({ error: "Pipeline is required for aggregate operation" });
        }

        const processedPipeline = convertIds(trimmedPipeline);

        // Always cap results to prevent memory issues
        if (!processedPipeline.some((stage: any) => stage.$limit)) {
          processedPipeline.push({ $limit: limit });
        }

        results = await col.aggregate(processedPipeline).toArray();

        // Security: strip sensitive fields
        const cleanedResults = results.map((doc) => {
          const cleaned = { ...doc };
          delete cleaned.password;
          delete cleaned.token;
          delete cleaned.refreshToken;
          delete cleaned.secret;
          return cleaned;
        });

        return JSON.stringify(
          {
            collection,
            operation,
            count: cleanedResults.length,
            results: cleanedResults,
          },
          null,
          2
        );
      } else {
        const processedQuery = convertIds(trimmedQuery || {});
        const processedSort = sort || { createdAt: -1 };
        const totalCount = await col.countDocuments(processedQuery);
        const rawResults = await col.find(processedQuery).sort(processedSort).limit(limit).toArray();
        
        // Security: strip sensitive fields
        const cleanedResults = rawResults.map((doc) => {
          const cleaned = { ...doc };
          delete cleaned.password;
          delete cleaned.token;
          delete cleaned.refreshToken;
          delete cleaned.secret;
          return cleaned;
        });

        return JSON.stringify(
          {
            collection,
            operation,
            totalMatchingCount: totalCount,
            retrievedCount: cleanedResults.length,
            limit,
            results: cleanedResults,
          },
          null,
          2
        );
      }
    } catch (error: any) {
      logger.error(`Mongo search tool failed: ${error.message}`);
      return JSON.stringify({
        error: error.message.startsWith("BLOCKED")
          ? error.message
          : "Failed to query database",
        details: error.message,
      });
    }
  },
});
