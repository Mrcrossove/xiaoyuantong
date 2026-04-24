import { request } from "../request";
import type { SessionProfile } from "../../utils/storage";

export interface LoginRequest {
  account: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  profile: SessionProfile;
  permissions: string[];
  menuPaths: string[];
}

export interface AdminSessionResponse {
  profile: SessionProfile;
  permissions: string[];
  menuPaths: string[];
}

export function loginApi(payload: LoginRequest) {
  return request<LoginResponse>({
    url: "/auth/admin/login",
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function getAdminSessionApi() {
  return request<AdminSessionResponse>({
    url: "/auth/admin/session",
    method: "GET"
  });
}

export function activateAdminApi(payload: { password: string }) {
  return request<AdminSessionResponse>({
    url: "/auth/admin/activate",
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function getAdminAccountProfileApi() {
  return request<{
    id: number;
    account: string;
    name: string;
    status: string;
    roleName: string;
    roleCode: string;
    schools: string[];
    mustChangePassword: boolean;
    lastLoginAt: string;
    passwordUpdatedAt: string;
  }>({
    url: "/auth/admin/account/profile",
    method: "GET"
  });
}

export function updateAdminAccountPasswordApi(payload: { oldPassword?: string; newPassword: string }) {
  return request<AdminSessionResponse>({
    url: "/auth/admin/account/password",
    method: "PUT",
    body: JSON.stringify(payload)
  });
}
