import type { ApiResponse } from "./contracts";
import { getToken } from "../utils/storage";

export interface RequestConfig extends RequestInit {
  url: string;
  params?: Record<string, string | number | boolean | undefined>;
}

export class ApiRequestError extends Error {
  code: number;
  traceId?: string;

  constructor(message: string, code = 50000, traceId?: string) {
    super(message);
    this.name = "ApiRequestError";
    this.code = code;
    this.traceId = traceId;
  }
}

function joinQuery(url: string, params?: RequestConfig["params"]) {
  if (!params) return url;
  const query = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join("&");
  return query ? `${url}${url.includes("?") ? "&" : "?"}${query}` : url;
}

function buildUrl(url: string) {
  if (/^https?:\/\//i.test(url)) return url;
  const base = String(import.meta.env.VITE_API_BASE_URL || "").trim().replace(/\/$/, "");
  if (!base) return url;
  return `${base}${url.startsWith("/") ? url : `/${url}`}`;
}

export async function request<T>(config: RequestConfig): Promise<T> {
  const token = getToken();
  const headers = new Headers(config.headers ?? {});
  if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(joinQuery(buildUrl(config.url), config.params), { ...config, headers });
  if (!response.ok) {
    throw new ApiRequestError(`请求失败：${response.status}`, response.status);
  }

  const result = (await response.json()) as ApiResponse<T> | T;
  if (typeof result === "object" && result !== null && "code" in result) {
    if (result.code !== 0) {
      throw new ApiRequestError(result.message || "请求失败", result.code, result.traceId);
    }
    return result.data;
  }

  return result as T;
}
