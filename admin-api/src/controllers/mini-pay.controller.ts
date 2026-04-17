import type { Request, Response } from "express";
import { confirmMiniOrderPay, createMiniOrderPayParams } from "../services/mini-pay.service";
import { ok } from "../utils/response";
import { idParamSchema } from "./schemas";

export async function createMiniOrderPayAction(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const data = await createMiniOrderPayParams(req.miniAuth!.userId, id);
  return ok(res, data, req.traceId, "拉起支付成功");
}

export async function confirmMiniOrderPayAction(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const data = await confirmMiniOrderPay(req.miniAuth!.userId, id);
  return ok(res, data, req.traceId, "支付成功");
}
