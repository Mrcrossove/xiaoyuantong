import { Router } from "express";
import {
  getMiniFavoriteStatusAction,
  listMiniFavoriteAction,
  toggleMiniFavoriteAction
} from "../controllers/mini-favorite.controller";
import { asyncHandler } from "../middlewares/async-handler";
import { requireMiniAuth } from "../middlewares/auth";
import { validateBody } from "../middlewares/validate";
import { miniFavoriteToggleSchema } from "../controllers/schemas";

const router = Router();

router.get("/list", requireMiniAuth, asyncHandler(listMiniFavoriteAction));
router.get("/status", requireMiniAuth, asyncHandler(getMiniFavoriteStatusAction));
router.post("/toggle", requireMiniAuth, validateBody(miniFavoriteToggleSchema), asyncHandler(toggleMiniFavoriteAction));

export default router;
