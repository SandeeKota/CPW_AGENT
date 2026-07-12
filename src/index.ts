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

// ==========================================
// Unhandled Error Handlers
// ==========================================
process.on("unhandledRejection", (reason: any) => {
  console.error("=======================================");
  console.error("❌ UNHANDLED REJECTION");
  console.error("🕒 Time:", new Date().toISOString());
  console.error("📌 Reason:", reason);
  console.error("📌 Stack:", reason?.stack);
  console.error("=======================================");
});

process.on("uncaughtException", (err: any) => {
  console.error("=======================================");
  console.error("❌ UNCAUGHT EXCEPTION");
  console.error("🕒 Time:", new Date().toISOString());
  console.error("📌 Error:", err.message);
  console.error("📌 Stack:", err.stack);
  console.error("=======================================");
  setTimeout(() => process.exit(1), 500);
});

process.on("SIGINT", () => {
  console.log("=======================================");
  console.log("🛑 Agent Server is shutting down (SIGINT)");
  console.log("🕒 Time:", new Date().toISOString());
  console.log("=======================================");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("=======================================");
  console.log("🛑 Agent Server terminated (SIGTERM)");
  console.log("🕒 Time:", new Date().toISOString());
  console.log("=======================================");
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
  console.error("❌ API ERROR");
  console.error("🕒 Time:", new Date().toISOString());
  console.error("📌 Method:", req.method);
  console.error("📌 URL:", req.originalUrl);
  console.error("📌 Message:", err.message);
  console.error("📌 Stack:", err.stack);

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
  console.log("=======================================");
  console.log(`🤖 CPW Agent Server STARTED`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`📍 API: http://localhost:${PORT}/api/v1`);
  console.log(`🕒 Time: ${new Date().toISOString()}`);
  console.log("=======================================");
});
