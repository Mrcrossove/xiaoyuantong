import type { Request, Response } from "express";
import { ok } from "../utils/response";
import { idParamSchema } from "./schemas";
import { queryAdminPostList, queryAdminPostReportList, reviewAdminPostReport } from "../services/post-admin.service";

export async function listAdminPostAction(req: Request, res: Response) {
  const data = await queryAdminPostList(req.adminAuth!.userId, req.query as Record<string, unknown>);
  return ok(res, data, req.traceId);
}

export async function listAdminPostReportAction(req: Request, res: Response) {
  const data = await queryAdminPostReportList(req.adminAuth!.userId, req.query as Record<string, unknown>);
  return ok(res, data, req.traceId);
}

export async function reviewAdminPostReportAction(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const data = await reviewAdminPostReport(id, req.adminAuth!.userId, req.body);
  return ok(res, data, req.traceId, "举报审核完成");
}
