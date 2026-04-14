import type { Request, Response } from "express";
import { ok } from "../utils/response";
import { queryOperationLogs } from "../services/operation-log.service";
import { getVersionInfo } from "../services/version.service";
import {
  createBasicConfig,
  createDictItem,
  createDictType,
  deleteBasicConfig,
  deleteDictItem,
  deleteDictType,
  queryBasicConfigList,
  queryDictConfig,
  toggleBasicConfigStatus,
  toggleDictItemStatus,
  toggleDictTypeStatus,
  updateBasicConfig,
  updateDictItem,
  updateDictType
} from "../services/system-config.service";
import { idParamSchema } from "./schemas";

export async function listOperationLogsAction(req: Request, res: Response) {
  const data = await queryOperationLogs(req.adminAuth!.userId, req.query as Record<string, unknown>);
  return ok(res, data, req.traceId);
}

export async function getVersionInfoAction(req: Request, res: Response) {
  const data = getVersionInfo();
  return ok(res, data, req.traceId);
}

export async function listBasicConfigAction(req: Request, res: Response) {
  const data = await queryBasicConfigList(req.query as Record<string, unknown>);
  return ok(res, data, req.traceId);
}

export async function createBasicConfigAction(req: Request, res: Response) {
  const data = await createBasicConfig(req.body);
  return ok(res, data, req.traceId, "基础配置创建成功");
}

export async function updateBasicConfigAction(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const data = await updateBasicConfig(id, req.body);
  return ok(res, data, req.traceId, "基础配置更新成功");
}

export async function toggleBasicConfigStatusAction(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const data = await toggleBasicConfigStatus(id);
  return ok(res, data, req.traceId, "基础配置状态已更新");
}

export async function deleteBasicConfigAction(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  await deleteBasicConfig(id);
  return ok(res, { success: true }, req.traceId, "基础配置删除成功");
}

export async function getDictConfigAction(req: Request, res: Response) {
  const data = await queryDictConfig();
  return ok(res, data, req.traceId);
}

export async function createDictTypeAction(req: Request, res: Response) {
  const data = await createDictType(req.body);
  return ok(res, data, req.traceId, "字典类型创建成功");
}

export async function updateDictTypeAction(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const data = await updateDictType(id, req.body);
  return ok(res, data, req.traceId, "字典类型更新成功");
}

export async function toggleDictTypeStatusAction(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const data = await toggleDictTypeStatus(id);
  return ok(res, data, req.traceId, "字典类型状态已更新");
}

export async function deleteDictTypeAction(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  await deleteDictType(id);
  return ok(res, { success: true }, req.traceId, "字典类型删除成功");
}

export async function createDictItemAction(req: Request, res: Response) {
  const data = await createDictItem(req.body);
  return ok(res, data, req.traceId, "字典项创建成功");
}

export async function updateDictItemAction(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const data = await updateDictItem(id, req.body);
  return ok(res, data, req.traceId, "字典项更新成功");
}

export async function toggleDictItemStatusAction(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const data = await toggleDictItemStatus(id);
  return ok(res, data, req.traceId, "字典项状态已更新");
}

export async function deleteDictItemAction(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  await deleteDictItem(id);
  return ok(res, { success: true }, req.traceId, "字典项删除成功");
}
