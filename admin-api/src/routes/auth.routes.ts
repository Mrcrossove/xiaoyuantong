import { Router } from "express";
import {
  createAdminRoleAction,
  createAdminRoleFromTemplateAction,
  createAdminUserManageAction,
  deleteAdminRoleAction,
  deleteAdminUserManageAction,
  getAuthManageMetaAction,
  getCurrentMenuPermissionAction,
  listAdminRoleAction,
  listAdminUserManageAction,
  toggleAdminRoleStatusAction,
  toggleAdminUserManageStatusAction,
  updateAdminRoleAction,
  updateAdminUserManageAction,
  updateRolePermissionAction
} from "../controllers/auth-manage.controller";
import {
  adminActivateAction,
  adminLoginAction,
  getAdminAccountProfileAction,
  getAdminSessionAction,
  getMiniProfileAction,
  miniLoginAction,
  updateMiniProfileAction,
  updateAdminPasswordAction
} from "../controllers/auth.controller";
import {
  adminActivateSchema,
  adminLoginSchema,
  adminManagerCreateSchema,
  adminManagerUpdateSchema,
  adminPasswordUpdateSchema,
  adminRolePayloadSchema,
  miniLoginSchema,
  miniProfileUpdateSchema,
  rolePermissionAssignSchema
} from "../controllers/schemas";
import { asyncHandler } from "../middlewares/async-handler";
import { requireAdminAuth, requireAdminMenuAccess, requireAdminPermission, requireMiniAuth } from "../middlewares/auth";
import { createRateLimit } from "../middlewares/rate-limit";
import { validateBody } from "../middlewares/validate";
import { env } from "../config/env";

const router = Router();

router.post(
  "/admin/login",
  createRateLimit({
    namespace: "admin-login",
    windowMs: env.adminLoginWindowMs,
    max: env.adminLoginMaxAttempts,
    message: "管理员登录尝试过于频繁，请稍后再试"
  }),
  validateBody(adminLoginSchema),
  asyncHandler(adminLoginAction)
);
router.get("/admin/session", requireAdminAuth, asyncHandler(getAdminSessionAction));
router.post("/admin/activate", requireAdminAuth, validateBody(adminActivateSchema), asyncHandler(adminActivateAction));
router.get("/admin/account/profile", requireAdminAuth, asyncHandler(getAdminAccountProfileAction));
router.put("/admin/account/password", requireAdminAuth, validateBody(adminPasswordUpdateSchema), asyncHandler(updateAdminPasswordAction));
router.get("/meta", requireAdminAuth, requireAdminMenuAccess("/auth/admin", "/auth/role", "/auth/menu"), asyncHandler(getAuthManageMetaAction));
router.get("/admin-user/list", requireAdminAuth, requireAdminMenuAccess("/auth/admin"), asyncHandler(listAdminUserManageAction));
router.post(
  "/admin-user",
  requireAdminAuth,
  requireAdminMenuAccess("/auth/admin"),
  requireAdminPermission("auth:admin:add"),
  validateBody(adminManagerCreateSchema),
  asyncHandler(createAdminUserManageAction)
);
router.put(
  "/admin-user/:id",
  requireAdminAuth,
  requireAdminMenuAccess("/auth/admin"),
  requireAdminPermission("auth:admin:edit"),
  validateBody(adminManagerUpdateSchema),
  asyncHandler(updateAdminUserManageAction)
);
router.patch(
  "/admin-user/:id/toggle-status",
  requireAdminAuth,
  requireAdminMenuAccess("/auth/admin"),
  requireAdminPermission("auth:admin:edit"),
  asyncHandler(toggleAdminUserManageStatusAction)
);
router.delete(
  "/admin-user/:id",
  requireAdminAuth,
  requireAdminMenuAccess("/auth/admin"),
  requireAdminPermission("auth:admin:edit"),
  asyncHandler(deleteAdminUserManageAction)
);
router.get("/role/list", requireAdminAuth, requireAdminMenuAccess("/auth/role", "/auth/menu"), asyncHandler(listAdminRoleAction));
router.post(
  "/role",
  requireAdminAuth,
  requireAdminMenuAccess("/auth/role"),
  requireAdminPermission("auth:role:add"),
  validateBody(adminRolePayloadSchema),
  asyncHandler(createAdminRoleAction)
);
router.post(
  "/role/template/:code",
  requireAdminAuth,
  requireAdminMenuAccess("/auth/role"),
  requireAdminPermission("auth:role:add"),
  asyncHandler(createAdminRoleFromTemplateAction)
);
router.put(
  "/role/:id",
  requireAdminAuth,
  requireAdminMenuAccess("/auth/role"),
  requireAdminPermission("auth:role:edit"),
  validateBody(adminRolePayloadSchema),
  asyncHandler(updateAdminRoleAction)
);
router.patch(
  "/role/:id/toggle-status",
  requireAdminAuth,
  requireAdminMenuAccess("/auth/role"),
  requireAdminPermission("auth:role:edit"),
  asyncHandler(toggleAdminRoleStatusAction)
);
router.delete(
  "/role/:id",
  requireAdminAuth,
  requireAdminMenuAccess("/auth/role"),
  requireAdminPermission("auth:role:edit"),
  asyncHandler(deleteAdminRoleAction)
);
router.put(
  "/menu/role/:id",
  requireAdminAuth,
  requireAdminMenuAccess("/auth/menu"),
  requireAdminPermission("auth:menu:edit"),
  validateBody(rolePermissionAssignSchema),
  asyncHandler(updateRolePermissionAction)
);
router.get("/menu/current", requireAdminAuth, requireAdminMenuAccess("/auth/menu"), asyncHandler(getCurrentMenuPermissionAction));
router.post(
  "/mini/login",
  createRateLimit({
    namespace: "mini-login",
    windowMs: 60 * 1000,
    max: 30,
    message: "小程序登录请求过于频繁，请稍后再试"
  }),
  validateBody(miniLoginSchema),
  asyncHandler(miniLoginAction)
);
router.get("/mini/profile", requireMiniAuth, asyncHandler(getMiniProfileAction));
router.put("/mini/profile", requireMiniAuth, validateBody(miniProfileUpdateSchema), asyncHandler(updateMiniProfileAction));

export default router;
