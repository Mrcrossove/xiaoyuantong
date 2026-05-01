import { Router } from "express";
import {
  getCurrentMerchantOrderBoardAction,
  getCurrentMerchantStoreAction,
  updateCurrentMerchantStoreAction
} from "../controllers/mini-merchant.controller";
import { miniMerchantStoreUpdateSchema } from "../controllers/mini-commerce-schemas";
import { asyncHandler } from "../middlewares/async-handler";
import { requireMiniAuth } from "../middlewares/auth";
import { validateBody } from "../middlewares/validate";

const router = Router();

router.get("/store/current", requireMiniAuth, asyncHandler(getCurrentMerchantStoreAction));
router.get("/order/board", requireMiniAuth, asyncHandler(getCurrentMerchantOrderBoardAction));
router.put("/store/current", requireMiniAuth, validateBody(miniMerchantStoreUpdateSchema), asyncHandler(updateCurrentMerchantStoreAction));

router.all("/product", requireMiniAuth, (_req, res) => {
  res.status(410).json({
    code: 41000,
    message: "小程序端已不再支持商品维护，请登录商家后台统一管理商品。",
    data: null
  });
});
router.all("/product/*", requireMiniAuth, (_req, res) => {
  res.status(410).json({
    code: 41000,
    message: "小程序端已不再支持商品维护，请登录商家后台统一管理商品。",
    data: null
  });
});

export default router;
