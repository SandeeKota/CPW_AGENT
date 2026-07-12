import type { RouteHandler } from "../../types/express";
import {
  chatRequestSchema,
  feedbackRequestSchema,
  conversationQuerySchema,
} from "../../schemas/agent.schema";
import { AgentService } from "../../services/v1/agent.service";
import { ConversationService } from "../../services/v1/conversation.service";
import { ApiResponse } from "../../utils/apiResponse";
import logger from "../../utils/logger";

// ==========================================
// Agent Controller
// ==========================================
export const AgentController = {
  /**
   * POST /api/v1/agent/chat
   * Send a message to the AI agent (supports streaming)
   */
  chat: <RouteHandler>(async (req, res, next) => {
    try {
      const validation = chatRequestSchema.safeParse(req.body);
      if (!validation.success) {
        return ApiResponse.validationError(res, validation.error.flatten());
      }

      const { message, conversationId, stream } = validation.data;
      const userEmail = req.userData?.email;

      if (!userEmail) {
        return ApiResponse.error(res, "User email not found", 401);
      }

      logger.agent(`Chat request from ${userEmail} | stream: ${stream}`);

      if (stream) {
        // SSE streaming response
        await AgentService.processMessageStream(
          req.db,
          res,
          req.userData,
          message,
          conversationId,
        );
      } else {
        // Standard JSON response
        const result = await AgentService.processMessage(
          req.db,
          req.userData,
          message,
          conversationId,
        );

        return ApiResponse.success(res, {
          conversationId: result.conversationId,
          response: result.response,
          toolCalls: result.toolCalls,
          metadata: result.metadata,
        });
      }
    } catch (error: any) {
      logger.error(`Agent chat error: ${error.message}`);
      return ApiResponse.error(
        res,
        error.message || "Agent processing failed",
        500,
      );
    }
  }),

  /**
   * GET /api/v1/agent/conversations
   * List conversations for the authenticated user
   */
  listConversations: <RouteHandler>(async (req, res, next) => {
    try {
      const queryValidation = conversationQuerySchema.safeParse(req.query);
      const limit = queryValidation.success ? queryValidation.data.limit : 20;

      const userEmail = req.userData?.email;
      if (!userEmail) {
        return ApiResponse.error(res, "User email not found", 401);
      }

      const conversations = await ConversationService.list(
        req.db,
        userEmail,
        limit,
      );

      return ApiResponse.success(res, {
        conversations,
        count: conversations.length,
      });
    } catch (error: any) {
      logger.error(`List conversations error: ${error.message}`);
      return ApiResponse.error(res, "Failed to fetch conversations", 500);
    }
  }),

  /**
   * GET /api/v1/agent/conversations/:conversationId
   * Get a specific conversation
   */
  getConversation: <RouteHandler>(async (req, res, next) => {
    try {
      const conversationId = req.params.conversationId as string;
      const userEmail = req.userData?.email;

      if (!userEmail) {
        return ApiResponse.error(res, "User email not found", 401);
      }

      if (!conversationId) {
        return ApiResponse.error(res, "Conversation ID is required", 400);
      }

      const conversation = await ConversationService.getById(
        req.db,
        conversationId,
        userEmail,
      );

      if (!conversation) {
        return ApiResponse.error(res, "Conversation not found", 404);
      }

      return ApiResponse.success(res, { conversation });
    } catch (error: any) {
      logger.error(`Get conversation error: ${error.message}`);
      return ApiResponse.error(res, "Failed to fetch conversation", 500);
    }
  }),

  /**
   * DELETE /api/v1/agent/conversations/:conversationId
   * Soft-delete a conversation
   */
  deleteConversation: <RouteHandler>(async (req, res, next) => {
    try {
      const conversationId = req.params.conversationId as string;
      const userEmail = req.userData?.email;

      if (!userEmail) {
        return ApiResponse.error(res, "User email not found", 401);
      }

      if (!conversationId) {
        return ApiResponse.error(res, "Conversation ID is required", 400);
      }

      const deleted = await ConversationService.delete(
        req.db,
        conversationId,
        userEmail,
      );

      if (!deleted) {
        return ApiResponse.error(res, "Conversation not found", 404);
      }

      return ApiResponse.success(res, {
        message: "Conversation deleted successfully",
      });
    } catch (error: any) {
      logger.error(`Delete conversation error: ${error.message}`);
      return ApiResponse.error(res, "Failed to delete conversation", 500);
    }
  }),

  /**
   * POST /api/v1/agent/feedback
   * Submit feedback for a conversation
   */
  submitFeedback: <RouteHandler>(async (req, res, next) => {
    try {
      const validation = feedbackRequestSchema.safeParse(req.body);
      if (!validation.success) {
        return ApiResponse.validationError(res, validation.error.flatten());
      }

      const { conversationId, rating, comment } = validation.data;
      const userEmail = req.userData?.email;

      if (!userEmail) {
        return ApiResponse.error(res, "User email not found", 401);
      }

      const feedback = await ConversationService.saveFeedback(
        req.db,
        conversationId,
        userEmail,
        rating,
        comment,
      );

      return ApiResponse.success(res, {
        message: "Feedback submitted successfully",
        feedback,
      });
    } catch (error: any) {
      logger.error(`Submit feedback error: ${error.message}`);
      return ApiResponse.error(res, "Failed to submit feedback", 500);
    }
  }),
};
