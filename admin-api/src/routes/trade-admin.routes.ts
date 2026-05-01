import { Router } from "express";
import {
  listRefundAction,
  listStoreSettlementConfigAction,
  reviewRefundAction,
  updateStoreSettlementConfigAction
} from "../controllers/trade-admin.controller";
import { refundReviewSchema, storeSettlementConfigSchema } from "../controllers/schemas";
import { requireAdminAuth, requireAdminMenuAccess, requireAdminPermission } from "../middlewares/auth";
import { asyncHandler } from "../middlewares/async-handler";
import { validateBody } from "../middlewares/validate";

const router = Router();

router.get("/refund/list", requireAdminAuth, requireAdminMenuAccess("/trade/refund"), asyncHandler(listRefundAction));
router.post(
  "/refund/:id/review",
  requireAdminAuth,
  requireAdminMenuAccess("/trade/refund"),
  requireAdminPermission("refund:review"),
  validateBody(refundReviewSchema),
  asyncHandler(reviewRefundAction)
);

router.get(
  "/settlement/store/list",
  requireAdminAuth,
  requireAdminMenuAccess("/trade/settlement"),
  asyncHandler(listStoreSettlementConfigAction)
);

router.put(
  "/settlement/store/:id",
  requireAdminAuth,
  requireAdminMenuAccess("/trade/settlement"),
  requireAdminPermission("settlement:config"),
  validateBody(storeSettlementConfigSchema),
  asyncHandler(updateStoreSettlementConfigAction)
);

export default router;
