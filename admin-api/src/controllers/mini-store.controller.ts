import type { Request, Response } from "express";
import { ok } from "../utils/response";
import {
  cancelAdminStoreOrder,
  createAdminStoreProduct,
  deleteAdminStoreProduct,
  finishAdminStoreOrder,
  getAdminStoreOrderDetail,
  getAdminStoreDashboard,
  getMiniStoreDetail,
  queryStoreProductApprovals,
  queryAdminStoreOrders,
  queryAdminStoreList,
  queryMiniStores,
  reviewStoreProductApproval,
  reviewAdminStoreOrderRefund,
  toggleAdminStoreProductStatus,
  updateAdminStoreProduct
} from "../services/mini-store.service";

export async function listMiniStoreAction(req: Request, res: Response) {
  const data = await queryMiniStores(req.query as Record<string, unknown>);
  return ok(res, data, req.traceId);
}

export async function getMiniStoreDetailAction(req: Request, res: Response) {
  const data = await getMiniStoreDetail(String(req.params.detailId || ""));
  return ok(res, data, req.traceId);
}

export async function listAdminStoreAction(req: Request, res: Response) {
  const data = await queryAdminStoreList(req.adminAuth!.userId, req.query as Record<string, unknown>);
  return ok(res, data, req.traceId);
}

export async function getAdminStoreDashboardAction(req: Request, res: Response) {
  const data = await getAdminStoreDashboard(req.adminAuth!.userId, Number(req.params.id), req.query as Record<string, unknown>);
  return ok(res, data, req.traceId);
}

export async function listAdminStoreOrdersAction(req: Request, res: Response) {
  const data = await queryAdminStoreOrders(req.adminAuth!.userId, Number(req.params.id), req.query as Record<string, unknown>);
  return ok(res, data, req.traceId);
}

export async function listStoreProductApprovalsAction(req: Request, res: Response) {
  const data = await queryStoreProductApprovals(req.adminAuth!.userId, req.query as Record<string, unknown>);
  return ok(res, data, req.traceId);
}

export async function createAdminStoreProductAction(req: Request, res: Response) {
  const data = await createAdminStoreProduct(req.adminAuth!.userId, Number(req.params.id), req.body);
  return ok(res, data, req.traceId);
}

export async function updateAdminStoreProductAction(req: Request, res: Response) {
  const data = await updateAdminStoreProduct(req.adminAuth!.userId, Number(req.params.id), String(req.params.productId || ""), req.body);
  return ok(res, data, req.traceId);
}

export async function toggleAdminStoreProductStatusAction(req: Request, res: Response) {
  const data = await toggleAdminStoreProductStatus(
    req.adminAuth!.userId,
    Number(req.params.id),
    String(req.params.productId || ""),
    req.body || {}
  );
  return ok(res, data, req.traceId);
}

export async function deleteAdminStoreProductAction(req: Request, res: Response) {
  const data = await deleteAdminStoreProduct(
    req.adminAuth!.userId,
    Number(req.params.id),
    String(req.params.productId || ""),
    req.body || {}
  );
  return ok(res, data, req.traceId);
}

export async function getAdminStoreOrderDetailAction(req: Request, res: Response) {
  const data = await getAdminStoreOrderDetail(req.adminAuth!.userId, Number(req.params.id), Number(req.params.orderId));
  return ok(res, data, req.traceId);
}

export async function finishAdminStoreOrderAction(req: Request, res: Response) {
  const data = await finishAdminStoreOrder(req.adminAuth!.userId, Number(req.params.id), Number(req.params.orderId));
  return ok(res, data, req.traceId);
}

export async function cancelAdminStoreOrderAction(req: Request, res: Response) {
  const data = await cancelAdminStoreOrder(req.adminAuth!.userId, Number(req.params.id), Number(req.params.orderId));
  return ok(res, data, req.traceId);
}

export async function reviewAdminStoreOrderRefundAction(req: Request, res: Response) {
  const data = await reviewAdminStoreOrderRefund(
    req.adminAuth!.userId,
    Number(req.params.id),
    Number(req.params.orderId),
    Number(req.params.refundId),
    req.body
  );
  return ok(res, data, req.traceId);
}

export async function reviewStoreProductApprovalAction(req: Request, res: Response) {
  const data = await reviewStoreProductApproval(req.adminAuth!.userId, Number(req.params.approvalId), req.body);
  return ok(res, data, req.traceId);
}
