import { getDb } from "../../config/mongoDbConnect";
import type { RouteHandler } from "../../types/express";
import logger from "../../utils/logger";

export const mongoDbConnection: RouteHandler = async (req, res, next) => {
  try {
    const db = await getDb();
    req.db = db;
    next();
  } catch (error: any) {
    logger.error(`MongoDB connection failed: ${error?.message}`);
    return res.status(500).json({ error: "Database connection failed" });
  }
};
