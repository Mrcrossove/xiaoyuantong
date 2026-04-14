import type { Request, Response } from "express";
import { ok } from "../utils/response";
import { adminLogin, getAdminSession } from "../services/auth.service";
import { miniLogin } from "../services/mini-auth.service";

export async function adminLoginAction(req: Request, res: Response) {
  const data = await adminLogin(req.body);
  return ok(res, data, req.traceId, "登录成功");
}

export async function getAdminSessionAction(req: Request, res: Response) {
  const data = await getAdminSession(req.adminAuth!.userId);
  return ok(res, data, req.traceId);
}

export async function miniLoginAction(req: Request, res: Response) {
  const data = await miniLogin(req.body);
  return ok(res, data, req.traceId, "登录成功");
}
