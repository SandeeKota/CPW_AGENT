import type { Db, ObjectId } from "mongodb";
import { Document } from "@langchain/core/documents";
import { getVectorStore, getPineconeClient } from "../../utils/pinecone";
import config from "../../config/config";
import logger from "../../utils/logger";

// Allowed collections for Pinecone ingestion
const ALLOWED_PINECONE_COLLECTIONS = ["projects", "fundraisers", "donations"];

export const EmbeddingService = {
  /**
   * Helper to flatten complex nested objects into readable strings
   * so the LLM can understand the context properly.
   */
  flattenDocument(doc: any): string {
    const skipKeys = ["_id", "__v", "password", "token"];
    let content = "";
    
    const recurse = (obj: any, prefix = "") => {
      for (const key in obj) {
        if (skipKeys.includes(key)) continue;
        
        const val = obj[key];
        if (val === null || val === undefined) continue;

        if (Array.isArray(val)) {
          content += `${prefix}${key}:\n`;
          val.forEach((item, idx) => {
            if (typeof item === "object") {
              recurse(item, prefix + `  [${idx + 1}] `);
            } else {
              content += `${prefix}  - ${item}\n`;
            }
          });
        } else if (typeof val === "object" && !(val instanceof Date)) {
          content += `${prefix}${key}:\n`;
          recurse(val, prefix + "  ");
        } else {
          content += `${prefix}${key}: ${val}\n`;
        }
      }
    };
    
    recurse(doc);
    return content.trim();
  },

  /**
   * Bulk ingest an entire collection into Pinecone
   */
  async bulkIngestCollection(db: Db, collectionName: string): Promise<{ success: boolean; count: number }> {
    if (!ALLOWED_PINECONE_COLLECTIONS.includes(collectionName)) {
      throw new Error(`Collection ${collectionName} is not authorized for Pinecone embeddings.`);
    }

    logger.info(`Starting bulk ingestion for collection: ${collectionName}`);
    const collection = db.collection(collectionName);
    const documents = await collection.find({}).toArray();

    if (documents.length === 0) return { success: true, count: 0 };

    const vectorStore = await getVectorStore();
    const docsToEmbed: Document[] = documents.map((doc) => {
      const textualContent = this.flattenDocument(doc);
      return new Document({
        pageContent: textualContent,
        metadata: {
          source_collection: collectionName,
          doc_id: doc._id.toString(),
          title: doc.title || doc.name || `${collectionName} record`,
        },
      });
    });

    // Add documents to pinecone (auto chunked by PineconeStore if needed)
    await vectorStore.addDocuments(docsToEmbed);
    
    logger.info(`Successfully ingested ${docsToEmbed.length} documents from ${collectionName}`);
    return { success: true, count: docsToEmbed.length };
  },

  /**
   * Ingest a single document by ID
   */
  async ingestSingleDocument(db: Db, collectionName: string, id: string | ObjectId): Promise<boolean> {
    if (!ALLOWED_PINECONE_COLLECTIONS.includes(collectionName)) {
      throw new Error(`Collection ${collectionName} is not authorized for Pinecone embeddings.`);
    }

    const collection = db.collection(collectionName);
    // Support string or ObjectId
    let queryId: any = id;
    if (typeof id === 'string' && id.length === 24) {
      const { ObjectId } = require('mongodb');
      queryId = new ObjectId(id);
    }
    
    const doc = await collection.findOne({ _id: queryId });
    if (!doc) throw new Error("Document not found");

    const textualContent = this.flattenDocument(doc);
    const vectorStore = await getVectorStore();
    
    const langchainDoc = new Document({
      pageContent: textualContent,
      metadata: {
        source_collection: collectionName,
        doc_id: doc._id.toString(),
        title: doc.title || doc.name || `${collectionName} record`,
      },
    });

    await vectorStore.addDocuments([langchainDoc]);
    return true;
  },

  /**
   * Delete data from Pinecone
   */
  async deleteFromPinecone(collectionName?: string, docId?: string): Promise<boolean> {
    const client = getPineconeClient();
    const index = client.Index(config.pinecone.INDEX_NAME);

    // Pinecone allows deletion by metadata filter
    let filter: Record<string, any> = {};
    if (collectionName) filter.source_collection = collectionName;
    if (docId) filter.doc_id = docId;

    if (Object.keys(filter).length === 0) {
      throw new Error("Must provide at least one filter for deletion.");
    }

    // Using native pinecone client for metadata deletion
    await index.deleteMany(filter);
    logger.info(`Deleted from Pinecone with filter: ${JSON.stringify(filter)}`);
    return true;
  }
};
