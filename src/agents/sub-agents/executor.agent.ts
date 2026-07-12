import { getAgentModel } from "../deep-agent/deep-agent.config";
import { EXECUTOR_PROMPT } from "../prompts/planner.prompts";
import logger from "../../utils/logger";

// ==========================================
// Executor Sub-Agent
// ==========================================

export interface ExecutionResult {
  output: string;
  status: "success" | "partial" | "failed";
  actions: string[];
}

/**
 * Executor sub-agent — executes planned tasks and reports results
 */
export const runExecutorAgent = async (
  task: string,
  plan?: string,
  context?: string,
): Promise<ExecutionResult> => {
  logger.agent("⚡ Executor sub-agent running...");

  const model = getAgentModel();

  let userContent = `Execute this task: ${task}`;
  if (plan) {
    userContent += `\n\nPlan to follow:\n${plan}`;
  }
  if (context) {
    userContent += `\n\nAdditional context:\n${context}`;
  }

  const messages = [
    { role: "system" as const, content: EXECUTOR_PROMPT },
    { role: "user" as const, content: userContent },
  ];

  const response = await model.invoke(messages);
  const content =
    typeof response.content === "string" ? response.content : "";

  return {
    output: content,
    status: "success",
    actions: [],
  };
};
