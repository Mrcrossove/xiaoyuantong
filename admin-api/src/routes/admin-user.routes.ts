import { Router } from "express";
import { listAdminUserAction } from "../controllers/admin-user.controller";
import { asyncHandler } from "../middlewares/async-handler";
import { requireAdminAuth, requireAdminMenuAccess } from "../middlewares/auth";

const router = Router();

router.get("/list", requireAdminAuth, requireAdminMenuAccess("/user/list"), asyncHandler(listAdminUserAction));

export default router;
