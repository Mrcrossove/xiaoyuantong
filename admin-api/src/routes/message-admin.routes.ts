import { Router } from "express";
import {
  createMessageTemplateAction,
  deleteMessageTemplateAction,
  listAdminInteractiveMessageAction,
  listAdminSendRecordAction,
  listAdminSystemMessageAction,
  listMessageTemplateAction,
  toggleMessageTemplateStatusAction,
  updateMessageTemplateAction
} from "../controllers/message-admin.controller";
import { messageTemplatePayloadSchema } from "../controllers/schemas";
import { asyncHandler } from "../middlewares/async-handler";
import { requireAdminAuth, requireAdminMenuAccess, requireAdminPermission } from "../middlewares/auth";
import { validateBody } from "../middlewares/validate";

const router = Router();

router.get("/interactive/list", requireAdminAuth, requireAdminMenuAccess("/message/interactive"), asyncHandler(listAdminInteractiveMessageAction));
router.get("/system/list", requireAdminAuth, requireAdminMenuAccess("/message/system"), asyncHandler(listAdminSystemMessageAction));
router.get("/send/list", requireAdminAuth, requireAdminMenuAccess("/message/send"), asyncHandler(listAdminSendRecordAction));
router.get("/template/list", requireAdminAuth, requireAdminMenuAccess("/message/template"), asyncHandler(listMessageTemplateAction));
router.post(
  "/template",
  requireAdminAuth,
  requireAdminMenuAccess("/message/template"),
  requireAdminPermission("message:template:add"),
  validateBody(messageTemplatePayloadSchema),
  asyncHandler(createMessageTemplateAction)
);
router.put(
  "/template/:id",
  requireAdminAuth,
  requireAdminMenuAccess("/message/template"),
  requireAdminPermission("message:template:edit"),
  validateBody(messageTemplatePayloadSchema),
  asyncHandler(updateMessageTemplateAction)
);
router.patch(
  "/template/:id/toggle-status",
  requireAdminAuth,
  requireAdminMenuAccess("/message/template"),
  requireAdminPermission("message:template:edit"),
  asyncHandler(toggleMessageTemplateStatusAction)
);
router.delete(
  "/template/:id",
  requireAdminAuth,
  requireAdminMenuAccess("/message/template"),
  requireAdminPermission("message:template:edit"),
  asyncHandler(deleteMessageTemplateAction)
);

export default router;
