import type { Db } from "mongodb";
import { v4 as uuidv4 } from "uuid";
import { COLLECTIONS } from "../../constants/collections";
import type {
  ConversationDoc,
  MessageDoc,
  FeedbackDoc,
} from "../../models/v1/Conversation.model";
import logger from "../../utils/logger";

// ==========================================
// Conversation Service — MongoDB CRUD
// ==========================================
export const ConversationService = {
  /**
   * Create a new conversation or append messages to an existing one
   */
  async createOrUpdate(
    db: Db,
    conversationId: string | undefined,
    userEmail: string,
    newMessages: MessageDoc[],
    metadata?: Record<string, unknown>,
  ): Promise<ConversationDoc> {
    const collection = db.collection<ConversationDoc>(
      COLLECTIONS.agent_conversations,
    );
    const now = new Date().toISOString();

    if (conversationId) {
      // Append messages to existing conversation
      const result = await collection.findOneAndUpdate(
        { conversationId, userEmail, isDeleted: { $ne: true } },
        {
          $push: { messages: { $each: newMessages } } as any,
          $set: {
            updatedAt: now,
            ...(metadata ? { metadata } : {}),
          },
        },
        { returnDocument: "after" },
      );

      if (result) {
        logger.debug(`Updated conversation: ${conversationId}`);
        return result;
      }
    }

    // Create new conversation
    const newConversationId = conversationId || uuidv4();
    const newConversation: ConversationDoc = {
      conversationId: newConversationId,
      userEmail,
      messages: newMessages,
      metadata: metadata as any,
      createdAt: now,
      updatedAt: now,
      isDeleted: false,
    };

    await collection.insertOne(newConversation as any);
    logger.debug(`Created conversation: ${newConversationId}`);
    return newConversation;
  },

  /**
   * Get a single conversation by ID
   */
  async getById(
    db: Db,
    conversationId: string,
    userEmail: string,
  ): Promise<ConversationDoc | null> {
    const collection = db.collection<ConversationDoc>(
      COLLECTIONS.agent_conversations,
    );

    return collection.findOne({
      conversationId,
      userEmail,
      isDeleted: { $ne: true },
    });
  },

  /**
   * List conversations for a user (most recent first)
   */
  async list(
    db: Db,
    userEmail: string,
    limit: number = 20,
  ): Promise<ConversationDoc[]> {
    const collection = db.collection<ConversationDoc>(
      COLLECTIONS.agent_conversations,
    );

    return collection
      .find({ userEmail, isDeleted: { $ne: true } })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .toArray();
  },

  /**
   * Soft-delete a conversation
   */
  async delete(
    db: Db,
    conversationId: string,
    userEmail: string,
  ): Promise<boolean> {
    const collection = db.collection<ConversationDoc>(
      COLLECTIONS.agent_conversations,
    );

    const result = await collection.updateOne(
      { conversationId, userEmail },
      { $set: { isDeleted: true, updatedAt: new Date().toISOString() } },
    );

    return result.modifiedCount > 0;
  },

  /**
   * Save feedback for a conversation
   */
  async saveFeedback(
    db: Db,
    conversationId: string,
    userEmail: string,
    rating: number,
    comment?: string,
  ): Promise<FeedbackDoc> {
    const collection = db.collection<FeedbackDoc>(COLLECTIONS.agent_feedback);

    const feedback: FeedbackDoc = {
      conversationId,
      userEmail,
      rating,
      comment,
      createdAt: new Date().toISOString(),
    };

    await collection.insertOne(feedback as any);
    logger.debug(`Saved feedback for conversation: ${conversationId}`);
    return feedback;
  },
};
