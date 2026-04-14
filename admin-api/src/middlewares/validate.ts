import type { NextFunction, Request, Response } from "express";
import type { ZodTypeAny } from "zod";
import { ERROR_CODES } from "../constants/error-codes";

export function validateBody(schema: ZodTypeAny) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        code: ERROR_CODES.BAD_REQUEST,
        message: result.error.issues[0]?.message || "参数错误",
        data: null,
        traceId: req.traceId
      });
    }
    req.body = result.data;
    next();
  };
}
