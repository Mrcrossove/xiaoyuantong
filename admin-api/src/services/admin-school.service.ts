import { prisma } from "../lib/prisma";
import { parsePageParams } from "../utils/pagination";
import { formatDateTime } from "../utils/time";
import { getAdminSchoolScope } from "./admin-scope.service";

const SCHOOL_META: Record<string, { province: string; city: string }> = {
  清华大学: { province: "北京市", city: "北京" },
  北京大学: { province: "北京市", city: "北京" },
  复旦大学: { province: "上海市", city: "上海" },
  六盘水师范学院: { province: "贵州省", city: "六盘水" },
  贵州大学: { province: "贵州省", city: "贵阳" }
};

function paginateList<T>(list: T[], page: number, pageSize: number) {
  const start = (page - 1) * pageSize;
  return list.slice(start, start + pageSize);
}

export async function queryAdminSchoolList(adminUserId: number, rawQuery: Record<string, unknown>) {
  const { page, pageSize } = parsePageParams(rawQuery);
  const keyword = String(rawQuery.keyword || "").trim();
  const status = String(rawQuery.status || "").trim();
  const scope = await getAdminSchoolScope(adminUserId);

  const rows = await prisma.schoolContent.findMany({
    where: {
      school: scope.isAll ? undefined : { in: scope.schools }
    },
    orderBy: [{ userCount: "desc" }, { id: "asc" }]
  });

  const mapped = rows.map((item: any, index: number) => {
    const meta = SCHOOL_META[item.school] || { province: "未知", city: "未知" };
    return {
      id: item.id,
      school: item.school,
      name: item.school,
      province: meta.province,
      city: meta.city,
      userCount: item.userCount,
      postCount: item.postCount,
      storeCount: item.storeCount,
      orderCount: item.orderCount,
      gmv: Number(item.gmv || 0),
      verifyPassRate: item.verifyPassRate,
      status: item.status,
      sort: index + 1,
      createdAt: formatDateTime(item.createdAt)
    };
  });

  const filtered = mapped.filter((item: any) => {
    const matchKeyword =
      !keyword || item.name.includes(keyword) || item.province.includes(keyword) || item.city.includes(keyword);
    const matchStatus = !status || item.status === status;
    return matchKeyword && matchStatus;
  });

  const totalUsers = filtered.reduce((sum: number, item: any) => sum + item.userCount, 0);
  const totalStores = filtered.reduce((sum: number, item: any) => sum + item.storeCount, 0);

  return {
    list: paginateList(filtered, page, pageSize),
    page,
    pageSize,
    total: filtered.length,
    summary: {
      total: filtered.length,
      enabledCount: filtered.filter((item: any) => item.status === "启用").length,
      totalUsers,
      totalStores
    }
  };
}
