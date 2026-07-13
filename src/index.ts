import * as dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import helmet from "helmet";
import indexRoutes from "./routes/routes";
import { mongoDbConnection } from "./middlewere/v1/mongoDbConnection";
import indexV1 from "./routes/v1/router";
import { patchAsyncRoutes } from "./middlewere/v1/asyncRouteWrapper";
import logger from "./utils/logger";
import { runStartupChecks } from "./utils/startupCheck";

// ==========================================
// Unhandled Error Handlers
// ==========================================
process.on("unhandledRejection", (reason: any) => {
  logger.error(`UNHANDLED REJECTION | reason: ${reason?.message || reason} | stack: ${reason?.stack}`);
});

process.on("uncaughtException", (err: any) => {
  logger.error(`UNCAUGHT EXCEPTION | message: ${err.message} | stack: ${err.stack}`);
  setTimeout(() => process.exit(1), 500);
});

process.on("SIGINT", () => {
  logger.info("Agent Server shutting down (SIGINT)");
  process.exit(0);
});

process.on("SIGTERM", () => {
  logger.info("Agent Server terminated (SIGTERM)");
  process.exit(0);
});

// ==========================================
// Express App Setup
// ==========================================
const app = express();

const PORT = process.env.PORT || 4000;

// Security
app.use(helmet());
app.use(cors());

// Parse JSON bodies
app.use(express.json({ limit: "10mb" }));

// Root endpoints
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to the CPW Agent API!",
    version: "v1",
    timestamp: new Date().toISOString(),
  });
});

app.get("/health-check", (req, res) => {
  res.status(200).json({ status: "OK" });
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK" });
});

// Connect to MongoDB
app.use(mongoDbConnection);

// Mount routes
app.use("/api/v1", indexV1);
app.use(indexRoutes);

// Patch async routes for error handling
patchAsyncRoutes(app as any);

// ==========================================
// Global Error Handler
// ==========================================
app.use((err: any, req: any, res: any, next: any) => {
  logger.error(`API ERROR | ${req.method} ${req.originalUrl} | ${err.message}`);

  const statusCode = err.status || err.statusCode || 500;
  const message =
    process.env.NODE_ENV === "production"
      ? "Internal Server Error"
      : err.message || "Internal Server Error";

  res.status(statusCode).json({
    success: false,
    error: message,
  });
});

// ==========================================
// Start Server
// ==========================================
app.listen(PORT, () => {
  logger.info(`CPW Agent Server started | port: ${PORT} | env: ${process.env.NODE_ENV || "development"}`);
  // Validate API keys immediately after startup
  runStartupChecks();
});

