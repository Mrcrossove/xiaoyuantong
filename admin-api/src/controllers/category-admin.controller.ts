import type { Request, Response } from "express";
import { ok } from "../utils/response";
import { batchIdsSchema, batchStatusSchema, idParamSchema } from "./schemas";
import {
  batchDeleteAdminCategory,
  batchSetAdminCategoryStatus,
  createAdminCategory,
  deleteAdminCategory,
  queryAdminCategoryList,
  toggleAdminCategoryStatus,
  updateAdminCategory,
  type AdminCategoryKind
} from "../services/category-admin.service";

function createListAction(kind: AdminCategoryKind) {
  return async (req: Request, res: Response) => {
    const data = await queryAdminCategoryList(kind, req.adminAuth!.userId, req.query as Record<string, unknown>);
    return ok(res, data, req.traceId);
  };
}

function createCreateAction(kind: AdminCategoryKind) {
  return async (req: Request, res: Response) => {
    const data = await createAdminCategory(kind, req.adminAuth!.userId, req.body);
    return ok(res, data, req.traceId, "创建成功");
  };
}

function createUpdateAction(kind: AdminCategoryKind) {
  return async (req: Request, res: Response) => {
    const { id } = idParamSchema.parse(req.params);
    const data = await updateAdminCategory(kind, req.adminAuth!.userId, id, req.body);
    return ok(res, data, req.traceId, "更新成功");
  };
}

function createToggleStatusAction(kind: AdminCategoryKind) {
  return async (req: Request, res: Response) => {
    const { id } = idParamSchema.parse(req.params);
    const data = await toggleAdminCategoryStatus(kind, req.adminAuth!.userId, id);
    return ok(res, data, req.traceId, "状态已更新");
  };
}

function createDeleteAction(kind: AdminCategoryKind) {
  return async (req: Request, res: Response) => {
    const { id } = idParamSchema.parse(req.params);
    await deleteAdminCategory(kind, req.adminAuth!.userId, id);
    return ok(res, { success: true }, req.traceId, "删除成功");
  };
}

function createBatchDeleteAction(kind: AdminCategoryKind) {
  return async (req: Request, res: Response) => {
    const payload = batchIdsSchema.parse(req.body);
    await batchDeleteAdminCategory(kind, req.adminAuth!.userId, payload.ids);
    return ok(res, { success: true }, req.traceId, "批量删除成功");
  };
}

function createBatchStatusAction(kind: AdminCategoryKind) {
  return async (req: Request, res: Response) => {
    const payload = batchStatusSchema.parse(req.body);
    await batchSetAdminCategoryStatus(kind, req.adminAuth!.userId, payload.ids, payload.status);
    return ok(res, { success: true }, req.traceId, "批量状态更新成功");
  };
}

export const listPostCategoryAction = createListAction("post");
export const createPostCategoryAction = createCreateAction("post");
export const updatePostCategoryAction = createUpdateAction("post");
export const togglePostCategoryStatusAction = createToggleStatusAction("post");
export const deletePostCategoryAction = createDeleteAction("post");
export const batchDeletePostCategoryAction = createBatchDeleteAction("post");
export const batchStatusPostCategoryAction = createBatchStatusAction("post");

export const listStoreCategoryAction = createListAction("store");
export const createStoreCategoryAction = createCreateAction("store");
export const updateStoreCategoryAction = createUpdateAction("store");
export const toggleStoreCategoryStatusAction = createToggleStatusAction("store");
export const deleteStoreCategoryAction = createDeleteAction("store");
export const batchDeleteStoreCategoryAction = createBatchDeleteAction("store");
export const batchStatusStoreCategoryAction = createBatchStatusAction("store");

export const listProductCategoryAction = createListAction("product");
export const createProductCategoryAction = createCreateAction("product");
export const updateProductCategoryAction = createUpdateAction("product");
export const toggleProductCategoryStatusAction = createToggleStatusAction("product");
export const deleteProductCategoryAction = createDeleteAction("product");
export const batchDeleteProductCategoryAction = createBatchDeleteAction("product");
export const batchStatusProductCategoryAction = createBatchStatusAction("product");
