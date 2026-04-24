import type {
  SchoolAdminApplicationAssignPayload,
  SchoolAdminApplicationAssignResult,
  SchoolAdminApplicationItem,
  SchoolAdminApplicationListResult,
  SchoolAdminApplicationQuery,
  SchoolAdminApplicationReviewPayload
} from "../contracts";
import { request } from "../request";

export function getSchoolAdminApplicationListApi(query: SchoolAdminApplicationQuery) {
  return request<SchoolAdminApplicationListResult>({
    url: "/school-admin/apply/admin/list",
    method: "GET",
    params: query
  });
}

export function reviewSchoolAdminApplicationApi(id: number, payload: SchoolAdminApplicationReviewPayload) {
  return request<SchoolAdminApplicationItem>({
    url: `/school-admin/apply/admin/${id}/review`,
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function assignSchoolAdminApplicationApi(id: number, payload: SchoolAdminApplicationAssignPayload) {
  return request<SchoolAdminApplicationAssignResult>({
    url: `/school-admin/apply/admin/${id}/assign`,
    method: "POST",
    body: JSON.stringify(payload)
  });
}
