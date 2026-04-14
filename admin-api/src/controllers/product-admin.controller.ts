import type { Request, Response } from "express";
import { ok } from "../utils/response";
import { queryAdminProductList } from "../services/product-admin.service";

export async function listAdminProductAction(req: Request, res: Response) {
  const data = await queryAdminProductList(req.adminAuth!.userId, req.query as Record<string, unknown>);
  return ok(res, data, req.traceId);
}
