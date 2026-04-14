import { Router } from "express";
import {
  createMiniAddressAction,
  deleteMiniAddressAction,
  listMiniAddressAction,
  setMiniAddressDefaultAction,
  updateMiniAddressAction
} from "../controllers/mini-address.controller";
import { miniAddressPayloadSchema } from "../controllers/schemas";
import { asyncHandler } from "../middlewares/async-handler";
import { requireMiniAuth } from "../middlewares/auth";
import { validateBody } from "../middlewares/validate";

const router = Router();

router.get("/list", requireMiniAuth, asyncHandler(listMiniAddressAction));
router.post("/", requireMiniAuth, validateBody(miniAddressPayloadSchema), asyncHandler(createMiniAddressAction));
router.put("/:id", requireMiniAuth, validateBody(miniAddressPayloadSchema), asyncHandler(updateMiniAddressAction));
router.delete("/:id", requireMiniAuth, asyncHandler(deleteMiniAddressAction));
router.post("/:id/default", requireMiniAuth, asyncHandler(setMiniAddressDefaultAction));

export default router;
