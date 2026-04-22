import { Router } from "express";
import {
  getAdminStoreDashboardAction,
  getMiniStoreDetailAction,
  listAdminStoreAction,
  listMiniStoreAction
} from "../controllers/mini-store.controller";
import { asyncHandler } from "../middlewares/async-handler";
import { requireAdminAuth, requireAdminMenuAccess } from "../middlewares/auth";

const router = Router();

router.get("/list", asyncHandler(listMiniStoreAction));
router.get("/detail/:detailId", asyncHandler(getMiniStoreDetailAction));
router.get("/admin/list", requireAdminAuth, requireAdminMenuAccess("/store/list"), asyncHandler(listAdminStoreAction));
router.get("/admin/detail/:id", requireAdminAuth, requireAdminMenuAccess("/store/list"), asyncHandler(getAdminStoreDashboardAction));

export default router;
