import type { Request, Response } from "express";
import { ok } from "../utils/response";
import { idParamSchema } from "./schemas";
import { queryRefundList, reviewRefund } from "../services/trade-admin.service";

export async function listRefundAction(req: Request, res: Response) {
  const data = await queryRefundList(req.adminAuth!.userId, req.query as Record<string, unknown>);
  return ok(res, data, req.traceId);
}

export async function reviewRefundAction(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const data = await reviewRefund(id, req.adminAuth!.userId, req.body);
  return ok(res, data, req.traceId, "退款审核完成");
}
