import { planningTool } from "./planning.tool";
import { searchTool } from "./search.tool";
import { apiTool } from "./api.tool";

// ==========================================
// Tool Registry — Central export for all tools
// ==========================================

export const allTools = [planningTool, searchTool, apiTool];

export const toolMap = {
  create_plan: planningTool,
  search_knowledge: searchTool,
  call_api: apiTool,
} as const;

export { planningTool, searchTool, apiTool };
