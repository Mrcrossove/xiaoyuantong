import type {
  AdminProductListResult,
  AdminProductQuery,
  BatchIdsPayload,
  BatchStatusPayload,
  PageResult,
  ProductSpecItem,
  ProductSpecPayload,
  ProductSpecQuery
} from "../contracts";
import { request } from "../request";

export function getAdminProductListApi(query: AdminProductQuery) {
  return request<AdminProductListResult>({
    url: "/product/admin/list",
    method: "GET",
    params: query
  });
}

export function getProductSpecsApi(query: ProductSpecQuery) {
  return request<PageResult<ProductSpecItem>>({
    url: "/product/spec",
    method: "GET",
    params: query
  });
}

export function createProductSpecApi(payload: ProductSpecPayload) {
  return request<ProductSpecItem>({
    url: "/product/spec",
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateProductSpecApi(id: number, payload: ProductSpecPayload) {
  return request<ProductSpecItem>({
    url: `/product/spec/${id}`,
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function toggleProductSpecStatusApi(id: number) {
  return request<ProductSpecItem>({
    url: `/product/spec/${id}/toggle-status`,
    method: "PATCH"
  });
}

export function deleteProductSpecApi(id: number) {
  return request<{ success: boolean }>({
    url: `/product/spec/${id}`,
    method: "DELETE"
  });
}

export function batchDeleteProductSpecApi(payload: BatchIdsPayload) {
  return request<{ success: boolean }>({
    url: "/product/spec/batch-delete",
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function batchSetProductSpecStatusApi(payload: BatchStatusPayload) {
  return request<{ success: boolean }>({
    url: "/product/spec/batch-status",
    method: "POST",
    body: JSON.stringify(payload)
  });
}
