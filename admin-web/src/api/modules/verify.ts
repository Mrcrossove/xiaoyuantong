import type { PageResult, VerifyItem, VerifyQuery, VerifyReviewPayload } from "../contracts";
import { request } from "../request";

export function getVerifyListApi(query: VerifyQuery) {
  return request<PageResult<VerifyItem>>({
    url: "/verify/admin/list",
    method: "GET",
    params: query
  });
}

export function reviewVerifyApi(id: number, payload: VerifyReviewPayload) {
  return request<VerifyItem>({
    url: `/verify/admin/${id}/review`,
    method: "POST",
    body: JSON.stringify(payload)
  });
}
