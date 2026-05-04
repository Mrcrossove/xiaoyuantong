import type { Request, Response } from "express";
import { ok } from "../utils/response";
import { idParamSchema } from "./schemas";
import {
  deleteMiniMessageForUser,
  getMiniMessageUnreadSummary,
  markAllMiniMessagesRead,
  markMiniMessageRead,
  queryMiniMessages
} from "../services/mini-message.service";
import type { MiniMessageReadAllPayload } from "./schemas";

export async function listMiniMessageAction(req: Request, res: Response) {
  const data = await queryMiniMessages(req.miniAuth!.userId, req.query as Record<string, unknown>);
  return ok(res, data, req.traceId);
}

export async function markMiniMessageReadAction(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const data = await markMiniMessageRead(req.miniAuth!.userId, id);
  return ok(res, data, req.traceId, "\u5df2\u8bbe\u4e3a\u5df2\u8bfb");
}

export async function deleteMiniMessageAction(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const data = await deleteMiniMessageForUser(req.miniAuth!.userId, id);
  return ok(res, data, req.traceId, "\u6d88\u606f\u5df2\u5220\u9664");
}

export async function markAllMiniMessageReadAction(req: Request, res: Response) {
  const data = await markAllMiniMessagesRead(
    req.miniAuth!.userId,
    (req.body || {}) as MiniMessageReadAllPayload,
    req.query as Record<string, unknown>
  );
  return ok(res, data, req.traceId, "\u5df2\u5168\u90e8\u8bbe\u4e3a\u5df2\u8bfb");
}

export async function getMiniMessageUnreadSummaryAction(req: Request, res: Response) {
  const data = await getMiniMessageUnreadSummary(req.miniAuth!.userId, req.query as Record<string, unknown>);
  return ok(res, data, req.traceId);
}
