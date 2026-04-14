import { Router } from "express";
import { asyncHandler } from "../middlewares/async-handler";
import { requireMiniAuth } from "../middlewares/auth";
import { confirmMiniOrderPayAction, createMiniOrderPayAction } from "../controllers/mini-pay.controller";

const router = Router();

router.post("/order/:id/create", requireMiniAuth, asyncHandler(createMiniOrderPayAction));
router.post("/order/:id/confirm", requireMiniAuth, asyncHandler(confirmMiniOrderPayAction));

export default router;
