import express from "express";
import logger from "../utils/logger";

const router = express.Router();

// Middleware to log hit URL endpoint
router.use((req, res, next) => {
  // Avoid logging GET / (root) requests to reduce noise
  if (!(req.method === "GET" && req.originalUrl === "/")) {
    logger.info(
      `[API HIT] ${req.method} ${req.originalUrl} from IP: ${req.ip}`,
    );
  }
  next();
});

// Routes
router.get("/", (req, res) => {
  res.json({
    message: "Welcome to the CPW Agent API!",
    version: "v1",
    timestamp: new Date().toISOString(),
  });
});

router.get("/health-check", (req, res) => {
  res.json({
    status: "OK",
    service: "CPW Agent API",
    timestamp: new Date().toISOString(),
  });
});

export default router;
