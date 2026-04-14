import type { Request, Response } from "express";
import { ok } from "../utils/response";
import { getDashboardOverview } from "../services/dashboard.service";

export async function getDashboardOverviewAction(req: Request, res: Response) {
  const data = await getDashboardOverview(req.adminAuth!.userId);
  return ok(res, data, req.traceId);
}
