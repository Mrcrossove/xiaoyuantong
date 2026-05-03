import { Prisma } from "@prisma/client";
import { ADMIN_MENU_PATHS, ADMIN_MENU_TREE, ADMIN_PERMISSION_CODES, ADMIN_PERMISSION_GROUPS } from "../constants/admin-auth";
import { ERROR_CODES } from "../constants/error-codes";
import type {
  AdminManagerCreatePayload,
  AdminManagerTransferPayload,
  AdminManagerUpdatePayload,
  AdminRolePayload,
  RolePermissionAssignPayload
} from "../controllers/schemas";
import { prisma } from "../lib/prisma";
import { parsePageParams } from "../utils/pagination";
import { ApiError } from "../utils/api-error";
import { formatDateTime } from "../utils/time";
import { getAdminSchoolScope } from "./admin-scope.service";
import { normalizeAdminPermissions } from "../utils/admin-permission";
import { hashPassword } from "../utils/password";

function toStringArray(value: Prisma.JsonValue | null | undefined) {
  return Array.isArray(value) ? value.map((item) => String(item)) : [];
}

function uniqueStrings(list: string[]) {
  return Array.from(new Set(list.map((item) => String(item).trim()).filter(Boolean)));
}

interface RoleTemplate {
  code: string;
  name: string;
  scopeType: "all" | "assigned";
  description: string;
  menuPaths: string[];
  permissionsList: string[];
}

const ROLE_TEMPLATES: RoleTemplate[] = [
  {
    code: "school_admin",
    name: "校园管理员",
    scopeType: "assigned" as const,
    description: "负责单个高校的后台运营、审核、交易与内容配置，数据范围仅限所在学校。",
    menuPaths: [
      "/dashboard/overview",
      "/school/content",
      "/user/list",
      "/user/publish",
      "/verify/list",
      "/post/list",
      "/post/category",
      "/post/report",
      "/store/apply",
      "/store/list",
      "/store/category",
      "/product/list",
      "/product/spec",
      "/product/category",
      "/message/system",
      "/message/interactive",
      "/message/send",
      "/message/template",
      "/operation/banner",
      "/operation/recommend",
      "/operation/search-word",
      "/operation/help",
      "/trade/order",
      "/trade/refund",
      "/trade/wallet",
      "/trade/withdraw",
      "/stat/user",
      "/stat/post",
      "/stat/store",
      "/stat/order"
    ],
    permissionsList: [
      "verify:view",
      "verify:approve",
      "verify:reject",
      "store:apply:view",
      "store:apply:approve",
      "store:apply:reject",
      "post:report:review",
      "post:review",
      "order:view",
      "order:export",
      "wallet:view",
      "wallet:export",
      "refund:review",
      "withdraw:review",
      "message:template:add",
      "message:template:edit",
      "operation:banner:add",
      "operation:banner:edit",
      "operation:recommend:add",
      "operation:recommend:edit",
      "operation:search:add",
      "operation:search:edit",
      "operation:help:add",
      "operation:help:edit",
      "post:category:add",
      "post:category:edit",
      "store:category:add",
      "store:category:edit",
      "product:category:add",
      "product:category:edit"
    ]
  }
];

function paginateList<T>(list: T[], page: number, pageSize: number) {
  const start = (page - 1) * pageSize;
  return list.slice(start, start + pageSize);
}

function badRequest(message: string) {
  throw new ApiError(message, ERROR_CODES.BAD_REQUEST, 400);
}

function forbidden(message: string) {
  throw new ApiError(message, ERROR_CODES.FORBIDDEN, 403);
}

async function getOperatorContext(adminUserId: number) {
  const [admin, scope] = await Promise.all([
    prisma.adminUser.findUniqueOrThrow({
      where: { id: adminUserId },
      include: {
        role: true
      }
    }),
    getAdminSchoolScope(adminUserId)
  ]);

  const permissions = normalizeAdminPermissions(toStringArray(admin.role.permissions));
  const menuPaths = uniqueStrings(toStringArray(admin.role.menuPaths));
  const isSuperAdmin = admin.role.code === "super_admin";

  return {
    userId: admin.id,
    roleId: admin.roleId,
    roleCode: admin.role.code,
    roleName: admin.role.name,
    scope,
    permissions,
    menuPaths,
    isSuperAdmin,
    canGrantAllPermissions: isSuperAdmin || permissions.includes("*"),
    canGrantAllMenus: isSuperAdmin || menuPaths.includes("*")
  };
}

function isSchoolsWithinScope(scope: Awaited<ReturnType<typeof getAdminSchoolScope>>, schools: string[]) {
  if (scope.isAll) {
    return true;
  }
  return schools.length > 0 && schools.every((school) => scope.schools.includes(school));
}

function normalizeSchools(schools: string[]) {
  return uniqueStrings(schools);
}

function ensureSchoolsAssignable(context: Awaited<ReturnType<typeof getOperatorContext>>, schools: string[]) {
  const normalized = normalizeSchools(schools);
  if (!normalized.length) {
    badRequest("请至少选择一个负责高校");
  }
  if (!context.scope.isAll && normalized.some((school) => !context.scope.schools.includes(school))) {
    forbidden("无权分配超出当前账号范围的高校");
  }
  return normalized;
}

function ensureRoleSchoolConstraints(roleCode: string, schools: string[]) {
  if (roleCode === "school_admin" && schools.length !== 1) {
    badRequest("校园管理员必须且只能绑定一个学校");
  }
  return schools;
}

function ensureMenuPathsGrantable(context: Awaited<ReturnType<typeof getOperatorContext>>, menuPaths: string[]) {
  const normalized = uniqueStrings(menuPaths);

  if (normalized.includes("*")) {
    if (!context.canGrantAllMenus) {
      forbidden("无权分配全部菜单权限");
    }
    return ["*"];
  }

  const invalid = normalized.filter((item) => !ADMIN_MENU_PATHS.includes(item));
  if (invalid.length) {
    badRequest(`存在无效菜单路径：${invalid.join("、")}`);
  }

  if (!context.canGrantAllMenus && normalized.some((item) => !context.menuPaths.includes(item))) {
    forbidden("无权分配超出当前账号范围的菜单权限");
  }

  return normalized;
}

function ensurePermissionsGrantable(context: Awaited<ReturnType<typeof getOperatorContext>>, permissions: string[]) {
  const normalized = uniqueStrings(permissions);

  if (normalized.includes("*")) {
    if (!context.canGrantAllPermissions) {
      forbidden("无权分配全部按钮权限");
    }
    return ["*"];
  }

  const invalid = normalized.filter((item) => !ADMIN_PERMISSION_CODES.includes(item));
  if (invalid.length) {
    badRequest(`存在无效按钮权限：${invalid.join("、")}`);
  }

  if (!context.canGrantAllPermissions && normalized.some((item) => !context.permissions.includes(item))) {
    forbidden("无权分配超出当前账号范围的按钮权限");
  }

  return normalized;
}

function canManageAdmin(context: Awaited<ReturnType<typeof getOperatorContext>>, admin: any) {
  if (context.isSuperAdmin) {
    return true;
  }

  if (admin.role.code === "super_admin" || admin.role.scopeType === "all") {
    return false;
  }

  return isSchoolsWithinScope(context.scope, toStringArray(admin.schools));
}

function canManageRole(context: Awaited<ReturnType<typeof getOperatorContext>>, role: any) {
  if (context.isSuperAdmin) {
    return true;
  }

  if (role.code === "super_admin" || role.scopeType === "all") {
    return false;
  }

  const permissions = normalizeAdminPermissions(toStringArray(role.permissions));
  const menuPaths = toStringArray(role.menuPaths);
  if (!context.canGrantAllPermissions && permissions.some((item) => item !== "*" && !context.permissions.includes(item))) {
    return false;
  }
  if (!context.canGrantAllMenus && menuPaths.some((item) => item !== "*" && !context.menuPaths.includes(item))) {
    return false;
  }

  return Array.isArray(role.users)
    ? role.users.every((user: any) => isSchoolsWithinScope(context.scope, toStringArray(user.schools)))
    : true;
}

function mapAdminUser(item: any) {
  const schools = toStringArray(item.schools);
  return {
    id: item.id,
    name: item.name,
    account: item.account,
    roleId: item.roleId,
    role: item.role.name,
    roleCode: item.role.code,
    scopeType: item.role.scopeType === "all" ? "all" : "assigned",
    schools,
    school: item.role.scopeType === "all" ? "全部高校" : schools.join("、") || "-",
    status: item.status,
    lastLoginTime: item.lastLoginAt ? formatDateTime(item.lastLoginAt) : "-"
  };
}

function generateInitialPassword() {
  const seed = "abcdefghijkmnpqrstuvwxyz23456789";
  let result = "";
  for (let i = 0; i < 8; i += 1) {
    result += seed[Math.floor(Math.random() * seed.length)];
  }
  return result;
}

function mapAdminRole(item: any) {
  const permissionsList = normalizeAdminPermissions(toStringArray(item.permissions));
  const menuPaths = uniqueStrings(toStringArray(item.menuPaths));
  return {
    id: item.id,
    name: item.name,
    code: item.code,
    status: item.status,
    scopeType: item.scopeType === "all" ? "全部高校" : "指定高校",
    scopeTypeValue: item.scopeType === "all" ? "all" : "assigned",
    permissionsList,
    permissions: permissionsList.includes("*") ? "平台全部权限" : permissionsList.join("、") || "-",
    menuPaths,
    menuCount: menuPaths.includes("*") ? ADMIN_MENU_PATHS.length : menuPaths.length,
    userCount: Array.isArray(item.users) ? item.users.length : 0
  };
}

async function queryAvailableSchools(context: Awaited<ReturnType<typeof getOperatorContext>>) {
  const schoolWhere = context.scope.isAll ? undefined : { in: context.scope.schools };
  const [contentRows, userRows, storeRows] = await Promise.all([
    prisma.schoolContent.findMany({
      where: {
        school: schoolWhere
      },
      select: { school: true }
    }),
    prisma.miniUser.findMany({
      where: context.scope.isAll ? { school: { not: null } } : { school: schoolWhere },
      select: { school: true }
    }),
    prisma.miniStore.findMany({
      where: {
        school: schoolWhere
      },
      select: { school: true }
    })
  ]);

  const set = new Set<string>();
  contentRows.forEach((item: { school: string }) => set.add(String(item.school)));
  userRows.forEach((item: { school: string | null }) => {
    if (item.school) {
      set.add(String(item.school));
    }
  });
  storeRows.forEach((item: { school: string }) => set.add(String(item.school)));
  context.scope.schools.forEach((item: string) => set.add(item));

  return Array.from(set).sort((a, b) => a.localeCompare(b, "zh-CN"));
}

async function findManageableRoleOrThrow(context: Awaited<ReturnType<typeof getOperatorContext>>, roleId: number) {
  const role = await prisma.adminRole.findUniqueOrThrow({
    where: { id: roleId },
    include: {
      users: {
        select: {
          id: true,
          schools: true
        }
      }
    }
  });

  if (!canManageRole(context, role)) {
    forbidden("无权操作当前角色");
  }

  return role;
}

async function ensureUniqueAdminAccount(account: string, excludeId?: number) {
  const row = await prisma.adminUser.findFirst({
    where: {
      account,
      id: excludeId ? { not: excludeId } : undefined
    },
    select: { id: true }
  });

  if (row) {
    badRequest("管理员账号已存在");
  }
}

async function ensureUniqueRoleCode(code: string, excludeId?: number) {
  const row = await prisma.adminRole.findFirst({
    where: {
      code,
      id: excludeId ? { not: excludeId } : undefined
    },
    select: { id: true }
  });

  if (row) {
    badRequest("角色编码已存在");
  }
}

export async function queryAuthManageMeta(adminUserId: number) {
  const context = await getOperatorContext(adminUserId);
  const [schoolOptions, roles] = await Promise.all([
    queryAvailableSchools(context),
    prisma.adminRole.findMany({
      include: {
        users: {
          select: {
            id: true,
            schools: true
          }
        }
      },
      orderBy: { id: "asc" }
    })
  ]);

  return {
    currentRoleId: context.roleId,
    currentRoleCode: context.roleCode,
    currentRoleName: context.roleName,
    schoolOptions,
    roleOptions: roles
      .filter((item: any) => canManageRole(context, item))
      .map((item: any) => ({
        id: item.id,
        name: item.name,
        code: item.code,
        scopeType: item.scopeType === "all" ? "all" : "assigned",
        status: item.status
      })),
    roleTemplates: ROLE_TEMPLATES.filter(
      (item) =>
        (item.scopeType !== "all" || context.isSuperAdmin) &&
        (context.canGrantAllMenus || item.menuPaths.every((menuPath) => context.menuPaths.includes(menuPath))) &&
        (context.canGrantAllPermissions || item.permissionsList.every((code) => context.permissions.includes(code)))
    ),
    menuTree: ADMIN_MENU_TREE,
    permissionGroups: ADMIN_PERMISSION_GROUPS
  };
}

export async function queryAdminUserManageList(adminUserId: number, rawQuery: Record<string, unknown>) {
  const { page, pageSize } = parsePageParams(rawQuery);
  const keyword = String(rawQuery.keyword || "").trim();
  const role = String(rawQuery.role || "").trim();
  const status = String(rawQuery.status || "").trim();
  const context = await getOperatorContext(adminUserId);

  const rows = await prisma.adminUser.findMany({
    include: {
      role: true
    },
    orderBy: { id: "asc" }
  });

  const mapped = rows.filter((item: any) => canManageAdmin(context, item)).map((item: any) => mapAdminUser(item));

  const filtered = mapped.filter((item: ReturnType<typeof mapAdminUser>) => {
    const matchKeyword = !keyword || item.name.includes(keyword) || item.account.includes(keyword);
    const matchRole = !role || item.role === role || item.roleCode === role;
    const matchStatus = !status || item.status === status;
    return matchKeyword && matchRole && matchStatus;
  });

  return {
    list: paginateList(filtered, page, pageSize),
    page,
    pageSize,
    total: filtered.length,
    summary: {
      total: filtered.length,
      enabledCount: filtered.filter((item: ReturnType<typeof mapAdminUser>) => item.status === "启用").length,
      roleCount: [...new Set(mapped.map((item: ReturnType<typeof mapAdminUser>) => item.role))].length,
      roleOptions: [...new Set(mapped.map((item: ReturnType<typeof mapAdminUser>) => item.role))]
    }
  };
}

export async function createAdminUser(adminUserId: number, payload: AdminManagerCreatePayload) {
  const context = await getOperatorContext(adminUserId);
  const role = await findManageableRoleOrThrow(context, payload.roleId);
  const account = payload.account.trim();
  await ensureUniqueAdminAccount(account);

  const schools =
    role.scopeType === "all" ? [] : ensureRoleSchoolConstraints(role.code, ensureSchoolsAssignable(context, payload.schools));

    const row = await prisma.adminUser.create({
      data: {
        account,
        password: hashPassword(payload.password),
        name: payload.name.trim(),
        status: payload.status,
        schools,
        roleId: payload.roleId
    },
    include: {
      role: true
    }
  });

  return mapAdminUser(row);
}

export async function updateAdminUser(adminUserId: number, id: number, payload: AdminManagerUpdatePayload) {
  const context = await getOperatorContext(adminUserId);
  const target = await prisma.adminUser.findUniqueOrThrow({
    where: { id },
    include: {
      role: true
    }
  });

  if (!canManageAdmin(context, target)) {
    forbidden("无权操作当前管理员");
  }

  const role = await findManageableRoleOrThrow(context, payload.roleId);
  const account = payload.account.trim();
  await ensureUniqueAdminAccount(account, id);

  const schools =
    role.scopeType === "all" ? [] : ensureRoleSchoolConstraints(role.code, ensureSchoolsAssignable(context, payload.schools));
  const nextPassword = payload.password?.trim();

    const row = await prisma.adminUser.update({
      where: { id },
      data: {
        account,
        name: payload.name.trim(),
        roleId: payload.roleId,
        schools,
        password: nextPassword ? hashPassword(nextPassword) : undefined
      },
    include: {
      role: true
    }
  });

  return mapAdminUser(row);
}

export async function toggleAdminUserStatus(adminUserId: number, id: number) {
  if (adminUserId === id) {
    badRequest("不能停用当前登录账号");
  }

  const context = await getOperatorContext(adminUserId);
  const target = await prisma.adminUser.findUniqueOrThrow({
    where: { id },
    include: {
      role: true
    }
  });

  if (!canManageAdmin(context, target)) {
    forbidden("无权操作当前管理员");
  }

  const row = await prisma.adminUser.update({
    where: { id },
    data: {
      status: target.status === "启用" ? "停用" : "启用"
    },
    include: {
      role: true
    }
  });

  return mapAdminUser(row);
}

export async function transferSchoolAdminAccount(adminUserId: number, id: number, payload: AdminManagerTransferPayload) {
  if (adminUserId === id) {
    badRequest("cannot revoke current login account");
  }

  const context = await getOperatorContext(adminUserId);
  const target = await prisma.adminUser.findUniqueOrThrow({
    where: { id },
    include: {
      role: true
    }
  });

  if (!canManageAdmin(context, target)) {
    forbidden("no permission to manage this admin account");
  }

  if (target.role.code !== "school_admin") {
    badRequest("only school_admin account can be revoked here");
  }

  const school = payload.school.trim();
  const targetSchools = toStringArray(target.schools);
  if (!targetSchools.includes(school)) {
    badRequest("this account is not bound to the selected school");
  }

  if (!isSchoolsWithinScope(context.scope, [school])) {
    forbidden("no permission to revoke this school admin");
  }

  const role = await prisma.adminRole.findFirst({
    where: {
      code: "school_admin",
      status: "\u542f\u7528"
    }
  });
  if (!role) {
    badRequest("please enable school_admin role first");
  }

  const replacement = payload.mode === "transfer" ? payload.replacement : undefined;
  if (payload.mode === "transfer" && !replacement) {
    badRequest("replacement account is required for transfer");
  }

  if (replacement) {
    await ensureUniqueAdminAccount(replacement.account.trim());
  }

  const now = new Date();
  const initialPassword = replacement ? generateInitialPassword() : "";

  const result = await prisma.$transaction(async (tx: any) => {
    const remainingSchools = targetSchools.filter((item) => item !== school);
    const revoked = await tx.adminUser.update({
      where: { id: target.id },
      data: {
        schools: remainingSchools,
        status: "\u505c\u7528",
        mustChangePassword: true
      },
      include: {
        role: true
      }
    });

    await tx.schoolAdminApplication.updateMany({
      where: {
        assignedAdminUserId: target.id,
        school
      },
      data: {
        reviewNote: payload.note || "school admin account revoked",
        reviewedById: adminUserId
      }
    });

    let newAdminUser: any = null;
    if (replacement) {
      newAdminUser = await tx.adminUser.create({
        data: {
          account: replacement.account.trim(),
          password: hashPassword(initialPassword),
          name: replacement.name.trim(),
          status: "\u542f\u7528",
          schools: [school],
          mustChangePassword: true,
          initialPasswordSentAt: now,
          roleId: role.id
        },
        include: {
          role: true
        }
      });

      await tx.schoolAdminApplication.updateMany({
        where: {
          school,
          assignedAdminUserId: target.id
        },
        data: {
          assignedAdminUserId: newAdminUser.id,
          reviewNote: payload.note || "school admin account transferred",
          reviewedById: adminUserId
        }
      });
    }

    return {
      revokedAdmin: mapAdminUser(revoked),
      replacementAdmin: newAdminUser
        ? {
            ...mapAdminUser(newAdminUser),
            initialPassword
          }
        : null,
      school
    };
  });

  return result;
}

export async function deleteAdminUser(adminUserId: number, id: number) {
  if (adminUserId === id) {
    badRequest("不能删除当前登录账号");
  }

  const context = await getOperatorContext(adminUserId);
  const target = await prisma.adminUser.findUniqueOrThrow({
    where: { id },
    include: {
      role: true
    }
  });

  if (!canManageAdmin(context, target)) {
    forbidden("无权操作当前管理员");
  }

  await prisma.adminUser.delete({
    where: { id }
  });
}

export async function queryAdminRoleList(adminUserId: number, rawQuery: Record<string, unknown>) {
  const { page, pageSize } = parsePageParams(rawQuery);
  const keyword = String(rawQuery.keyword || "").trim();
  const status = String(rawQuery.status || "").trim();
  const context = await getOperatorContext(adminUserId);

  const rows = await prisma.adminRole.findMany({
    include: {
      users: {
        select: {
          id: true,
          schools: true
        }
      }
    },
    orderBy: { id: "asc" }
  });

  const mapped = rows.filter((item: any) => canManageRole(context, item)).map((item: any) => mapAdminRole(item));

  const filtered = mapped.filter((item: ReturnType<typeof mapAdminRole>) => {
    const matchKeyword = !keyword || item.name.includes(keyword) || item.code.includes(keyword);
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
      enabledCount: filtered.filter((item: ReturnType<typeof mapAdminRole>) => item.status === "启用").length,
      userCount: filtered.reduce((sum: number, item: ReturnType<typeof mapAdminRole>) => sum + item.userCount, 0)
    }
  };
}

export async function createAdminRole(adminUserId: number, payload: AdminRolePayload) {
  const context = await getOperatorContext(adminUserId);
  const code = payload.code.trim();

  if (code === "super_admin") {
    badRequest("super_admin 为系统保留角色编码");
  }

  if (payload.scopeType === "all" && !context.isSuperAdmin) {
    forbidden("无权创建全部高校角色");
  }

  await ensureUniqueRoleCode(code);

  const row = await prisma.adminRole.create({
    data: {
      code,
      name: payload.name.trim(),
      scopeType: payload.scopeType,
      status: payload.status,
      permissions: [],
      menuPaths: []
    },
    include: {
      users: {
        select: {
          id: true,
          schools: true
        }
      }
    }
  });

  return mapAdminRole(row);
}

export async function createAdminRoleFromTemplate(adminUserId: number, templateCode: string) {
  const context = await getOperatorContext(adminUserId);
  const template = ROLE_TEMPLATES.find((item) => item.code === templateCode);

  if (!template) {
    throw new ApiError("角色模板不存在", ERROR_CODES.BAD_REQUEST, 400);
  }

  if (template.scopeType === "all" && !context.isSuperAdmin) {
    forbidden("无权创建全部高校角色模板");
  }

  await ensureUniqueRoleCode(template.code);

  const row = await prisma.adminRole.create({
    data: {
      code: template.code,
      name: template.name,
      scopeType: template.scopeType,
      status: "启用",
      menuPaths: ensureMenuPathsGrantable(context, template.menuPaths),
      permissions: ensurePermissionsGrantable(context, template.permissionsList)
    },
    include: {
      users: {
        select: {
          id: true,
          schools: true
        }
      }
    }
  });

  return mapAdminRole(row);
}

export async function updateAdminRole(adminUserId: number, id: number, payload: AdminRolePayload) {
  const context = await getOperatorContext(adminUserId);
  const target = await findManageableRoleOrThrow(context, id);
  const code = payload.code.trim();

  if (target.code === "super_admin" || code === "super_admin") {
    badRequest("系统超级管理员角色不支持编辑");
  }

  if (payload.scopeType === "all" && !context.isSuperAdmin) {
    forbidden("无权设置全部高校角色");
  }

  await ensureUniqueRoleCode(code, id);

  const row = await prisma.adminRole.update({
    where: { id },
    data: {
      code,
      name: payload.name.trim(),
      scopeType: payload.scopeType,
      status: payload.status
    },
    include: {
      users: {
        select: {
          id: true,
          schools: true
        }
      }
    }
  });

  return mapAdminRole(row);
}

export async function toggleAdminRoleStatus(adminUserId: number, id: number) {
  const context = await getOperatorContext(adminUserId);
  const target = await findManageableRoleOrThrow(context, id);

  if (target.code === "super_admin") {
    badRequest("系统超级管理员角色不支持停用");
  }

  if (target.users.some((item: any) => item.id === adminUserId)) {
    badRequest("不能停用当前登录账号正在使用的角色");
  }

  const row = await prisma.adminRole.update({
    where: { id },
    data: {
      status: target.status === "启用" ? "停用" : "启用"
    },
    include: {
      users: {
        select: {
          id: true,
          schools: true
        }
      }
    }
  });

  return mapAdminRole(row);
}

export async function deleteAdminRole(adminUserId: number, id: number) {
  const context = await getOperatorContext(adminUserId);
  const target = await findManageableRoleOrThrow(context, id);

  if (target.code === "super_admin") {
    badRequest("系统超级管理员角色不支持删除");
  }

  if (target.users.length > 0) {
    badRequest("当前角色仍有关联管理员，暂不能删除");
  }

  await prisma.adminRole.delete({
    where: { id }
  });
}

export async function updateRolePermission(adminUserId: number, roleId: number, payload: RolePermissionAssignPayload) {
  const context = await getOperatorContext(adminUserId);
  const target = await findManageableRoleOrThrow(context, roleId);

  if (target.code === "super_admin") {
    badRequest("系统超级管理员角色不支持修改权限");
  }

  const row = await prisma.adminRole.update({
    where: { id: roleId },
    data: {
      menuPaths: ensureMenuPathsGrantable(context, payload.menuPaths),
      permissions: ensurePermissionsGrantable(context, payload.permissionsList)
    },
    include: {
      users: {
        select: {
          id: true,
          schools: true
        }
      }
    }
  });

  return mapAdminRole(row);
}

export async function getCurrentMenuPermission(adminUserId: number) {
  const admin = await prisma.adminUser.findUniqueOrThrow({
    where: { id: adminUserId },
    include: {
      role: true
    }
  });

  return {
    currentRoleId: admin.roleId,
    currentRoleCode: admin.role.code,
    currentRoleName: admin.role.name,
    tree: ADMIN_MENU_TREE,
    permissionGroups: ADMIN_PERMISSION_GROUPS,
    checkedCodes: uniqueStrings(toStringArray(admin.role.menuPaths)),
    checkedPermissions: normalizeAdminPermissions(toStringArray(admin.role.permissions))
  };
}
