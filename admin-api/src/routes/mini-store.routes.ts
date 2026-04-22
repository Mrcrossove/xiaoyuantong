import { Router } from "express";
import {
  cancelAdminStoreOrderAction,
  createAdminStoreProductAction,
  deleteAdminStoreProductAction,
  finishAdminStoreOrderAction,
  getAdminStoreDashboardAction,
  getAdminStoreOrderDetailAction,
  getMiniStoreDetailAction,
  listAdminStoreAction,
  listMiniStoreAction,
  reviewAdminStoreOrderRefundAction,
  toggleAdminStoreProductStatusAction,
  updateAdminStoreProductAction
} from "../controllers/mini-store.controller";
import { miniMerchantProductSchema } from "../controllers/mini-commerce-schemas";
import { refundReviewSchema } from "../controllers/schemas";
import { asyncHandler } from "../middlewares/async-handler";
import { requireAdminAuth, requireAdminMenuAccess } from "../middlewares/auth";
import { validateBody } from "../middlewares/validate";

const router = Router();

router.get("/list", asyncHandler(listMiniStoreAction));
router.get("/detail/:detailId", asyncHandler(getMiniStoreDetailAction));
router.get("/admin/list", requireAdminAuth, requireAdminMenuAccess("/store/list"), asyncHandler(listAdminStoreAction));
router.get("/admin/detail/:id", requireAdminAuth, requireAdminMenuAccess("/store/list"), asyncHandler(getAdminStoreDashboardAction));
router.post(
  "/admin/detail/:id/product",
  requireAdminAuth,
  requireAdminMenuAccess("/store/list"),
  validateBody(miniMerchantProductSchema),
  asyncHandler(createAdminStoreProductAction)
);
router.put(
  "/admin/detail/:id/product/:productId",
  requireAdminAuth,
  requireAdminMenuAccess("/store/list"),
  validateBody(miniMerchantProductSchema),
  asyncHandler(updateAdminStoreProductAction)
);
router.post(
  "/admin/detail/:id/product/:productId/status",
  requireAdminAuth,
  requireAdminMenuAccess("/store/list"),
  asyncHandler(toggleAdminStoreProductStatusAction)
);
router.delete(
  "/admin/detail/:id/product/:productId",
  requireAdminAuth,
  requireAdminMenuAccess("/store/list"),
  asyncHandler(deleteAdminStoreProductAction)
);
router.get(
  "/admin/detail/:id/order/:orderId",
  requireAdminAuth,
  requireAdminMenuAccess("/store/list"),
  asyncHandler(getAdminStoreOrderDetailAction)
);
router.post(
  "/admin/detail/:id/order/:orderId/finish",
  requireAdminAuth,
  requireAdminMenuAccess("/store/list"),
  asyncHandler(finishAdminStoreOrderAction)
);
router.post(
  "/admin/detail/:id/order/:orderId/cancel",
  requireAdminAuth,
  requireAdminMenuAccess("/store/list"),
  asyncHandler(cancelAdminStoreOrderAction)
);
router.post(
  "/admin/detail/:id/order/:orderId/refund/:refundId/review",
  requireAdminAuth,
  requireAdminMenuAccess("/store/list"),
  validateBody(refundReviewSchema),
  asyncHandler(reviewAdminStoreOrderRefundAction)
);

export default router;
