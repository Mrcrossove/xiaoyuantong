import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/api-error";
import { ERROR_CODES } from "../constants/error-codes";
import { issueToken } from "../utils/token";
import type { AdminActivatePayload, AdminLoginPayload, AdminPasswordUpdatePayload } from "../controllers/schemas";
import { normalizeAdminPermissions } from "../utils/admin-permission";
import { hashPassword, isPasswordHashed, verifyPassword } from "../utils/password";

function toStringArray(value: Prisma.JsonValue | null | undefined) {
  return Array.isArray(value) ? value.map((item) => String(item)) : [];
}

function buildAdminSession(user: {
  id: number;
  name: string;
  account: string;
  status: string;
  schools: Prisma.JsonValue | null;
  mustChangePassword: boolean;
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
    throw new ApiError("当前账号或角色已停用", ERROR_CODES.FORBIDDEN, 403);
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
      schools: toStringArray(user.schools),
      mustChangePassword: Boolean(user.mustChangePassword)
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

  if (!user || !verifyPassword(password, user.password)) {
    throw new ApiError("账号或密码错误", ERROR_CODES.BAD_REQUEST, 400);
  }

  await prisma.adminUser.update({
    where: { id: user.id },
    data: {
      lastLoginAt: new Date(),
      password: isPasswordHashed(user.password) ? user.password : hashPassword(password)
    }
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

export async function getAdminAccountProfile(adminUserId: number) {
  const user = await prisma.adminUser.findUniqueOrThrow({
    where: { id: adminUserId },
    include: { role: true }
  });

  return {
    id: user.id,
    account: user.account,
    name: user.name,
    status: user.status,
    roleName: user.role.name,
    roleCode: user.role.code,
    schools: toStringArray(user.schools),
    mustChangePassword: Boolean(user.mustChangePassword),
    lastLoginAt: user.lastLoginAt?.toISOString() || "",
    passwordUpdatedAt: user.passwordUpdatedAt?.toISOString() || ""
  };
}

export async function adminActivate(adminUserId: number, payload: AdminActivatePayload) {
  const row = await prisma.adminUser.update({
    where: { id: adminUserId },
    data: {
      password: hashPassword(payload.password),
      mustChangePassword: false,
      passwordUpdatedAt: new Date()
    },
    include: { role: true }
  });

  return buildAdminSession(row);
}

export async function updateAdminPassword(adminUserId: number, payload: AdminPasswordUpdatePayload) {
  const user = await prisma.adminUser.findUniqueOrThrow({
    where: { id: adminUserId },
    include: { role: true }
  });

  if (!user.mustChangePassword) {
    if (!payload.oldPassword || !verifyPassword(payload.oldPassword, user.password)) {
      throw new ApiError("原密码错误", ERROR_CODES.BAD_REQUEST, 400);
    }
  }

  const row = await prisma.adminUser.update({
    where: { id: adminUserId },
    data: {
      password: hashPassword(payload.newPassword),
      mustChangePassword: false,
      passwordUpdatedAt: new Date()
    },
    include: { role: true }
  });

  return buildAdminSession(row);
}
