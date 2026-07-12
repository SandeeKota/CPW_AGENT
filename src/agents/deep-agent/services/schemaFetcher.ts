import fs from "fs/promises";
import path from "path";
import config from "../../../config/config";

const SCHEMA_API_URL = config?.SCHEMA_API_URL || "http://localhost:3000/api/v1/agent/schemas";
const FALLBACK_PATH = path.join(__dirname, "../schemas/_static_schemas.json");

export async function fetchAndCacheSchemas(): Promise<any> {
  try {
    const response = await fetch(SCHEMA_API_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch schemas. HTTP Status: ${response.status}`);
    }
    const data = await response.json() as any;
    if (data.success && data.data) {
      // Save it locally to update the fallback
      await fs.writeFile(FALLBACK_PATH, JSON.stringify(data.data, null, 2), "utf-8");
      console.log("Successfully fetched and cached latest agent schemas from backend.");
      return data.data;
    } else {
      throw new Error("Invalid response format from schema API.");
    }
  } catch (error: any) {
    console.error("Error fetching agent schemas, falling back to static schemas:", error.message);
    try {
      const fileData = await fs.readFile(FALLBACK_PATH, "utf-8");
      return JSON.parse(fileData);
    } catch (fileError) {
      console.error("Failed to load fallback schemas:", fileError);
      return null;
    }
  }
}
