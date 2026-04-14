import { randomUUID } from "crypto";
import type { NextFunction, Request, Response } from "express";

export function traceIdMiddleware(req: Request, _res: Response, next: NextFunction) {
  req.traceId = randomUUID();
  next();
}
