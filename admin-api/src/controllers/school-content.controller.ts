import type { Request, Response } from "express";
import { ok } from "../utils/response";
import { batchIdsSchema, batchStatusSchema, idParamSchema } from "./schemas";
import {
  batchDeleteSchoolContent,
  batchSetSchoolContentStatus,
  createSchoolContent,
  deleteSchoolContent,
  querySchoolContent,
  toggleSchoolContentStatus,
  updateSchoolContent
} from "../services/school-content.service";

export async function listSchoolContent(req: Request, res: Response) {
  const data = await querySchoolContent(req.adminAuth!.userId, req.query as Record<string, unknown>);
  return ok(res, data, req.traceId);
}

export async function createSchoolContentAction(req: Request, res: Response) {
  const data = await createSchoolContent(req.adminAuth!.userId, req.body);
  return ok(res, data, req.traceId, "创建成功");
}

export async function updateSchoolContentAction(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const data = await updateSchoolContent(req.adminAuth!.userId, id, req.body);
  return ok(res, data, req.traceId, "更新成功");
}

export async function toggleSchoolContentStatusAction(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const data = await toggleSchoolContentStatus(req.adminAuth!.userId, id);
  return ok(res, data, req.traceId, "状态已更新");
}

export async function deleteSchoolContentAction(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  await deleteSchoolContent(req.adminAuth!.userId, id);
  return ok(res, { success: true }, req.traceId, "删除成功");
}

export async function batchDeleteSchoolContentAction(req: Request, res: Response) {
  const payload = batchIdsSchema.parse(req.body);
  await batchDeleteSchoolContent(req.adminAuth!.userId, payload.ids);
  return ok(res, { success: true }, req.traceId, "批量删除成功");
}

export async function batchStatusSchoolContentAction(req: Request, res: Response) {
  const payload = batchStatusSchema.parse(req.body);
  await batchSetSchoolContentStatus(req.adminAuth!.userId, payload.ids, payload.status);
  return ok(res, { success: true }, req.traceId, "批量状态更新成功");
}
