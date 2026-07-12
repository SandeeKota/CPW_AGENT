import rateLimit from "express-rate-limit";
import type { Request, Response } from "express";

// ==========================================
// Agent Chat Rate Limiter
// ==========================================
export const agentRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // 20 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many agent requests. Please wait a moment before trying again.",
  },
  keyGenerator: (req: Request) => {
    // Use user email if authenticated, otherwise fall back to IP
    const userData = (req as any).userData;
    return userData?.email || req.ip || "unknown";
  },
});

// ==========================================
// General API Rate Limiter
// ==========================================
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many requests from this IP. Please try again later.",
  },
});
