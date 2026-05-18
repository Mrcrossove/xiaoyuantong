import { Router } from "express";
import {
  cancelMiniTravelBookingAction,
  confirmMiniTravelPayAction,
  createAdminTravelProviderAction,
  createAdminTravelRouteAction,
  createAdminTravelScheduleAction,
  createMiniTravelPayAction,
  createMiniTravelBookingAction,
  getMiniTravelSubscribeConfigAction,
  getMiniTravelRouteAction,
  listAdminTravelBookingAction,
  listAdminTravelProviderAction,
  listAdminTravelRouteAction,
  listMiniTravelBookingAction,
  listMiniTravelRouteAction,
  notifyAdminTravelScheduleAction,
  updateAdminTravelBookingAction,
  updateAdminTravelProviderAction,
  updateAdminTravelRouteAction,
  updateAdminTravelScheduleAction
} from "../controllers/travel.controller";
import { asyncHandler } from "../middlewares/async-handler";
import { requireAdminAuth, requireAdminMenuAccess, requireAdminPermission, requireMiniAuth } from "../middlewares/auth";

const router = Router();

router.get("/mini/route/list", asyncHandler(listMiniTravelRouteAction));
router.get("/mini/subscribe-config", asyncHandler(getMiniTravelSubscribeConfigAction));
router.get("/mini/route/:id", asyncHandler(getMiniTravelRouteAction));
router.get("/mini/booking/list", requireMiniAuth, asyncHandler(listMiniTravelBookingAction));
router.post("/mini/booking", requireMiniAuth, asyncHandler(createMiniTravelBookingAction));
router.post("/mini/booking/:id/cancel", requireMiniAuth, asyncHandler(cancelMiniTravelBookingAction));
router.post("/mini/booking/:id/pay/create", requireMiniAuth, asyncHandler(createMiniTravelPayAction));
router.post("/mini/booking/:id/pay/confirm", requireMiniAuth, asyncHandler(confirmMiniTravelPayAction));

router.get("/admin/provider/list", requireAdminAuth, requireAdminMenuAccess("/travel/provider"), asyncHandler(listAdminTravelProviderAction));
router.post(
  "/admin/provider",
  requireAdminAuth,
  requireAdminMenuAccess("/travel/provider"),
  requireAdminPermission("travel:provider:edit"),
  asyncHandler(createAdminTravelProviderAction)
);
router.put(
  "/admin/provider/:id",
  requireAdminAuth,
  requireAdminMenuAccess("/travel/provider"),
  requireAdminPermission("travel:provider:edit"),
  asyncHandler(updateAdminTravelProviderAction)
);

router.get("/admin/route/list", requireAdminAuth, requireAdminMenuAccess("/travel/route"), asyncHandler(listAdminTravelRouteAction));
router.post(
  "/admin/route",
  requireAdminAuth,
  requireAdminMenuAccess("/travel/route"),
  requireAdminPermission("travel:route:edit"),
  asyncHandler(createAdminTravelRouteAction)
);
router.put(
  "/admin/route/:id",
  requireAdminAuth,
  requireAdminMenuAccess("/travel/route"),
  requireAdminPermission("travel:route:edit"),
  asyncHandler(updateAdminTravelRouteAction)
);
router.post(
  "/admin/route/:routeId/schedule",
  requireAdminAuth,
  requireAdminMenuAccess("/travel/route"),
  requireAdminPermission("travel:route:edit"),
  asyncHandler(createAdminTravelScheduleAction)
);
router.put(
  "/admin/route/:routeId/schedule/:id",
  requireAdminAuth,
  requireAdminMenuAccess("/travel/route"),
  requireAdminPermission("travel:route:edit"),
  asyncHandler(updateAdminTravelScheduleAction)
);
router.post(
  "/admin/schedule/:id/notify-payment",
  requireAdminAuth,
  requireAdminMenuAccess("/travel/booking", "/travel/route"),
  requireAdminPermission("travel:booking:review"),
  asyncHandler(notifyAdminTravelScheduleAction)
);

router.get("/admin/booking/list", requireAdminAuth, requireAdminMenuAccess("/travel/booking"), asyncHandler(listAdminTravelBookingAction));
router.post(
  "/admin/booking/:id/status",
  requireAdminAuth,
  requireAdminMenuAccess("/travel/booking"),
  requireAdminPermission("travel:booking:review"),
  asyncHandler(updateAdminTravelBookingAction)
);

export default router;
