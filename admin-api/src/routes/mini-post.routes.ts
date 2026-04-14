import { Router } from "express";
import {
  createMiniPostAction,
  createMiniPostCommentAction,
  getMiniPostDetailAction,
  listMiniPostAction,
  listMiniPostCommentAction,
  listMyMiniPostAction,
  toggleMiniPostLikeAction
} from "../controllers/mini-post.controller";
import { miniPostCommentCreateSchema, miniPostPayloadSchema } from "../controllers/schemas";
import { asyncHandler } from "../middlewares/async-handler";
import { requireMiniAuth } from "../middlewares/auth";
import { validateBody } from "../middlewares/validate";

const router = Router();

router.get("/list", asyncHandler(listMiniPostAction));
router.get("/detail/:id", asyncHandler(getMiniPostDetailAction));
router.get("/:id/comments", asyncHandler(listMiniPostCommentAction));
router.get("/my", requireMiniAuth, asyncHandler(listMyMiniPostAction));
router.post("/", requireMiniAuth, validateBody(miniPostPayloadSchema), asyncHandler(createMiniPostAction));
router.post("/:id/like", requireMiniAuth, asyncHandler(toggleMiniPostLikeAction));
router.post("/:id/comment", requireMiniAuth, validateBody(miniPostCommentCreateSchema), asyncHandler(createMiniPostCommentAction));

export default router;
