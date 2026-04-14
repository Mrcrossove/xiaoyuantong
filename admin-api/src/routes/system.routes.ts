import { Router } from "express";
import {
  createBasicConfigAction,
  createDictItemAction,
  createDictTypeAction,
  deleteBasicConfigAction,
  deleteDictItemAction,
  deleteDictTypeAction,
  getDictConfigAction,
  getVersionInfoAction,
  listBasicConfigAction,
  listOperationLogsAction,
  toggleBasicConfigStatusAction,
  toggleDictItemStatusAction,
  toggleDictTypeStatusAction,
  updateBasicConfigAction,
  updateDictItemAction,
  updateDictTypeAction
} from "../controllers/system.controller";
import { asyncHandler } from "../middlewares/async-handler";
import { requireAdminAuth, requireAdminMenuAccess, requireAdminPermission } from "../middlewares/auth";
import { validateBody } from "../middlewares/validate";
import { basicConfigPayloadSchema, dictItemPayloadSchema, dictTypePayloadSchema } from "../controllers/schemas";

const router = Router();

router.get("/log/list", requireAdminAuth, requireAdminMenuAccess("/system/log"), asyncHandler(listOperationLogsAction));
router.get("/version", requireAdminAuth, requireAdminMenuAccess("/system/version"), asyncHandler(getVersionInfoAction));

router.get("/basic/list", requireAdminAuth, requireAdminMenuAccess("/system/basic"), asyncHandler(listBasicConfigAction));
router.post(
  "/basic",
  requireAdminAuth,
  requireAdminMenuAccess("/system/basic"),
  requireAdminPermission("system:basic:add"),
  validateBody(basicConfigPayloadSchema),
  asyncHandler(createBasicConfigAction)
);
router.put(
  "/basic/:id",
  requireAdminAuth,
  requireAdminMenuAccess("/system/basic"),
  requireAdminPermission("system:basic:edit"),
  validateBody(basicConfigPayloadSchema),
  asyncHandler(updateBasicConfigAction)
);
router.patch(
  "/basic/:id/toggle-status",
  requireAdminAuth,
  requireAdminMenuAccess("/system/basic"),
  requireAdminPermission("system:basic:edit"),
  asyncHandler(toggleBasicConfigStatusAction)
);
router.delete(
  "/basic/:id",
  requireAdminAuth,
  requireAdminMenuAccess("/system/basic"),
  requireAdminPermission("system:basic:edit"),
  asyncHandler(deleteBasicConfigAction)
);

router.get("/dict", requireAdminAuth, requireAdminMenuAccess("/system/dict"), asyncHandler(getDictConfigAction));
router.post(
  "/dict/type",
  requireAdminAuth,
  requireAdminMenuAccess("/system/dict"),
  requireAdminPermission("system:dict:add"),
  validateBody(dictTypePayloadSchema),
  asyncHandler(createDictTypeAction)
);
router.put(
  "/dict/type/:id",
  requireAdminAuth,
  requireAdminMenuAccess("/system/dict"),
  requireAdminPermission("system:dict:edit"),
  validateBody(dictTypePayloadSchema),
  asyncHandler(updateDictTypeAction)
);
router.patch(
  "/dict/type/:id/toggle-status",
  requireAdminAuth,
  requireAdminMenuAccess("/system/dict"),
  requireAdminPermission("system:dict:edit"),
  asyncHandler(toggleDictTypeStatusAction)
);
router.delete(
  "/dict/type/:id",
  requireAdminAuth,
  requireAdminMenuAccess("/system/dict"),
  requireAdminPermission("system:dict:edit"),
  asyncHandler(deleteDictTypeAction)
);

router.post(
  "/dict/item",
  requireAdminAuth,
  requireAdminMenuAccess("/system/dict"),
  requireAdminPermission("system:dict:add"),
  validateBody(dictItemPayloadSchema),
  asyncHandler(createDictItemAction)
);
router.put(
  "/dict/item/:id",
  requireAdminAuth,
  requireAdminMenuAccess("/system/dict"),
  requireAdminPermission("system:dict:edit"),
  validateBody(dictItemPayloadSchema),
  asyncHandler(updateDictItemAction)
);
router.patch(
  "/dict/item/:id/toggle-status",
  requireAdminAuth,
  requireAdminMenuAccess("/system/dict"),
  requireAdminPermission("system:dict:edit"),
  asyncHandler(toggleDictItemStatusAction)
);
router.delete(
  "/dict/item/:id",
  requireAdminAuth,
  requireAdminMenuAccess("/system/dict"),
  requireAdminPermission("system:dict:edit"),
  asyncHandler(deleteDictItemAction)
);

export default router;
