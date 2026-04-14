import type { Request, Response } from "express";
import { ERROR_CODES } from "../constants/error-codes";

export function notFoundHandler(req: Request, res: Response) {
  return res.status(404).json({
    code: ERROR_CODES.NOT_FOUND,
    message: "接口不存在",
    data: null,
    traceId: req.traceId
  });
}
