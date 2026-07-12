import { getDb } from "../../config/mongoDbConnect";
import type { RouteHandler } from "../../types/express";

export const mongoDbConnection: RouteHandler = async (req, res, next) => {
  try {
    const db = await getDb();
    req.db = db;
    next();
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error);
    return res.status(500).json({ error: "Database connection failed" });
  }
};
