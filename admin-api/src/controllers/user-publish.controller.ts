import type { Request, Response } from "express";
import { ok } from "../utils/response";
import { batchIdsSchema, batchStatusSchema, idParamSchema } from "./schemas";
import {
  batchDeleteUserPublish,
  batchSetUserPublishStatus,
  createUserPublish,
  deleteUserPublish,
  queryUserPublish,
  toggleUserPublishStatus,
  updateUserPublish
} from "../services/user-publish.service";

export async function listUserPublish(req: Request, res: Response) {
  const data = await queryUserPublish(req.adminAuth!.userId, req.query as Record<string, unknown>);
  return ok(res, data, req.traceId);
}

export async function createUserPublishAction(req: Request, res: Response) {
  const data = await createUserPublish(req.adminAuth!.userId, req.body);
  return ok(res, data, req.traceId, "创建成功");
}

export async function updateUserPublishAction(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const data = await updateUserPublish(req.adminAuth!.userId, id, req.body);
  return ok(res, data, req.traceId, "更新成功");
}

export async function toggleUserPublishStatusAction(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const data = await toggleUserPublishStatus(req.adminAuth!.userId, id);
  return ok(res, data, req.traceId, "状态已更新");
}

export async function deleteUserPublishAction(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  await deleteUserPublish(req.adminAuth!.userId, id);
  return ok(res, { success: true }, req.traceId, "删除成功");
}

export async function batchDeleteUserPublishAction(req: Request, res: Response) {
  const payload = batchIdsSchema.parse(req.body);
  await batchDeleteUserPublish(req.adminAuth!.userId, payload.ids);
  return ok(res, { success: true }, req.traceId, "批量删除成功");
}

export async function batchStatusUserPublishAction(req: Request, res: Response) {
  const payload = batchStatusSchema.parse(req.body);
  await batchSetUserPublishStatus(req.adminAuth!.userId, payload.ids, payload.status);
  return ok(res, { success: true }, req.traceId, "批量状态更新成功");
}
