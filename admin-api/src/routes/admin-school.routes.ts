import { Router } from "express";
import { listAdminSchoolAction } from "../controllers/admin-school.controller";
import { asyncHandler } from "../middlewares/async-handler";
import { requireAdminAuth, requireAdminMenuAccess } from "../middlewares/auth";

const router = Router();

router.get("/list", requireAdminAuth, requireAdminMenuAccess("/school/list"), asyncHandler(listAdminSchoolAction));

export default router;
