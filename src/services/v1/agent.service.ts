import type { Db } from "mongodb";
import type { Response } from "express";
import { v4 as uuidv4 } from "uuid";
import type { MessageDoc } from "../../models/v1/Conversation.model";
import { ConversationService } from "./conversation.service";
import { HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";
import type { BaseMessage } from "@langchain/core/messages";

import logger from "../../utils/logger";
import { createDeepAgentGraph } from "../../agents/deep-agent/deep-agent.graph";

// Convert a stored MessageDoc to a proper LangChain BaseMessage instance
function docToBaseMessage(m: MessageDoc): BaseMessage {
  if (m.role === "assistant") return new AIMessage(m.content);
  if (m.role === "system") return new SystemMessage(m.content);
  return new HumanMessage(m.content);
}

// ==========================================
// Agent Service — Orchestrates DeepAgent
// ==========================================
export const AgentService = {
  /**
   * Process a message through the DeepAgent graph (non-streaming)
   */
  async processMessage(
    db: Db,
    userData: any,
    message: string,
    conversationId?: string,
  ): Promise<{
    conversationId: string;
    response: string;
    toolCalls?: any[];
    metadata?: Record<string, unknown>;
  }> {
    const startTime = Date.now();
    const resolvedConversationId = conversationId || uuidv4();

    const userEmail = userData.email;
    logger.agent(`Processing message for ${userEmail} [${resolvedConversationId}]`);

    // Load existing conversation for context
    let existingMessages: MessageDoc[] = [];
    if (conversationId) {
      const existing = await ConversationService.getById(
        db,
        conversationId,
        userEmail,
      );
      if (existing) {
        existingMessages = existing.messages;
      }
    }

    // Run through DeepAgent graph
    const graph = createDeepAgentGraph();
    const result = await graph.invoke({
      messages: [
        ...existingMessages.map(docToBaseMessage),
        new HumanMessage(message),
      ],
      plan: [],
      currentStep: 0,
      subAgentResults: {},
      metadata: {
        userEmail,
        userData,
        conversationId: resolvedConversationId,
      },
    }, { configurable: { thread_id: resolvedConversationId } });

    // Extract response from the last assistant message
    const assistantMessages = result.messages.filter(
      (m: any) => m._getType?.() === "ai",
    );
    const lastAssistant = assistantMessages[assistantMessages.length - 1];
    const responseContent =
      typeof lastAssistant?.content === "string"
        ? lastAssistant.content
        : "I apologize, but I was unable to process your request. Please try again.";

    const executionTimeMs = Date.now() - startTime;

    // Extract tool calls if any
    const toolCalls = result.toolCalls || [];

    // Save conversation to MongoDB
    const now = new Date().toISOString();
    const newMessages: MessageDoc[] = [
      {
        role: "user",
        content: message,
        timestamp: now,
      },
      {
        role: "assistant",
        content: responseContent,
        timestamp: now,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      },
    ];

    await ConversationService.createOrUpdate(
      db,
      resolvedConversationId,  // always use the resolved ID — avoids UUID mismatch
      userEmail,
      newMessages,
      {
        executionTimeMs,
        intent: result.metadata?.intent,
      },
    );

    logger.agent(
      `Response generated in ${executionTimeMs}ms [${resolvedConversationId}]`,
    );

    return {
      conversationId: resolvedConversationId,
      response: responseContent,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      metadata: {
        executionTimeMs,
        intent: result.metadata?.intent,
      },
    };
  },

  /**
   * Process a message with SSE streaming
   */
  async processMessageStream(
    db: Db,
    res: Response,
    userData: any,
    message: string,
    conversationId?: string,
  ): Promise<void> {
    const startTime = Date.now();
    const resolvedConversationId = conversationId || uuidv4();

    const userEmail = userData.email;
    logger.agent(
      `Streaming message for ${userEmail} [${resolvedConversationId}]`,
    );

    // Set SSE headers
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });

    // Send thinking event
    res.write(
      `event: thinking\ndata: ${JSON.stringify({ status: "processing" })}\n\n`,
    );

    // Load existing conversation for context
    let existingMessages: MessageDoc[] = [];
    if (conversationId) {
      const existing = await ConversationService.getById(
        db,
        conversationId,
        userEmail,
      );
      if (existing) {
        existingMessages = existing.messages;
      }
    }

    try {
      // Run through DeepAgent graph with true token-level streaming
      const graph = createDeepAgentGraph();
      const stream = await graph.streamEvents({
        messages: [
          ...existingMessages.map(docToBaseMessage),
          new HumanMessage(message),
        ],
        plan: [],
        currentStep: 0,
        subAgentResults: {},
        metadata: {
          userEmail,
          userData,
          conversationId: resolvedConversationId,
        },
      }, { version: "v2", configurable: { thread_id: resolvedConversationId } });

      let fullResponse = "";
      let toolCalls: any[] = [];
      let tokenIndex = 0;

      for await (const event of stream) {
        // Stream actual LLM tokens as they are generated
        if (event.event === "on_chat_model_stream") {
          const chunk = event.data.chunk;
          if (chunk && chunk.content) {
            const token = typeof chunk.content === "string" ? chunk.content : "";
            if (token) {
              fullResponse += token;
              res.write(
                `event: token\ndata: ${JSON.stringify({ token, index: tokenIndex++ })}\n\n`,
              );
            }
          }
        }
        
        // Capture tool calls when the model finishes its generation
        if (event.event === "on_chat_model_end") {
          const output = event.data.output;
          if (output) {
            if (output.tool_calls && output.tool_calls.length > 0) {
              toolCalls.push(...output.tool_calls);
            }
            // Safety net: if model didn't stream but returned text content, capture it
            if (!fullResponse && output.content && typeof output.content === "string") {
              fullResponse = output.content;
              res.write(
                `event: token\ndata: ${JSON.stringify({ token: fullResponse, index: tokenIndex++ })}\n\n`,
              );
            }
          }
        }
      }

      const executionTimeMs = Date.now() - startTime;

      // Save conversation to MongoDB
      const now = new Date().toISOString();
      const newMessages: MessageDoc[] = [
        { role: "user", content: message, timestamp: now },
        {
          role: "assistant",
          content: fullResponse,
          timestamp: now,
          toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        },
      ];

      await ConversationService.createOrUpdate(
        db,
        resolvedConversationId,  // always use the resolved ID — avoids UUID mismatch
        userEmail,
        newMessages,
        { executionTimeMs },
      );

      // Send done event
      res.write(
        `event: done\ndata: ${JSON.stringify({
          conversationId: resolvedConversationId,
          toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
          executionTimeMs,
        })}\n\n`,
      );

      res.write(`event: close\ndata: {}\n\n`);
      res.end();

      logger.agent(
        `Stream completed in ${executionTimeMs}ms [${resolvedConversationId}]`,
      );
    } catch (error: any) {
      logger.error(`Stream error: ${error.message}`);

      res.write(
        `event: error\ndata: ${JSON.stringify({ error: error.message || "Agent processing failed" })}\n\n`,
      );
      res.end();
    }
  },
};
