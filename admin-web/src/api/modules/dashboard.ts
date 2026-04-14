import type { DashboardOverviewResult } from "../contracts";
import { request } from "../request";

export function getDashboardOverviewApi() {
  return request<DashboardOverviewResult>({
    url: "/dashboard/overview",
    method: "GET"
  });
}
