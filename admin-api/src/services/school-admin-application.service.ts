import { Prisma } from "@prisma/client";
import type {
  SchoolAdminApplicationAssignPayload,
  SchoolAdminApplicationPayload,
  SchoolAdminApplicationReviewPayload
} from "../controllers/schemas";
import { ERROR_CODES } from "../constants/error-codes";
import { prisma } from "../lib/prisma";
import { parsePageParams } from "../utils/pagination";
import { formatDateTime } from "../utils/time";
import { ApiError } from "../utils/api-error";
import { assertRiskPassed } from "./risk-control.service";
import { hashPassword } from "../utils/password";

const STATUS = {
  pending: "待处理",
  contacted: "已联系",
  assigned: "已分配账号",
  rejected: "已拒绝",
  closed: "已关闭"
} as const;

const ACTIVE_STATUSES = [STATUS.pending, STATUS.contacted, STATUS.assigned] as const;

function badRequest(message: string) {
  throw new ApiError(message, ERROR_CODES.BAD_REQUEST, 400);
}

function forbidden(message: string) {
  throw new ApiError(message, ERROR_CODES.FORBIDDEN, 403);
}

function toStatusClass(status: string) {
  if (status === STATUS.pending) return "warning";
  if (status === STATUS.contacted) return "primary";
  if (status === STATUS.assigned) return "success";
  return "danger";
}

function generateInitialPassword() {
  const seed = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let result = "";
  for (let i = 0; i < 10; i += 1) {
    result += seed[Math.floor(Math.random() * seed.length)];
  }
  return result;
}

function mapApplication(item: any, schoolPendingCountMap?: Map<string, number>) {
  const schoolPendingCount = schoolPendingCountMap?.get(item.school) || 0;
  return {
    id: item.id,
    userId: item.userId,
    applicantName: item.user?.nickname || "-",
    applicantPhone: item.user?.phone || "",
    school: item.school,
    teamSize: item.teamSize,
    contact: item.contact,
    status: item.status,
    statusClass: toStatusClass(item.status),
    reviewNote: item.reviewNote || "",
    assignedAdminUserId: item.assignedAdminUserId || 0,
    assignedAdminAccount: item.assignedAdminUser?.account || "",
    assignedAdminName: item.assignedAdminUser?.name || "",
    reviewedByName: item.reviewedBy?.name || "",
    createdAt: formatDateTime(item.createdAt),
    updatedAt: formatDateTime(item.updatedAt),
    schoolPendingCount
  };
}

async function ensureSuperAdmin(adminUserId: number) {
  const admin = await prisma.adminUser.findUniqueOrThrow({
    where: { id: adminUserId },
    include: { role: true }
  });

  if (admin.role.code !== "super_admin") {
    forbidden("仅超级管理员可操作管理员申请");
  }

  return admin;
}

async function ensureRole(roleCode: string) {
  const role = await prisma.adminRole.findFirst({
    where: {
      code: roleCode,
      status: "启用"
    }
  });

  if (!role) {
    throw new ApiError("请先创建并启用校园管理员角色", ERROR_CODES.BAD_REQUEST, 400);
  }

  return role;
}

async function ensureUniqueAdminAccount(account: string) {
  const existing = await prisma.adminUser.findUnique({ where: { account } });
  if (existing) {
    badRequest("管理员账号已存在，请更换后重试");
  }
}

async function findApplicationOrThrow(id: number) {
  return prisma.schoolAdminApplication.findUniqueOrThrow({
    where: { id },
    include: {
      user: {
        select: {
          nickname: true,
          phone: true
        }
      },
      reviewedBy: {
        select: {
          id: true,
          name: true
        }
      },
      assignedAdminUser: {
        select: {
          id: true,
          account: true,
          name: true
        }
      }
    }
  });
}

export async function getCurrentSchoolAdminApplication(userId: number) {
  const row = await prisma.schoolAdminApplication.findFirst({
    where: { userId },
    orderBy: { id: "desc" },
    include: {
      user: {
        select: {
          nickname: true,
          phone: true
        }
      },
      reviewedBy: {
        select: {
          name: true
        }
      },
      assignedAdminUser: {
        select: {
          id: true,
          account: true,
          name: true
        }
      }
    }
  });

  return row ? mapApplication(row) : null;
}

export async function createSchoolAdminApplication(userId: number, payload: SchoolAdminApplicationPayload) {
  await assertRiskPassed({
    userId,
    scene: "shop_apply",
    texts: [payload.school, String(payload.teamSize), payload.contact]
  });

  const latest = await prisma.schoolAdminApplication.findFirst({
    where: { userId },
    orderBy: { id: "desc" }
  });

  if (latest && ACTIVE_STATUSES.includes(latest.status as (typeof ACTIVE_STATUSES)[number])) {
    badRequest("你当前已有进行中的管理员申请，请等待平台处理");
  }

  const row = await prisma.schoolAdminApplication.create({
    data: {
      userId,
      school: payload.school,
      teamSize: payload.teamSize,
      contact: payload.contact,
      status: STATUS.pending
    },
    include: {
      user: {
        select: {
          nickname: true,
          phone: true
        }
      },
      reviewedBy: {
        select: {
          name: true
        }
      },
      assignedAdminUser: {
        select: {
          id: true,
          account: true,
          name: true
        }
      }
    }
  });

  return mapApplication(row);
}

export async function querySchoolAdminApplicationList(adminUserId: number, rawQuery: Record<string, unknown>) {
  await ensureSuperAdmin(adminUserId);
  const { page, pageSize, skip } = parsePageParams(rawQuery);
  const school = String(rawQuery.school || "").trim();
  const status = String(rawQuery.status || "").trim();
  const keyword = String(rawQuery.keyword || "").trim();

  const where: any = {
    school: school || undefined,
    status: status || undefined,
    OR: keyword
      ? [
          { school: { contains: keyword, mode: "insensitive" } },
          { contact: { contains: keyword, mode: "insensitive" } },
          { user: { nickname: { contains: keyword, mode: "insensitive" } } },
          { user: { phone: { contains: keyword, mode: "insensitive" } } }
        ]
      : undefined
  };

  const [total, rows, allRows, pendingBySchool] = await prisma.$transaction([
    prisma.schoolAdminApplication.count({ where }),
    prisma.schoolAdminApplication.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: [{ status: "asc" }, { id: "desc" }],
      include: {
        user: {
          select: {
            nickname: true,
            phone: true
          }
        },
        reviewedBy: {
          select: {
            name: true
          }
        },
        assignedAdminUser: {
          select: {
            id: true,
            account: true,
            name: true
          }
        }
      }
    }),
    prisma.schoolAdminApplication.findMany({
      orderBy: { id: "desc" },
      include: {
        user: {
          select: {
            nickname: true,
            phone: true
          }
        },
        reviewedBy: {
          select: {
            name: true
          }
        },
        assignedAdminUser: {
          select: {
            id: true,
            account: true,
            name: true
          }
        }
      }
    }),
    prisma.schoolAdminApplication.groupBy({
      by: ["school"],
      where: {
        status: {
          in: [STATUS.pending, STATUS.contacted]
        }
      },
      _count: {
        school: true
      }
    })
  ]);

  const pendingMap = new Map<string, number>(pendingBySchool.map((item: any) => [item.school, item._count.school]));

  return {
    list: rows.map((item: any) => mapApplication(item, pendingMap)),
    page,
    pageSize,
    total,
    summary: {
      total: allRows.length,
      pendingCount: allRows.filter((item: any) => item.status === STATUS.pending).length,
      contactedCount: allRows.filter((item: any) => item.status === STATUS.contacted).length,
      assignedCount: allRows.filter((item: any) => item.status === STATUS.assigned).length,
      schoolOptions: ([...new Set(allRows.map((item: any) => item.school))] as string[]).sort((a, b) =>
        a.localeCompare(b, "zh-CN")
      )
    }
  };
}

export async function reviewSchoolAdminApplication(
  adminUserId: number,
  id: number,
  payload: SchoolAdminApplicationReviewPayload
) {
  await ensureSuperAdmin(adminUserId);
  const current = await findApplicationOrThrow(id);

  if (current.status === STATUS.assigned) {
    badRequest("该申请已分配管理员账号，不能再修改状态");
  }

  const row = await prisma.schoolAdminApplication.update({
    where: { id },
    data: {
      status: payload.status,
      reviewNote: payload.reviewNote || "",
      reviewedById: adminUserId
    },
    include: {
      user: {
        select: {
          nickname: true,
          phone: true
        }
      },
      reviewedBy: {
        select: {
          name: true
        }
      },
      assignedAdminUser: {
        select: {
          id: true,
          account: true,
          name: true
        }
      }
    }
  });

  return mapApplication(row);
}

export async function assignSchoolAdminAccount(
  adminUserId: number,
  id: number,
  payload: SchoolAdminApplicationAssignPayload
) {
  await ensureSuperAdmin(adminUserId);
  const [application, role] = await Promise.all([findApplicationOrThrow(id), ensureRole("school_admin")]);

  if (application.status === STATUS.assigned && application.assignedAdminUserId) {
    badRequest("该申请已分配管理员账号");
  }

  await ensureUniqueAdminAccount(payload.account.trim());
  const initialPassword = generateInitialPassword();
  const now = new Date();

  const result = await prisma.$transaction(async (tx: any) => {
    const adminUser = await tx.adminUser.create({
      data: {
        account: payload.account.trim(),
        password: hashPassword(initialPassword),
        name: payload.name.trim(),
        status: "启用",
        schools: [application.school],
        mustChangePassword: true,
        initialPasswordSentAt: now,
        roleId: role.id
      }
    });

    const updatedApplication = await tx.schoolAdminApplication.update({
      where: { id: application.id },
      data: {
        status: STATUS.assigned,
        reviewNote: payload.reviewNote || "",
        reviewedById: adminUserId,
        assignedAdminUserId: adminUser.id
      },
      include: {
        user: {
          select: {
            nickname: true,
            phone: true
          }
        },
        reviewedBy: {
          select: {
            name: true
          }
        },
        assignedAdminUser: {
          select: {
            id: true,
            account: true,
            name: true
          }
        }
      }
    });

    return {
      application: mapApplication(updatedApplication),
      adminUser: {
        id: adminUser.id,
        account: adminUser.account,
        name: adminUser.name,
        school: application.school,
        roleCode: role.code,
        roleName: role.name,
        initialPassword
      }
    };
  });

  return result;
}
