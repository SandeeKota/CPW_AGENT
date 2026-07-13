// @ts-nocheck
import { StateGraph, END } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { MemorySaver } from "@langchain/langgraph";
import { DeepAgentState, type DeepAgentStateType } from "./deep-agent.state";
import {
  plannerNode,
  routerNode,
  responderNode,
  mongoSearchNode,
  pineconeSearchNode,
} from "./deep-agent.nodes";
import { getAllTools } from "./deep-agent.config";
import logger from "../../utils/logger";

// ==========================================
// DeepAgent Graph — LangGraph StateGraph
// ==========================================

/**
 * Conditional edge: decide which node to go to next
 */
const routeDecision = (state: DeepAgentStateType): string => {
  const next = state.nextNode;
  logger.debug(`Route decision: ${next}`);

  switch (next) {
    case "planner":
      return "planner";
    case "responder":
      return "responder";
    default:
      return "responder";
  }
};

/**
 * Create the DeepAgent LangGraph StateGraph
 *
 * Flow:
 *   START → router → (planner | responder)
 *   planner → responder
 *   responder → END
 */
export const createDeepAgentGraph = () => {
  const toolNode = new ToolNode(getAllTools());

  const graph = new StateGraph(DeepAgentState)
    // Add nodes
    .addNode("router", routerNode)
    .addNode("planner", plannerNode)
    .addNode("mongo_search", mongoSearchNode)
    .addNode("pinecone_search", pineconeSearchNode)
    .addNode("responder", responderNode)
    .addNode("tools", toolNode)

    // Entry point
    .addEdge("__start__", "router")

    // The router decides where to go
    .addConditionalEdges("router", (state: DeepAgentStateType) => {
      return state.nextNode || "responder";
    })

    // Subagents and nodes route to their next steps
    .addEdge("planner", "responder")
    
    // Tool Node routing for subagents
    .addConditionalEdges("mongo_search", (state: DeepAgentStateType) => {
      const lastMsg = state.messages[state.messages.length - 1] as any;
      if (lastMsg.tool_calls?.length || lastMsg.invalid_tool_calls?.length) return "tools";
      return "responder";
    })
    
    .addConditionalEdges("pinecone_search", (state: DeepAgentStateType) => {
      const lastMsg = state.messages[state.messages.length - 1] as any;
      if (lastMsg.tool_calls?.length || lastMsg.invalid_tool_calls?.length) return "tools";
      return "responder";
    })

    // The responder might use tools or finish
    .addConditionalEdges("responder", (state: DeepAgentStateType) => {
      const lastMsg = state.messages[state.messages.length - 1] as any;
      if (lastMsg.tool_calls?.length || lastMsg.invalid_tool_calls?.length) return "tools";
      return "__end__";
    })

    // Tools always route back to responder for final synthesis
    .addEdge("tools", "responder");

  // Compile with memory checkpointing
  const checkpointer = new MemorySaver();
  const compiledGraph = graph.compile({ checkpointer });

  logger.agent("DeepAgent graph compiled successfully");
  return compiledGraph;
};
