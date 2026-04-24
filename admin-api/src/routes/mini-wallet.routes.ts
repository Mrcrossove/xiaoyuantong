import { Router } from "express";
import {
  createMiniWithdrawAction,
  getMiniWalletSummaryAction,
  listAdminWalletAccountAction,
  listAdminWithdrawAction,
  reviewMiniWithdrawAction,
  syncAdminWithdrawTransferAction
} from "../controllers/mini-wallet.controller";
import { miniWithdrawCreateSchema, miniWithdrawReviewSchema } from "../controllers/schemas";
import { asyncHandler } from "../middlewares/async-handler";
import { requireAdminAuth, requireAdminMenuAccess, requireAdminPermission, requireMiniAuth } from "../middlewares/auth";
import { validateBody } from "../middlewares/validate";

const router = Router();

router.get("/summary", requireMiniAuth, asyncHandler(getMiniWalletSummaryAction));
router.get(
  "/admin/account/list",
  requireAdminAuth,
  requireAdminMenuAccess("/trade/wallet"),
  requireAdminPermission("wallet:view"),
  asyncHandler(listAdminWalletAccountAction)
);
router.get("/admin/withdraw/list", requireAdminAuth, requireAdminMenuAccess("/trade/withdraw"), asyncHandler(listAdminWithdrawAction));
router.post("/withdraw", requireMiniAuth, validateBody(miniWithdrawCreateSchema), asyncHandler(createMiniWithdrawAction));
router.post(
  "/admin/withdraw/:id/review",
  requireAdminAuth,
  requireAdminMenuAccess("/trade/withdraw"),
  requireAdminPermission("withdraw:review"),
  validateBody(miniWithdrawReviewSchema),
  asyncHandler(reviewMiniWithdrawAction)
);
router.post(
  "/admin/withdraw/:id/sync",
  requireAdminAuth,
  requireAdminMenuAccess("/trade/withdraw"),
  requireAdminPermission("withdraw:review"),
  asyncHandler(syncAdminWithdrawTransferAction)
);

export default router;
