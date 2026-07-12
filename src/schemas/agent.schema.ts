import { z } from "zod";

// ==========================================
// Chat Request Schema
// ==========================================
export const chatRequestSchema = z.object({
  message: z.string().min(1, "Message is required").max(4000, "Message too long"),
  conversationId: z.string().optional(),
  stream: z.boolean().optional().default(false),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;

// ==========================================
// Feedback Request Schema
// ==========================================
export const feedbackRequestSchema = z.object({
  conversationId: z.string().min(1, "Conversation ID is required"),
  rating: z.number().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

export type FeedbackRequest = z.infer<typeof feedbackRequestSchema>;

// ==========================================
// Conversation Query Schema
// ==========================================
export const conversationQuerySchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .pipe(z.number().min(1).max(100)),
});

export type ConversationQuery = z.infer<typeof conversationQuerySchema>;
