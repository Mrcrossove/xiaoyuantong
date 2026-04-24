import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { parsePageParams } from "../utils/pagination";
import { formatDateTime } from "../utils/time";
import { ApiError } from "../utils/api-error";
import { ERROR_CODES } from "../constants/error-codes";
import { getAdminSchoolScope } from "./admin-scope.service";
import { createMiniMessage } from "./mini-message.service";
import { reviewMiniRefundRequest } from "./mini-refund.service";
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
    throw new ApiError("\u9000\u6b3e\u8bb0\u5f55\u4e0d\u5b58\u5728", ERROR_CODES.NOT_FOUND, 404);
  }

  if (row.status !== "\u5f85\u5ba1\u6838") {
    throw new ApiError("\u5f53\u524d\u9000\u6b3e\u8bb0\u5f55\u4e0d\u53ef\u91cd\u590d\u5ba1\u6838", ERROR_CODES.BAD_REQUEST, 400);
  }

  const updated = await reviewMiniRefundRequest(id, reviewerId, payload);

  await createMiniMessage({
    school: row.school,
    type: "system",
    category: "\u9000\u6b3e\u901a\u77e5",
    content:
      payload.status === "\u5df2\u901a\u8fc7"
        ? `\u9000\u6b3e\u7533\u8bf7 ${row.refundNo} \u5df2\u5ba1\u6838\u901a\u8fc7\uff0c\u9000\u6b3e\u7ed3\u679c\u5c06\u6309\u5fae\u4fe1\u5b9e\u9645\u5904\u7406\u7ed3\u679c\u56de\u5199\u3002`
        : `\u9000\u6b3e\u7533\u8bf7 ${row.refundNo} \u672a\u901a\u8fc7\u5ba1\u6838\uff0c\u539f\u56e0\uff1a${payload.reviewNote || "\u8bf7\u8054\u7cfb\u5e73\u53f0\u5ba2\u670d\u4e86\u89e3\u8be6\u60c5"}`,
    receiverUserId: row.userId,
    targetType: "refund",
    targetId: String(row.id)
  });

  return {
    id: updated.id,
    refundNo: updated.refundNo,
    orderNo: updated.order?.orderNo || "",
    school: updated.school,
    buyer: row.user?.nickname || "",
    amount: Number(updated.amount || 0),
    reason: updated.reason,
    status: updated.status,
    reviewNote: updated.reviewNote || "",
    reviewerName: row.reviewer?.name || "",
    applyTime: formatDateTime(updated.applyTime),
    reviewedAt: updated.reviewedAt ? formatDateTime(updated.reviewedAt) : ""
  };
}
