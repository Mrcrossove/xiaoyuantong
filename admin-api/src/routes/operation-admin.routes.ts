import { Router } from "express";
import {
  createBannerConfigAction,
  createHelpCenterAction,
  createRecommendConfigAction,
  createSearchWordAction,
  deleteBannerConfigAction,
  deleteHelpCenterAction,
  deleteRecommendConfigAction,
  deleteSearchWordAction,
  listBannerConfigAction,
  listHelpCenterAction,
  listRecommendConfigAction,
  listSearchWordAction,
  toggleBannerConfigStatusAction,
  toggleHelpCenterStatusAction,
  toggleRecommendConfigStatusAction,
  toggleSearchWordStatusAction,
  updateBannerConfigAction,
  updateHelpCenterAction,
  updateRecommendConfigAction,
  updateSearchWordAction
} from "../controllers/operation-admin.controller";
import {
  bannerConfigPayloadSchema,
  helpCenterPayloadSchema,
  recommendConfigPayloadSchema,
  searchWordPayloadSchema
} from "../controllers/schemas";
import { asyncHandler } from "../middlewares/async-handler";
import { requireAdminAuth, requireAdminMenuAccess, requireAdminPermission } from "../middlewares/auth";
import { validateBody } from "../middlewares/validate";

const router = Router();

router.get("/banner/list", requireAdminAuth, requireAdminMenuAccess("/operation/banner"), asyncHandler(listBannerConfigAction));
router.post(
  "/banner",
  requireAdminAuth,
  requireAdminMenuAccess("/operation/banner"),
  requireAdminPermission("operation:banner:add"),
  validateBody(bannerConfigPayloadSchema),
  asyncHandler(createBannerConfigAction)
);
router.put(
  "/banner/:id",
  requireAdminAuth,
  requireAdminMenuAccess("/operation/banner"),
  requireAdminPermission("operation:banner:edit"),
  validateBody(bannerConfigPayloadSchema),
  asyncHandler(updateBannerConfigAction)
);
router.patch(
  "/banner/:id/toggle-status",
  requireAdminAuth,
  requireAdminMenuAccess("/operation/banner"),
  requireAdminPermission("operation:banner:edit"),
  asyncHandler(toggleBannerConfigStatusAction)
);
router.delete(
  "/banner/:id",
  requireAdminAuth,
  requireAdminMenuAccess("/operation/banner"),
  requireAdminPermission("operation:banner:edit"),
  asyncHandler(deleteBannerConfigAction)
);

router.get("/recommend/list", requireAdminAuth, requireAdminMenuAccess("/operation/recommend"), asyncHandler(listRecommendConfigAction));
router.post(
  "/recommend",
  requireAdminAuth,
  requireAdminMenuAccess("/operation/recommend"),
  requireAdminPermission("operation:recommend:add"),
  validateBody(recommendConfigPayloadSchema),
  asyncHandler(createRecommendConfigAction)
);
router.put(
  "/recommend/:id",
  requireAdminAuth,
  requireAdminMenuAccess("/operation/recommend"),
  requireAdminPermission("operation:recommend:edit"),
  validateBody(recommendConfigPayloadSchema),
  asyncHandler(updateRecommendConfigAction)
);
router.patch(
  "/recommend/:id/toggle-status",
  requireAdminAuth,
  requireAdminMenuAccess("/operation/recommend"),
  requireAdminPermission("operation:recommend:edit"),
  asyncHandler(toggleRecommendConfigStatusAction)
);
router.delete(
  "/recommend/:id",
  requireAdminAuth,
  requireAdminMenuAccess("/operation/recommend"),
  requireAdminPermission("operation:recommend:edit"),
  asyncHandler(deleteRecommendConfigAction)
);

router.get("/search-word/list", requireAdminAuth, requireAdminMenuAccess("/operation/search-word"), asyncHandler(listSearchWordAction));
router.post(
  "/search-word",
  requireAdminAuth,
  requireAdminMenuAccess("/operation/search-word"),
  requireAdminPermission("operation:search:add"),
  validateBody(searchWordPayloadSchema),
  asyncHandler(createSearchWordAction)
);
router.put(
  "/search-word/:id",
  requireAdminAuth,
  requireAdminMenuAccess("/operation/search-word"),
  requireAdminPermission("operation:search:edit"),
  validateBody(searchWordPayloadSchema),
  asyncHandler(updateSearchWordAction)
);
router.patch(
  "/search-word/:id/toggle-status",
  requireAdminAuth,
  requireAdminMenuAccess("/operation/search-word"),
  requireAdminPermission("operation:search:edit"),
  asyncHandler(toggleSearchWordStatusAction)
);
router.delete(
  "/search-word/:id",
  requireAdminAuth,
  requireAdminMenuAccess("/operation/search-word"),
  requireAdminPermission("operation:search:edit"),
  asyncHandler(deleteSearchWordAction)
);

router.get("/help/list", requireAdminAuth, requireAdminMenuAccess("/operation/help"), asyncHandler(listHelpCenterAction));
router.post(
  "/help",
  requireAdminAuth,
  requireAdminMenuAccess("/operation/help"),
  requireAdminPermission("operation:help:add"),
  validateBody(helpCenterPayloadSchema),
  asyncHandler(createHelpCenterAction)
);
router.put(
  "/help/:id",
  requireAdminAuth,
  requireAdminMenuAccess("/operation/help"),
  requireAdminPermission("operation:help:edit"),
  validateBody(helpCenterPayloadSchema),
  asyncHandler(updateHelpCenterAction)
);
router.patch(
  "/help/:id/toggle-status",
  requireAdminAuth,
  requireAdminMenuAccess("/operation/help"),
  requireAdminPermission("operation:help:edit"),
  asyncHandler(toggleHelpCenterStatusAction)
);
router.delete(
  "/help/:id",
  requireAdminAuth,
  requireAdminMenuAccess("/operation/help"),
  requireAdminPermission("operation:help:edit"),
  asyncHandler(deleteHelpCenterAction)
);

export default router;
