import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { parsePageParams } from "../utils/pagination";
import { formatDateTime } from "../utils/time";
import { ApiError } from "../utils/api-error";
import { ERROR_CODES } from "../constants/error-codes";
import { getAdminSchoolScope } from "./admin-scope.service";
import { createMiniMessage } from "./mini-message.service";
import type { RefundReviewPayload } from "../controllers/schemas";

function buildSchoolWhere(scope: Awaited<ReturnType<typeof getAdminSchoolScope>>, school: string) {
  if (scope.isAll) {
    return school || undefined;
  }

  if (school) {
    return scope.schools.includes(school) ? school : "__no_school__";
  }

  return {
    in: scope.schools
  };
}

export async function queryRefundList(adminUserId: number, rawQuery: Record<string, unknown>) {
  const { page, pageSize, skip } = parsePageParams(rawQuery);
  const keyword = String(rawQuery.keyword || "").trim();
  const school = String(rawQuery.school || "").trim();
  const status = String(rawQuery.status || "").trim();
  const scope = await getAdminSchoolScope(adminUserId);
  const schoolWhere = buildSchoolWhere(scope, school);
  const summarySchoolWhere = buildSchoolWhere(scope, "");

  const where = {
    school: schoolWhere,
    status: status || undefined,
    OR: keyword
      ? [
          { refundNo: { contains: keyword, mode: "insensitive" as const } },
          { reason: { contains: keyword, mode: "insensitive" as const } },
          { order: { is: { orderNo: { contains: keyword, mode: "insensitive" as const } } } },
          { user: { is: { nickname: { contains: keyword, mode: "insensitive" as const } } } }
        ]
      : undefined
  };

  const summaryWhere = {
    school: summarySchoolWhere,
    OR: keyword
      ? [
          { refundNo: { contains: keyword, mode: "insensitive" as const } },
          { reason: { contains: keyword, mode: "insensitive" as const } },
          { order: { is: { orderNo: { contains: keyword, mode: "insensitive" as const } } } },
          { user: { is: { nickname: { contains: keyword, mode: "insensitive" as const } } } }
        ]
      : undefined
  };

  const [total, list, pendingCount, approvedCount, rejectedCount, schoolRows] = await prisma.$transaction([
    prisma.miniRefundRecord.count({ where }),
    prisma.miniRefundRecord.findMany({
      where,
      include: {
        order: {
          select: {
            orderNo: true
          }
        },
        user: {
          select: {
            nickname: true
          }
        },
        reviewer: {
          select: {
            name: true
          }
        }
      },
      orderBy: { id: "desc" },
      skip,
      take: pageSize
    }),
    prisma.miniRefundRecord.count({
      where: {
        ...summaryWhere,
        status: "待审核"
      }
    }),
    prisma.miniRefundRecord.count({
      where: {
        ...summaryWhere,
        status: "已通过"
      }
    }),
    prisma.miniRefundRecord.count({
      where: {
        ...summaryWhere,
        status: "已驳回"
      }
    }),
    prisma.miniRefundRecord.findMany({
      where: {
        school: summarySchoolWhere
      },
      select: {
        school: true
      },
      distinct: ["school"],
      orderBy: {
        school: "asc"
      }
    })
  ]);

  return {
    list: list.map((item: any) => ({
      id: item.id,
      refundNo: item.refundNo,
      orderNo: item.order?.orderNo || "",
      school: item.school,
      buyer: item.user?.nickname || "",
      amount: Number(item.amount || 0),
      reason: item.reason,
      status: item.status,
      reviewNote: item.reviewNote || "",
      reviewerName: item.reviewer?.name || "",
      applyTime: formatDateTime(item.applyTime),
      reviewedAt: item.reviewedAt ? formatDateTime(item.reviewedAt) : ""
    })),
    page,
    pageSize,
    total,
    summary: {
      total: pendingCount + approvedCount + rejectedCount,
      pendingCount,
      approvedCount,
      rejectedCount,
      schoolOptions: schoolRows.map((item: any) => item.school)
    }
  };
}

export async function reviewRefund(id: number, reviewerId: number, payload: RefundReviewPayload) {
  const row = await prisma.miniRefundRecord.findUnique({
    where: { id },
    include: {
      order: true,
      user: {
        select: {
          nickname: true
        }
      },
      reviewer: {
        select: {
          name: true
        }
      }
    }
  });

  if (!row) {
    throw new ApiError("退款记录不存在", ERROR_CODES.NOT_FOUND, 404);
  }

  if (row.status !== "待审核") {
    throw new ApiError("当前退款记录不可重复审核", ERROR_CODES.BAD_REQUEST, 400);
  }

  const reviewedAt = new Date();
  const updated = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const nextRefund = await tx.miniRefundRecord.update({
      where: { id },
      data: {
        status: payload.status,
        reviewNote: payload.reviewNote || "",
        reviewerId,
        reviewedAt
      },
      include: {
        order: {
          select: {
            orderNo: true
          }
        },
        user: {
          select: {
            nickname: true
          }
        },
        reviewer: {
          select: {
            name: true
          }
        }
      }
    });

    if (payload.status === "已通过") {
      await tx.miniOrder.update({
        where: { id: row.orderId },
        data: {
          payStatus: "已退款",
          status: row.order.status === "已完成" ? "已完成" : "已取消",
          canceledAt: row.order.status === "已完成" ? row.order.canceledAt : reviewedAt
        }
      });
    }

    return nextRefund;
  });

  await createMiniMessage({
    school: row.school,
    type: "system",
    category: "退款通知",
    content:
      payload.status === "已通过"
        ? `退款申请 ${row.refundNo} 已审核通过，退款金额将按原路返回。`
        : `退款申请 ${row.refundNo} 未通过审核，原因：${payload.reviewNote || "请联系平台客服了解详情"}`,
    receiverUserId: row.userId,
    targetType: "refund",
    targetId: String(row.id)
  });

  return {
    id: updated.id,
    refundNo: updated.refundNo,
    orderNo: updated.order?.orderNo || "",
    school: updated.school,
    buyer: updated.user?.nickname || "",
    amount: Number(updated.amount || 0),
    reason: updated.reason,
    status: updated.status,
    reviewNote: updated.reviewNote || "",
    reviewerName: updated.reviewer?.name || "",
    applyTime: formatDateTime(updated.applyTime),
    reviewedAt: updated.reviewedAt ? formatDateTime(updated.reviewedAt) : ""
  };
}
