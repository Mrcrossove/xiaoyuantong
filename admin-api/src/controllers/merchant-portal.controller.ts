import type { Request, Response } from "express";
import type { MiniUploadImagePayload } from "./mini-commerce-schemas";
import { idParamSchema } from "./schemas";
import { getMerchantAuth } from "../middlewares/auth";
import { uploadMiniImage } from "../services/mini-upload.service";
import {
  getMerchantAccountProfile,
  merchantAcceptOrder,
  merchantBatchDeleteProducts,
  merchantBatchDownProducts,
  merchantCreateProduct,
  merchantCreateWithdraw,
  merchantDeleteProduct,
  merchantFinishOrder,
  merchantGetStore,
  merchantMarkAllMessagesRead,
  merchantMarkMessageRead,
  merchantMoveProduct,
  merchantReviewRefund,
  merchantToggleProductStatus,
  merchantUpdateProduct,
  merchantUpdateStore,
  queryMerchantDashboard,
  queryMerchantMessageList,
  queryMerchantOrderDetail,
  queryMerchantOrderList,
  queryMerchantProductList,
  queryMerchantRefundDetail,
  queryMerchantRefundList,
  queryMerchantStat,
  queryMerchantWallet,
  updateMerchantAccountProfile,
  updateMerchantPassword
} from "../services/merchant-portal.service";
import { ok } from "../utils/response";

export async function getMerchantDashboardAction(req: Request, res: Response) {
  const auth = getMerchantAuth(req);
  const data = await queryMerchantDashboard(auth.accountId);
  return ok(res, data, req.traceId);
}

export async function getMerchantStoreAction(req: Request, res: Response) {
  const auth = getMerchantAuth(req);
  const data = await merchantGetStore(auth.accountId);
  return ok(res, data, req.traceId);
}

export async function updateMerchantStoreAction(req: Request, res: Response) {
  const auth = getMerchantAuth(req);
  const data = await merchantUpdateStore(auth.accountId, req.body);
  return ok(res, data, req.traceId, "店铺信息已更新");
}

export async function listMerchantProductsAction(req: Request, res: Response) {
  const auth = getMerchantAuth(req);
  const data = await queryMerchantProductList(auth.accountId);
  return ok(res, data, req.traceId);
}

export async function createMerchantProductAction(req: Request, res: Response) {
  const auth = getMerchantAuth(req);
  const data = await merchantCreateProduct(auth.accountId, req.body);
  return ok(res, data, req.traceId, "商品已创建");
}

export async function updateMerchantProductAction(req: Request, res: Response) {
  const auth = getMerchantAuth(req);
  const data = await merchantUpdateProduct(auth.accountId, String(req.params.id), req.body);
  return ok(res, data, req.traceId, "商品已更新");
}

export async function toggleMerchantProductStatusAction(req: Request, res: Response) {
  const auth = getMerchantAuth(req);
  const data = await merchantToggleProductStatus(auth.accountId, String(req.params.id));
  return ok(res, data, req.traceId, "商品状态已更新");
}

export async function deleteMerchantProductAction(req: Request, res: Response) {
  const auth = getMerchantAuth(req);
  const data = await merchantDeleteProduct(auth.accountId, String(req.params.id));
  return ok(res, data, req.traceId, "商品已删除");
}

export async function moveMerchantProductAction(req: Request, res: Response) {
  const auth = getMerchantAuth(req);
  const data = await merchantMoveProduct(auth.accountId, String(req.params.id), req.body);
  return ok(res, data, req.traceId, "商品顺序已更新");
}

export async function batchDownMerchantProductsAction(req: Request, res: Response) {
  const auth = getMerchantAuth(req);
  const data = await merchantBatchDownProducts(auth.accountId, req.body);
  return ok(res, data, req.traceId, "商品已批量下架");
}

export async function batchDeleteMerchantProductsAction(req: Request, res: Response) {
  const auth = getMerchantAuth(req);
  const data = await merchantBatchDeleteProducts(auth.accountId, req.body);
  return ok(res, data, req.traceId, "商品已批量删除");
}

export async function uploadMerchantImageAction(req: Request, res: Response) {
  const data = await uploadMiniImage(req.body as MiniUploadImagePayload);
  return ok(res, data, req.traceId, "图片上传成功");
}

export async function listMerchantOrdersAction(req: Request, res: Response) {
  const auth = getMerchantAuth(req);
  const data = await queryMerchantOrderList(auth.accountId, req.query as Record<string, unknown>);
  return ok(res, data, req.traceId);
}

export async function getMerchantOrderDetailAction(req: Request, res: Response) {
  const auth = getMerchantAuth(req);
  const { id } = idParamSchema.parse(req.params);
  const data = await queryMerchantOrderDetail(auth.accountId, id);
  return ok(res, data, req.traceId);
}

export async function acceptMerchantOrderAction(req: Request, res: Response) {
  const auth = getMerchantAuth(req);
  const { id } = idParamSchema.parse(req.params);
  const data = await merchantAcceptOrder(auth.accountId, id);
  return ok(res, data, req.traceId, "订单已接单");
}

export async function finishMerchantOrderAction(req: Request, res: Response) {
  const auth = getMerchantAuth(req);
  const { id } = idParamSchema.parse(req.params);
  const data = await merchantFinishOrder(auth.accountId, id);
  return ok(res, data, req.traceId, "订单已完成");
}

export async function listMerchantRefundsAction(req: Request, res: Response) {
  const auth = getMerchantAuth(req);
  const data = await queryMerchantRefundList(auth.accountId);
  return ok(res, data, req.traceId);
}

export async function getMerchantRefundDetailAction(req: Request, res: Response) {
  const auth = getMerchantAuth(req);
  const { id } = idParamSchema.parse(req.params);
  const data = await queryMerchantRefundDetail(auth.accountId, id);
  return ok(res, data, req.traceId);
}

export async function reviewMerchantRefundAction(req: Request, res: Response) {
  const auth = getMerchantAuth(req);
  const { id } = idParamSchema.parse(req.params);
  const data = await merchantReviewRefund(auth.accountId, id, req.body);
  return ok(res, data, req.traceId, "退款处理完成");
}

export async function getMerchantWalletAction(req: Request, res: Response) {
  const auth = getMerchantAuth(req);
  const data = await queryMerchantWallet(auth.accountId);
  return ok(res, data, req.traceId);
}

export async function createMerchantWithdrawAction(req: Request, res: Response) {
  const auth = getMerchantAuth(req);
  const data = await merchantCreateWithdraw(auth.accountId, req.body);
  return ok(res, data, req.traceId, "提现申请已提交");
}

export async function listMerchantMessagesAction(req: Request, res: Response) {
  const auth = getMerchantAuth(req);
  const data = await queryMerchantMessageList(auth.accountId, req.query as Record<string, unknown>);
  return ok(res, data, req.traceId);
}

export async function readMerchantMessageAction(req: Request, res: Response) {
  const auth = getMerchantAuth(req);
  const { id } = idParamSchema.parse(req.params);
  const data = await merchantMarkMessageRead(auth.accountId, id);
  return ok(res, data, req.traceId, "消息已设为已读");
}

export async function readAllMerchantMessagesAction(req: Request, res: Response) {
  const auth = getMerchantAuth(req);
  const data = await merchantMarkAllMessagesRead(auth.accountId, req.body || {}, req.query as Record<string, unknown>);
  return ok(res, data, req.traceId, "消息已全部设为已读");
}

export async function getMerchantStatAction(req: Request, res: Response) {
  const auth = getMerchantAuth(req);
  const data = await queryMerchantStat(auth.accountId);
  return ok(res, data, req.traceId);
}

export async function getMerchantAccountProfileAction(req: Request, res: Response) {
  const auth = getMerchantAuth(req);
  const data = await getMerchantAccountProfile(auth.accountId);
  return ok(res, data, req.traceId);
}

export async function updateMerchantAccountProfileAction(req: Request, res: Response) {
  const auth = getMerchantAuth(req);
  const data = await updateMerchantAccountProfile(auth.accountId, req.body);
  return ok(res, data, req.traceId, "账号信息已更新");
}

export async function updateMerchantPasswordAction(req: Request, res: Response) {
  const auth = getMerchantAuth(req);
  const data = await updateMerchantPassword(auth.accountId, req.body);
  return ok(res, data, req.traceId, data ? "密码已更新" : "处理成功");
}
