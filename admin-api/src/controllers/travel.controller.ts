import type { Request, Response } from "express";
import { ok } from "../utils/response";
import {
  cancelMiniTravelBooking,
  createMiniTravelBooking,
  getMiniTravelRouteDetail,
  notifyAdminTravelSchedulePayment,
  queryAdminTravelBookings,
  queryAdminTravelProviders,
  queryAdminTravelRoutes,
  queryMiniTravelBookings,
  queryMiniTravelRoutes,
  saveAdminTravelProvider,
  saveAdminTravelRoute,
  saveAdminTravelSchedule,
  updateAdminTravelBookingStatus
} from "../services/travel.service";

export async function listMiniTravelRouteAction(req: Request, res: Response) {
  const data = await queryMiniTravelRoutes(req.query as Record<string, unknown>);
  return ok(res, data, req.traceId);
}

export async function getMiniTravelRouteAction(req: Request, res: Response) {
  const data = await getMiniTravelRouteDetail(Number(req.params.id), req.miniAuth?.userId);
  return ok(res, data, req.traceId);
}

export async function createMiniTravelBookingAction(req: Request, res: Response) {
  const data = await createMiniTravelBooking(req.miniAuth!.userId, req.body);
  return ok(res, data, req.traceId);
}

export async function listMiniTravelBookingAction(req: Request, res: Response) {
  const data = await queryMiniTravelBookings(req.miniAuth!.userId);
  return ok(res, data, req.traceId);
}

export async function cancelMiniTravelBookingAction(req: Request, res: Response) {
  const data = await cancelMiniTravelBooking(req.miniAuth!.userId, Number(req.params.id));
  return ok(res, data, req.traceId);
}

export async function listAdminTravelProviderAction(req: Request, res: Response) {
  const data = await queryAdminTravelProviders(req.adminAuth!.userId);
  return ok(res, data, req.traceId);
}

export async function createAdminTravelProviderAction(req: Request, res: Response) {
  const data = await saveAdminTravelProvider(req.adminAuth!.userId, req.body);
  return ok(res, data, req.traceId);
}

export async function updateAdminTravelProviderAction(req: Request, res: Response) {
  const data = await saveAdminTravelProvider(req.adminAuth!.userId, req.body, Number(req.params.id));
  return ok(res, data, req.traceId);
}

export async function listAdminTravelRouteAction(req: Request, res: Response) {
  const data = await queryAdminTravelRoutes(req.adminAuth!.userId, req.query as Record<string, unknown>);
  return ok(res, data, req.traceId);
}

export async function createAdminTravelRouteAction(req: Request, res: Response) {
  const data = await saveAdminTravelRoute(req.adminAuth!.userId, req.body);
  return ok(res, data, req.traceId);
}

export async function updateAdminTravelRouteAction(req: Request, res: Response) {
  const data = await saveAdminTravelRoute(req.adminAuth!.userId, req.body, Number(req.params.id));
  return ok(res, data, req.traceId);
}

export async function createAdminTravelScheduleAction(req: Request, res: Response) {
  const data = await saveAdminTravelSchedule(req.adminAuth!.userId, Number(req.params.routeId), req.body);
  return ok(res, data, req.traceId);
}

export async function updateAdminTravelScheduleAction(req: Request, res: Response) {
  const data = await saveAdminTravelSchedule(req.adminAuth!.userId, Number(req.params.routeId), req.body, Number(req.params.id));
  return ok(res, data, req.traceId);
}

export async function listAdminTravelBookingAction(req: Request, res: Response) {
  const data = await queryAdminTravelBookings(req.adminAuth!.userId, req.query as Record<string, unknown>);
  return ok(res, data, req.traceId);
}

export async function updateAdminTravelBookingAction(req: Request, res: Response) {
  const data = await updateAdminTravelBookingStatus(req.adminAuth!.userId, Number(req.params.id), req.body);
  return ok(res, data, req.traceId);
}

export async function notifyAdminTravelScheduleAction(req: Request, res: Response) {
  const data = await notifyAdminTravelSchedulePayment(req.adminAuth!.userId, Number(req.params.id));
  return ok(res, data, req.traceId);
}
