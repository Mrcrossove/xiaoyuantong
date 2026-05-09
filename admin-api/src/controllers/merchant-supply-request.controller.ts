import type { Request, Response } from "express";
import { idParamSchema } from "./schemas";
import { getMerchantAuth } from "../middlewares/auth";
import {
  createMerchantSupplyRequest,
  exportAdminSupplyRequests,
  getMerchantSupplyDefaults,
  queryAdminSupplyRequests,
  queryMerchantSupplyRequests,
  updateAdminSupplyRequestStatus
} from "../services/merchant-supply-request.service";
import { ok } from "../utils/response";

export async function getMerchantSupplyDefaultsAction(req: Request, res: Response) {
  const auth = getMerchantAuth(req);
  const data = await getMerchantSupplyDefaults(auth.accountId);
  return ok(res, data, req.traceId);
}

export async function createMerchantSupplyRequestAction(req: Request, res: Response) {
  const auth = getMerchantAuth(req);
  const data = await createMerchantSupplyRequest(auth.accountId, req.body);
  return ok(res, data, req.traceId, "补给申请已提交");
}

export async function listMerchantSupplyRequestsAction(req: Request, res: Response) {
  const auth = getMerchantAuth(req);
  const data = await queryMerchantSupplyRequests(auth.accountId, req.query as Record<string, unknown>);
  return ok(res, data, req.traceId);
}

export async function listAdminSupplyRequestsAction(req: Request, res: Response) {
  const data = await queryAdminSupplyRequests(req.query as Record<string, unknown>);
  return ok(res, data, req.traceId);
}

export async function exportAdminSupplyRequestsAction(req: Request, res: Response) {
  const data = await exportAdminSupplyRequests(req.query as Record<string, unknown>);
  return ok(res, data, req.traceId);
}

export async function updateAdminSupplyRequestStatusAction(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const data = await updateAdminSupplyRequestStatus(id, req.adminAuth!.userId, req.body);
  return ok(res, data, req.traceId, "补给申请状态已更新");
}
