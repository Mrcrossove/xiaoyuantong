import type { Request, Response } from "express";
import { queryOrderStat, queryPostStat, queryStoreStat, queryUserStat } from "../services/stat-admin.service";
import { ok } from "../utils/response";

export async function getUserStatAction(req: Request, res: Response) {
  const data = await queryUserStat(req.adminAuth!.userId);
  return ok(res, data, req.traceId);
}

export async function getPostStatAction(req: Request, res: Response) {
  const data = await queryPostStat(req.adminAuth!.userId);
  return ok(res, data, req.traceId);
}

export async function getStoreStatAction(req: Request, res: Response) {
  const data = await queryStoreStat(req.adminAuth!.userId);
  return ok(res, data, req.traceId);
}

export async function getOrderStatAction(req: Request, res: Response) {
  const data = await queryOrderStat(req.adminAuth!.userId);
  return ok(res, data, req.traceId);
}
