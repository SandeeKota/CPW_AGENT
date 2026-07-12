import type { Request, Response, NextFunction } from "express";
import { Db } from "mongodb";
import type { UserDoc } from "../models/v1/User.model";

declare global {
  namespace Express {
    interface Request {
      db: Db;
      userData?: UserDoc;
      jwt?: any;
    }
  }
}

export type RouteHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => void;
