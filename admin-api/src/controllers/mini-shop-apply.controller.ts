import type { Request, Response } from "express";
import { assertRequestAdminPermission } from "../middlewares/auth";
import { ok } from "../utils/response";
import {
  createMiniShopApply,
  getCurrentMiniShopApply,
  queryAdminShopApplyList,
  reviewMiniShopApply
} from "../services/mini-shop-apply.service";
import type { MiniShopApplyPayload, MiniShopApplyReviewPayload } from "./schemas";

export async function getCurrentMiniShopApplyAction(req: Request, res: Response) {
  const data = await getCurrentMiniShopApply(req.miniAuth!.userId);
  return ok(res, data, req.traceId);
}

export async function submitMiniShopApplyAction(req: Request, res: Response) {
  const data = await createMiniShopApply(req.miniAuth!.userId, req.body as MiniShopApplyPayload);
  return ok(res, data, req.traceId);
}

export async function listAdminShopApplyAction(req: Request, res: Response) {
  const data = await queryAdminShopApplyList(req.query as Record<string, unknown>);
  return ok(res, data, req.traceId);
}

export async function reviewMiniShopApplyAction(req: Request, res: Response) {
  const status = String(req.body?.status || "");
  const requiredPermissions = status === "已通过" ? ["store:apply:approve"] : ["store:apply:reject"];
  await assertRequestAdminPermission(req, ...requiredPermissions);
  const data = await reviewMiniShopApply(Number(req.params.id), req.body as MiniShopApplyReviewPayload);
  return ok(res, data, req.traceId);
}
