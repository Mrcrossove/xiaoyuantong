import { prisma } from "../lib/prisma";
import { formatDateTime } from "../utils/time";
import { parsePageParams } from "../utils/pagination";
import { ApiError } from "../utils/api-error";
import { ERROR_CODES } from "../constants/error-codes";
import { getAdminSchoolScope } from "./admin-scope.service";
import type { PostReportReviewPayload } from "../controllers/schemas";

function paginateList<T>(list: T[], page: number, pageSize: number) {
  const start = (page - 1) * pageSize;
  return list.slice(start, start + pageSize);
}

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

export async function queryAdminPostList(adminUserId: number, rawQuery: Record<string, unknown>) {
  const { page, pageSize } = parsePageParams(rawQuery);
  const keyword = String(rawQuery.keyword || "").trim();
  const school = String(rawQuery.school || "").trim();
  const status = String(rawQuery.status || "").trim();
  const scope = await getAdminSchoolScope(adminUserId);

  const rows = await prisma.miniPost.findMany({
    where: {
      school: buildSchoolWhere(scope, school)
    },
    orderBy: { id: "desc" }
  });

  const mapped = rows.map((item: any) => ({
    id: item.id,
    title: item.title,
    author: item.authorName,
    school: item.school,
    category: item.category,
    status: item.status,
    favoriteCount: Number(item.likeCount || 0),
    createdAt: formatDateTime(item.createdAt)
  }));

  const filtered = mapped.filter((item: any) => {
    const matchKeyword = !keyword || item.title.includes(keyword) || item.author.includes(keyword);
    const matchStatus = !status || item.status === status;
    return matchKeyword && matchStatus;
  });

  return {
    list: paginateList(filtered, page, pageSize),
    page,
    pageSize,
    total: filtered.length,
    summary: {
      total: filtered.length,
      pendingCount: filtered.filter((item: any) => item.status === "待审核").length,
      publishedCount: filtered.filter((item: any) => item.status === "已发布").length,
      schoolOptions: [...new Set(mapped.map((item: any) => item.school))]
    }
  };
}

export async function queryAdminPostReportList(adminUserId: number, rawQuery: Record<string, unknown>) {
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
          { reportNo: { contains: keyword, mode: "insensitive" as const } },
          { reason: { contains: keyword, mode: "insensitive" as const } },
          { post: { is: { title: { contains: keyword, mode: "insensitive" as const } } } },
          { reporter: { is: { nickname: { contains: keyword, mode: "insensitive" as const } } } }
        ]
      : undefined
  };

  const summaryWhere = {
    school: summarySchoolWhere,
    OR: keyword
      ? [
          { reportNo: { contains: keyword, mode: "insensitive" as const } },
          { reason: { contains: keyword, mode: "insensitive" as const } },
          { post: { is: { title: { contains: keyword, mode: "insensitive" as const } } } },
          { reporter: { is: { nickname: { contains: keyword, mode: "insensitive" as const } } } }
        ]
      : undefined
  };

  const [total, list, pendingCount, processedCount, rejectedCount, schoolRows] = await prisma.$transaction([
    prisma.miniPostReport.count({ where }),
    prisma.miniPostReport.findMany({
      where,
      include: {
        post: {
          select: {
            title: true
          }
        },
        reporter: {
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
    prisma.miniPostReport.count({
      where: {
        ...summaryWhere,
        status: "待处理"
      }
    }),
    prisma.miniPostReport.count({
      where: {
        ...summaryWhere,
        status: "已处理"
      }
    }),
    prisma.miniPostReport.count({
      where: {
        ...summaryWhere,
        status: "已驳回"
      }
    }),
    prisma.miniPostReport.findMany({
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
      reportNo: item.reportNo,
      school: item.school,
      target: item.post?.title || "",
      reporter: item.reporter?.nickname || "",
      reason: item.reason,
      detail: item.detail || "",
      status: item.status,
      reviewNote: item.reviewNote || "",
      reviewerName: item.reviewer?.name || "",
      createdAt: formatDateTime(item.createdAt),
      reviewedAt: item.reviewedAt ? formatDateTime(item.reviewedAt) : ""
    })),
    page,
    pageSize,
    total,
    summary: {
      total: pendingCount + processedCount + rejectedCount,
      pendingCount,
      processedCount,
      rejectedCount,
      schoolOptions: schoolRows.map((item: any) => item.school)
    }
  };
}

export async function reviewAdminPostReport(id: number, reviewerId: number, payload: PostReportReviewPayload) {
  const row = await prisma.miniPostReport.findUnique({
    where: { id },
    include: {
      post: {
        select: {
          title: true
        }
      },
      reporter: {
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
    throw new ApiError("举报记录不存在", ERROR_CODES.NOT_FOUND, 404);
  }

  if (row.status !== "待处理") {
    throw new ApiError("当前举报记录不可重复处理", ERROR_CODES.BAD_REQUEST, 400);
  }

  const reviewedAt = new Date();
  const updated = await prisma.miniPostReport.update({
    where: { id },
    data: {
      status: payload.status,
      reviewNote: payload.reviewNote || "",
      reviewerId,
      reviewedAt
    },
    include: {
      post: {
        select: {
          title: true
        }
      },
      reporter: {
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

  return {
    id: updated.id,
    reportNo: updated.reportNo,
    school: updated.school,
    target: updated.post?.title || "",
    reporter: updated.reporter?.nickname || "",
    reason: updated.reason,
    detail: updated.detail || "",
    status: updated.status,
    reviewNote: updated.reviewNote || "",
    reviewerName: updated.reviewer?.name || "",
    createdAt: formatDateTime(updated.createdAt),
    reviewedAt: updated.reviewedAt ? formatDateTime(updated.reviewedAt) : ""
  };
}
