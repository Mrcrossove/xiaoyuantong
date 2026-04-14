import type { Request, Response } from "express";
import { ok } from "../utils/response";
import { getMiniFavoriteStatus, queryMiniFavoriteList, toggleMiniFavorite } from "../services/mini-favorite.service";

export async function toggleMiniFavoriteAction(req: Request, res: Response) {
  const data = await toggleMiniFavorite(req.miniAuth!.userId, req.body as any);
  return ok(res, data, req.traceId);
}

export async function getMiniFavoriteStatusAction(req: Request, res: Response) {
  const data = await getMiniFavoriteStatus(
    req.miniAuth!.userId,
    String(req.query.targetType || "") as "post" | "store",
    String(req.query.targetId || "")
  );
  return ok(res, data, req.traceId);
}

export async function listMiniFavoriteAction(req: Request, res: Response) {
  const data = await queryMiniFavoriteList(req.miniAuth!.userId, req.query as Record<string, unknown>);
  return ok(res, data, req.traceId);
}
