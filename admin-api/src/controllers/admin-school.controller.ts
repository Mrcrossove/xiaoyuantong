import type { Request, Response } from "express";
import { ok } from "../utils/response";
import { queryAdminSchoolList } from "../services/admin-school.service";

export async function listAdminSchoolAction(req: Request, res: Response) {
  const data = await queryAdminSchoolList(req.adminAuth!.userId, req.query as Record<string, unknown>);
  return ok(res, data, req.traceId);
}
