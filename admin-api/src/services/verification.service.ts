import { prisma } from "../lib/prisma";
import { parsePageParams } from "../utils/pagination";
import type { VerifyReviewPayload, VerifySubmitPayload } from "../controllers/schemas";
import { assertRiskPassed } from "./risk-control.service";
import { getAdminSchoolScope } from "./admin-scope.service";

const STATUS = {
  verified: "已认证",
  approved: "已通过",
  rejected: "已驳回",
  verifyRejected: "认证驳回"
};

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

export async function getCurrentVerification(userId: number) {
  const user = await prisma.miniUser.findUniqueOrThrow({
    where: { id: userId },
    include: {
      verifications: {
        orderBy: { id: "desc" },
        take: 1
      }
    }
  });

  const current = user.verifications[0];
  return {
    verified: user.verifyStatus === STATUS.verified,
    statusText: current?.status || user.verifyStatus,
    name: current?.realName || "",
    phone: current?.phone || user.phone || "",
    school: current?.school || user.school || "",
    reviewNote: current?.reviewNote || "",
    reviewedAt: current?.reviewedAt ? current.reviewedAt.toISOString() : "",
    verifiedAt: user.verifiedAt ? user.verifiedAt.toISOString() : ""
  };
}

export async function submitVerification(userId: number, payload: VerifySubmitPayload) {
  await assertRiskPassed({
    userId,
    scene: "verify_submit",
    texts: [payload.name, payload.phone, payload.school]
  });

  const reviewedAt = new Date();
  const reviewer = await prisma.adminUser.findFirst({
    where: { account: "admin" }
  });

  await prisma.$transaction([
    prisma.miniUser.update({
      where: { id: userId },
      data: {
        nickname: payload.name,
        phone: payload.phone,
        school: payload.school,
        verifyStatus: STATUS.verified,
        verifiedAt: reviewedAt
      }
    }),
    prisma.userVerification.create({
      data: {
        userId,
        realName: payload.name,
        phone: payload.phone,
        school: payload.school,
        status: STATUS.approved,
        reviewerId: reviewer?.id,
        reviewNote: "系统自动认证通过",
        reviewedAt
      }
    })
  ]);

  return getCurrentVerification(userId);
}

export async function queryVerificationList(adminUserId: number, rawQuery: Record<string, unknown>) {
  const { page, pageSize, skip } = parsePageParams(rawQuery);
  const school = String(rawQuery.school || "");
  const status = String(rawQuery.status || "");
  const keyword = String(rawQuery.keyword || "");
  const scope = await getAdminSchoolScope(adminUserId);

  const where = {
    school: buildSchoolWhere(scope, school),
    status: status || undefined,
    OR: keyword
      ? [
          { realName: { contains: keyword, mode: "insensitive" as const } },
          { phone: { contains: keyword, mode: "insensitive" as const } },
          { school: { contains: keyword, mode: "insensitive" as const } }
        ]
      : undefined
  };

  const [total, list] = await prisma.$transaction([
    prisma.userVerification.count({ where }),
    prisma.userVerification.findMany({
      where,
      include: {
        reviewer: {
          select: { id: true, name: true }
        },
        user: {
          select: { nickname: true }
        }
      },
      orderBy: { id: "desc" },
      skip,
      take: pageSize
    })
  ]);

  return {
    list: list.map((item: any) => ({
      id: item.id,
      userId: item.userId,
      realName: item.realName,
      phone: item.phone,
      school: item.school,
      status: item.status,
      reviewerName: item.reviewer?.name || "",
      reviewNote: item.reviewNote || "",
      submitSource: item.submitSource,
      createdAt: item.createdAt,
      reviewedAt: item.reviewedAt,
      userNickname: item.user.nickname
    })),
    page,
    pageSize,
    total
  };
}

export async function reviewVerification(id: number, reviewerId: number, payload: VerifyReviewPayload) {
  const reviewedAt = new Date();
  const record = await prisma.userVerification.update({
    where: { id },
    data: {
      status: payload.status,
      reviewerId,
      reviewNote: payload.reviewNote || "",
      reviewedAt
    }
  });

  await prisma.miniUser.update({
    where: { id: record.userId },
    data: {
      phone: record.phone,
      school: record.school,
      nickname: record.realName,
      verifyStatus: payload.status === STATUS.approved ? STATUS.verified : STATUS.verifyRejected,
      verifiedAt: payload.status === STATUS.approved ? reviewedAt : null
    }
  });

  return prisma.userVerification.findUniqueOrThrow({
    where: { id },
    include: { reviewer: { select: { name: true } } }
  });
}
