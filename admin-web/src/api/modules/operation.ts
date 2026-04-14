import type {
  BannerConfigItem,
  BannerConfigListResult,
  BannerConfigPayload,
  BannerConfigQuery,
  HelpCenterItem,
  HelpCenterListResult,
  HelpCenterPayload,
  HelpCenterQuery,
  RecommendConfigItem,
  RecommendConfigListResult,
  RecommendConfigPayload,
  RecommendConfigQuery,
  SearchWordItem,
  SearchWordListResult,
  SearchWordPayload,
  SearchWordQuery
} from "../contracts";
import { request } from "../request";

export function getBannerConfigListApi(query: BannerConfigQuery) {
  return request<BannerConfigListResult>({
    url: "/operation/banner/list",
    method: "GET",
    params: query
  });
}

export function createBannerConfigApi(payload: BannerConfigPayload) {
  return request<BannerConfigItem>({
    url: "/operation/banner",
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateBannerConfigApi(id: number, payload: BannerConfigPayload) {
  return request<BannerConfigItem>({
    url: `/operation/banner/${id}`,
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function toggleBannerConfigStatusApi(id: number) {
  return request<BannerConfigItem>({
    url: `/operation/banner/${id}/toggle-status`,
    method: "PATCH"
  });
}

export function deleteBannerConfigApi(id: number) {
  return request<{ success: boolean }>({
    url: `/operation/banner/${id}`,
    method: "DELETE"
  });
}

export function getRecommendConfigListApi(query: RecommendConfigQuery) {
  return request<RecommendConfigListResult>({
    url: "/operation/recommend/list",
    method: "GET",
    params: query
  });
}

export function createRecommendConfigApi(payload: RecommendConfigPayload) {
  return request<RecommendConfigItem>({
    url: "/operation/recommend",
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateRecommendConfigApi(id: number, payload: RecommendConfigPayload) {
  return request<RecommendConfigItem>({
    url: `/operation/recommend/${id}`,
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function toggleRecommendConfigStatusApi(id: number) {
  return request<RecommendConfigItem>({
    url: `/operation/recommend/${id}/toggle-status`,
    method: "PATCH"
  });
}

export function deleteRecommendConfigApi(id: number) {
  return request<{ success: boolean }>({
    url: `/operation/recommend/${id}`,
    method: "DELETE"
  });
}

export function getSearchKeywordsApi(query: SearchWordQuery) {
  return request<SearchWordListResult>({
    url: "/operation/search-word/list",
    method: "GET",
    params: query
  });
}

export function createSearchKeywordApi(payload: SearchWordPayload) {
  return request<SearchWordItem>({
    url: "/operation/search-word",
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateSearchKeywordApi(id: number, payload: SearchWordPayload) {
  return request<SearchWordItem>({
    url: `/operation/search-word/${id}`,
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function toggleSearchKeywordStatusApi(id: number) {
  return request<SearchWordItem>({
    url: `/operation/search-word/${id}/toggle-status`,
    method: "PATCH"
  });
}

export function deleteSearchKeywordApi(id: number) {
  return request<{ success: boolean }>({
    url: `/operation/search-word/${id}`,
    method: "DELETE"
  });
}

export function getHelpCenterListApi(query: HelpCenterQuery) {
  return request<HelpCenterListResult>({
    url: "/operation/help/list",
    method: "GET",
    params: query
  });
}

export function createHelpCenterApi(payload: HelpCenterPayload) {
  return request<HelpCenterItem>({
    url: "/operation/help",
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateHelpCenterApi(id: number, payload: HelpCenterPayload) {
  return request<HelpCenterItem>({
    url: `/operation/help/${id}`,
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function toggleHelpCenterStatusApi(id: number) {
  return request<HelpCenterItem>({
    url: `/operation/help/${id}/toggle-status`,
    method: "PATCH"
  });
}

export function deleteHelpCenterApi(id: number) {
  return request<{ success: boolean }>({
    url: `/operation/help/${id}`,
    method: "DELETE"
  });
}
