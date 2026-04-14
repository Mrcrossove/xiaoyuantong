import { Router } from "express";
import {
  batchDeletePostCategoryAction,
  batchDeleteProductCategoryAction,
  batchDeleteStoreCategoryAction,
  batchStatusPostCategoryAction,
  batchStatusProductCategoryAction,
  batchStatusStoreCategoryAction,
  createPostCategoryAction,
  createProductCategoryAction,
  createStoreCategoryAction,
  deletePostCategoryAction,
  deleteProductCategoryAction,
  deleteStoreCategoryAction,
  listPostCategoryAction,
  listProductCategoryAction,
  listStoreCategoryAction,
  togglePostCategoryStatusAction,
  toggleProductCategoryStatusAction,
  toggleStoreCategoryStatusAction,
  updatePostCategoryAction,
  updateProductCategoryAction,
  updateStoreCategoryAction
} from "../controllers/category-admin.controller";
import { adminCategoryPayloadSchema } from "../controllers/schemas";
import { asyncHandler } from "../middlewares/async-handler";
import { requireAdminAuth, requireAdminMenuAccess, requireAdminPermission } from "../middlewares/auth";
import { validateBody } from "../middlewares/validate";

const router = Router();

router.get("/post/list", requireAdminAuth, requireAdminMenuAccess("/post/category"), asyncHandler(listPostCategoryAction));
router.post(
  "/post",
  requireAdminAuth,
  requireAdminMenuAccess("/post/category"),
  requireAdminPermission("post:category:add"),
  validateBody(adminCategoryPayloadSchema),
  asyncHandler(createPostCategoryAction)
);
router.put(
  "/post/:id",
  requireAdminAuth,
  requireAdminMenuAccess("/post/category"),
  requireAdminPermission("post:category:edit"),
  validateBody(adminCategoryPayloadSchema),
  asyncHandler(updatePostCategoryAction)
);
router.patch(
  "/post/:id/toggle-status",
  requireAdminAuth,
  requireAdminMenuAccess("/post/category"),
  requireAdminPermission("post:category:edit"),
  asyncHandler(togglePostCategoryStatusAction)
);
router.delete(
  "/post/:id",
  requireAdminAuth,
  requireAdminMenuAccess("/post/category"),
  requireAdminPermission("post:category:edit"),
  asyncHandler(deletePostCategoryAction)
);
router.post(
  "/post/batch-delete",
  requireAdminAuth,
  requireAdminMenuAccess("/post/category"),
  requireAdminPermission("post:category:edit"),
  asyncHandler(batchDeletePostCategoryAction)
);
router.post(
  "/post/batch-status",
  requireAdminAuth,
  requireAdminMenuAccess("/post/category"),
  requireAdminPermission("post:category:edit"),
  asyncHandler(batchStatusPostCategoryAction)
);

router.get("/store/list", requireAdminAuth, requireAdminMenuAccess("/store/category"), asyncHandler(listStoreCategoryAction));
router.post(
  "/store",
  requireAdminAuth,
  requireAdminMenuAccess("/store/category"),
  requireAdminPermission("store:category:add"),
  validateBody(adminCategoryPayloadSchema),
  asyncHandler(createStoreCategoryAction)
);
router.put(
  "/store/:id",
  requireAdminAuth,
  requireAdminMenuAccess("/store/category"),
  requireAdminPermission("store:category:edit"),
  validateBody(adminCategoryPayloadSchema),
  asyncHandler(updateStoreCategoryAction)
);
router.patch(
  "/store/:id/toggle-status",
  requireAdminAuth,
  requireAdminMenuAccess("/store/category"),
  requireAdminPermission("store:category:edit"),
  asyncHandler(toggleStoreCategoryStatusAction)
);
router.delete(
  "/store/:id",
  requireAdminAuth,
  requireAdminMenuAccess("/store/category"),
  requireAdminPermission("store:category:edit"),
  asyncHandler(deleteStoreCategoryAction)
);
router.post(
  "/store/batch-delete",
  requireAdminAuth,
  requireAdminMenuAccess("/store/category"),
  requireAdminPermission("store:category:edit"),
  asyncHandler(batchDeleteStoreCategoryAction)
);
router.post(
  "/store/batch-status",
  requireAdminAuth,
  requireAdminMenuAccess("/store/category"),
  requireAdminPermission("store:category:edit"),
  asyncHandler(batchStatusStoreCategoryAction)
);

router.get("/product/list", requireAdminAuth, requireAdminMenuAccess("/product/category"), asyncHandler(listProductCategoryAction));
router.post(
  "/product",
  requireAdminAuth,
  requireAdminMenuAccess("/product/category"),
  requireAdminPermission("product:category:add"),
  validateBody(adminCategoryPayloadSchema),
  asyncHandler(createProductCategoryAction)
);
router.put(
  "/product/:id",
  requireAdminAuth,
  requireAdminMenuAccess("/product/category"),
  requireAdminPermission("product:category:edit"),
  validateBody(adminCategoryPayloadSchema),
  asyncHandler(updateProductCategoryAction)
);
router.patch(
  "/product/:id/toggle-status",
  requireAdminAuth,
  requireAdminMenuAccess("/product/category"),
  requireAdminPermission("product:category:edit"),
  asyncHandler(toggleProductCategoryStatusAction)
);
router.delete(
  "/product/:id",
  requireAdminAuth,
  requireAdminMenuAccess("/product/category"),
  requireAdminPermission("product:category:edit"),
  asyncHandler(deleteProductCategoryAction)
);
router.post(
  "/product/batch-delete",
  requireAdminAuth,
  requireAdminMenuAccess("/product/category"),
  requireAdminPermission("product:category:edit"),
  asyncHandler(batchDeleteProductCategoryAction)
);
router.post(
  "/product/batch-status",
  requireAdminAuth,
  requireAdminMenuAccess("/product/category"),
  requireAdminPermission("product:category:edit"),
  asyncHandler(batchStatusProductCategoryAction)
);

export default router;
