import { Router } from "express";
import {
  adminStoreProductConflictSchema,
  adminStoreProductMutationSchema,
  miniMerchantProductSchema,
  storeProductApprovalReviewSchema
} from "../controllers/mini-commerce-schemas";
import {
  cancelAdminStoreOrderAction,
  createAdminStoreProductAction,
  deleteAdminStoreProductAction,
  finishAdminStoreOrderAction,
  getAdminStoreDashboardAction,
  getAdminStoreOrderDetailAction,
  getMiniStoreDetailAction,
  resolveMiniStoreReferralSceneAction,
  listAdminStoreOrdersAction,
  listAdminStoreAction,
  listMiniStoreAction,
  listStoreProductApprovalsAction,
  reviewAdminStoreOrderRefundAction,
  reviewStoreProductApprovalAction,
  toggleAdminStoreProductStatusAction,
  updateAdminStoreProductAction
} from "../controllers/mini-store.controller";
import { refundReviewSchema } from "../controllers/schemas";
import { asyncHandler } from "../middlewares/async-handler";
import { requireAdminAuth, requireAdminMenuAccess } from "../middlewares/auth";
import { validateBody } from "../middlewares/validate";

const router = Router();

router.get("/list", asyncHandler(listMiniStoreAction));
router.get("/referral/resolve", asyncHandler(resolveMiniStoreReferralSceneAction));
router.get("/detail/:detailId", asyncHandler(getMiniStoreDetailAction));

router.get("/admin/list", requireAdminAuth, requireAdminMenuAccess("/store/list"), asyncHandler(listAdminStoreAction));
router.get("/admin/detail/:id", requireAdminAuth, requireAdminMenuAccess("/store/list"), asyncHandler(getAdminStoreDashboardAction));
router.get("/admin/detail/:id/orders", requireAdminAuth, requireAdminMenuAccess("/store/list"), asyncHandler(listAdminStoreOrdersAction));
router.get("/admin/approval/list", requireAdminAuth, requireAdminMenuAccess("/system/store-approval"), asyncHandler(listStoreProductApprovalsAction));

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
  validateBody(adminStoreProductMutationSchema),
  asyncHandler(updateAdminStoreProductAction)
);

router.post(
  "/admin/detail/:id/product/:productId/status",
  requireAdminAuth,
  requireAdminMenuAccess("/store/list"),
  validateBody(adminStoreProductConflictSchema),
  asyncHandler(toggleAdminStoreProductStatusAction)
);

router.delete(
  "/admin/detail/:id/product/:productId",
  requireAdminAuth,
  requireAdminMenuAccess("/store/list"),
  validateBody(adminStoreProductConflictSchema),
  asyncHandler(deleteAdminStoreProductAction)
);

router.post(
  "/admin/approval/:approvalId/review",
  requireAdminAuth,
  requireAdminMenuAccess("/system/store-approval"),
  validateBody(storeProductApprovalReviewSchema),
  asyncHandler(reviewStoreProductApprovalAction)
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
