import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/api-error";
import { ERROR_CODES } from "../constants/error-codes";

function toStringArray(value: Prisma.JsonValue | null | undefined) {
  return Array.isArray(value) ? value.map((item) => String(item)) : [];
}

export async function getAdminSchoolScope(adminUserId: number) {
  const admin = await prisma.adminUser.findUniqueOrThrow({
    where: { id: adminUserId },
    include: {
      role: {
        select: {
          scopeType: true
        }
      }
    }
  });

  return {
    isAll: admin.role.scopeType === "all",
    schools: toStringArray(admin.schools)
  };
}

export function buildScopedSchoolWhere(
  scope: Awaited<ReturnType<typeof getAdminSchoolScope>>,
  school?: string
) {
  const currentSchool = String(school || "").trim();

  if (scope.isAll) {
    return currentSchool || undefined;
  }

  if (currentSchool) {
    return scope.schools.includes(currentSchool) ? currentSchool : "__no_school__";
  }

  return {
    in: scope.schools
  };
}

export function assertSchoolInScope(
  scope: Awaited<ReturnType<typeof getAdminSchoolScope>>,
  school?: string | null
) {
  const currentSchool = String(school || "").trim();
  if (!currentSchool) {
    throw new ApiError("学校不能为空", ERROR_CODES.BAD_REQUEST, 400);
  }

  if (scope.isAll) {
    return currentSchool;
  }

  if (!scope.schools.includes(currentSchool)) {
    throw new ApiError("无权操作当前高校数据", ERROR_CODES.FORBIDDEN, 403);
  }

  return currentSchool;
}
