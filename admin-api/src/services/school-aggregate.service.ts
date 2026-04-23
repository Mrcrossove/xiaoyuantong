import { prisma } from "../lib/prisma";
import type { Prisma } from "@prisma/client";

const SCHOOL_META: Record<string, { province: string; city: string }> = {
  清华大学: { province: "北京市", city: "北京" },
  北京大学: { province: "北京市", city: "北京" },
  复旦大学: { province: "上海市", city: "上海" },
  上海交通大学: { province: "上海市", city: "上海" },
  六盘水师范学院: { province: "贵州省", city: "六盘水" },
  贵州大学: { province: "贵州省", city: "贵阳" }
};

type SchoolScope = {
  isAll: boolean;
  schools: string[];
};

export interface AggregatedSchoolMetric {
  school: string;
  province: string;
  city: string;
  userCount: number;
  postCount: number;
  storeCount: number;
  orderCount: number;
  gmv: number;
  verifyPassRate: string;
  status: string;
  sort: number;
  createdAt: Date | null;
}

function createSchoolStringWhere(scope: SchoolScope): Prisma.StringFilter | string | undefined {
  if (scope.isAll) {
    return undefined;
  }

  if (!scope.schools.length) {
    return "__no_school__";
  }

  return {
    in: scope.schools
  };
}

function createNullableSchoolWhere(scope: SchoolScope): Prisma.StringNullableFilter | undefined {
  if (scope.isAll) {
    return {
      not: null
    };
  }

  if (!scope.schools.length) {
    return {
      equals: "__no_school__"
    };
  }

  return {
    in: scope.schools
  };
}

function pushCount(target: Map<string, number>, school: string | null | undefined, count: number) {
  const key = String(school || "").trim();
  if (!key) return;
  target.set(key, (target.get(key) || 0) + Number(count || 0));
}

function pushSum(target: Map<string, number>, school: string | null | undefined, amount: number) {
  const key = String(school || "").trim();
  if (!key) return;
  target.set(key, Number(((target.get(key) || 0) + Number(amount || 0)).toFixed(2)));
}

export async function getAggregatedSchoolMetrics(scope: SchoolScope) {
  const nullableSchoolWhere = createNullableSchoolWhere(scope);
  const schoolWhere = createSchoolStringWhere(scope);

  const [schoolContentRows, userRows, postRows, storeRows, orderRows, verifyRows, verifyApprovedRows] = await Promise.all([
    prisma.schoolContent.findMany({
      where: {
        school: schoolWhere
      }
    }),
    prisma.miniUser.groupBy({
      by: ["school"],
      where: {
        school: nullableSchoolWhere
      },
      _count: {
        _all: true
      }
    }),
    prisma.miniPost.groupBy({
      by: ["school"],
      where: {
        school: schoolWhere
      },
      _count: {
        _all: true
      }
    }),
    prisma.miniStore.groupBy({
      by: ["school"],
      where: {
        school: schoolWhere
      },
      _count: {
        _all: true
      }
    }),
    prisma.miniOrder.groupBy({
      by: ["school"],
      where: {
        school: schoolWhere
      },
      _count: {
        _all: true
      },
      _sum: {
        amount: true
      }
    }),
    prisma.userVerification.groupBy({
      by: ["school"],
      where: {
        school: schoolWhere
      },
      _count: {
        _all: true
      }
    }),
    prisma.userVerification.groupBy({
      by: ["school"],
      where: {
        school: schoolWhere,
        status: "已通过"
      },
      _count: {
        _all: true
      }
    })
  ]);

  const schoolSet = new Set<string>();
  const userCountMap = new Map<string, number>();
  const postCountMap = new Map<string, number>();
  const storeCountMap = new Map<string, number>();
  const orderCountMap = new Map<string, number>();
  const gmvMap = new Map<string, number>();
  const verifyTotalMap = new Map<string, number>();
  const verifyApprovedMap = new Map<string, number>();
  const schoolContentMap = new Map<string, (typeof schoolContentRows)[number]>();

  schoolContentRows.forEach((item: (typeof schoolContentRows)[number]) => {
    schoolSet.add(item.school);
    schoolContentMap.set(item.school, item);
  });

  userRows.forEach((item: { school: string | null; _count: { _all: number } }) => {
    pushCount(userCountMap, item.school, item._count._all);
    if (item.school) schoolSet.add(item.school);
  });

  postRows.forEach((item: { school: string; _count: { _all: number } }) => {
    pushCount(postCountMap, item.school, item._count._all);
    schoolSet.add(item.school);
  });

  storeRows.forEach((item: { school: string; _count: { _all: number } }) => {
    pushCount(storeCountMap, item.school, item._count._all);
    schoolSet.add(item.school);
  });

  orderRows.forEach((item: { school: string; _count: { _all: number }; _sum: { amount: number | null } }) => {
    pushCount(orderCountMap, item.school, item._count._all);
    pushSum(gmvMap, item.school, Number(item._sum.amount || 0));
    schoolSet.add(item.school);
  });

  verifyRows.forEach((item: { school: string; _count: { _all: number } }) => {
    pushCount(verifyTotalMap, item.school, item._count._all);
    schoolSet.add(item.school);
  });

  verifyApprovedRows.forEach((item: { school: string; _count: { _all: number } }) => {
    pushCount(verifyApprovedMap, item.school, item._count._all);
    schoolSet.add(item.school);
  });

  return Array.from(schoolSet)
    .map((school, index) => {
      const meta = SCHOOL_META[school] || { province: "未知", city: "未知" };
      const contentRow = schoolContentMap.get(school);
      const verifyTotal = verifyTotalMap.get(school) || 0;
      const verifyApproved = verifyApprovedMap.get(school) || 0;
      const verifyPassRate =
        verifyTotal > 0 ? `${((verifyApproved / verifyTotal) * 100).toFixed(2)}%` : contentRow?.verifyPassRate || "0.00%";

      return {
        school,
        province: meta.province,
        city: meta.city,
        userCount: userCountMap.get(school) || contentRow?.userCount || 0,
        postCount: postCountMap.get(school) || contentRow?.postCount || 0,
        storeCount: storeCountMap.get(school) || contentRow?.storeCount || 0,
        orderCount: orderCountMap.get(school) || contentRow?.orderCount || 0,
        gmv: Number((gmvMap.get(school) || contentRow?.gmv || 0).toFixed(2)),
        verifyPassRate,
        status: contentRow?.status || "启用",
        sort: index + 1,
        createdAt: contentRow?.createdAt || null
      } satisfies AggregatedSchoolMetric;
    })
    .sort((a, b) => {
      if (b.gmv !== a.gmv) return b.gmv - a.gmv;
      if (b.userCount !== a.userCount) return b.userCount - a.userCount;
      return a.school.localeCompare(b.school, "zh-CN");
    })
    .map((item, index) => ({
      ...item,
      sort: index + 1
    }));
}
