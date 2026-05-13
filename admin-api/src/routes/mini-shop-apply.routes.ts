import { Router } from "express";
import {
  getCurrentMiniShopApplyAction,
  listAdminShopApplyAction,
  reviewMiniShopApplyAction,
  submitMiniShopApplyAction,
  takedownMiniShopApplyAction
} from "../controllers/mini-shop-apply.controller";
import { miniShopApplyReviewSchema, miniShopApplySchema, miniShopApplyTakedownSchema } from "../controllers/schemas";
import { asyncHandler } from "../middlewares/async-handler";
import { requireAdminAuth, requireAdminMenuAccess, requireAdminPermission, requireMiniAuth } from "../middlewares/auth";
import { validateBody } from "../middlewares/validate";

const router = Router();

router.get("/mini/current", requireMiniAuth, asyncHandler(getCurrentMiniShopApplyAction));
router.post("/mini/submit", requireMiniAuth, validateBody(miniShopApplySchema), asyncHandler(submitMiniShopApplyAction));
router.get(
  "/admin/list",
  requireAdminAuth,
  requireAdminMenuAccess("/store/apply"),
  requireAdminPermission("store:apply:view", "store:apply:approve", "store:apply:reject"),
  asyncHandler(listAdminShopApplyAction)
);
router.post(
  "/admin/:id/review",
  requireAdminAuth,
  requireAdminMenuAccess("/store/apply"),
  validateBody(miniShopApplyReviewSchema),
  asyncHandler(reviewMiniShopApplyAction)
);
router.post(
  "/admin/:id/takedown",
  requireAdminAuth,
  requireAdminMenuAccess("/store/apply"),
  validateBody(miniShopApplyTakedownSchema),
  asyncHandler(takedownMiniShopApplyAction)
);

export default router;
