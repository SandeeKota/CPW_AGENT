import { create } from "zustand";
import {
  streamAgentMessage,
  listAgentConversations,
  getAgentConversation,
  deleteAgentConversation,
  deleteAllAgentConversations,
  updateAgentConversationTitle,
  deleteMultipleAgentConversations,
} from "../_services/agent.service";
import type { ConversationListItem, ToolCallInfo } from "../_services/agent.service";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
  status?: "thinking" | "streaming" | "done";
  toolCalls?: ToolCallInfo[];
  loadingStatus?: string;
}

interface Thread {
  conversationId: string;
  title: string;
  updatedAt: string;
  createdAt: string;
}

interface ChatStore {
  messages: Message[];
  conversationId: string | null;
  isSending: boolean;
  isFetchingThreads: boolean;
  error: string | null;
  threads: Thread[];
  totalCount: number;
  showThreads: boolean;

  addMessage: (message: Omit<Message, "id" | "createdAt">) => string;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
  setConversationId: (id: string | null) => void;
  fetchThreads: () => Promise<void>;
  loadThread: (conversationId: string) => Promise<void>;
  toggleThreads: () => void;
  deleteThread: (conversationId: string) => Promise<void>;
  deleteAllThreads: () => Promise<void>;
  updateThreadTitle: (conversationId: string, title: string) => Promise<void>;
  deleteMultipleThreads: (conversationIds: string[]) => Promise<void>;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  conversationId: null,
  isSending: false,
  isFetchingThreads: false,
  error: null,
  threads: [],
  totalCount: 0,
  showThreads: true,

  addMessage: (message) => {
    const id = crypto.randomUUID();

    set((state) => ({
      messages: [
        ...state.messages,
        {
          ...message,
          id,
          createdAt: Date.now(),
        },
      ],
    }));

    return id;
  },

  updateMessage: (id, updates) =>
    set((state) => ({
      messages: state.messages.map((message) =>
        message.id === id ? { ...message, ...updates } : message,
      ),
    })),

  sendMessage: async (content: string) => {
    const state = get();
    if (state.isSending || !content.trim()) return;

    // Add user message
    state.addMessage({
      role: "user",
      content,
      status: "done",
    });

    // Add placeholder assistant message with streaming status
    const aiMessageId = state.addMessage({
      role: "assistant",
      content: "",
      status: "thinking",
      loadingStatus: "Synthesizing answer...",
    });

    set({ isSending: true, error: null });

    // Track accumulated content for streaming
    let accumulatedContent = "";

    await streamAgentMessage(
      { message: content, conversationId: state.conversationId ?? undefined },
      // onToken: receive each word token and update in real-time
      (token: string) => {
        accumulatedContent += token;

        // Switch from "thinking" to "streaming" on first token
        get().updateMessage(aiMessageId, {
          content: accumulatedContent,
          status: "streaming",
        });
      },
      // onDone: streaming completed
      (metadata) => {
        // Final update with complete content and tool execution info
        get().updateMessage(aiMessageId, {
          content: accumulatedContent,
          status: "done",
          toolCalls: metadata.toolCalls,
        });

        // Store conversation ID for continuing
        if (metadata.conversationId) {
          set({ conversationId: metadata.conversationId });
        }

        set({ isSending: false });
        void get().fetchThreads();
      },
      // onError: handle errors
      (errorMessage: string) => {
        const finalContent = accumulatedContent || `Error: ${errorMessage}`;
        get().updateMessage(aiMessageId, {
          content: finalContent,
          status: "done",
        });
        set({ error: errorMessage, isSending: false });
      },
      // onStatus: handle tool execution status
      (status: string) => {
        get().updateMessage(aiMessageId, { loadingStatus: status });
      }
    );
  },

  clearMessages: () =>
    set({
      messages: [],
      conversationId: null,
      error: null,
    }),

  setConversationId: (id) => set({ conversationId: id }),

  fetchThreads: async () => {
    set({ isFetchingThreads: true, error: null });
    try {
      const response = await listAgentConversations(50);
      const threads: Thread[] = (response.conversations || []).map((c) => {
        const firstUserMessage = c.messages?.find((m) => m.role === "user");
        return {
          conversationId: c.conversationId,
          title:
            c.title ||
            firstUserMessage?.content?.slice(0, 80) ||
            c.messages?.[0]?.content?.slice(0, 80) ||
            "New conversation",
          updatedAt: c.updatedAt,
          createdAt: c.createdAt,
        };
      });
      const sortedThreads = threads.sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      set({
        threads: sortedThreads,
        totalCount: response.totalCount ?? sortedThreads.length,
        isFetchingThreads: false,
      });
    } catch (err) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ||
        (err as Error).message ||
        "Failed to load conversations";
      set({ isFetchingThreads: false, error: message });
    }
  },

  loadThread: async (conversationId: string) => {
    try {
      const response = await getAgentConversation(conversationId);
      if (response.success && response.conversation) {
        const conv = response.conversation;
        const loadedMessages: Message[] = (conv.messages || []).map((m) => ({
          id: crypto.randomUUID(),
          role: m.role === "user" ? ("user" as const) : ("assistant" as const),
          content: m.content,
          createdAt: new Date(m.timestamp).getTime(),
          status: "done" as const,
        }));
        set({
          messages: loadedMessages,
          conversationId: conv.conversationId,
          error: null,
        });
      }
    } catch (err) {
      set({ error: `Failed to load conversation: ${(err as Error).message}` });
    }
  },

  toggleThreads: () => set((state) => ({ showThreads: !state.showThreads })),

  deleteThread: async (conversationId: string) => {
    // Prevent duplicate API calls if the thread is already removed or undergoing deletion
    const threadExists = get().threads.some((t) => t.conversationId === conversationId);
    if (!threadExists) return;

    try {
      // Optimistic update: instantly update UI for responsive design feel
      set((state) => ({
        threads: state.threads.filter((t) => t.conversationId !== conversationId),
        // Also clear active messages if this thread was open
        ...(state.conversationId === conversationId
          ? { messages: [], conversationId: null }
          : {}),
      }));

      await deleteAgentConversation(conversationId);
    } catch (err) {
      set({ error: `Failed to delete conversation: ${(err as Error).message}` });
      // Rollback optimistic update on error
      get().fetchThreads();
    }
  },

  deleteAllThreads: async () => {
    try {
      await deleteAllAgentConversations();
      set({
        threads: [],
        messages: [],
        conversationId: null,
      });
    } catch (err) {
      set({ error: `Failed to delete all conversations: ${(err as Error).message}` });
    }
  },

  updateThreadTitle: async (conversationId: string, title: string) => {
    try {
      await updateAgentConversationTitle(conversationId, title);
      set((state) => ({
        threads: state.threads.map((t) =>
          t.conversationId === conversationId ? { ...t, title } : t
        ),
      }));
    } catch (err) {
      set({ error: `Failed to update title: ${(err as Error).message}` });
    }
  },

  deleteMultipleThreads: async (conversationIds: string[]) => {
    try {
      // Optimistic updates
      set((state) => ({
        threads: state.threads.filter((t) => !conversationIds.includes(t.conversationId)),
        totalCount: Math.max(0, state.totalCount - conversationIds.length),
        // Clear active conversation if deleted
        ...(state.conversationId && conversationIds.includes(state.conversationId)
          ? { messages: [], conversationId: null }
          : {}),
      }));

      await deleteMultipleAgentConversations(conversationIds);
    } catch (err) {
      set({ error: `Failed to delete selected conversations: ${(err as Error).message}` });
      // Rollback
      get().fetchThreads();
    }
  },
}));
