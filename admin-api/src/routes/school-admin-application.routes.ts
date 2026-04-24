import { Router } from "express";
import {
  assignSchoolAdminApplicationAction,
  getCurrentSchoolAdminApplicationAction,
  listSchoolAdminApplicationAction,
  reviewSchoolAdminApplicationAction,
  submitSchoolAdminApplicationAction
} from "../controllers/school-admin-application.controller";
import {
  schoolAdminApplicationAssignSchema,
  schoolAdminApplicationReviewSchema,
  schoolAdminApplicationSchema
} from "../controllers/schemas";
import { asyncHandler } from "../middlewares/async-handler";
import { requireAdminAuth, requireAdminMenuAccess, requireAdminPermission, requireMiniAuth } from "../middlewares/auth";
import { validateBody } from "../middlewares/validate";

const router = Router();

router.get("/mini/current", requireMiniAuth, asyncHandler(getCurrentSchoolAdminApplicationAction));
router.post("/mini/submit", requireMiniAuth, validateBody(schoolAdminApplicationSchema), asyncHandler(submitSchoolAdminApplicationAction));

router.get(
  "/admin/list",
  requireAdminAuth,
  requireAdminMenuAccess("/auth/school-admin-apply"),
  requireAdminPermission("auth:school-admin-apply:view"),
  asyncHandler(listSchoolAdminApplicationAction)
);

router.post(
  "/admin/:id/review",
  requireAdminAuth,
  requireAdminMenuAccess("/auth/school-admin-apply"),
  requireAdminPermission("auth:school-admin-apply:review"),
  validateBody(schoolAdminApplicationReviewSchema),
  asyncHandler(reviewSchoolAdminApplicationAction)
);

router.post(
  "/admin/:id/assign",
  requireAdminAuth,
  requireAdminMenuAccess("/auth/school-admin-apply"),
  requireAdminPermission("auth:school-admin-apply:assign"),
  validateBody(schoolAdminApplicationAssignSchema),
  asyncHandler(assignSchoolAdminApplicationAction)
);

export default router;
