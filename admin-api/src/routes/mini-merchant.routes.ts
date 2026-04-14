import { Router } from "express";
import {
  batchDeleteMerchantProductsAction,
  batchDownMerchantProductsAction,
  createMerchantProductAction,
  deleteMerchantProductAction,
  getCurrentMerchantOrderBoardAction,
  getCurrentMerchantStoreAction,
  moveMerchantProductAction,
  toggleMerchantProductStatusAction,
  updateCurrentMerchantStoreAction,
  updateMerchantProductAction
} from "../controllers/mini-merchant.controller";
import {
  miniMerchantBatchIdsSchema,
  miniMerchantMoveSchema,
  miniMerchantProductSchema,
  miniMerchantStoreUpdateSchema
} from "../controllers/schemas";
import { asyncHandler } from "../middlewares/async-handler";
import { requireMiniAuth } from "../middlewares/auth";
import { validateBody } from "../middlewares/validate";

const router = Router();

router.get("/store/current", requireMiniAuth, asyncHandler(getCurrentMerchantStoreAction));
router.get("/order/board", requireMiniAuth, asyncHandler(getCurrentMerchantOrderBoardAction));
router.put("/store/current", requireMiniAuth, validateBody(miniMerchantStoreUpdateSchema), asyncHandler(updateCurrentMerchantStoreAction));
router.post("/product/batch-down", requireMiniAuth, validateBody(miniMerchantBatchIdsSchema), asyncHandler(batchDownMerchantProductsAction));
router.post("/product/batch-delete", requireMiniAuth, validateBody(miniMerchantBatchIdsSchema), asyncHandler(batchDeleteMerchantProductsAction));
router.post("/product", requireMiniAuth, validateBody(miniMerchantProductSchema), asyncHandler(createMerchantProductAction));
router.put("/product/:id", requireMiniAuth, validateBody(miniMerchantProductSchema), asyncHandler(updateMerchantProductAction));
router.post("/product/:id/move", requireMiniAuth, validateBody(miniMerchantMoveSchema), asyncHandler(moveMerchantProductAction));
router.post("/product/:id/status", requireMiniAuth, asyncHandler(toggleMerchantProductStatusAction));
router.delete("/product/:id", requireMiniAuth, asyncHandler(deleteMerchantProductAction));

export default router;
