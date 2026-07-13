// @ts-nocheck
import { ChatOpenAI } from "@langchain/openai";
import config from "../../config/config";
import { planningTool } from "../tools/planning.tool";
import { searchTool as pineconeSearchTool } from "../tools/search.tool";
import { mongoSearchTool } from "../tools/mongo_search.tool";
import { apiTool } from "../tools/api.tool";

// ==========================================
// DeepAgent Configuration
// LLM: Sarvam AI (OpenAI-compatible endpoint)
// Embeddings: OpenAI (handled separately in pinecone.ts)
// ==========================================
export const getAgentModel = () => {
  return new ChatOpenAI({
    model: config.sarvam.MODEL,
    temperature: 0.7,
    openAIApiKey: config.sarvam.API_KEY,
    maxTokens: 2048,
    streaming: true,
    configuration: {
      baseURL: config.sarvam.BASE_URL,
    },
  });
};

export const getAgentModelWithTools = () => {
  const model = getAgentModel();
  return model.bindTools(getAllTools());
};

export const getMongoAgentModel = () => {
  return getAgentModel().bindTools([mongoSearchTool]);
};

export const getPineconeAgentModel = () => {
  return getAgentModel().bindTools([pineconeSearchTool]);
};

export const getAllTools = () => [planningTool, pineconeSearchTool, apiTool, mongoSearchTool];

export const agentConfig = {
  maxIterations: 10,
  maxTokens: 2048,
  temperature: 0.7,
  model: config.sarvam.MODEL,
};

