import { Router } from "express";
import { getMiniStoreDetailAction, listAdminStoreAction, listMiniStoreAction } from "../controllers/mini-store.controller";
import { asyncHandler } from "../middlewares/async-handler";
import { requireAdminAuth, requireAdminMenuAccess } from "../middlewares/auth";

const router = Router();

router.get("/list", asyncHandler(listMiniStoreAction));
router.get("/detail/:detailId", asyncHandler(getMiniStoreDetailAction));
router.get("/admin/list", requireAdminAuth, requireAdminMenuAccess("/store/list"), asyncHandler(listAdminStoreAction));

export default router;
