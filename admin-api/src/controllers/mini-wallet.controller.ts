import type { Request, Response } from "express";
import { ok } from "../utils/response";
import { idParamSchema } from "./schemas";
import {
  createMiniWithdraw,
  queryAdminWalletAccountList,
  queryAdminWithdrawList,
  queryMiniWalletSummary,
  reviewMiniWithdraw,
  syncAdminWithdrawTransfer
} from "../services/mini-wallet.service";
import type { MiniWithdrawCreatePayload, MiniWithdrawReviewPayload } from "./schemas";

export async function getMiniWalletSummaryAction(req: Request, res: Response) {
  const data = await queryMiniWalletSummary(req.miniAuth!.userId);
  return ok(res, data, req.traceId);
}

export async function listAdminWithdrawAction(req: Request, res: Response) {
  const data = await queryAdminWithdrawList(req.query as Record<string, unknown>);
  return ok(res, data, req.traceId);
}

export async function listAdminWalletAccountAction(req: Request, res: Response) {
  const data = await queryAdminWalletAccountList(req.query as Record<string, unknown>);
  return ok(res, data, req.traceId);
}

export async function createMiniWithdrawAction(req: Request, res: Response) {
  const data = await createMiniWithdraw(req.miniAuth!.userId, req.body as MiniWithdrawCreatePayload);
  return ok(res, data, req.traceId, "提现申请已提交");
}

export async function reviewMiniWithdrawAction(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const data = await reviewMiniWithdraw(id, req.body as MiniWithdrawReviewPayload);
  return ok(res, data, req.traceId, "提现审核完成");
}

export async function syncAdminWithdrawTransferAction(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const data = await syncAdminWithdrawTransfer(id);
  return ok(res, data, req.traceId, "提现打款状态已同步");
}
