import type {
  AdminStoreDashboardResult,
  AdminStoreOrderDetailResult,
  AdminStoreItem,
  AdminStoreProductPayload,
  AdminStoreQuery,
  PageResult,
  RefundReviewPayload,
  StoreApplyItem,
  StoreApplyQuery,
  StoreReviewPayload
} from "../contracts";
import { request } from "../request";

export function getStoreApplyListApi(query: StoreApplyQuery) {
  return request<PageResult<StoreApplyItem>>({
    url: "/shop/apply/admin/list",
    method: "GET",
    params: query
  });
}

export function reviewStoreApplyApi(id: number, payload: StoreReviewPayload) {
  return request<StoreApplyItem>({
    url: `/shop/apply/admin/${id}/review`,
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function getAdminStoreListApi(query: AdminStoreQuery) {
  return request<PageResult<AdminStoreItem>>({
    url: "/mini/store/admin/list",
    method: "GET",
    params: query
  });
}

export function getAdminStoreDashboardApi(id: number) {
  return request<AdminStoreDashboardResult>({
    url: `/mini/store/admin/detail/${id}`,
    method: "GET"
  });
}

export function createAdminStoreProductApi(storeId: number, payload: AdminStoreProductPayload) {
  return request({
    url: `/mini/store/admin/detail/${storeId}/product`,
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateAdminStoreProductApi(storeId: number, productId: string, payload: AdminStoreProductPayload) {
  return request({
    url: `/mini/store/admin/detail/${storeId}/product/${productId}`,
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function toggleAdminStoreProductStatusApi(storeId: number, productId: string) {
  return request({
    url: `/mini/store/admin/detail/${storeId}/product/${productId}/status`,
    method: "POST"
  });
}

export function deleteAdminStoreProductApi(storeId: number, productId: string) {
  return request({
    url: `/mini/store/admin/detail/${storeId}/product/${productId}`,
    method: "DELETE"
  });
}

export function getAdminStoreOrderDetailApi(storeId: number, orderId: number) {
  return request<AdminStoreOrderDetailResult>({
    url: `/mini/store/admin/detail/${storeId}/order/${orderId}`,
    method: "GET"
  });
}

export function finishAdminStoreOrderApi(storeId: number, orderId: number) {
  return request<AdminStoreOrderDetailResult>({
    url: `/mini/store/admin/detail/${storeId}/order/${orderId}/finish`,
    method: "POST"
  });
}

export function cancelAdminStoreOrderApi(storeId: number, orderId: number) {
  return request<AdminStoreOrderDetailResult>({
    url: `/mini/store/admin/detail/${storeId}/order/${orderId}/cancel`,
    method: "POST"
  });
}

export function reviewAdminStoreOrderRefundApi(
  storeId: number,
  orderId: number,
  refundId: number,
  payload: RefundReviewPayload
) {
  return request<AdminStoreOrderDetailResult>({
    url: `/mini/store/admin/detail/${storeId}/order/${orderId}/refund/${refundId}/review`,
    method: "POST",
    body: JSON.stringify(payload)
  });
}
