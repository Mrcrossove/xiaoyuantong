import { Router } from "express";
import {
  exportAdminSupplyRequestsAction,
  listAdminSupplyRequestsAction,
  updateAdminSupplyRequestStatusAction
} from "../controllers/merchant-supply-request.controller";
import { adminSupplyRequestStatusSchema } from "../controllers/mini-commerce-schemas";
import { requireAdminAuth, requireAdminMenuAccess, requireAdminPermission } from "../middlewares/auth";
import { asyncHandler } from "../middlewares/async-handler";
import { validateBody } from "../middlewares/validate";

const router = Router();

router.get(
  "/admin/list",
  requireAdminAuth,
  requireAdminMenuAccess("/trade/supply"),
  requireAdminPermission("supply:view"),
  asyncHandler(listAdminSupplyRequestsAction)
);

router.get(
  "/admin/export",
  requireAdminAuth,
  requireAdminMenuAccess("/trade/supply"),
  requireAdminPermission("supply:export"),
  asyncHandler(exportAdminSupplyRequestsAction)
);

router.post(
  "/admin/:id/status",
  requireAdminAuth,
  requireAdminMenuAccess("/trade/supply"),
  requireAdminPermission("supply:handle"),
  validateBody(adminSupplyRequestStatusSchema),
  asyncHandler(updateAdminSupplyRequestStatusAction)
);

export default router;
