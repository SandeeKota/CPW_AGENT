import agentApi from "./agent.api";

export interface AgentChatRequest {
  message: string;
  conversationId?: string;
}

export interface ToolCallInfo {
  id: string;
  toolName: string;
  args: Record<string, unknown>;
  status: "completed" | "failed" | "pending" | "running";
  result?: unknown;
  error?: string;
}

export interface AgentChatResponse {
  success: boolean;
  conversationId: string;
  response: string;
  toolCalls?: ToolCallInfo[];
  metadata?: {
    intent?: string;
    executionTimeMs?: number;
  };
  error?: string;
}

export interface ConversationListItem {
  conversationId: string;
  userEmail?: string;
  createdAt: string;
  updatedAt: string;
  title?: string;
  messages?: Array<{
    role: string;
    content: string;
    timestamp: string;
  }>;
}

/**
 * Send a message to the CPW AI Agent
 * The agent processes the message through its LangGraph workflow
 * and returns a natural language response with tool execution details.
 */
export const sendAgentMessage = async (
  payload: AgentChatRequest,
): Promise<AgentChatResponse> => {
  const response = await agentApi.post("/agent/chat", payload);
  return response.data;
};

/**
 * Stream a message to the CPW AI Agent via SSE (Server-Sent Events).
 *
 * Calls the agent with stream:true, receives an SSE event stream:
 *   - event: "thinking"  → agent is processing
 *   - event: "token"     → receives { token: string, index: number }
 *   - event: "done"      → final metadata { conversationId, toolCalls, ... }
 *   - event: "error"     → error message
 *   - event: "close"     → stream ended
 *
 * @param payload - The message and optional conversationId
 * @param onToken - Callback for each word token received
 * @param onDone - Callback when streaming completes with final metadata
 * @param onError - Callback for errors
 */
export const streamAgentMessage = async (
  payload: AgentChatRequest,
  onToken: (token: string) => void,
  onDone: (metadata: {
    conversationId: string;
    toolCalls?: ToolCallInfo[];
  }) => void,
  onError: (error: string) => void,
  onStatus?: (status: string) => void,
): Promise<void> => {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${agentApi.defaults.baseURL}/agent/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ ...payload, stream: true }),
    });

    if (!response.ok) {
      onError(`HTTP ${response.status}: ${response.statusText}`);
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      onError("No response body stream available");
      return;
    }

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Parse SSE events from buffer
      const events = buffer.split("\n\n");
      buffer = events.pop() || ""; // Keep incomplete event in buffer

      for (const eventBlock of events) {
        const lines = eventBlock.split("\n");
        let eventType = "";
        let data = "";

        for (const line of lines) {
          if (line.startsWith("event: ")) {
            eventType = line.slice(7).trim();
          } else if (line.startsWith("data: ")) {
            data = line.slice(6).trim();
          }
        }

        if (!eventType || !data) continue;

        try {
          const parsed = JSON.parse(data);

          switch (eventType) {
            case "token":
              if (parsed.token) {
                onToken(parsed.token);
              }
              break;
            case "status":
              if (parsed.status && onStatus) {
                onStatus(parsed.status);
              }
              break;
            case "done":
              onDone({
                conversationId: parsed.conversationId,
                toolCalls: parsed.toolCalls,
              });
              break;
            case "error":
              onError(parsed.error || "Unknown streaming error");
              break;
          }
        } catch {
          // Skip malformed JSON events
        }
      }
    }
  } catch (error: unknown) {
    const errMsg =
      error instanceof Error ? error.message : "Stream connection failed";
    onError(errMsg);
  }
};

/**
 * Get auth token for Agent API calls
 */
async function getAuthToken(): Promise<string | null> {
  try {
    const { default: cognitoService } = await import("./aws-cognito.service");
    return await cognitoService.getSession();
  } catch {
    return null;
  }
}

/**
 * List all conversations for the authenticated user
 */
export const listAgentConversations = async (
  limit: number = 20,
): Promise<{
  success: boolean;
  conversations: ConversationListItem[];
  count: number;
  totalCount: number;
}> => {
  const response = await agentApi.get(`/agent/conversations?limit=${limit}`);
  return response.data;
};

/**
 * Get a specific conversation's full history
 */
export const getAgentConversation = async (
  conversationId: string,
): Promise<{ success: boolean; conversation: ConversationListItem }> => {
  const response = await agentApi.get(`/agent/conversations/${conversationId}`);
  return response.data;
};

/**
 * Submit feedback for a conversation
 */
export const submitAgentFeedback = async (payload: {
  conversationId: string;
  rating: number;
  comment?: string;
}): Promise<{ success: boolean; message: string }> => {
  const response = await agentApi.post("/agent/feedback", payload);
  return response.data;
};

/**
 * Delete a specific conversation
 */
export const deleteAgentConversation = async (
  conversationId: string,
): Promise<{ success: boolean; message: string }> => {
  const response = await agentApi.delete(`/agent/conversations/${conversationId}`);
  return response.data;
};

/**
 * Delete all conversations visible to the user
 */
export const deleteAllAgentConversations = async (): Promise<{
  success: boolean;
  message: string;
}> => {
  const response = await agentApi.delete("/agent/conversations");
  return response.data;
};

/**
 * Generate report dynamically from the Agent (returns blob)
 */
export const generateAgentReport = async (payload: {
  format: string;
  entity?: string;
  filters?: any;
  title?: string;
  data?: any;
}): Promise<Blob> => {
  const response = await agentApi.post("/agent/reports/generate", payload, {
    responseType: "blob",
  });
  return response.data;
};

/**
 * Update the custom title of a conversation
 */
export const updateAgentConversationTitle = async (
  conversationId: string,
  title: string,
): Promise<{ success: boolean; message: string }> => {
  const response = await agentApi.patch(`/agent/conversations/${conversationId}/title`, { title });
  return response.data;
};

/**
 * Delete selected conversations in bulk
 */
export const deleteMultipleAgentConversations = async (
  conversationIds: string[],
): Promise<{ success: boolean; message: string }> => {
  const response = await agentApi.post("/agent/conversations/bulk-delete", {
    conversationIds,
  });
  return response.data;
};
