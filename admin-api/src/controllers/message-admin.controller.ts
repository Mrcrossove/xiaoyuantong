import type { Request, Response } from "express";
import { ok } from "../utils/response";
import { idParamSchema } from "./schemas";
import {
  createMessageTemplate,
  deleteMessageTemplate,
  queryAdminInteractiveMessageList,
  queryAdminSendRecordList,
  queryAdminSystemMessageList,
  queryMessageTemplateList,
  toggleMessageTemplateStatus,
  updateMessageTemplate
} from "../services/message-admin.service";

export async function listAdminSystemMessageAction(req: Request, res: Response) {
  const data = await queryAdminSystemMessageList(req.adminAuth!.userId, req.query as Record<string, unknown>);
  return ok(res, data, req.traceId);
}

export async function listAdminSendRecordAction(req: Request, res: Response) {
  const data = await queryAdminSendRecordList(req.adminAuth!.userId, req.query as Record<string, unknown>);
  return ok(res, data, req.traceId);
}

export async function listAdminInteractiveMessageAction(req: Request, res: Response) {
  const data = await queryAdminInteractiveMessageList(req.adminAuth!.userId, req.query as Record<string, unknown>);
  return ok(res, data, req.traceId);
}

export async function listMessageTemplateAction(req: Request, res: Response) {
  const data = await queryMessageTemplateList(req.adminAuth!.userId, req.query as Record<string, unknown>);
  return ok(res, data, req.traceId);
}

export async function createMessageTemplateAction(req: Request, res: Response) {
  const data = await createMessageTemplate(req.adminAuth!.userId, req.body);
  return ok(res, data, req.traceId, "消息模板创建成功");
}

export async function updateMessageTemplateAction(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const data = await updateMessageTemplate(req.adminAuth!.userId, id, req.body);
  return ok(res, data, req.traceId, "消息模板更新成功");
}

export async function toggleMessageTemplateStatusAction(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const data = await toggleMessageTemplateStatus(req.adminAuth!.userId, id);
  return ok(res, data, req.traceId, "消息模板状态已更新");
}

export async function deleteMessageTemplateAction(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  await deleteMessageTemplate(req.adminAuth!.userId, id);
  return ok(res, { success: true }, req.traceId, "消息模板删除成功");
}
