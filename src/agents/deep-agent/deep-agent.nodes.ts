import type { DeepAgentStateType } from "./deep-agent.state";
import { getAgentModel, getAgentModelWithTools, getMongoAgentModel, getPineconeAgentModel } from "./deep-agent.config";
import { SYSTEM_PROMPT } from "../prompts/system.prompts";
import { PLANNER_PROMPT } from "../prompts/planner.prompts";
import logger from "../../utils/logger";
import { fetchAndCacheSchemas } from "./services/schemaFetcher";
import {
  HumanMessage,
  AIMessage,
  SystemMessage,
  ToolMessage,
} from "@langchain/core/messages";
import type { BaseMessage } from "@langchain/core/messages";

// ==========================================
// Message Conversion Helper
// ==========================================

/**
 * Converts any message (plain object or BaseMessage instance) into a proper
 * LangChain BaseMessage. This is required because LangGraph's ToolNode calls
 * message._getType() internally, which only exists on BaseMessage instances.
 */
function toBaseMessage(m: any): BaseMessage {
  // Already a proper LangChain message — pass through
  if (typeof m._getType === "function") return m as BaseMessage;

  const role = m.role || "user";
  const content = m.content ?? "";

  if (role === "system") {
    return new SystemMessage(content);
  }

  if (role === "assistant" || role === "ai") {
    return new AIMessage({
      content,
      ...(m.tool_calls && m.tool_calls.length > 0 ? { tool_calls: m.tool_calls } : {}),
    });
  }

  if (role === "tool") {
    return new ToolMessage({
      content,
      tool_call_id: m.tool_call_id ?? "",
      name: m.name,
    });
  }

  // Default: human/user
  return new HumanMessage(content);
}

// ==========================================
// Graph Node Functions
// ==========================================

/**
 * Planner Node — Analyzes the user query and creates a plan
 */
export const plannerNode = async (
  state: DeepAgentStateType,
): Promise<Partial<DeepAgentStateType>> => {
  logger.agent("📋 Planner node executing...");

  const model = getAgentModel();

  // Find the last human message
  const lastUserMessage = [...state.messages]
    .reverse()
    .find((m) => m._getType() === "human");

  if (!lastUserMessage) {
    return { nextNode: "responder" };
  }

  const userContent =
    typeof lastUserMessage.content === "string"
      ? lastUserMessage.content
      : "";

  const response = await model.invoke([
    new SystemMessage(PLANNER_PROMPT),
    new HumanMessage(`Analyze this request and create a brief plan:\n\n"${userContent}"`),
  ]);

  const planContent =
    typeof response.content === "string" ? response.content : "";

  return {
    plan: [
      {
        id: 1,
        description: planContent,
        status: "completed" as const,
      },
    ],
    subAgentResults: { plannerOutput: planContent },
    nextNode: "responder",
  };
};

/**
 * Router Node — Decides which sub-agent to invoke next
 */
export const routerNode = async (
  state: DeepAgentStateType,
): Promise<Partial<DeepAgentStateType>> => {
  logger.agent("🔀 Router node executing...");

  const lastUserMessage = [...state.messages]
    .reverse()
    .find((m) => m._getType() === "human");

  if (!lastUserMessage) {
    return { nextNode: "responder" };
  }

  const rawContent = lastUserMessage.content;
  const content =
    typeof rawContent === "string" ? rawContent.toLowerCase() : "";

  // Simple routing logic (will be enhanced with LLM-based routing later)
  if (
    content.includes("plan") ||
    content.includes("break down") ||
    content.includes("steps")
  ) {
    return { nextNode: "planner" };
  }

  // ALWAYS route to responder for any data/information query.
  // The responder has ALL tools bound (search_knowledge for Pinecone + mongo_database_search for MongoDB)
  // and can intelligently decide which tools to call based on the query.
  // This avoids the problem of routing to a single sub-agent (pinecone_search or mongo_search)
  // that only has one tool and cannot fetch data from the other source.
  // Many real-world queries span multiple collections (e.g., "center with donations and donors"
  // needs Pinecone for center + MongoDB for donations/donors).
  return { nextNode: "responder" };
};

/**
 * Mongo Search Node — Subagent for direct database operational queries
 */
export const mongoSearchNode = async (
  state: DeepAgentStateType,
): Promise<Partial<DeepAgentStateType>> => {
  logger.agent("🔍 Mongo Search Node executing...");

  const model = getMongoAgentModel();

  // Convert state messages to proper BaseMessage instances
  const chatMessages = state.messages.map(toBaseMessage);

  let dynamicSchemaContext = "";
  try {
    const schemas = await fetchAndCacheSchemas();
    if (schemas) {
      dynamicSchemaContext = `\n\n## Database Schemas & Capabilities\nUse this schema reference to identify collections and field types (objects, strings, arrays):\n${JSON.stringify(schemas, null, 2)}`;
    }
  } catch (err: any) {
    logger.error(`Failed to fetch schema context for mongo search: ${err.message}`);
  }

  const systemMessage =
    "You are the Mongo Database Search Subagent. Formulate a query using the mongo_database_search tool based on the user's request to fetch data from operational collections.\n" +
    "STRICT DEEP SEARCH RULES:\n" +
    "- Date fields (createdAt, startDate, endDate, etc.) are stored as ISO 8601 strings (e.g., '2026-07-12...'). Query them using string range operators ($gte/$lte) or regex ($regex), NEVER use BSON Date objects.\n" +
    "- Reference IDs in queries are BSON ObjectIds. Ensure hex strings are cast to BSON ObjectIds where needed.\n" +
    "- Plan to resolve relationships recursively (e.g. resolve projects, campaigns, users by fetching referenced documents or lookup joins).\n" +
    "- If key attributes (like specific user identifiers) are ambiguous, stop and report this so the agent can ask clarifying questions instead of guessing.\n" +
    "- Refer to the schema reference below to identify valid collection names and exact attribute casing.\n" +
    dynamicSchemaContext;

  const response = await model.invoke([
    new SystemMessage(systemMessage),
    ...chatMessages,
  ]);

  // Return a proper AIMessage so ToolNode can call _getType() on it
  return {
    messages: [
      new AIMessage({
        content: typeof response.content === "string" ? response.content : "",
        tool_calls: response.tool_calls ?? [],
      }),
    ],
    subAgentResults: { source: "mongo" },
    nextNode: "responder",
  };
};

/**
 * Pinecone Search Node — Subagent for semantic vector searches
 */
export const pineconeSearchNode = async (
  state: DeepAgentStateType,
): Promise<Partial<DeepAgentStateType>> => {
  logger.agent("🌲 Pinecone Search Subagent executing...");

  const model = getPineconeAgentModel();

  // Convert state messages to proper BaseMessage instances
  const chatMessages = state.messages.map(toBaseMessage);

  const systemMessage =
    "You are the Pinecone Search Subagent. Formulate a semantic query using the search_knowledge tool based on the user's request to fetch data from the vector database.\n" +
    "STRICT RULES:\n" +
    "- Only 'projects' and 'updates' collections are indexed in Pinecone. All other queries (donations, users, fundraisers, donors) must be searched via the database.\n" +
    "- If the search request is ambiguous or lacks contextual parameters, report this so the main agent can request clarification.";

  const response = await model.invoke([
    new SystemMessage(systemMessage),
    ...chatMessages,
  ]);

  // Return a proper AIMessage so ToolNode can call _getType() on it
  return {
    messages: [
      new AIMessage({
        content: typeof response.content === "string" ? response.content : "",
        tool_calls: response.tool_calls ?? [],
      }),
    ],
    subAgentResults: { source: "pinecone" },
    nextNode: "responder",
  };
};

/**
 * Responder Node — Generates the final response
 */
export const responderNode = async (
  state: DeepAgentStateType,
): Promise<Partial<DeepAgentStateType>> => {
  logger.agent("💬 Responder node executing...");

  // Use model WITH all tools bound — so the responder can call Pinecone/Mongo
  // as a fallback even if the router sent it here directly.
  // The graph already wires responder → tools → responder for multi-step tool use.
  const model = getAgentModelWithTools();

  // Build context from sub-agent results
  let context = "";
  if (state.subAgentResults && Object.keys(state.subAgentResults).length > 0) {
    context = `\n\nContext from analysis:\n${JSON.stringify(state.subAgentResults, null, 2)}`;
  }

  const userData = state.metadata?.userData;
  const userProfile = userData
    ? `\n\n## Authenticated User Profile\nYou are currently speaking with:\n- Name: ${userData.firstName || ""} ${userData.lastName || ""}`.trim() +
      `\n- Email: ${userData.email || "Unknown"}` +
      `\n- Role: ${userData.role || "Team Member"}` +
      `\n\nAlways acknowledge them by their name and role if they ask who they are.`
    : "";

  let dynamicSchemaContext = "";
  try {
    const schemas = await fetchAndCacheSchemas();
    if (schemas) {
      dynamicSchemaContext = `\n\n## Database Schemas & Capabilities
The following represents the live operational database schema, including Pinecone configuration and foreign key relationships. 
Use this to formulate dynamic MongoDB aggregations or determine which Pinecone index to search:
${JSON.stringify(schemas, null, 2)}`;
    }
  } catch (err) {
    console.error("Could not append schema context");
  }

  const systemPrompt = SYSTEM_PROMPT + context + userProfile + dynamicSchemaContext;

  // Convert state messages to proper BaseMessage instances
  const chatMessages = state.messages.map(toBaseMessage);

  const response = await model.invoke([
    new SystemMessage(systemPrompt),
    ...chatMessages,
  ]);

  const responseContent =
    typeof response.content === "string"
      ? response.content
      : "I apologize, but I was unable to generate a response. Please try again.";

  return {
    messages: [
      new AIMessage({
        content: responseContent,
        tool_calls: response.tool_calls ?? [],
      }),
    ],
    metadata: { intent: "general" },
  };
};
