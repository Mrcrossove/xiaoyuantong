import { Router } from "express";
import { createCosDirectUploadTicketAction, uploadMiniImageAction } from "../controllers/mini-upload.controller";
import { miniCosDirectUploadSchema, miniUploadImageSchema } from "../controllers/schemas";
import { asyncHandler } from "../middlewares/async-handler";
import { requireMiniAuth } from "../middlewares/auth";
import { validateBody } from "../middlewares/validate";

const router = Router();

router.post(
  "/cos-ticket",
  requireMiniAuth,
  validateBody(miniCosDirectUploadSchema),
  asyncHandler(createCosDirectUploadTicketAction)
);
router.post("/image", requireMiniAuth, validateBody(miniUploadImageSchema), asyncHandler(uploadMiniImageAction));

export default router;
