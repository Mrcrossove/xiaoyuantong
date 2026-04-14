import type {
  AdminStoreItem,
  AdminStoreQuery,
  PageResult,
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
