import { Router } from "express";
import {
  getCurrentVerificationAction,
  listVerificationAction,
  reviewVerificationAction,
  submitVerificationAction
} from "../controllers/verification.controller";
import { verifyReviewSchema, verifySubmitSchema } from "../controllers/schemas";
import { asyncHandler } from "../middlewares/async-handler";
import { requireAdminAuth, requireAdminMenuAccess, requireAdminPermission, requireMiniAuth } from "../middlewares/auth";
import { validateBody } from "../middlewares/validate";

const router = Router();

router.get("/mini/current", requireMiniAuth, asyncHandler(getCurrentVerificationAction));
router.post("/mini/submit", requireMiniAuth, validateBody(verifySubmitSchema), asyncHandler(submitVerificationAction));
router.get(
  "/admin/list",
  requireAdminAuth,
  requireAdminMenuAccess("/verify/list"),
  requireAdminPermission("verify:view", "verify:approve", "verify:reject"),
  asyncHandler(listVerificationAction)
);
router.post(
  "/admin/:id/review",
  requireAdminAuth,
  requireAdminMenuAccess("/verify/list"),
  validateBody(verifyReviewSchema),
  asyncHandler(reviewVerificationAction)
);

export default router;
