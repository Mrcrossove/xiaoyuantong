import type { Request, Response } from "express";
import { ok } from "../utils/response";
import {
  batchDeleteMerchantProducts,
  batchDownMerchantProducts,
  createMerchantProduct,
  deleteMerchantProduct,
  getCurrentMerchantStore,
  getCurrentMerchantOrderBoard,
  moveMerchantProduct,
  toggleMerchantProductStatus,
  updateCurrentMerchantStore,
  updateMerchantProduct
} from "../services/mini-merchant.service";

export async function getCurrentMerchantStoreAction(req: Request, res: Response) {
  const data = await getCurrentMerchantStore(req.miniAuth!.userId);
  return ok(res, data, req.traceId);
}

export async function getCurrentMerchantOrderBoardAction(req: Request, res: Response) {
  const data = await getCurrentMerchantOrderBoard(req.miniAuth!.userId);
  return ok(res, data, req.traceId);
}

export async function updateCurrentMerchantStoreAction(req: Request, res: Response) {
  const data = await updateCurrentMerchantStore(req.miniAuth!.userId, req.body);
  return ok(res, data, req.traceId, "\u5e97\u94fa\u4fe1\u606f\u5df2\u66f4\u65b0");
}

export async function createMerchantProductAction(req: Request, res: Response) {
  const data = await createMerchantProduct(req.miniAuth!.userId, req.body);
  return ok(res, data, req.traceId, "\u5546\u54c1\u5df2\u65b0\u589e");
}

export async function updateMerchantProductAction(req: Request, res: Response) {
  const data = await updateMerchantProduct(req.miniAuth!.userId, String(req.params.id), req.body);
  return ok(res, data, req.traceId, "\u5546\u54c1\u5df2\u66f4\u65b0");
}

export async function toggleMerchantProductStatusAction(req: Request, res: Response) {
  const data = await toggleMerchantProductStatus(req.miniAuth!.userId, String(req.params.id));
  return ok(res, data, req.traceId, "\u5546\u54c1\u72b6\u6001\u5df2\u66f4\u65b0");
}

export async function deleteMerchantProductAction(req: Request, res: Response) {
  const data = await deleteMerchantProduct(req.miniAuth!.userId, String(req.params.id));
  return ok(res, data, req.traceId, "\u5546\u54c1\u5df2\u5220\u9664");
}

export async function moveMerchantProductAction(req: Request, res: Response) {
  const data = await moveMerchantProduct(req.miniAuth!.userId, String(req.params.id), req.body.direction);
  return ok(res, data, req.traceId, "\u5546\u54c1\u987a\u5e8f\u5df2\u66f4\u65b0");
}

export async function batchDownMerchantProductsAction(req: Request, res: Response) {
  const data = await batchDownMerchantProducts(req.miniAuth!.userId, req.body.ids);
  return ok(res, data, req.traceId, "\u6240\u9009\u5546\u54c1\u5df2\u4e0b\u67b6");
}

export async function batchDeleteMerchantProductsAction(req: Request, res: Response) {
  const data = await batchDeleteMerchantProducts(req.miniAuth!.userId, req.body.ids);
  return ok(res, data, req.traceId, "\u6240\u9009\u5546\u54c1\u5df2\u5220\u9664");
}
