import { Router } from "express";
import { getDashboardOverviewAction } from "../controllers/dashboard.controller";
import { asyncHandler } from "../middlewares/async-handler";
import { requireAdminAuth, requireAdminMenuAccess } from "../middlewares/auth";

const router = Router();

router.get("/overview", requireAdminAuth, requireAdminMenuAccess("/dashboard/overview"), asyncHandler(getDashboardOverviewAction));

export default router;
