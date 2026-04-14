import { Router } from "express";
import { listAdminProductAction } from "../controllers/product-admin.controller";
import { asyncHandler } from "../middlewares/async-handler";
import { requireAdminAuth, requireAdminMenuAccess } from "../middlewares/auth";

const router = Router();

router.get("/list", requireAdminAuth, requireAdminMenuAccess("/product/list"), asyncHandler(listAdminProductAction));

export default router;
