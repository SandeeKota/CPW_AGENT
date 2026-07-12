import { getAgentModel } from "../deep-agent/deep-agent.config";
import { PLANNER_PROMPT } from "../prompts/planner.prompts";
import logger from "../../utils/logger";

// ==========================================
// Planner Sub-Agent
// ==========================================

export interface PlanResult {
  steps: Array<{
    id: number;
    description: string;
    priority: "high" | "medium" | "low";
  }>;
  summary: string;
}

/**
 * Planner sub-agent — breaks a complex task into actionable steps
 */
export const runPlannerAgent = async (
  task: string,
  context?: string,
): Promise<PlanResult> => {
  logger.agent("📋 Planner sub-agent running...");

  const model = getAgentModel();

  const messages = [
    { role: "system" as const, content: PLANNER_PROMPT },
    {
      role: "user" as const,
      content: context
        ? `Task: ${task}\n\nAdditional context: ${context}`
        : `Task: ${task}`,
    },
  ];

  const response = await model.invoke(messages);
  const content =
    typeof response.content === "string" ? response.content : "";

  // Parse the response into structured plan
  const steps = content
    .split("\n")
    .filter((line) => line.match(/^[-*]\s*Step\s*\d+/i) || line.match(/^\d+\./))
    .map((line, index) => ({
      id: index + 1,
      description: line.replace(/^[-*]\s*Step\s*\d+[:.]\s*/i, "").replace(/^\d+\.\s*/, "").trim(),
      priority: "medium" as const,
    }));

  return {
    steps: steps.length > 0 ? steps : [{ id: 1, description: content, priority: "medium" }],
    summary: content,
  };
};
