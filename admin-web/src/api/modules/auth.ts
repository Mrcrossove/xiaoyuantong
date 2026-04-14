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
