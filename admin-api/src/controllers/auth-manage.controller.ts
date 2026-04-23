import type { Request, Response } from "express";
import { ok } from "../utils/response";
import { idParamSchema } from "./schemas";
import {
  createAdminRole,
  createAdminRoleFromTemplate,
  createAdminUser,
  deleteAdminRole,
  deleteAdminUser,
  getCurrentMenuPermission,
  queryAdminRoleList,
  queryAdminUserManageList,
  queryAuthManageMeta,
  toggleAdminRoleStatus,
  toggleAdminUserStatus,
  updateAdminRole,
  updateAdminUser,
  updateRolePermission
} from "../services/auth-manage.service";

export async function getAuthManageMetaAction(req: Request, res: Response) {
  const data = await queryAuthManageMeta(req.adminAuth!.userId);
  return ok(res, data, req.traceId);
}

export async function listAdminUserManageAction(req: Request, res: Response) {
  const data = await queryAdminUserManageList(req.adminAuth!.userId, req.query as Record<string, unknown>);
  return ok(res, data, req.traceId);
}

export async function createAdminUserManageAction(req: Request, res: Response) {
  const data = await createAdminUser(req.adminAuth!.userId, req.body);
  return ok(res, data, req.traceId, "管理员创建成功");
}

export async function updateAdminUserManageAction(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const data = await updateAdminUser(req.adminAuth!.userId, id, req.body);
  return ok(res, data, req.traceId, "管理员更新成功");
}

export async function toggleAdminUserManageStatusAction(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const data = await toggleAdminUserStatus(req.adminAuth!.userId, id);
  return ok(res, data, req.traceId, "管理员状态已更新");
}

export async function deleteAdminUserManageAction(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  await deleteAdminUser(req.adminAuth!.userId, id);
  return ok(res, { success: true }, req.traceId, "管理员删除成功");
}

export async function listAdminRoleAction(req: Request, res: Response) {
  const data = await queryAdminRoleList(req.adminAuth!.userId, req.query as Record<string, unknown>);
  return ok(res, data, req.traceId);
}

export async function createAdminRoleAction(req: Request, res: Response) {
  const data = await createAdminRole(req.adminAuth!.userId, req.body);
  return ok(res, data, req.traceId, "角色创建成功");
}

export async function createAdminRoleFromTemplateAction(req: Request, res: Response) {
  const templateCode = String(req.params.code || "").trim();
  const data = await createAdminRoleFromTemplate(req.adminAuth!.userId, templateCode);
  return ok(res, data, req.traceId, "角色模板创建成功");
}

export async function updateAdminRoleAction(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const data = await updateAdminRole(req.adminAuth!.userId, id, req.body);
  return ok(res, data, req.traceId, "角色更新成功");
}

export async function toggleAdminRoleStatusAction(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const data = await toggleAdminRoleStatus(req.adminAuth!.userId, id);
  return ok(res, data, req.traceId, "角色状态已更新");
}

export async function deleteAdminRoleAction(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  await deleteAdminRole(req.adminAuth!.userId, id);
  return ok(res, { success: true }, req.traceId, "角色删除成功");
}

export async function updateRolePermissionAction(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const data = await updateRolePermission(req.adminAuth!.userId, id, req.body);
  return ok(res, data, req.traceId, "角色权限已更新");
}

export async function getCurrentMenuPermissionAction(req: Request, res: Response) {
  const data = await getCurrentMenuPermission(req.adminAuth!.userId);
  return ok(res, data, req.traceId);
}
