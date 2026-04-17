import type { Request, Response } from "express";
import type { MiniOrderCreatePayload, MiniRefundApplyPayload } from "./mini-commerce-schemas";
import {
  cancelMiniOrder,
  createMiniOrder,
  createMiniRefund,
  finishMiniOrder,
  getMiniOrderDetail,
  payMiniOrder,
  queryAdminOrderList,
  queryMiniOrderList
} from "../services/mini-order.service";
import { ok } from "../utils/response";
import { idParamSchema } from "./schemas";

export async function listMiniOrderAction(req: Request, res: Response) {
  const data = await queryMiniOrderList(req.miniAuth!.userId, req.query as Record<string, unknown>);
  return ok(res, data, req.traceId);
}

export async function listAdminOrderAction(req: Request, res: Response) {
  const data = await queryAdminOrderList(req.query as Record<string, unknown>);
  return ok(res, data, req.traceId);
}

export async function getMiniOrderDetailAction(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const data = await getMiniOrderDetail(req.miniAuth!.userId, id);
  return ok(res, data, req.traceId);
}

export async function createMiniOrderAction(req: Request, res: Response) {
  const data = await createMiniOrder(req.miniAuth!.userId, req.body as MiniOrderCreatePayload);
  return ok(res, data, req.traceId, "下单成功");
}

export async function payMiniOrderAction(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const data = await payMiniOrder(req.miniAuth!.userId, id);
  return ok(res, data, req.traceId, "支付成功");
}

export async function cancelMiniOrderAction(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const data = await cancelMiniOrder(req.miniAuth!.userId, id);
  return ok(res, data, req.traceId, "订单已取消");
}

export async function finishMiniOrderAction(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const data = await finishMiniOrder(req.miniAuth!.userId, id);
  return ok(res, data, req.traceId, "订单已完成");
}

export async function createMiniRefundAction(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const data = await createMiniRefund(req.miniAuth!.userId, id, req.body as MiniRefundApplyPayload);
  return ok(res, data, req.traceId, "退款申请已提交");
}
