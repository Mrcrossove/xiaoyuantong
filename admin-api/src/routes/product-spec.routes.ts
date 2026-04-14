import { Router } from "express";
import {
  batchDeleteProductSpecAction,
  batchStatusProductSpecAction,
  createProductSpecAction,
  deleteProductSpecAction,
  listProductSpec,
  toggleProductSpecStatusAction,
  updateProductSpecAction
} from "../controllers/product-spec.controller";
import { productSpecPayloadSchema } from "../controllers/schemas";
import { asyncHandler } from "../middlewares/async-handler";
import { requireAdminAuth, requireAdminMenuAccess } from "../middlewares/auth";
import { validateBody } from "../middlewares/validate";

const router = Router();

router.get("/", requireAdminAuth, requireAdminMenuAccess("/product/spec"), asyncHandler(listProductSpec));
router.post("/", requireAdminAuth, requireAdminMenuAccess("/product/spec"), validateBody(productSpecPayloadSchema), asyncHandler(createProductSpecAction));
router.put("/:id", requireAdminAuth, requireAdminMenuAccess("/product/spec"), validateBody(productSpecPayloadSchema), asyncHandler(updateProductSpecAction));
router.patch("/:id/toggle-status", requireAdminAuth, requireAdminMenuAccess("/product/spec"), asyncHandler(toggleProductSpecStatusAction));
router.delete("/:id", requireAdminAuth, requireAdminMenuAccess("/product/spec"), asyncHandler(deleteProductSpecAction));
router.post("/batch-delete", requireAdminAuth, requireAdminMenuAccess("/product/spec"), asyncHandler(batchDeleteProductSpecAction));
router.post("/batch-status", requireAdminAuth, requireAdminMenuAccess("/product/spec"), asyncHandler(batchStatusProductSpecAction));

export default router;
