import type { Request, Response } from "express";
import { assertRequestAdminPermission } from "../middlewares/auth";
import { ok } from "../utils/response";
import { idParamSchema } from "./schemas";
import {
  getCurrentVerification,
  queryVerificationList,
  reviewVerification,
  submitVerification
} from "../services/verification.service";

export async function getCurrentVerificationAction(req: Request, res: Response) {
  const data = await getCurrentVerification(req.miniAuth!.userId);
  return ok(res, data, req.traceId);
}

export async function submitVerificationAction(req: Request, res: Response) {
  const data = await submitVerification(req.miniAuth!.userId, req.body);
  return ok(res, data, req.traceId, "认证成功");
}

export async function listVerificationAction(req: Request, res: Response) {
  const data = await queryVerificationList(req.adminAuth!.userId, req.query as Record<string, unknown>);
  return ok(res, data, req.traceId);
}

export async function reviewVerificationAction(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const status = String(req.body?.status || "");
  const requiredPermissions = status === "已通过" ? ["verify:approve"] : ["verify:reject"];
  await assertRequestAdminPermission(req, ...requiredPermissions);
  const data = await reviewVerification(id, req.adminAuth!.userId, req.body);
  return ok(res, data, req.traceId, "审核完成");
}
