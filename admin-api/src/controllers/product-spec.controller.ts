import type { Request, Response } from "express";
import { ok } from "../utils/response";
import { batchIdsSchema, batchStatusSchema, idParamSchema } from "./schemas";
import {
  batchDeleteProductSpec,
  batchSetProductSpecStatus,
  createProductSpec,
  deleteProductSpec,
  queryProductSpec,
  toggleProductSpecStatus,
  updateProductSpec
} from "../services/product-spec.service";

export async function listProductSpec(req: Request, res: Response) {
  const data = await queryProductSpec(req.adminAuth!.userId, req.query as Record<string, unknown>);
  return ok(res, data, req.traceId);
}

export async function createProductSpecAction(req: Request, res: Response) {
  const data = await createProductSpec(req.adminAuth!.userId, req.body);
  return ok(res, data, req.traceId, "创建成功");
}

export async function updateProductSpecAction(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const data = await updateProductSpec(req.adminAuth!.userId, id, req.body);
  return ok(res, data, req.traceId, "更新成功");
}

export async function toggleProductSpecStatusAction(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const data = await toggleProductSpecStatus(req.adminAuth!.userId, id);
  return ok(res, data, req.traceId, "状态已更新");
}

export async function deleteProductSpecAction(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  await deleteProductSpec(req.adminAuth!.userId, id);
  return ok(res, { success: true }, req.traceId, "删除成功");
}

export async function batchDeleteProductSpecAction(req: Request, res: Response) {
  const payload = batchIdsSchema.parse(req.body);
  await batchDeleteProductSpec(req.adminAuth!.userId, payload.ids);
  return ok(res, { success: true }, req.traceId, "批量删除成功");
}

export async function batchStatusProductSpecAction(req: Request, res: Response) {
  const payload = batchStatusSchema.parse(req.body);
  await batchSetProductSpecStatus(req.adminAuth!.userId, payload.ids, payload.status);
  return ok(res, { success: true }, req.traceId, "批量状态更新成功");
}
