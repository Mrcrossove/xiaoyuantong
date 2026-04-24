import type { Request, Response } from "express";
import { ok } from "../utils/response";
import { idParamSchema } from "./schemas";
import {
  assignSchoolAdminAccount,
  createSchoolAdminApplication,
  getCurrentSchoolAdminApplication,
  querySchoolAdminApplicationList,
  reviewSchoolAdminApplication
} from "../services/school-admin-application.service";
import type {
  SchoolAdminApplicationAssignPayload,
  SchoolAdminApplicationPayload,
  SchoolAdminApplicationReviewPayload
} from "./schemas";

export async function getCurrentSchoolAdminApplicationAction(req: Request, res: Response) {
  const data = await getCurrentSchoolAdminApplication(req.miniAuth!.userId);
  return ok(res, data, req.traceId);
}

export async function submitSchoolAdminApplicationAction(req: Request, res: Response) {
  const data = await createSchoolAdminApplication(req.miniAuth!.userId, req.body as SchoolAdminApplicationPayload);
  return ok(res, data, req.traceId, "申请已提交");
}

export async function listSchoolAdminApplicationAction(req: Request, res: Response) {
  const data = await querySchoolAdminApplicationList(req.adminAuth!.userId, req.query as Record<string, unknown>);
  return ok(res, data, req.traceId);
}

export async function reviewSchoolAdminApplicationAction(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const data = await reviewSchoolAdminApplication(
    req.adminAuth!.userId,
    id,
    req.body as SchoolAdminApplicationReviewPayload
  );
  return ok(res, data, req.traceId, "申请状态已更新");
}

export async function assignSchoolAdminApplicationAction(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const data = await assignSchoolAdminAccount(req.adminAuth!.userId, id, req.body as SchoolAdminApplicationAssignPayload);
  return ok(res, data, req.traceId, "学校管理员账号已创建");
}
