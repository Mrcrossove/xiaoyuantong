import { parsePageParams } from "../utils/pagination";
import { formatDateTime } from "../utils/time";
import { getAdminSchoolScope } from "./admin-scope.service";
import { getAggregatedSchoolMetrics } from "./school-aggregate.service";

function paginateList<T>(list: T[], page: number, pageSize: number) {
  const start = (page - 1) * pageSize;
  return list.slice(start, start + pageSize);
}

export async function queryAdminSchoolList(adminUserId: number, rawQuery: Record<string, unknown>) {
  const { page, pageSize } = parsePageParams(rawQuery);
  const keyword = String(rawQuery.keyword || "").trim();
  const status = String(rawQuery.status || "").trim();
  const scope = await getAdminSchoolScope(adminUserId);

  const rows = await getAggregatedSchoolMetrics(scope);

  const filtered = rows.filter((item) => {
    const matchKeyword =
      !keyword || item.school.includes(keyword) || item.province.includes(keyword) || item.city.includes(keyword);
    const matchStatus = !status || item.status === status;
    return matchKeyword && matchStatus;
  });

  const totalUsers = filtered.reduce((sum, item) => sum + item.userCount, 0);
  const totalStores = filtered.reduce((sum, item) => sum + item.storeCount, 0);

  return {
    list: paginateList(filtered, page, pageSize).map((item) => ({
      id: item.sort,
      school: item.school,
      name: item.school,
      province: item.province,
      city: item.city,
      userCount: item.userCount,
      postCount: item.postCount,
      storeCount: item.storeCount,
      orderCount: item.orderCount,
      gmv: item.gmv,
      verifyPassRate: item.verifyPassRate,
      status: item.status,
      sort: item.sort,
      createdAt: item.createdAt ? formatDateTime(item.createdAt) : ""
    })),
    page,
    pageSize,
    total: filtered.length,
    summary: {
      total: filtered.length,
      enabledCount: filtered.filter((item) => item.status === "启用").length,
      totalUsers,
      totalStores
    }
  };
}
