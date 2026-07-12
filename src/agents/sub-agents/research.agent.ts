import { getAgentModel } from "../deep-agent/deep-agent.config";
import { RESEARCH_PROMPT } from "../prompts/planner.prompts";
import logger from "../../utils/logger";

// ==========================================
// Research Sub-Agent
// ==========================================

export interface ResearchResult {
  findings: string;
  sources: string[];
  confidence: "high" | "medium" | "low";
}

/**
 * Research sub-agent — gathers information and provides insights
 */
export const runResearchAgent = async (
  query: string,
  context?: string,
): Promise<ResearchResult> => {
  logger.agent("🔍 Research sub-agent running...");

  const model = getAgentModel();

  const messages = [
    { role: "system" as const, content: RESEARCH_PROMPT },
    {
      role: "user" as const,
      content: context
        ? `Research query: ${query}\n\nContext: ${context}`
        : `Research query: ${query}`,
    },
  ];

  const response = await model.invoke(messages);
  const content =
    typeof response.content === "string" ? response.content : "";

  return {
    findings: content,
    sources: [],
    confidence: "medium",
  };
};
