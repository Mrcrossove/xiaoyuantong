import type {
  AdminStoreDashboardResult,
  AdminStoreOrderDetailResult,
  AdminStoreOrderQuery,
  AdminStoreItem,
  AdminStoreProductMutationControl,
  AdminStoreProductMutationResult,
  AdminStoreProductPayload,
  AdminStoreQuery,
  PageResult,
  RefundReviewPayload,
  StoreProductApprovalItem,
  StoreProductApprovalReviewPayload,
  StoreApplyItem,
  StoreApplyQuery,
  StoreReviewPayload,
  StoreTakedownPayload
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

export function takedownStoreApplyApi(id: number, payload: StoreTakedownPayload) {
  return request<StoreApplyItem>({
    url: `/shop/apply/admin/${id}/takedown`,
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

export function getAdminStoreDashboardWithQueryApi(id: number, params: Record<string, string | number | undefined>) {
  return request<AdminStoreDashboardResult>({
    url: `/mini/store/admin/detail/${id}`,
    method: "GET",
    params
  });
}

export function createAdminStoreProductApi(storeId: number, payload: AdminStoreProductPayload) {
  return request<AdminStoreProductMutationResult>({
    url: `/mini/store/admin/detail/${storeId}/product`,
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateAdminStoreProductApi(
  storeId: number,
  productId: string,
  payload: AdminStoreProductPayload & AdminStoreProductMutationControl
) {
  return request<AdminStoreProductMutationResult>({
    url: `/mini/store/admin/detail/${storeId}/product/${productId}`,
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function toggleAdminStoreProductStatusApi(
  storeId: number,
  productId: string,
  payload: AdminStoreProductMutationControl = {}
) {
  return request<AdminStoreProductMutationResult>({
    url: `/mini/store/admin/detail/${storeId}/product/${productId}/status`,
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function deleteAdminStoreProductApi(
  storeId: number,
  productId: string,
  payload: AdminStoreProductMutationControl = {}
) {
  return request<AdminStoreProductMutationResult>({
    url: `/mini/store/admin/detail/${storeId}/product/${productId}`,
    method: "DELETE",
    body: JSON.stringify(payload)
  });
}

export function getStoreProductApprovalListApi(query: { page?: number; pageSize?: number; status?: string; keyword?: string }) {
  return request<PageResult<StoreProductApprovalItem>>({
    url: "/mini/store/admin/approval/list",
    method: "GET",
    params: query
  });
}

export function reviewStoreProductApprovalApi(approvalId: number, payload: StoreProductApprovalReviewPayload) {
  return request<StoreProductApprovalItem>({
    url: `/mini/store/admin/approval/${approvalId}/review`,
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function getAdminStoreOrderDetailApi(storeId: number, orderId: number) {
  return request<AdminStoreOrderDetailResult>({
    url: `/mini/store/admin/detail/${storeId}/order/${orderId}`,
    method: "GET"
  });
}

export function getAdminStoreOrdersApi(storeId: number, query: AdminStoreOrderQuery) {
  return request<PageResult<AdminStoreDashboardResult["orders"][number]>>({
    url: `/mini/store/admin/detail/${storeId}/orders`,
    method: "GET",
    params: query
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
