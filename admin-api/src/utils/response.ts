import type { Response } from "express";
import { ERROR_CODES } from "../constants/error-codes";

export function ok<T>(res: Response, data: T, traceId: string, message = "成功") {
  return res.json({
    code: ERROR_CODES.OK,
    message,
    data,
    traceId
  });
}
