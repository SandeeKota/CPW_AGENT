import type { Response } from "express";

// ==========================================
// Standardized API Response Helper
// ==========================================
export class ApiResponse {
  static success(res: Response, data: any, statusCode: number = 200, meta?: Record<string, any>) {
    return res.status(statusCode).json({
      success: true,
      ...data,
      ...(meta ? { meta } : {}),
    });
  }

  static error(res: Response, message: string, statusCode: number = 500, details?: any) {
    return res.status(statusCode).json({
      success: false,
      error: message,
      ...(details ? { details } : {}),
    });
  }

  static validationError(res: Response, errors: any) {
    return res.status(400).json({
      success: false,
      error: "Validation failed",
      errors,
    });
  }
}
