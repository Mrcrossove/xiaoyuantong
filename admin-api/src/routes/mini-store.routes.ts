import { Router } from "express";
import {
  createAdminStoreProductAction,
  deleteAdminStoreProductAction,
  getAdminStoreDashboardAction,
  getMiniStoreDetailAction,
  listAdminStoreAction,
  listMiniStoreAction,
  toggleAdminStoreProductStatusAction,
  updateAdminStoreProductAction
} from "../controllers/mini-store.controller";
import { miniMerchantProductSchema } from "../controllers/mini-commerce-schemas";
import { asyncHandler } from "../middlewares/async-handler";
import { requireAdminAuth, requireAdminMenuAccess } from "../middlewares/auth";
import { validateBody } from "../middlewares/validate";

const router = Router();

router.get("/list", asyncHandler(listMiniStoreAction));
router.get("/detail/:detailId", asyncHandler(getMiniStoreDetailAction));
router.get("/admin/list", requireAdminAuth, requireAdminMenuAccess("/store/list"), asyncHandler(listAdminStoreAction));
router.get("/admin/detail/:id", requireAdminAuth, requireAdminMenuAccess("/store/list"), asyncHandler(getAdminStoreDashboardAction));
router.post(
  "/admin/detail/:id/product",
  requireAdminAuth,
  requireAdminMenuAccess("/store/list"),
  validateBody(miniMerchantProductSchema),
  asyncHandler(createAdminStoreProductAction)
);
router.put(
  "/admin/detail/:id/product/:productId",
  requireAdminAuth,
  requireAdminMenuAccess("/store/list"),
  validateBody(miniMerchantProductSchema),
  asyncHandler(updateAdminStoreProductAction)
);
router.post(
  "/admin/detail/:id/product/:productId/status",
  requireAdminAuth,
  requireAdminMenuAccess("/store/list"),
  asyncHandler(toggleAdminStoreProductStatusAction)
);
router.delete(
  "/admin/detail/:id/product/:productId",
  requireAdminAuth,
  requireAdminMenuAccess("/store/list"),
  asyncHandler(deleteAdminStoreProductAction)
);

export default router;
