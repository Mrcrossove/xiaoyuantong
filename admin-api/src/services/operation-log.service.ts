import { prisma } from "../lib/prisma";
import { parsePageParams } from "../utils/pagination";
import { formatDateTime } from "../utils/time";
import { getAdminSchoolScope } from "./admin-scope.service";

function paginateList<T>(list: T[], page: number, pageSize: number) {
  const start = (page - 1) * pageSize;
  return list.slice(start, start + pageSize);
}

function hasSchoolPermission(scope: Awaited<ReturnType<typeof getAdminSchoolScope>>, school: string) {
  if (scope.isAll) {
    return true;
  }
  return scope.schools.includes(school);
}

function hasAdminLogPermission(scope: Awaited<ReturnType<typeof getAdminSchoolScope>>, schools: string[], isAllScope: boolean) {
  if (scope.isAll) {
    return true;
  }

  if (isAllScope || !schools.length) {
    return false;
  }

  return schools.some((school) => scope.schools.includes(school));
}

export async function queryOperationLogs(adminUserId: number, rawQuery: Record<string, unknown>) {
  const { page, pageSize } = parsePageParams(rawQuery);
  const keyword = String(rawQuery.keyword || "").trim();
  const moduleName = String(rawQuery.module || "").trim();
  const scope = await getAdminSchoolScope(adminUserId);
  const schoolWhere = scope.isAll ? undefined : { in: scope.schools };

  const [adminUsers, verifications, storeApplies, withdraws, storeChangeLogs] = await Promise.all([
    prisma.adminUser.findMany({
      include: {
        role: {
          select: {
            scopeType: true
          }
        }
      }
    }),
    prisma.userVerification.findMany({
      where: {
        school: schoolWhere,
        reviewedAt: {
          not: null
        }
      },
      include: {
        reviewer: {
          select: {
            name: true
          }
        }
      }
    }),
    prisma.miniShopApply.findMany({
      where: {
        school: schoolWhere,
        reviewedAt: {
          not: null
        }
      },
      orderBy: {
        reviewedAt: "desc"
      }
    }),
    prisma.miniWithdrawRecord.findMany({
      where: {
        school: schoolWhere,
        reviewedAt: {
          not: null
        }
      },
      orderBy: {
        reviewedAt: "desc"
      }
    }),
    prisma.adminStoreChangeLog.findMany({
      where: {
        school: schoolWhere
      },
      include: {
        operator: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })
  ]);

  const logs = [
    ...storeChangeLogs.map((item: any) => ({
      id: `store-change-${item.id}`,
      school: item.school,
      module: "店铺商品",
      action: item.action,
      operator: item.operator?.name || "管理员",
      ip: "-",
      createdAt: formatDateTime(item.createdAt),
      content: item.summary
    })),
    ...adminUsers
      .filter((item: any) => !!item.lastLoginAt)
      .filter((item: any) =>
        hasAdminLogPermission(
          scope,
          Array.isArray(item.schools) ? item.schools.map((school: any) => String(school)) : [],
          item.role.scopeType === "all"
        )
      )
      .map((item: any) => ({
        id: `admin-login-${item.id}`,
        school:
          item.role.scopeType === "all"
            ? "全部高校"
            : Array.isArray(item.schools) && item.schools.length
              ? item.schools.map((school: any) => String(school)).join("、")
              : "-",
        module: "权限管理",
        action: "登录后台",
        operator: item.name,
        ip: "-",
        createdAt: formatDateTime(item.lastLoginAt),
        content: `管理员账号 ${item.account} 登录后台`
      })),
    ...verifications
      .filter((item: any) => hasSchoolPermission(scope, item.school))
      .map((item: any) => ({
        id: `verify-${item.id}`,
        school: item.school,
        module: "校园认证",
        action: item.status === "已通过" ? "审核通过" : "审核驳回",
        operator: item.reviewer?.name || "管理员",
        ip: "-",
        createdAt: item.reviewedAt ? formatDateTime(item.reviewedAt) : "-",
        content: `认证申请 ${item.realName} 审核结果：${item.status}`
      })),
    ...storeApplies
      .filter((item: any) => hasSchoolPermission(scope, item.school))
      .map((item: any) => ({
        id: `store-apply-${item.id}`,
        school: item.school,
        module: "店铺管理",
        action: item.status === "已通过" ? "入驻通过" : "入驻驳回",
        operator: "管理员",
        ip: "-",
        createdAt: item.reviewedAt ? formatDateTime(item.reviewedAt) : "-",
        content: `店铺《${item.storeName}》入驻审核结果：${item.status}`
      })),
    ...withdraws
      .filter((item: any) => hasSchoolPermission(scope, item.school))
      .map((item: any) => ({
        id: `withdraw-${item.id}`,
        school: item.school,
        module: "订单与钱包",
        action: item.status === "已通过" ? "提现通过" : "提现驳回",
        operator: "管理员",
        ip: "-",
        createdAt: item.reviewedAt ? formatDateTime(item.reviewedAt) : "-",
        content: `提现申请 ${item.withdrawNo} 审核结果：${item.status}`
      }))
  ]
    .filter((item: any) => item.createdAt !== "-")
    .sort((a: any, b: any) => String(b.createdAt).localeCompare(String(a.createdAt)));

  const filtered = logs.filter((item: any) => {
    const matchKeyword =
      !keyword ||
      item.school.includes(keyword) ||
      item.operator.includes(keyword) ||
      item.content.includes(keyword);
    const matchModule = !moduleName || item.module === moduleName;
    return matchKeyword && matchModule;
  });

  return {
    list: paginateList(filtered, page, pageSize),
    page,
    pageSize,
    total: filtered.length,
    summary: {
      total: filtered.length,
      moduleOptions: [...new Set(logs.map((item: any) => item.module))]
    }
  };
}
