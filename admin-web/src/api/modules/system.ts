import type {
  BasicConfigItem,
  BasicConfigPayload,
  BasicConfigQuery,
  BasicConfigResult,
  DictConfigResult,
  DictItemPayload,
  DictTypeItem,
  DictTypePayload,
  DictValueItem,
  OperationLogListResult,
  OperationLogQuery,
  VersionInfo
} from "../contracts";
import { request } from "../request";

export function getOperationLogsApi(query: OperationLogQuery) {
  return request<OperationLogListResult>({
    url: "/system/log/list",
    method: "GET",
    params: query
  });
}

export function getVersionInfoApi() {
  return request<VersionInfo>({
    url: "/system/version",
    method: "GET"
  });
}

export function getBasicConfigApi(query: BasicConfigQuery) {
  return request<BasicConfigResult>({
    url: "/system/basic/list",
    method: "GET",
    params: query
  });
}

export function createBasicConfigApi(payload: BasicConfigPayload) {
  return request<BasicConfigItem>({
    url: "/system/basic",
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateBasicConfigApi(id: number, payload: BasicConfigPayload) {
  return request<BasicConfigItem>({
    url: `/system/basic/${id}`,
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function toggleBasicConfigStatusApi(id: number) {
  return request<BasicConfigItem>({
    url: `/system/basic/${id}/toggle-status`,
    method: "PATCH"
  });
}

export function deleteBasicConfigApi(id: number) {
  return request<{ success: boolean }>({
    url: `/system/basic/${id}`,
    method: "DELETE"
  });
}

export function getDictConfigApi() {
  return request<DictConfigResult>({
    url: "/system/dict",
    method: "GET"
  });
}

export function createDictTypeApi(payload: DictTypePayload) {
  return request<DictTypeItem>({
    url: "/system/dict/type",
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateDictTypeApi(id: number, payload: DictTypePayload) {
  return request<DictTypeItem>({
    url: `/system/dict/type/${id}`,
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function toggleDictTypeStatusApi(id: number) {
  return request<DictTypeItem>({
    url: `/system/dict/type/${id}/toggle-status`,
    method: "PATCH"
  });
}

export function deleteDictTypeApi(id: number) {
  return request<{ success: boolean }>({
    url: `/system/dict/type/${id}`,
    method: "DELETE"
  });
}

export function createDictItemApi(payload: DictItemPayload) {
  return request<DictValueItem>({
    url: "/system/dict/item",
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateDictItemApi(id: number, payload: DictItemPayload) {
  return request<DictValueItem>({
    url: `/system/dict/item/${id}`,
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function toggleDictItemStatusApi(id: number) {
  return request<DictValueItem>({
    url: `/system/dict/item/${id}/toggle-status`,
    method: "PATCH"
  });
}

export function deleteDictItemApi(id: number) {
  return request<{ success: boolean }>({
    url: `/system/dict/item/${id}`,
    method: "DELETE"
  });
}
