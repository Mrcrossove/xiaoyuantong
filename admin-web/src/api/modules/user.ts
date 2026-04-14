import type {
  AdminUserListResult,
  AdminUserQuery,
  BatchIdsPayload,
  BatchStatusPayload,
  PageResult,
  UserPublishItem,
  UserPublishPayload,
  UserPublishQuery
} from "../contracts";
import { request } from "../request";

export function getAdminUserListApi(query: AdminUserQuery) {
  return request<AdminUserListResult>({
    url: "/user/admin/list",
    method: "GET",
    params: query
  });
}

export function getUserPublishRecordsApi(query: UserPublishQuery) {
  return request<PageResult<UserPublishItem>>({
    url: "/user/publish",
    method: "GET",
    params: query
  });
}

export function createUserPublishRecordApi(payload: UserPublishPayload) {
  return request<UserPublishItem>({
    url: "/user/publish",
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateUserPublishRecordApi(id: number, payload: UserPublishPayload) {
  return request<UserPublishItem>({
    url: `/user/publish/${id}`,
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function toggleUserPublishStatusApi(id: number) {
  return request<UserPublishItem>({
    url: `/user/publish/${id}/toggle-status`,
    method: "PATCH"
  });
}

export function deleteUserPublishRecordApi(id: number) {
  return request<{ success: boolean }>({
    url: `/user/publish/${id}`,
    method: "DELETE"
  });
}

export function batchDeleteUserPublishRecordApi(payload: BatchIdsPayload) {
  return request<{ success: boolean }>({
    url: "/user/publish/batch-delete",
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function batchSetUserPublishStatusApi(payload: BatchStatusPayload) {
  return request<{ success: boolean }>({
    url: "/user/publish/batch-status",
    method: "POST",
    body: JSON.stringify(payload)
  });
}
