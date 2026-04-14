import { prisma } from "../lib/prisma";
import { parsePageParams } from "../utils/pagination";
import { formatDateTime } from "../utils/time";
import { getAdminSchoolScope } from "./admin-scope.service";

function paginateList<T>(list: T[], page: number, pageSize: number) {
  const start = (page - 1) * pageSize;
  return list.slice(start, start + pageSize);
}

function getVerifyText(value: string | null | undefined) {
  return value === "已认证" ? "已认证" : "未认证";
}

export async function queryAdminUserList(adminUserId: number, rawQuery: Record<string, unknown>) {
  const { page, pageSize } = parsePageParams(rawQuery);
  const keyword = String(rawQuery.keyword || "").trim();
  const school = String(rawQuery.school || "").trim();
  const verified = String(rawQuery.verified || "").trim();
  const scope = await getAdminSchoolScope(adminUserId);

  const rows = await prisma.miniUser.findMany({
    where: {
      school: scope.isAll ? undefined : { in: scope.schools }
    },
    include: {
      _count: {
        select: {
          posts: true,
          orders: true,
          shopApplies: true,
          ownedStores: true
        }
      }
    },
    orderBy: { id: "desc" }
  });

  const mapped = rows.map((item: any) => {
    const verifiedText = getVerifyText(item.verifyStatus);
    return {
      id: item.id,
      nickname: item.nickname || "未命名用户",
      phone: item.phone || "",
      school: item.school || "",
      verified: verifiedText,
      status: "正常",
      postCount: item._count.posts,
      orderCount: item._count.orders,
      publishCount: item._count.posts + item._count.shopApplies + item._count.ownedStores,
      registerTime: formatDateTime(item.createdAt),
      verifiedAt: item.verifiedAt ? formatDateTime(item.verifiedAt) : ""
    };
  });

  const filtered = mapped.filter((item: any) => {
    const matchKeyword = !keyword || item.nickname.includes(keyword) || item.phone.includes(keyword);
    const matchSchool = !school || item.school === school;
    const matchVerified = !verified || item.verified === verified;
    return matchKeyword && matchSchool && matchVerified;
  });

  return {
    list: paginateList(filtered, page, pageSize),
    page,
    pageSize,
    total: filtered.length,
    summary: {
      total: filtered.length,
      verifiedCount: filtered.filter((item: any) => item.verified === "已认证").length,
      normalCount: filtered.filter((item: any) => item.status === "正常").length,
      schoolOptions: [...new Set(mapped.map((item: any) => item.school).filter(Boolean))]
    }
  };
}
