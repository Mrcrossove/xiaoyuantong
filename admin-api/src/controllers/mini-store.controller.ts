import type { Request, Response } from "express";
import { ok } from "../utils/response";
import { getMiniStoreDetail, queryAdminStoreList, queryMiniStores } from "../services/mini-store.service";

export async function listMiniStoreAction(req: Request, res: Response) {
  const data = await queryMiniStores(req.query as Record<string, unknown>);
  return ok(res, data, req.traceId);
}

export async function getMiniStoreDetailAction(req: Request, res: Response) {
  const data = await getMiniStoreDetail(String(req.params.detailId || ""));
  return ok(res, data, req.traceId);
}

export async function listAdminStoreAction(req: Request, res: Response) {
  const data = await queryAdminStoreList(req.adminAuth!.userId, req.query as Record<string, unknown>);
  return ok(res, data, req.traceId);
}
