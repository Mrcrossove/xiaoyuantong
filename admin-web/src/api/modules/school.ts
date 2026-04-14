import type {
  AdminSchoolListResult,
  AdminSchoolQuery,
  BatchIdsPayload,
  BatchStatusPayload,
  PageResult,
  SchoolContentItem,
  SchoolContentPayload,
  SchoolContentQuery
} from "../contracts";
import { request } from "../request";

export function getAdminSchoolListApi(query: AdminSchoolQuery) {
  return request<AdminSchoolListResult>({
    url: "/school/admin/list",
    method: "GET",
    params: query
  });
}

export function getSchoolContentListApi(query: SchoolContentQuery) {
  return request<PageResult<SchoolContentItem>>({
    url: "/school/content",
    method: "GET",
    params: query
  });
}

export function createSchoolContentApi(payload: SchoolContentPayload) {
  return request<SchoolContentItem>({
    url: "/school/content",
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateSchoolContentApi(id: number, payload: SchoolContentPayload) {
  return request<SchoolContentItem>({
    url: `/school/content/${id}`,
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function toggleSchoolContentStatusApi(id: number) {
  return request<SchoolContentItem>({
    url: `/school/content/${id}/toggle-status`,
    method: "PATCH"
  });
}

export function deleteSchoolContentApi(id: number) {
  return request<{ success: boolean }>({
    url: `/school/content/${id}`,
    method: "DELETE"
  });
}

export function batchDeleteSchoolContentApi(payload: BatchIdsPayload) {
  return request<{ success: boolean }>({
    url: "/school/content/batch-delete",
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function batchSetSchoolContentStatusApi(payload: BatchStatusPayload) {
  return request<{ success: boolean }>({
    url: "/school/content/batch-status",
    method: "POST",
    body: JSON.stringify(payload)
  });
}
