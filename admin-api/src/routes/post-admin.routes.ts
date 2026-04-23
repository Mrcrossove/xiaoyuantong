import { Router } from "express";
import { listAdminPostAction, listAdminPostReportAction, reviewAdminPostAction, reviewAdminPostReportAction } from "../controllers/post-admin.controller";
import { postReportReviewSchema, postReviewSchema } from "../controllers/schemas";
import { asyncHandler } from "../middlewares/async-handler";
import { requireAdminAuth, requireAdminMenuAccess, requireAdminPermission } from "../middlewares/auth";
import { validateBody } from "../middlewares/validate";

const router = Router();

router.get("/list", requireAdminAuth, requireAdminMenuAccess("/post/list"), asyncHandler(listAdminPostAction));
router.post(
  "/:id/review",
  requireAdminAuth,
  requireAdminMenuAccess("/post/list"),
  requireAdminPermission("post:review"),
  validateBody(postReviewSchema),
  asyncHandler(reviewAdminPostAction)
);
router.get("/report/list", requireAdminAuth, requireAdminMenuAccess("/post/report"), asyncHandler(listAdminPostReportAction));
router.post(
  "/report/:id/review",
  requireAdminAuth,
  requireAdminMenuAccess("/post/report"),
  requireAdminPermission("post:report:review"),
  validateBody(postReportReviewSchema),
  asyncHandler(reviewAdminPostReportAction)
);

export default router;
