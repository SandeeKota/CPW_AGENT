import type { RouteHandler } from "../../types/express";

// ==========================================
// Health Controller
// ==========================================
export const HealthController = {
  check: <RouteHandler>((req, res) => {
    res.json({
      success: true,
      status: "OK",
      service: "CPW Agent API",
      version: "v1",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + "MB",
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + "MB",
      },
    });
  }),
};
