import type { Request, Response } from "express";
import { queryMiniHomeBannerList } from "../services/mini-operation.service";
import { ok } from "../utils/response";

export async function listMiniHomeBannerAction(req: Request, res: Response) {
  const data = await queryMiniHomeBannerList(req.query as Record<string, unknown>);
  return ok(res, data, req.traceId);
}
