import { prisma } from "../lib/prisma";
import { getAdminSchoolScope } from "./admin-scope.service";
import { getAggregatedSchoolMetrics } from "./school-aggregate.service";

function formatMoney(value: number) {
  return Number(value || 0).toFixed(2);
}

export async function getDashboardOverview(adminUserId: number) {
  const scope = await getAdminSchoolScope(adminUserId);
  const schoolWhere = scope.isAll ? undefined : { in: scope.schools };

  const [schools, users, posts, stores, orders, pendingVerify, pendingApply, pendingWithdraw, pendingPost] = await Promise.all([
    getAggregatedSchoolMetrics(scope),
    prisma.miniUser.count({
      where: {
        school: schoolWhere
      }
    }),
    prisma.miniPost.count({
      where: {
        school: schoolWhere
      }
    }),
    prisma.miniStore.count({
      where: {
        school: schoolWhere
      }
    }),
    prisma.miniOrder.count({
      where: {
        school: schoolWhere
      }
    }),
    prisma.userVerification.count({
      where: {
        school: schoolWhere,
        status: "待审核"
      }
    }),
    prisma.miniShopApply.count({
      where: {
        school: schoolWhere,
        status: "待审核"
      }
    }),
    prisma.miniWithdrawRecord.count({
      where: {
        school: schoolWhere,
        status: "待审核"
      }
    }),
    prisma.miniPost.count({
      where: {
        school: schoolWhere,
        status: "待审核"
      }
    })
  ]);

  const totalGmv = schools.reduce((sum, item) => sum + Number(item.gmv || 0), 0);
  const totalSchool = schools.length;
  const enabledSchool = schools.filter((item) => item.status === "启用").length;

  return {
    cards: [
      { key: "schoolCount", label: "已接入高校", value: totalSchool, remark: `已启用 ${enabledSchool} 所` },
      { key: "userCount", label: "用户总数", value: users, remark: "按当前数据范围统计" },
      { key: "postCount", label: "帖子总数", value: posts, remark: `店铺 ${stores} 家，订单 ${orders} 笔` },
      { key: "gmv", label: "累计交易额", value: `￥${formatMoney(totalGmv)}`, remark: "来自真实业务订单汇总" }
    ],
    todos: [
      { key: "post", label: "待审核帖子", count: pendingPost, path: "/post/list" },
      { key: "verify", label: "待审核认证", count: pendingVerify, path: "/verify/list" },
      { key: "storeApply", label: "待审核入驻", count: pendingApply, path: "/store/apply" },
      { key: "withdraw", label: "待审核提现", count: pendingWithdraw, path: "/trade/withdraw" }
    ],
    rankings: schools.slice(0, 6).map((item) => ({
      school: item.school,
      userCount: item.userCount,
      postCount: item.postCount,
      storeCount: item.storeCount,
      orderCount: item.orderCount,
      gmv: item.gmv,
      verifyPassRate: item.verifyPassRate,
      status: item.status
    }))
  };
}
