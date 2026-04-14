import type { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { ERROR_CODES } from "../constants/error-codes";
import { ApiError } from "../utils/api-error";

export function errorHandler(error: unknown, req: Request, res: Response, _next: NextFunction) {
  if (error instanceof ZodError) {
    return res.status(400).json({
      code: ERROR_CODES.BAD_REQUEST,
      message: error.issues[0]?.message || "参数错误",
      data: null,
      traceId: req.traceId
    });
  }

  if (error instanceof ApiError) {
    return res.status(error.status).json({
      code: error.code,
      message: error.message,
      data: null,
      traceId: req.traceId
    });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
    return res.status(404).json({
      code: ERROR_CODES.NOT_FOUND,
      message: "目标记录不存在",
      data: null,
      traceId: req.traceId
    });
  }

  const message = error instanceof Error ? error.message : "服务器内部错误";
  return res.status(500).json({
    code: ERROR_CODES.SERVER_ERROR,
    message,
    data: null,
    traceId: req.traceId
  });
}
