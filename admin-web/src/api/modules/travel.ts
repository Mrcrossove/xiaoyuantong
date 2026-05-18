import type { PageResult } from "../contracts";
import { request } from "../request";

export function getTravelProviderListApi() {
  return request<PageResult<any>>({
    url: "/travel/admin/provider/list",
    method: "GET"
  });
}

export function createTravelProviderApi(payload: any) {
  return request<any>({
    url: "/travel/admin/provider",
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateTravelProviderApi(id: number, payload: any) {
  return request<any>({
    url: `/travel/admin/provider/${id}`,
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function getTravelRouteListApi(query: Record<string, unknown>) {
  return request<PageResult<any>>({
    url: "/travel/admin/route/list",
    method: "GET",
    params: query
  });
}

export function createTravelRouteApi(payload: any) {
  return request<any>({
    url: "/travel/admin/route",
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateTravelRouteApi(id: number, payload: any) {
  return request<any>({
    url: `/travel/admin/route/${id}`,
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function createTravelScheduleApi(routeId: number, payload: any) {
  return request<any>({
    url: `/travel/admin/route/${routeId}/schedule`,
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateTravelScheduleApi(routeId: number, id: number, payload: any) {
  return request<any>({
    url: `/travel/admin/route/${routeId}/schedule/${id}`,
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function notifyTravelSchedulePaymentApi(id: number) {
  return request<any>({
    url: `/travel/admin/schedule/${id}/notify-payment`,
    method: "POST"
  });
}

export function getTravelBookingListApi(query: Record<string, unknown>) {
  return request<PageResult<any>>({
    url: "/travel/admin/booking/list",
    method: "GET",
    params: query
  });
}

export function updateTravelBookingStatusApi(id: number, payload: any) {
  return request<any>({
    url: `/travel/admin/booking/${id}/status`,
    method: "POST",
    body: JSON.stringify(payload)
  });
}
