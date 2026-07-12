import { Annotation } from "@langchain/langgraph";
import type { BaseMessage } from "@langchain/core/messages";

// ==========================================
// DeepAgent State Definition
// ==========================================

export interface PlanStep {
  id: number;
  description: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  result?: string;
}

export const DeepAgentState = Annotation.Root({
  // Core message history — must be BaseMessage instances so ToolNode works correctly
  messages: Annotation<BaseMessage[]>({
    reducer: (prev, next) => [...prev, ...next],
    default: () => [],
  }),

  // Planning
  plan: Annotation<PlanStep[]>({
    reducer: (_prev, next) => next,
    default: () => [],
  }),

  currentStep: Annotation<number>({
    reducer: (_prev, next) => next,
    default: () => 0,
  }),

  // Sub-agent results
  subAgentResults: Annotation<Record<string, any>>({
    reducer: (prev, next) => ({ ...prev, ...next }),
    default: () => ({}),
  }),

  // Tool call tracking
  toolCalls: Annotation<any[]>({
    reducer: (prev, next) => [...prev, ...next],
    default: () => [],
  }),

  // Metadata
  metadata: Annotation<Record<string, any>>({
    reducer: (prev, next) => ({ ...prev, ...next }),
    default: () => ({}),
  }),

  // Routing decision
  nextNode: Annotation<string>({
    reducer: (_prev, next) => next,
    default: () => "responder",
  }),
});

export type DeepAgentStateType = typeof DeepAgentState.State;
