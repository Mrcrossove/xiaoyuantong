import { Router } from "express";
import {
  getMiniMessageUnreadSummaryAction,
  listMiniMessageAction,
  markAllMiniMessageReadAction,
  markMiniMessageReadAction
} from "../controllers/mini-message.controller";
import { miniMessageReadAllSchema } from "../controllers/schemas";
import { asyncHandler } from "../middlewares/async-handler";
import { requireMiniAuth } from "../middlewares/auth";
import { validateBody } from "../middlewares/validate";

const router = Router();

router.get("/list", requireMiniAuth, asyncHandler(listMiniMessageAction));
router.get("/unread-summary", requireMiniAuth, asyncHandler(getMiniMessageUnreadSummaryAction));
router.post("/:id/read", requireMiniAuth, asyncHandler(markMiniMessageReadAction));
router.post("/read-all", requireMiniAuth, validateBody(miniMessageReadAllSchema), asyncHandler(markAllMiniMessageReadAction));

export default router;
