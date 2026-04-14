import { Router } from "express";
import {
  batchDeleteSchoolContentAction,
  batchStatusSchoolContentAction,
  createSchoolContentAction,
  deleteSchoolContentAction,
  listSchoolContent,
  toggleSchoolContentStatusAction,
  updateSchoolContentAction
} from "../controllers/school-content.controller";
import { schoolContentPayloadSchema } from "../controllers/schemas";
import { asyncHandler } from "../middlewares/async-handler";
import { requireAdminAuth, requireAdminMenuAccess } from "../middlewares/auth";
import { validateBody } from "../middlewares/validate";

const router = Router();

router.get("/", requireAdminAuth, requireAdminMenuAccess("/school/content"), asyncHandler(listSchoolContent));
router.post("/", requireAdminAuth, requireAdminMenuAccess("/school/content"), validateBody(schoolContentPayloadSchema), asyncHandler(createSchoolContentAction));
router.put("/:id", requireAdminAuth, requireAdminMenuAccess("/school/content"), validateBody(schoolContentPayloadSchema), asyncHandler(updateSchoolContentAction));
router.patch("/:id/toggle-status", requireAdminAuth, requireAdminMenuAccess("/school/content"), asyncHandler(toggleSchoolContentStatusAction));
router.delete("/:id", requireAdminAuth, requireAdminMenuAccess("/school/content"), asyncHandler(deleteSchoolContentAction));
router.post("/batch-delete", requireAdminAuth, requireAdminMenuAccess("/school/content"), asyncHandler(batchDeleteSchoolContentAction));
router.post("/batch-status", requireAdminAuth, requireAdminMenuAccess("/school/content"), asyncHandler(batchStatusSchoolContentAction));

export default router;
