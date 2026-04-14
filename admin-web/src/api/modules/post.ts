import type {
  AdminPostListResult,
  AdminPostQuery,
  PostReportItem,
  PostReportListResult,
  PostReportQuery,
  PostReportReviewPayload
} from "../contracts";
import { request } from "../request";

export function getAdminPostListApi(query: AdminPostQuery) {
  return request<AdminPostListResult>({
    url: "/post/admin/list",
    method: "GET",
    params: query
  });
}

export function getPostReportsApi(query: PostReportQuery) {
  return request<PostReportListResult>({
    url: "/post/admin/report/list",
    method: "GET",
    params: query
  });
}

export function reviewPostReportApi(id: number, payload: PostReportReviewPayload) {
  return request<PostReportItem>({
    url: `/post/admin/report/${id}/review`,
    method: "POST",
    body: JSON.stringify(payload)
  });
}
