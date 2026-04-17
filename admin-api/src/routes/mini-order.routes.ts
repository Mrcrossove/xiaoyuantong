import { Router } from "express";
import {
  cancelMiniOrderAction,
  createMiniOrderAction,
  createMiniRefundAction,
  finishMiniOrderAction,
  getMiniOrderDetailAction,
  listAdminOrderAction,
  listMiniOrderAction,
  payMiniOrderAction
} from "../controllers/mini-order.controller";
import { miniOrderCreateSchema, miniRefundApplySchema } from "../controllers/mini-commerce-schemas";
import { asyncHandler } from "../middlewares/async-handler";
import { requireAdminAuth, requireAdminMenuAccess, requireAdminPermission, requireMiniAuth } from "../middlewares/auth";
import { validateBody } from "../middlewares/validate";

const router = Router();

router.get("/list", requireMiniAuth, asyncHandler(listMiniOrderAction));
router.get(
  "/admin/list",
  requireAdminAuth,
  requireAdminMenuAccess("/trade/order"),
  requireAdminPermission("order:view"),
  asyncHandler(listAdminOrderAction)
);
router.get("/detail/:id", requireMiniAuth, asyncHandler(getMiniOrderDetailAction));
router.post("/", requireMiniAuth, validateBody(miniOrderCreateSchema), asyncHandler(createMiniOrderAction));
router.post("/:id/pay", requireMiniAuth, asyncHandler(payMiniOrderAction));
router.post("/:id/cancel", requireMiniAuth, asyncHandler(cancelMiniOrderAction));
router.post("/:id/finish", requireMiniAuth, asyncHandler(finishMiniOrderAction));
router.post("/:id/refund", requireMiniAuth, validateBody(miniRefundApplySchema), asyncHandler(createMiniRefundAction));

export default router;
