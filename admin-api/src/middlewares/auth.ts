import { Prisma } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";
import { ERROR_CODES } from "../constants/error-codes";
import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/api-error";
import { verifyToken } from "../utils/token";
import { normalizeAdminPermissions } from "../utils/admin-permission";

function getBearerToken(req: Request) {
  const authorization = req.headers.authorization || "";
  if (!authorization.startsWith("Bearer ")) {
    throw new ApiError("未登录或登录已失效", ERROR_CODES.UNAUTHORIZED, 401);
  }
  return authorization.slice(7).trim();
}

function toStringArray(value: Prisma.JsonValue | null | undefined) {
  return Array.isArray(value) ? value.map((item) => String(item)) : [];
}

function uniqueStrings(list: string[]) {
  return Array.from(new Set(list.map((item) => String(item).trim()).filter(Boolean)));
}

function ensureAdminAuth(req: Request) {
  if (!req.adminAuth?.userId) {
    throw new ApiError("请先登录后台账号", ERROR_CODES.UNAUTHORIZED, 401);
  }
  return req.adminAuth;
}

async function loadAdminPermissionContext(userId: number) {
  const admin = await prisma.adminUser.findUnique({
    where: { id: userId },
    include: {
      role: {
        select: {
          code: true,
          status: true,
          permissions: true,
          menuPaths: true
        }
      }
    }
  });

  if (!admin) {
    throw new ApiError("当前登录状态已失效，请重新登录", ERROR_CODES.UNAUTHORIZED, 401);
  }

  if (admin.status !== "启用" || admin.role.status !== "启用") {
    throw new ApiError("当前账号或角色已停用，无法继续操作", ERROR_CODES.FORBIDDEN, 403);
  }

  const permissions = normalizeAdminPermissions(toStringArray(admin.role.permissions));
  const menuPaths = uniqueStrings(toStringArray(admin.role.menuPaths));

  return {
    roleCode: admin.role.code,
    permissions,
    menuPaths,
    isSuperAdmin: admin.role.code === "super_admin" || permissions.includes("*")
  };
}

function hasAnyPermission(grantedCodes: string[], requiredCodes: string[]) {
  return requiredCodes.some((code) => grantedCodes.includes(code));
}

export function requireAdminAuth(req: Request, _res: Response, next: NextFunction) {
  const payload = verifyToken(getBearerToken(req));
  if (payload.typ !== "admin" || !payload.roleCode) {
    throw new ApiError("无权访问当前接口", ERROR_CODES.FORBIDDEN, 403);
  }
  req.adminAuth = {
    userId: payload.uid,
    roleCode: payload.roleCode
  };
  next();
}

export function requireAdminPermission(...codes: string[]) {
  const requiredCodes = uniqueStrings(codes);

  return (req: Request, _res: Response, next: NextFunction) => {
    let auth: NonNullable<Request["adminAuth"]>;

    try {
      auth = ensureAdminAuth(req);
    } catch (error) {
      next(error);
      return;
    }

    if (!requiredCodes.length) {
      next();
      return;
    }

    if (auth.permissions) {
      if (auth.isSuperAdmin || auth.permissions.includes("*") || hasAnyPermission(auth.permissions, requiredCodes)) {
        next();
        return;
      }

      next(new ApiError(`缺少接口权限：${requiredCodes.join("、")}`, ERROR_CODES.FORBIDDEN, 403));
      return;
    }

    loadAdminPermissionContext(auth.userId)
      .then((context) => {
        req.adminAuth = {
          ...auth,
          roleCode: context.roleCode,
          permissions: context.permissions,
          menuPaths: context.menuPaths,
          isSuperAdmin: context.isSuperAdmin
        };

        if (context.isSuperAdmin || hasAnyPermission(context.permissions, requiredCodes)) {
          next();
          return;
        }

        next(new ApiError(`缺少接口权限：${requiredCodes.join("、")}`, ERROR_CODES.FORBIDDEN, 403));
      })
      .catch(next);
  };
}

export function requireAdminMenuAccess(...paths: string[]) {
  const requiredPaths = uniqueStrings(paths);

  return (req: Request, _res: Response, next: NextFunction) => {
    let auth: NonNullable<Request["adminAuth"]>;

    try {
      auth = ensureAdminAuth(req);
    } catch (error) {
      next(error);
      return;
    }

    if (!requiredPaths.length) {
      next();
      return;
    }

    if (auth.menuPaths) {
      if (auth.isSuperAdmin || auth.menuPaths.includes("*") || hasAnyPermission(auth.menuPaths, requiredPaths)) {
        next();
        return;
      }

      next(new ApiError(`缺少页面访问权限：${requiredPaths.join("、")}`, ERROR_CODES.FORBIDDEN, 403));
      return;
    }

    loadAdminPermissionContext(auth.userId)
      .then((context) => {
        req.adminAuth = {
          ...auth,
          roleCode: context.roleCode,
          permissions: context.permissions,
          menuPaths: context.menuPaths,
          isSuperAdmin: context.isSuperAdmin
        };

        if (context.isSuperAdmin || context.menuPaths.includes("*") || hasAnyPermission(context.menuPaths, requiredPaths)) {
          next();
          return;
        }

        next(new ApiError(`缺少页面访问权限：${requiredPaths.join("、")}`, ERROR_CODES.FORBIDDEN, 403));
      })
      .catch(next);
  };
}

export async function assertRequestAdminPermission(req: Request, ...codes: string[]) {
  const requiredCodes = uniqueStrings(codes);
  const auth = ensureAdminAuth(req);

  if (!requiredCodes.length) {
    return;
  }

  if (auth.permissions) {
    if (auth.isSuperAdmin || auth.permissions.includes("*") || hasAnyPermission(auth.permissions, requiredCodes)) {
      return;
    }

    throw new ApiError(`缺少接口权限：${requiredCodes.join("、")}`, ERROR_CODES.FORBIDDEN, 403);
  }

  const context = await loadAdminPermissionContext(auth.userId);
  req.adminAuth = {
    ...auth,
    roleCode: context.roleCode,
    permissions: context.permissions,
    menuPaths: context.menuPaths,
    isSuperAdmin: context.isSuperAdmin
  };

  if (context.isSuperAdmin || hasAnyPermission(context.permissions, requiredCodes)) {
    return;
  }

  throw new ApiError(`缺少接口权限：${requiredCodes.join("、")}`, ERROR_CODES.FORBIDDEN, 403);
}

export function requireMiniAuth(req: Request, _res: Response, next: NextFunction) {
  const payload = verifyToken(getBearerToken(req));
  if (payload.typ !== "mini" || !payload.deviceId) {
    throw new ApiError("请先完成小程序登录", ERROR_CODES.UNAUTHORIZED, 401);
  }
  req.miniAuth = {
    userId: payload.uid,
    deviceId: payload.deviceId
  };
  next();
}
