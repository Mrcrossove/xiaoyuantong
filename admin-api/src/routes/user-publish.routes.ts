import { Router } from "express";
import {
  batchDeleteUserPublishAction,
  batchStatusUserPublishAction,
  createUserPublishAction,
  deleteUserPublishAction,
  listUserPublish,
  toggleUserPublishStatusAction,
  updateUserPublishAction
} from "../controllers/user-publish.controller";
import { userPublishPayloadSchema } from "../controllers/schemas";
import { asyncHandler } from "../middlewares/async-handler";
import { requireAdminAuth, requireAdminMenuAccess } from "../middlewares/auth";
import { validateBody } from "../middlewares/validate";

const router = Router();

router.get("/", requireAdminAuth, requireAdminMenuAccess("/user/publish"), asyncHandler(listUserPublish));
router.post("/", requireAdminAuth, requireAdminMenuAccess("/user/publish"), validateBody(userPublishPayloadSchema), asyncHandler(createUserPublishAction));
router.put("/:id", requireAdminAuth, requireAdminMenuAccess("/user/publish"), validateBody(userPublishPayloadSchema), asyncHandler(updateUserPublishAction));
router.patch("/:id/toggle-status", requireAdminAuth, requireAdminMenuAccess("/user/publish"), asyncHandler(toggleUserPublishStatusAction));
router.delete("/:id", requireAdminAuth, requireAdminMenuAccess("/user/publish"), asyncHandler(deleteUserPublishAction));
router.post("/batch-delete", requireAdminAuth, requireAdminMenuAccess("/user/publish"), asyncHandler(batchDeleteUserPublishAction));
router.post("/batch-status", requireAdminAuth, requireAdminMenuAccess("/user/publish"), asyncHandler(batchStatusUserPublishAction));

export default router;
