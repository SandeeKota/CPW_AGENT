import { ObjectId } from "mongodb";

// ==========================================
// Message Document
// ==========================================
export interface ToolCallDoc {
  id: string;
  toolName: string;
  args: Record<string, unknown>;
  status: "completed" | "failed" | "pending" | "running";
  result?: unknown;
  error?: string;
}

export interface MessageDoc {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  toolCalls?: ToolCallDoc[];
}

// ==========================================
// Conversation Document
// ==========================================
export interface ConversationDoc {
  _id?: ObjectId;
  conversationId: string;
  userEmail: string;
  userId?: string;
  messages: MessageDoc[];
  metadata?: {
    intent?: string;
    executionTimeMs?: number;
    totalTokens?: number;
  };
  createdAt: string;
  updatedAt: string;
  isDeleted?: boolean;
}

// ==========================================
// Feedback Document
// ==========================================
export interface FeedbackDoc {
  _id?: ObjectId;
  conversationId: string;
  userEmail: string;
  rating: number;
  comment?: string;
  createdAt: string;
}
