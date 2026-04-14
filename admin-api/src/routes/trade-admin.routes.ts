import { Router } from "express";
import { listRefundAction, reviewRefundAction } from "../controllers/trade-admin.controller";
import { refundReviewSchema } from "../controllers/schemas";
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

export default router;
