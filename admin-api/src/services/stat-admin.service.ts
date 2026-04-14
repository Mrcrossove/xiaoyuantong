import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { buildScopedSchoolWhere, getAdminSchoolScope } from "./admin-scope.service";

function toArray(value: Prisma.JsonValue | null | undefined) {
  return Array.isArray(value) ? value : [];
}

function sum(numbers: number[]) {
  return numbers.reduce((total, item) => total + item, 0);
}

function percent(numerator: number, denominator: number) {
  if (!denominator) return "0%";
  return `${Math.round((numerator / denominator) * 100)}%`;
}

export async function queryUserStat(adminUserId: number) {
  const scope = await getAdminSchoolScope(adminUserId);
  const users = await prisma.miniUser.findMany({
    where: {
      school: buildScopedSchoolWhere(scope)
    },
    select: {
      school: true,
      verifyStatus: true,
      createdAt: true
    },
    orderBy: { createdAt: "desc" }
  });

  const total = users.length;
  const verifiedCount = users.filter((item: any) => item.verifyStatus === "已认证").length;
  const todayAdded = users.filter((item: any) => {
    const createdAt = new Date(item.createdAt);
    const now = new Date();
    return createdAt.getFullYear() === now.getFullYear() && createdAt.getMonth() === now.getMonth() && createdAt.getDate() === now.getDate();
  }).length;

  const schoolMap = new Map<string, number>();
  users.forEach((item: any) => {
    const school = String(item.school || "未分配高校");
    schoolMap.set(school, (schoolMap.get(school) || 0) + 1);
  });

  return {
    cards: [
      { label: "用户总数", value: total, trend: "按真实用户数据统计" },
      { label: "已认证用户", value: verifiedCount, trend: `认证率 ${percent(verifiedCount, total)}` },
      { label: "今日新增", value: todayAdded, trend: "按今日注册时间统计" }
    ],
    schoolRank: Array.from(schoolMap.entries())
      .map(([school, value]) => ({ school, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)
  };
}

export async function queryPostStat(adminUserId: number) {
  const scope = await getAdminSchoolScope(adminUserId);
  const posts = await prisma.miniPost.findMany({
    where: {
      school: buildScopedSchoolWhere(scope)
    },
    select: {
      category: true,
      status: true,
      likeCount: true
    },
    orderBy: { id: "desc" }
  });

  const categoryMap = new Map<string, number>();
  posts.forEach((item: any) => {
    const name = String(item.category || "未分类");
    categoryMap.set(name, (categoryMap.get(name) || 0) + 1);
  });

  const total = posts.length;
  const publishedCount = posts.filter((item: any) => item.status === "已发布").length;
  const totalLikes = sum(posts.map((item: any) => Number(item.likeCount || 0)));

  return {
    cards: [
      { label: "帖子总数", value: total, trend: "按真实帖子数据统计" },
      { label: "已发布帖子", value: publishedCount, trend: `发布率 ${percent(publishedCount, total)}` },
      { label: "累计点赞", value: totalLikes, trend: "点赞数来自帖子互动数据" }
    ],
    categoryRank: Array.from(categoryMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)
  };
}

export async function queryStoreStat(adminUserId: number) {
  const scope = await getAdminSchoolScope(adminUserId);
  const stores = await prisma.miniStore.findMany({
    where: {
      school: buildScopedSchoolWhere(scope)
    },
    select: {
      school: true,
      status: true,
      products: true
    },
    orderBy: { id: "desc" }
  });

  const schoolMap = new Map<string, number>();
  let onSaleStoreCount = 0;
  let productCount = 0;

  stores.forEach((item: any) => {
    const school = String(item.school || "未分配高校");
    schoolMap.set(school, (schoolMap.get(school) || 0) + 1);
    if (String(item.status || "") === "营业中") {
      onSaleStoreCount += 1;
    }
    productCount += toArray(item.products).length;
  });

  return {
    cards: [
      { label: "店铺总数", value: stores.length, trend: "按真实店铺数据统计" },
      { label: "营业中店铺", value: onSaleStoreCount, trend: `营业率 ${percent(onSaleStoreCount, stores.length)}` },
      { label: "在售商品数", value: productCount, trend: "商品数来自店铺商品明细" }
    ],
    schoolRank: Array.from(schoolMap.entries())
      .map(([school, value]) => ({ school, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)
  };
}

export async function queryOrderStat(adminUserId: number) {
  const scope = await getAdminSchoolScope(adminUserId);
  const orders = await prisma.miniOrder.findMany({
    where: {
      school: buildScopedSchoolWhere(scope)
    },
    select: {
      school: true,
      amount: true,
      payStatus: true
    },
    orderBy: { id: "desc" }
  });

  const schoolMap = new Map<string, number>();
  const paidOrders = orders.filter((item: any) => item.payStatus === "已支付");
  const gmv = sum(paidOrders.map((item: any) => Number(item.amount || 0)));

  orders.forEach((item: any) => {
    const school = String(item.school || "未分配高校");
    schoolMap.set(school, (schoolMap.get(school) || 0) + 1);
  });

  return {
    cards: [
      { label: "订单总数", value: orders.length, trend: "按真实订单数据统计" },
      { label: "已支付订单", value: paidOrders.length, trend: `支付率 ${percent(paidOrders.length, orders.length)}` },
      { label: "累计交易额", value: `¥${gmv.toFixed(2)}`, trend: "交易额按已支付订单汇总" }
    ],
    schoolRank: Array.from(schoolMap.entries())
      .map(([school, value]) => ({ school, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)
  };
}
