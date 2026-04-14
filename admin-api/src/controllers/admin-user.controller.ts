import type { Request, Response } from "express";
import { ok } from "../utils/response";
import { queryAdminUserList } from "../services/admin-user.service";

export async function listAdminUserAction(req: Request, res: Response) {
  const data = await queryAdminUserList(req.adminAuth!.userId, req.query as Record<string, unknown>);
  return ok(res, data, req.traceId);
}
