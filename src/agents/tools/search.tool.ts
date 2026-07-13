// @ts-nocheck
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { getPineconeClient } from "../../utils/pinecone";
import { PineconeStore } from "@langchain/pinecone";
import { OpenAIEmbeddings } from "@langchain/openai";
import { MongoClient, Db, ObjectId } from "mongodb";
import config from "../../config/config";
import logger from "../../utils/logger";

// ==========================================
// Search Tool — Information Retrieval
// ==========================================

/**
 * Get a PineconeStore scoped to a specific namespace.
 * Each vectorized collection (projects, updates) is stored in its own namespace.
 */
async function getVectorStoreForNamespace(namespace?: string): Promise<PineconeStore> {
  const client = getPineconeClient();
  const index = client.Index(config.pinecone.INDEX_NAME);

  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: config.OPENAI_API_KEY,
    modelName: config.OPENAI_EMBEDDING_MODEL,
  });

  // Scope the search to a namespace if provided (e.g., "projects", "updates")
  const pineconeIndex = namespace
    ? index.namespace(namespace)
    : index;

  return await PineconeStore.fromExistingIndex(embeddings, {
    pineconeIndex: pineconeIndex as any,
  });
}

export const searchTool: any = new DynamicStructuredTool({
  name: "search_knowledge",
  description:
    "Search through CPW's knowledge base via Pinecone vector embeddings. Use this when users ask for semantic searches, such as finding projects by description or updates by content. " +
    "The 'namespace' parameter scopes the search: use 'projects' for project searches, 'updates' for project updates. " +
    "Leave namespace empty to search all vectorized content. " +
    "Only 'projects' and 'updates' collections are vectorized — all others (donations, users, fundraisers, donors) must be queried via mongo_database_search.",
  schema: z.object({
    query: z.string().describe("The semantic search query — be descriptive for best results"),
    namespace: z
      .string()
      .nullish()
      .describe("Pinecone namespace to scope the search: 'projects' or 'updates'. Leave empty to search all."),
    limit: z
      .number()
      .max(20)
      .nullish()
      .default(5)
      .describe("Number of results to return (default 5, max 20)"),
  }),
  func: async ({ query, namespace, limit }) => {
    let mongoClient: MongoClient | null = null;
    try {
      logger.info(`Performing vector search for: "${query}" in namespace: ${namespace || "all"} with limit: ${limit}`);

      const vectorStore = await getVectorStoreForNamespace(namespace);

      // Similarity search — top N most relevant chunks
      const docs = await vectorStore.similaritySearch(query, limit);

      if (docs.length === 0) {
        return JSON.stringify({
          query,
          namespace: namespace || "all",
          message: "No relevant documents found in the CPW knowledge base for this query.",
          results: [],
        }, null, 2);
      }

      // Query MongoDB to enrich metadata
      mongoClient = new MongoClient(config.MONGO_URI);
      await mongoClient.connect();
      const db = mongoClient.db(config.DB_NAME);

      const results = await Promise.all(docs.map(async (doc, idx) => {
        let enrichedMetadata = { ...doc.metadata };
        
        // Use doc_id and source_collection per our embedding logic
        const docId = doc.metadata.doc_id;
        const collectionName = doc.metadata.source_collection;
        
        if (docId && collectionName) {
            try {
                const collection = db.collection(collectionName);
                const fullDoc = await collection.findOne({ _id: new ObjectId(docId) });
                if (fullDoc) {
                    // Strip sensitive fields
                    delete fullDoc.password;
                    delete fullDoc.token;
                    delete fullDoc.refreshToken;
                    delete fullDoc.secret;
                    enrichedMetadata = { ...enrichedMetadata, fullData: fullDoc };
                }
            } catch (err) {
                logger.error(`Error fetching full doc ${docId} from ${collectionName}: ${err}`);
            }
        }

        return {
          resultIndex: idx + 1,
          content: doc.pageContent,
          metadata: enrichedMetadata,
        };
      }));

      await mongoClient.close();

      return JSON.stringify({
        query,
        namespace: namespace || "all",
        results,
        totalResults: results.length,
      }, null, 2);

    } catch (error: any) {
      if (mongoClient) {
        await mongoClient.close();
      }
      logger.error(`Search tool failed: ${error.message}`);
      return JSON.stringify({
        error: "Failed to search the knowledge base",
        details: error.message,
      });
    }
  },
});
