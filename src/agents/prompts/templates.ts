// ==========================================
// Prompt Template Utilities
// ==========================================

/**
 * Simple template replacement utility
 * Replaces {{variable}} placeholders with provided values
 */
export const fillTemplate = (
  template: string,
  variables: Record<string, string>,
): string => {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
  }
  return result;
};

/**
 * Build a context string from conversation history
 */
export const buildConversationContext = (
  messages: Array<{ role: string; content: string }>,
  maxMessages: number = 10,
): string => {
  const recent = messages.slice(-maxMessages);
  return recent
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join("\n\n");
};

/**
 * Create a system message with injected context
 */
export const createContextualSystemPrompt = (
  basePrompt: string,
  context: Record<string, string>,
): string => {
  let prompt = basePrompt;

  if (context.userEmail) {
    prompt += `\n\nCurrent user: ${context.userEmail}`;
  }

  if (context.conversationId) {
    prompt += `\nConversation ID: ${context.conversationId}`;
  }

  if (context.timestamp) {
    prompt += `\nCurrent time: ${context.timestamp}`;
  }

  return prompt;
};
