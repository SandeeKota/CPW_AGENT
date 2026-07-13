import fs from "fs/promises";
import path from "path";
import config from "../../../config/config";
import logger from "../../../utils/logger";

const SCHEMA_API_URL = config?.SCHEMA_API_URL || "http://localhost:3000/api/v1/agent/schemas";
const FALLBACK_PATH = path.join(__dirname, "../schemas/_static_schemas.json");

export async function fetchAndCacheSchemas(): Promise<any> {
  try {
    const response = await fetch(SCHEMA_API_URL);
    if (!response.ok) {
      throw new Error(`HTTP Status: ${response.status}`);
    }
    const data = await response.json() as any;
    if (data.success && data.data) {
      // Save it locally to update the fallback
      await fs.writeFile(FALLBACK_PATH, JSON.stringify(data.data, null, 2), "utf-8");
      logger.info("Agent schemas fetched and cached successfully.");
      return data.data;
    } else {
      throw new Error("Invalid response format from schema API.");
    }
  } catch (error: any) {
    // If backend is down or unreachable, quietly use the fallback without spamming logs
    logger.debug(`Schema API unavailable (${error.message}). Using local static schemas.`);
    try {
      const fileData = await fs.readFile(FALLBACK_PATH, "utf-8");
      return JSON.parse(fileData);
    } catch (fileError: any) {
      logger.error(`Critical: Both API and local fallback schemas failed to load. Agent may not function properly. Details: ${fileError.message}`);
      return null;
    }
  }
}

