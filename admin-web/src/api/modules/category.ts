import type { BatchIdsPayload, BatchStatusPayload, PageQuery, PageResult } from "../contracts";
import { request } from "../request";

export type CategoryType = "post" | "store" | "product";

export interface CategoryItem {
  id: number;
  school: string;
  name: string;
  code: string;
  sort: number;
  status: string;
  relatedCount: number;
  updatedAt: string;
}

export interface CategoryQuery extends PageQuery {}

export interface CategoryPayload {
  school: string;
  name: string;
  code: string;
  sort: number;
  status: "启用" | "停用";
}

export interface CategorySummary {
  total: number;
  enabledCount: number;
  schoolOptions: string[];
}

export interface CategoryListResult extends PageResult<CategoryItem> {
  summary: CategorySummary;
}

function getCategoryBaseUrl(type: CategoryType) {
  return `/category/admin/${type}`;
}

export function getCategoryListApi(type: CategoryType, query: CategoryQuery) {
  return request<CategoryListResult>({
    url: `${getCategoryBaseUrl(type)}/list`,
    method: "GET",
    params: query
  });
}

export function createCategoryApi(type: CategoryType, payload: CategoryPayload) {
  return request<CategoryItem>({
    url: getCategoryBaseUrl(type),
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateCategoryApi(type: CategoryType, id: number, payload: CategoryPayload) {
  return request<CategoryItem>({
    url: `${getCategoryBaseUrl(type)}/${id}`,
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function toggleCategoryStatusApi(type: CategoryType, id: number) {
  return request<CategoryItem>({
    url: `${getCategoryBaseUrl(type)}/${id}/toggle-status`,
    method: "PATCH"
  });
}

export function deleteCategoryApi(type: CategoryType, id: number) {
  return request<{ success: boolean }>({
    url: `${getCategoryBaseUrl(type)}/${id}`,
    method: "DELETE"
  });
}

export function batchDeleteCategoryApi(type: CategoryType, payload: BatchIdsPayload) {
  return request<{ success: boolean }>({
    url: `${getCategoryBaseUrl(type)}/batch-delete`,
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function batchSetCategoryStatusApi(type: CategoryType, payload: BatchStatusPayload) {
  return request<{ success: boolean }>({
    url: `${getCategoryBaseUrl(type)}/batch-status`,
    method: "POST",
    body: JSON.stringify(payload)
  });
}
