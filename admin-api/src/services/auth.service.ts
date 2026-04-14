import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/api-error";
import { ERROR_CODES } from "../constants/error-codes";
import { issueToken } from "../utils/token";
import type { AdminLoginPayload } from "../controllers/schemas";
import { normalizeAdminPermissions } from "../utils/admin-permission";

function toStringArray(value: Prisma.JsonValue | null | undefined) {
  return Array.isArray(value) ? value.map((item) => String(item)) : [];
}

function buildAdminSession(user: {
  id: number;
  name: string;
  account: string;
  status: string;
  schools: Prisma.JsonValue | null;
  roleId: number;
  role: {
    code: string;
    name: string;
    scopeType: string;
    status: string;
    permissions: Prisma.JsonValue | null;
    menuPaths: Prisma.JsonValue | null;
  };
}) {
  if (user.status !== "启用" || user.role.status !== "启用") {
    throw new ApiError("当前账号已停用", ERROR_CODES.FORBIDDEN, 403);
  }

  return {
    profile: {
      id: user.id,
      roleId: user.roleId,
      name: user.name,
      account: user.account,
      roleCode: user.role.code,
      roleName: user.role.name,
      scopeType: user.role.scopeType === "all" ? "all" : "assigned",
      schools: toStringArray(user.schools)
    },
    permissions: normalizeAdminPermissions(toStringArray(user.role.permissions)),
    menuPaths: toStringArray(user.role.menuPaths)
  };
}

export async function adminLogin(payload: AdminLoginPayload) {
  const account = payload.account.trim();
  const password = payload.password.trim();

  const user = await prisma.adminUser.findUnique({
    where: { account },
    include: { role: true }
  });

  if (!user || user.password !== password) {
    throw new ApiError("账号或密码错误", ERROR_CODES.BAD_REQUEST, 400);
  }

  await prisma.adminUser.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() }
  });

  return {
    token: issueToken({ typ: "admin", uid: user.id, roleCode: user.role.code }),
    ...buildAdminSession(user)
  };
}

export async function getAdminSession(adminUserId: number) {
  const user = await prisma.adminUser.findUniqueOrThrow({
    where: { id: adminUserId },
    include: { role: true }
  });

  return buildAdminSession(user);
}
