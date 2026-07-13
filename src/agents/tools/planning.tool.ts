// @ts-nocheck
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";

// ==========================================
// Planning Tool — Task Decomposition
// ==========================================

export const planningTool: any = new DynamicStructuredTool({
  name: "create_plan",
  description:
    "Break a complex task into actionable steps. Use this when a user asks to plan, organize, or break down a complex request into manageable parts.",
  schema: z.object({
    task: z.string().describe("The task or goal to plan for"),
    context: z
      .string()
      .nullish()
      .describe("Additional context or constraints for the plan"),
  }),
  func: async ({ task, context }) => {
    const steps = [
      `Analyze: Understand the core requirements of "${task}"`,
      `Research: Gather relevant information and context`,
      `Plan: Create a structured approach`,
      `Execute: Implement the planned steps`,
      `Review: Verify the results and quality`,
    ];

    const plan = {
      task,
      context: context || "No additional context provided",
      steps: steps.map((step, i) => ({
        id: i + 1,
        description: step,
        status: "pending",
      })),
      totalSteps: steps.length,
    };

    return JSON.stringify(plan, null, 2);
  },
});
