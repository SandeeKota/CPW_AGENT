import express from "express";
import { AgentController } from "../../controllers/v1/agent.controller";
import { HealthController } from "../../controllers/v1/health.controller";
import { PineconeController } from "../../controllers/v1/pinecone.controller";
import { AuthMiddlewere } from "../../middlewere/v1/authCheck.middlewere";
import { agentRateLimiter } from "../../middleware/rateLimiter";

const router = express.Router();

// Middleware to log hit URL endpoint
router.use((req, res, next) => {
  // Avoid logging GET / (root) requests to reduce noise
  if (!(req.method === "GET" && req.originalUrl === "/")) {
    console.info(
      `[AGENT API HIT] ${req.method} ${req.originalUrl} from IP: ${req.ip}`,
    );
  }
  next();
});

// Health and status routes
router.get("/", (req, res) => {
  res.json({
    message: "Welcome to the CPW Agent API!",
    version: "v1",
    timestamp: new Date().toISOString(),
  });
});

// ===========================================
// PUBLIC ROUTES (No Authentication Required)
// ===========================================

// Health check
router.get("/health", HealthController.check);

// ===========================================
// PROTECTED ROUTES (Authentication Required)
// ===========================================

// Apply authentication middleware to all routes below
router.use(AuthMiddlewere.cognitoTokenVerification);

// Agent chat (with rate limiting)
router.post("/agent/chat", agentRateLimiter, AgentController.chat);

// Conversation management
router.get("/agent/conversations", AgentController.listConversations);
router.get(
  "/agent/conversations/:conversationId",
  AgentController.getConversation,
);
router.delete(
  "/agent/conversations/:conversationId",
  AgentController.deleteConversation,
);

// Feedback
router.post("/agent/feedback", AgentController.submitFeedback);

// Pinecone Ingestion endpoints
router.post("/pinecone/ingest/bulk", PineconeController.bulkIngest);
router.post("/pinecone/ingest/single", PineconeController.singleIngest);
router.delete("/pinecone/data", PineconeController.deleteData);

export default router;
