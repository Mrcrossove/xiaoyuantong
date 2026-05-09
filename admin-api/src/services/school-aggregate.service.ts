import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { MINI_PAY_STATUS } from "./mini-order.service";

const SCHOOL_META: Record<string, { province: string; city: string }> = {
  "清华大学": { province: "北京市", city: "北京" },
  "北京大学": { province: "北京市", city: "北京" },
  "复旦大学": { province: "上海市", city: "上海" },
  "上海交通大学": { province: "上海市", city: "上海" },
  "六盘水师范学院": { province: "贵州省", city: "六盘水" },
  "贵州大学": { province: "贵州省", city: "贵阳" },
  "贵州电子商务职业技术学院": { province: "贵州省", city: "贵阳" }
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
  if (scope.isAll) return undefined;
  if (!scope.schools.length) return "__no_school__";
  return { in: scope.schools };
}

function createNullableSchoolWhere(scope: SchoolScope): Prisma.StringNullableFilter | undefined {
  if (scope.isAll) return { not: null };
  if (!scope.schools.length) return { equals: "__no_school__" };
  return { in: scope.schools };
}

function pushSchool(target: Set<string>, school: string | null | undefined) {
  const value = String(school || "").trim();
  if (value) target.add(value);
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

function makeRate(approved: number, total: number) {
  if (!total) return "0.00%";
  return `${((approved / total) * 100).toFixed(2)}%`;
}

export async function getAggregatedSchoolMetrics(scope: SchoolScope) {
  const nullableSchoolWhere = createNullableSchoolWhere(scope);
  const schoolWhere = createSchoolStringWhere(scope);

  const [
    schoolContentRows,
    userRows,
    postRows,
    storeRows,
    orderRows,
    paidOrderRows,
    verifyRows,
    verifyApprovedRows,
    shopApplyRows
  ] = await Promise.all([
    prisma.schoolContent.findMany({
      where: { school: schoolWhere }
    }),
    prisma.miniUser.groupBy({
      by: ["school"],
      where: { school: nullableSchoolWhere },
      _count: { _all: true }
    }),
    prisma.miniPost.groupBy({
      by: ["school"],
      where: { school: schoolWhere },
      _count: { _all: true }
    }),
    prisma.miniStore.groupBy({
      by: ["school"],
      where: { school: schoolWhere },
      _count: { _all: true }
    }),
    prisma.miniOrder.groupBy({
      by: ["school"],
      where: { school: schoolWhere },
      _count: { _all: true }
    }),
    prisma.miniOrder.groupBy({
      by: ["school"],
      where: {
        school: schoolWhere,
        payStatus: MINI_PAY_STATUS.paid
      },
      _sum: { amount: true }
    }),
    prisma.userVerification.groupBy({
      by: ["school"],
      where: { school: schoolWhere },
      _count: { _all: true }
    }),
    prisma.userVerification.groupBy({
      by: ["school"],
      where: {
        school: schoolWhere,
        status: "已通过"
      },
      _count: { _all: true }
    }),
    prisma.miniShopApply.groupBy({
      by: ["school"],
      where: { school: schoolWhere },
      _count: { _all: true }
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

  schoolContentRows.forEach((item) => {
    pushSchool(schoolSet, item.school);
    schoolContentMap.set(item.school, item);
  });

  userRows.forEach((item) => {
    pushSchool(schoolSet, item.school);
    pushCount(userCountMap, item.school, item._count._all);
  });

  postRows.forEach((item) => {
    pushSchool(schoolSet, item.school);
    pushCount(postCountMap, item.school, item._count._all);
  });

  storeRows.forEach((item) => {
    pushSchool(schoolSet, item.school);
    pushCount(storeCountMap, item.school, item._count._all);
  });

  orderRows.forEach((item) => {
    pushSchool(schoolSet, item.school);
    pushCount(orderCountMap, item.school, item._count._all);
  });

  paidOrderRows.forEach((item) => {
    pushSchool(schoolSet, item.school);
    pushSum(gmvMap, item.school, Number(item._sum.amount || 0));
  });

  verifyRows.forEach((item) => {
    pushSchool(schoolSet, item.school);
    pushCount(verifyTotalMap, item.school, item._count._all);
  });

  verifyApprovedRows.forEach((item) => {
    pushSchool(schoolSet, item.school);
    pushCount(verifyApprovedMap, item.school, item._count._all);
  });

  shopApplyRows.forEach((item) => {
    pushSchool(schoolSet, item.school);
  });

  return Array.from(schoolSet)
    .map((school, index) => {
      const meta = SCHOOL_META[school] || { province: "未知", city: "未知" };
      const contentRow = schoolContentMap.get(school);
      const verifyTotal = verifyTotalMap.get(school) || 0;
      const verifyApproved = verifyApprovedMap.get(school) || 0;

      return {
        school,
        province: meta.province,
        city: meta.city,
        userCount: userCountMap.get(school) || 0,
        postCount: postCountMap.get(school) || 0,
        storeCount: storeCountMap.get(school) || 0,
        orderCount: orderCountMap.get(school) || 0,
        gmv: Number((gmvMap.get(school) || 0).toFixed(2)),
        verifyPassRate: makeRate(verifyApproved, verifyTotal),
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
