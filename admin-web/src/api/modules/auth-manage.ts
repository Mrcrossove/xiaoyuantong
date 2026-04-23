import type {
  AdminManagerCreatePayload,
  AdminManagerItem,
  AdminManagerListResult,
  AdminManagerQuery,
  AdminManagerUpdatePayload,
  AdminRoleItem,
  AdminRoleListResult,
  AdminRolePayload,
  AdminRoleQuery,
  AuthManageMeta,
  RolePermissionPayload
} from "../contracts";
import { request } from "../request";

export function getAuthManageMetaApi() {
  return request<AuthManageMeta>({
    url: "/auth/meta",
    method: "GET"
  });
}

export function getAdminManagerListApi(query: AdminManagerQuery) {
  return request<AdminManagerListResult>({
    url: "/auth/admin-user/list",
    method: "GET",
    params: query
  });
}

export function createAdminManagerApi(payload: AdminManagerCreatePayload) {
  return request<AdminManagerItem>({
    url: "/auth/admin-user",
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateAdminManagerApi(id: number, payload: AdminManagerUpdatePayload) {
  return request<AdminManagerItem>({
    url: `/auth/admin-user/${id}`,
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function toggleAdminManagerStatusApi(id: number) {
  return request<AdminManagerItem>({
    url: `/auth/admin-user/${id}/toggle-status`,
    method: "PATCH"
  });
}

export function deleteAdminManagerApi(id: number) {
  return request<{ success: boolean }>({
    url: `/auth/admin-user/${id}`,
    method: "DELETE"
  });
}

export function getAdminRoleListApi(query: AdminRoleQuery) {
  return request<AdminRoleListResult>({
    url: "/auth/role/list",
    method: "GET",
    params: query
  });
}

export function createAdminRoleApi(payload: AdminRolePayload) {
  return request<AdminRoleItem>({
    url: "/auth/role",
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function createAdminRoleFromTemplateApi(code: string) {
  return request<AdminRoleItem>({
    url: `/auth/role/template/${code}`,
    method: "POST"
  });
}

export function updateAdminRoleApi(id: number, payload: AdminRolePayload) {
  return request<AdminRoleItem>({
    url: `/auth/role/${id}`,
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function toggleAdminRoleStatusApi(id: number) {
  return request<AdminRoleItem>({
    url: `/auth/role/${id}/toggle-status`,
    method: "PATCH"
  });
}

export function deleteAdminRoleApi(id: number) {
  return request<{ success: boolean }>({
    url: `/auth/role/${id}`,
    method: "DELETE"
  });
}

export function updateRolePermissionApi(id: number, payload: RolePermissionPayload) {
  return request<AdminRoleItem>({
    url: `/auth/menu/role/${id}`,
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function getMenuPermissionDataApi() {
  return request<{
    currentRoleId: number;
    currentRoleCode: string;
    currentRoleName: string;
    tree: AuthManageMeta["menuTree"];
    permissionGroups: AuthManageMeta["permissionGroups"];
    checkedCodes: string[];
    checkedPermissions: string[];
  }>({
    url: "/auth/menu/current",
    method: "GET"
  });
}
