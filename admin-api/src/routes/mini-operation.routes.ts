import { Router } from "express";
import { listMiniHomeBannerAction } from "../controllers/mini-operation.controller";
import { asyncHandler } from "../middlewares/async-handler";

const router = Router();

router.get("/banner/list", asyncHandler(listMiniHomeBannerAction));

export default router;
