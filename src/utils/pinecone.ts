import { Pinecone } from "@pinecone-database/pinecone";
import { PineconeStore } from "@langchain/pinecone";
import { OpenAIEmbeddings } from "@langchain/openai";
import config from "../config/config";
import logger from "./logger";

let pineconeClient: Pinecone | null = null;

/**
 * Get or initialize the Pinecone native client
 */
export const getPineconeClient = (): Pinecone => {
  if (!pineconeClient) {
    if (!config.pinecone.API_KEY) {
      throw new Error("PINECONE_API_KEY is missing from configuration");
    }

    pineconeClient = new Pinecone({
      apiKey: config.pinecone.API_KEY,
    });
    logger.info("Pinecone client initialized successfully");
  }
  return pineconeClient;
};

/**
 * Get an initialized LangChain PineconeStore for vector search
 */
export const getVectorStore = async (): Promise<PineconeStore> => {
  const client = getPineconeClient();
  const index = client.Index(config.pinecone.INDEX_NAME);

  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: config.OPENAI_API_KEY,
    modelName: config.OPENAI_EMBEDDING_MODEL,
  });

  return await PineconeStore.fromExistingIndex(embeddings, {
    pineconeIndex: index as any,
  });
};
