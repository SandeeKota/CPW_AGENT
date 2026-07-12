// @ts-nocheck
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { getPineconeClient } from "../../utils/pinecone";
import { PineconeStore } from "@langchain/pinecone";
import { OpenAIEmbeddings } from "@langchain/openai";
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
      .optional()
      .describe("Pinecone namespace to scope the search: 'projects' or 'updates'. Leave empty to search all."),
    limit: z
      .number()
      .max(20)
      .default(5)
      .describe("Number of results to return (default 5, max 20)"),
  }),
  func: async ({ query, namespace, limit }) => {
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

      const results = docs.map((doc, idx) => ({
        resultIndex: idx + 1,
        content: doc.pageContent,
        metadata: doc.metadata,
      }));

      return JSON.stringify({
        query,
        namespace: namespace || "all",
        results,
        totalResults: results.length,
      }, null, 2);

    } catch (error: any) {
      logger.error(`Search tool failed: ${error.message}`);
      return JSON.stringify({
        error: "Failed to search the knowledge base",
        details: error.message,
      });
    }
  },
});
