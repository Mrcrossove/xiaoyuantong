import { Router } from "express";
import {
  acceptMerchantOrderAction,
  batchDeleteMerchantProductsAction,
  batchDownMerchantProductsAction,
  createMerchantProductAction,
  createMerchantWithdrawAction,
  deleteMerchantProductAction,
  finishMerchantOrderAction,
  getMerchantAccountProfileAction,
  getMerchantDashboardAction,
  getMerchantOrderDetailAction,
  getMerchantRefundDetailAction,
  getMerchantStatAction,
  getMerchantStoreAction,
  getMerchantWalletAction,
  listMerchantMessagesAction,
  listMerchantOrdersAction,
  listMerchantProductsAction,
  listMerchantRefundsAction,
  moveMerchantProductAction,
  readAllMerchantMessagesAction,
  readMerchantMessageAction,
  reviewMerchantRefundAction,
  toggleMerchantProductStatusAction,
  updateMerchantAccountProfileAction,
  updateMerchantPasswordAction,
  updateMerchantProductAction,
  updateMerchantStoreAction,
  uploadMerchantImageAction
} from "../controllers/merchant-portal.controller";
import { merchantPasswordUpdateSchema, merchantProfileUpdateSchema } from "../controllers/merchant-schemas";
import {
  miniMessageReadAllSchema,
  miniMerchantBatchIdsSchema,
  miniMerchantMoveSchema,
  miniMerchantProductSchema,
  miniMerchantStoreUpdateSchema,
  miniUploadImageSchema,
  miniWithdrawCreateSchema,
  refundReviewSchema
} from "../controllers/mini-commerce-schemas";
import { asyncHandler } from "../middlewares/async-handler";
import {
  requireMerchantAuth,
  requireMerchantMenuAccess,
  requireMerchantPermission
} from "../middlewares/auth";
import { validateBody } from "../middlewares/validate";

const router = Router();

router.use(requireMerchantAuth);

router.get(
  "/dashboard",
  requireMerchantMenuAccess("/dashboard"),
  requireMerchantPermission("dashboard:view"),
  asyncHandler(getMerchantDashboardAction)
);

router.get(
  "/store/current",
  requireMerchantMenuAccess("/store"),
  requireMerchantPermission("store:view"),
  asyncHandler(getMerchantStoreAction)
);
router.put(
  "/store/current",
  requireMerchantMenuAccess("/store"),
  requireMerchantPermission("store:edit"),
  validateBody(miniMerchantStoreUpdateSchema),
  asyncHandler(updateMerchantStoreAction)
);
router.post(
  "/upload/image",
  requireMerchantPermission("store:edit", "product:create", "product:edit"),
  validateBody(miniUploadImageSchema),
  asyncHandler(uploadMerchantImageAction)
);

router.get(
  "/product/list",
  requireMerchantMenuAccess("/product"),
  requireMerchantPermission("product:view"),
  asyncHandler(listMerchantProductsAction)
);
router.post(
  "/product",
  requireMerchantMenuAccess("/product"),
  requireMerchantPermission("product:create"),
  validateBody(miniMerchantProductSchema),
  asyncHandler(createMerchantProductAction)
);
router.put(
  "/product/:id",
  requireMerchantMenuAccess("/product"),
  requireMerchantPermission("product:edit"),
  validateBody(miniMerchantProductSchema),
  asyncHandler(updateMerchantProductAction)
);
router.post(
  "/product/:id/status",
  requireMerchantMenuAccess("/product"),
  requireMerchantPermission("product:status"),
  asyncHandler(toggleMerchantProductStatusAction)
);
router.delete(
  "/product/:id",
  requireMerchantMenuAccess("/product"),
  requireMerchantPermission("product:delete"),
  asyncHandler(deleteMerchantProductAction)
);
router.post(
  "/product/:id/move",
  requireMerchantMenuAccess("/product"),
  requireMerchantPermission("product:sort"),
  validateBody(miniMerchantMoveSchema),
  asyncHandler(moveMerchantProductAction)
);
router.post(
  "/product/batch-down",
  requireMerchantMenuAccess("/product"),
  requireMerchantPermission("product:status"),
  validateBody(miniMerchantBatchIdsSchema),
  asyncHandler(batchDownMerchantProductsAction)
);
router.post(
  "/product/batch-delete",
  requireMerchantMenuAccess("/product"),
  requireMerchantPermission("product:delete"),
  validateBody(miniMerchantBatchIdsSchema),
  asyncHandler(batchDeleteMerchantProductsAction)
);

router.get(
  "/order/list",
  requireMerchantMenuAccess("/order"),
  requireMerchantPermission("order:view"),
  asyncHandler(listMerchantOrdersAction)
);
router.get(
  "/order/:id",
  requireMerchantMenuAccess("/order"),
  requireMerchantPermission("order:view"),
  asyncHandler(getMerchantOrderDetailAction)
);
router.post(
  "/order/:id/accept",
  requireMerchantMenuAccess("/order"),
  requireMerchantPermission("order:accept"),
  asyncHandler(acceptMerchantOrderAction)
);
router.post(
  "/order/:id/finish",
  requireMerchantMenuAccess("/order"),
  requireMerchantPermission("order:finish"),
  asyncHandler(finishMerchantOrderAction)
);

router.get(
  "/refund/list",
  requireMerchantMenuAccess("/refund"),
  requireMerchantPermission("refund:view"),
  asyncHandler(listMerchantRefundsAction)
);
router.get(
  "/refund/:id",
  requireMerchantMenuAccess("/refund"),
  requireMerchantPermission("refund:view"),
  asyncHandler(getMerchantRefundDetailAction)
);
router.post(
  "/refund/:id/review",
  requireMerchantMenuAccess("/refund"),
  requireMerchantPermission("refund:review"),
  validateBody(refundReviewSchema),
  asyncHandler(reviewMerchantRefundAction)
);

router.get(
  "/wallet/overview",
  requireMerchantMenuAccess("/wallet"),
  requireMerchantPermission("wallet:view"),
  asyncHandler(getMerchantWalletAction)
);
router.post(
  "/wallet/withdraw",
  requireMerchantMenuAccess("/wallet"),
  requireMerchantPermission("wallet:withdraw"),
  validateBody(miniWithdrawCreateSchema),
  asyncHandler(createMerchantWithdrawAction)
);

router.get(
  "/message/list",
  requireMerchantMenuAccess("/message"),
  requireMerchantPermission("message:view"),
  asyncHandler(listMerchantMessagesAction)
);
router.post(
  "/message/:id/read",
  requireMerchantMenuAccess("/message"),
  requireMerchantPermission("message:read"),
  asyncHandler(readMerchantMessageAction)
);
router.post(
  "/message/read-all",
  requireMerchantMenuAccess("/message"),
  requireMerchantPermission("message:read"),
  validateBody(miniMessageReadAllSchema),
  asyncHandler(readAllMerchantMessagesAction)
);

router.get(
  "/stat/overview",
  requireMerchantMenuAccess("/stat"),
  requireMerchantPermission("stat:view"),
  asyncHandler(getMerchantStatAction)
);

router.get(
  "/account/profile",
  requireMerchantMenuAccess("/account"),
  requireMerchantPermission("account:view"),
  asyncHandler(getMerchantAccountProfileAction)
);
router.put(
  "/account/profile",
  requireMerchantMenuAccess("/account"),
  requireMerchantPermission("account:edit"),
  validateBody(merchantProfileUpdateSchema),
  asyncHandler(updateMerchantAccountProfileAction)
);
router.put(
  "/account/password",
  requireMerchantMenuAccess("/account"),
  requireMerchantPermission("account:password"),
  validateBody(merchantPasswordUpdateSchema),
  asyncHandler(updateMerchantPasswordAction)
);
export default router;
