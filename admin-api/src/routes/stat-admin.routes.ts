import { Router } from "express";
import { getOrderStatAction, getPostStatAction, getStoreStatAction, getUserStatAction } from "../controllers/stat-admin.controller";
import { requireAdminAuth, requireAdminMenuAccess } from "../middlewares/auth";
import { asyncHandler } from "../middlewares/async-handler";

const router = Router();

router.get("/user", requireAdminAuth, requireAdminMenuAccess("/stat/user"), asyncHandler(getUserStatAction));
router.get("/post", requireAdminAuth, requireAdminMenuAccess("/stat/post"), asyncHandler(getPostStatAction));
router.get("/store", requireAdminAuth, requireAdminMenuAccess("/stat/store"), asyncHandler(getStoreStatAction));
router.get("/order", requireAdminAuth, requireAdminMenuAccess("/stat/order"), asyncHandler(getOrderStatAction));

export default router;
