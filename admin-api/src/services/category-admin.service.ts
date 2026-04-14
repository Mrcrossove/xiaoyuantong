import { Prisma } from "@prisma/client";
import type { AdminCategoryPayload } from "../controllers/schemas";
import { ERROR_CODES } from "../constants/error-codes";
import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/api-error";
import { parsePageParams } from "../utils/pagination";
import { formatDateTime } from "../utils/time";
import { assertSchoolInScope, buildScopedSchoolWhere, getAdminSchoolScope } from "./admin-scope.service";

export type AdminCategoryKind = "post" | "store" | "product";

type AdminCategoryRow = {
  id: number;
  school: string;
  name: string;
  code: string;
  sort: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

function toStringArray(value: Prisma.JsonValue | null | undefined) {
  return Array.isArray(value) ? value.map((item) => String(item)) : [];
}

function uniqueStrings(list: string[]) {
  return Array.from(new Set(list.map((item) => String(item).trim()).filter(Boolean)));
}

function toLikeText(value?: string) {
  if (!value) return undefined;
  return { contains: value, mode: "insensitive" as const };
}

function buildCategoryCode(prefix: string, raw: string, index: number) {
  const normalized = String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return normalized ? `${prefix}_${normalized}` : `${prefix}_${index + 1}`;
}

function buildCategoryKey(school: string, name: string) {
  return `${school}::${name}`;
}

function badRequest(message: string) {
  throw new ApiError(message, ERROR_CODES.BAD_REQUEST, 400);
}

function getCategoryLabel(kind: AdminCategoryKind) {
  switch (kind) {
    case "post":
      return "帖子分类";
    case "store":
      return "店铺分类";
    case "product":
      return "商品分类";
    default:
      return "分类";
  }
}

function getUsageLabel(kind: AdminCategoryKind) {
  switch (kind) {
    case "post":
      return "帖子";
    case "store":
      return "店铺";
    case "product":
      return "商品";
    default:
      return "数据";
  }
}

function getCategoryModel(kind: AdminCategoryKind): any {
  switch (kind) {
    case "post":
      return prisma.adminPostCategory;
    case "store":
      return prisma.adminStoreCategory;
    case "product":
      return prisma.adminProductCategory;
    default:
      throw new Error(`Unsupported category kind: ${kind}`);
  }
}

function mapCategory(row: AdminCategoryRow, relatedCount: number) {
  return {
    id: row.id,
    school: row.school,
    name: row.name,
    code: row.code,
    sort: row.sort,
    status: row.status,
    relatedCount,
    updatedAt: formatDateTime(row.updatedAt)
  };
}

async function queryScopeSchoolOptions(scope: Awaited<ReturnType<typeof getAdminSchoolScope>>) {
  if (!scope.isAll) {
    return uniqueStrings(scope.schools).sort((a, b) => a.localeCompare(b, "zh-CN"));
  }

  const [contentRows, userRows, storeRows, postRows] = await Promise.all([
    prisma.schoolContent.findMany({ select: { school: true } }),
    prisma.miniUser.findMany({ where: { school: { not: null } }, select: { school: true } }),
    prisma.miniStore.findMany({ select: { school: true } }),
    prisma.miniPost.findMany({ select: { school: true } })
  ]);

  const schools = new Set<string>();
  contentRows.forEach((item: { school: string }) => schools.add(String(item.school)));
  userRows.forEach((item: { school: string | null }) => {
    if (item.school) {
      schools.add(String(item.school));
    }
  });
  storeRows.forEach((item: { school: string }) => schools.add(String(item.school)));
  postRows.forEach((item: { school: string }) => schools.add(String(item.school)));

  return Array.from(schools).sort((a, b) => a.localeCompare(b, "zh-CN"));
}

async function buildBootstrapRows(kind: AdminCategoryKind) {
  const result = new Map<string, Omit<AdminCategoryRow, "id" | "createdAt" | "updatedAt">>();
  const schoolSortMap = new Map<string, number>();

  const pushRow = (schoolValue: string, nameValue: string, codeValue: string, prefix: string) => {
    const school = String(schoolValue || "").trim();
    const name = String(nameValue || "").trim();
    if (!school || !name) {
      return;
    }

    const key = buildCategoryKey(school, name);
    if (result.has(key)) {
      return;
    }

    const sort = (schoolSortMap.get(school) || 0) + 1;
    schoolSortMap.set(school, sort);

    result.set(key, {
      school,
      name,
      code: String(codeValue || "").trim() || buildCategoryCode(prefix, name, sort - 1),
      sort,
      status: "启用"
    });
  };

  if (kind === "post") {
    const rows = await prisma.miniPost.findMany({
      select: {
        school: true,
        category: true
      },
      orderBy: [{ school: "asc" }, { id: "asc" }]
    });

    rows.forEach((item: { school: string; category: string }) => pushRow(item.school, item.category, "", "post"));
  }

  if (kind === "store") {
    const rows = await prisma.miniStore.findMany({
      select: {
        school: true,
        groupLabel: true,
        groupKey: true
      },
      orderBy: [{ school: "asc" }, { id: "asc" }]
    });

    rows.forEach((item: { school: string; groupLabel: string; groupKey: string }) => pushRow(item.school, item.groupLabel, item.groupKey, "store"));
  }

  if (kind === "product") {
    const rows = await prisma.miniStore.findMany({
      select: {
        school: true,
        sectionLabel: true,
        sectionKey: true
      },
      orderBy: [{ school: "asc" }, { id: "asc" }]
    });

    rows.forEach((item: { school: string; sectionLabel: string; sectionKey: string }) => pushRow(item.school, item.sectionLabel, item.sectionKey, "product"));
  }

  return Array.from(result.values());
}

async function ensureCategorySeeded(kind: AdminCategoryKind) {
  const model = getCategoryModel(kind);
  const total = await model.count();
  if (total > 0) {
    return;
  }

  const rows = await buildBootstrapRows(kind);
  if (!rows.length) {
    return;
  }

  await model.createMany({
    data: rows,
    skipDuplicates: true
  });
}

async function buildRelatedCountMap(kind: AdminCategoryKind, schools?: string[]) {
  const schoolWhere = schools?.length ? { in: schools } : undefined;
  const countMap = new Map<string, number>();

  if (kind === "post") {
    const rows = await prisma.miniPost.findMany({
      where: {
        school: schoolWhere
      },
      select: {
        school: true,
        category: true
      }
    });

    rows.forEach((item: { school: string; category: string }) => {
      const key = buildCategoryKey(item.school, item.category);
      countMap.set(key, (countMap.get(key) || 0) + 1);
    });
  }

  if (kind === "store") {
    const rows = await prisma.miniStore.findMany({
      where: {
        school: schoolWhere
      },
      select: {
        school: true,
        groupLabel: true
      }
    });

    rows.forEach((item: { school: string; groupLabel: string }) => {
      const key = buildCategoryKey(item.school, item.groupLabel);
      countMap.set(key, (countMap.get(key) || 0) + 1);
    });
  }

  if (kind === "product") {
    const rows = await prisma.miniStore.findMany({
      where: {
        school: schoolWhere
      },
      select: {
        school: true,
        sectionLabel: true,
        products: true
      }
    });

    rows.forEach((item: { school: string; sectionLabel: string; products: Prisma.JsonValue | null }) => {
      const key = buildCategoryKey(item.school, item.sectionLabel);
      const productCount = toStringArray(item.products).length || 0;
      countMap.set(key, (countMap.get(key) || 0) + productCount);
    });
  }

  return countMap;
}

async function ensureCategoryAccessible(kind: AdminCategoryKind, adminUserId: number, id: number) {
  const scope = await getAdminSchoolScope(adminUserId);
  const row = (await getCategoryModel(kind).findUniqueOrThrow({
    where: { id }
  })) as AdminCategoryRow;

  assertSchoolInScope(scope, row.school);

  return {
    row,
    scope
  };
}

async function ensureCategoryUnique(kind: AdminCategoryKind, payload: AdminCategoryPayload, excludeId?: number) {
  const model = getCategoryModel(kind);

  const duplicatedName = await model.findFirst({
    where: {
      school: payload.school,
      name: payload.name,
      id: excludeId ? { not: excludeId } : undefined
    }
  });

  if (duplicatedName) {
    badRequest(`${getCategoryLabel(kind)}名称已存在`);
  }

  const duplicatedCode = await model.findFirst({
    where: {
      school: payload.school,
      code: payload.code,
      id: excludeId ? { not: excludeId } : undefined
    }
  });

  if (duplicatedCode) {
    badRequest(`${getCategoryLabel(kind)}编码已存在`);
  }
}

async function syncCategoryBusinessData(kind: AdminCategoryKind, row: AdminCategoryRow, payload: AdminCategoryPayload) {
  if (payload.school !== row.school) {
    return;
  }

  if (kind === "post") {
    if (payload.name !== row.name) {
      await prisma.miniPost.updateMany({
        where: {
          school: row.school,
          category: row.name
        },
        data: {
          category: payload.name
        }
      });
    }
    return;
  }

  if (kind === "store") {
    const nextData: Record<string, string> = {};
    if (payload.name !== row.name) {
      nextData.groupLabel = payload.name;
    }
    if (payload.code !== row.code) {
      nextData.groupKey = payload.code;
    }

    if (Object.keys(nextData).length) {
      await prisma.miniStore.updateMany({
        where: {
          school: row.school,
          OR: [{ groupLabel: row.name }, { groupKey: row.code }]
        },
        data: nextData
      });
    }

    if (payload.name !== row.name) {
      await prisma.miniShopApply.updateMany({
        where: {
          school: row.school,
          category: row.name
        },
        data: {
          category: payload.name
        }
      });
    }
    return;
  }

  if (kind === "product") {
    const nextData: Record<string, string> = {};
    if (payload.name !== row.name) {
      nextData.sectionLabel = payload.name;
    }
    if (payload.code !== row.code) {
      nextData.sectionKey = payload.code;
    }

    if (Object.keys(nextData).length) {
      await prisma.miniStore.updateMany({
        where: {
          school: row.school,
          OR: [{ sectionLabel: row.name }, { sectionKey: row.code }]
        },
        data: nextData
      });
    }
  }
}

async function assertCategorySchoolChangeAllowed(kind: AdminCategoryKind, row: AdminCategoryRow, nextSchool: string) {
  if (nextSchool === row.school) {
    return;
  }

  const usageMap = await buildRelatedCountMap(kind, [row.school]);
  const relatedCount = usageMap.get(buildCategoryKey(row.school, row.name)) || 0;

  if (relatedCount > 0) {
    badRequest(`当前${getCategoryLabel(kind)}已关联${relatedCount}条${getUsageLabel(kind)}数据，不支持直接变更所属高校`);
  }
}

async function assertCategoryDeletable(kind: AdminCategoryKind, row: AdminCategoryRow) {
  const usageMap = await buildRelatedCountMap(kind, [row.school]);
  const relatedCount = usageMap.get(buildCategoryKey(row.school, row.name)) || 0;

  if (relatedCount > 0) {
    badRequest(`分类“${row.name}”已关联${relatedCount}条${getUsageLabel(kind)}数据，无法删除`);
  }
}

export async function queryAdminCategoryList(
  kind: AdminCategoryKind,
  adminUserId: number,
  rawQuery: Record<string, unknown>
) {
  await ensureCategorySeeded(kind);

  const { page, pageSize, skip } = parsePageParams(rawQuery);
  const keyword = String(rawQuery.keyword || "").trim();
  const school = String(rawQuery.school || "").trim();
  const status = String(rawQuery.status || "").trim();
  const scope = await getAdminSchoolScope(adminUserId);
  const model = getCategoryModel(kind);

  const where = {
    school: buildScopedSchoolWhere(scope, school),
    status: status || undefined,
    OR: keyword ? [{ name: toLikeText(keyword) }, { code: toLikeText(keyword) }, { school: toLikeText(keyword) }] : undefined
  };

  const [total, rows, allRows, schoolOptions, countMap] = await Promise.all([
    model.count({ where }),
    model.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: [{ sort: "asc" }, { id: "desc" }]
    }),
    model.findMany({
      where: {
        school: buildScopedSchoolWhere(scope)
      },
      orderBy: [{ school: "asc" }, { sort: "asc" }, { id: "desc" }]
    }),
    queryScopeSchoolOptions(scope),
    buildRelatedCountMap(kind, scope.isAll ? undefined : scope.schools)
  ]);

  return {
    list: (rows as AdminCategoryRow[]).map((row) => mapCategory(row, countMap.get(buildCategoryKey(row.school, row.name)) || 0)),
    page,
    pageSize,
    total,
    summary: {
      total,
      enabledCount: (allRows as AdminCategoryRow[]).filter((item) => item.status === "启用").length,
      schoolOptions: uniqueStrings([...schoolOptions, ...(allRows as AdminCategoryRow[]).map((item) => item.school)]).sort((a, b) =>
        a.localeCompare(b, "zh-CN")
      )
    }
  };
}

export async function createAdminCategory(kind: AdminCategoryKind, adminUserId: number, payload: AdminCategoryPayload) {
  const scope = await getAdminSchoolScope(adminUserId);
  const school = assertSchoolInScope(scope, payload.school);
  const nextPayload = {
    ...payload,
    school,
    name: payload.name.trim(),
    code: payload.code.trim()
  };

  await ensureCategoryUnique(kind, nextPayload);

  const row = (await getCategoryModel(kind).create({
    data: nextPayload
  })) as AdminCategoryRow;

  return mapCategory(row, 0);
}

export async function updateAdminCategory(
  kind: AdminCategoryKind,
  adminUserId: number,
  id: number,
  payload: AdminCategoryPayload
) {
  const { row, scope } = await ensureCategoryAccessible(kind, adminUserId, id);
  const school = assertSchoolInScope(scope, payload.school);
  const nextPayload = {
    ...payload,
    school,
    name: payload.name.trim(),
    code: payload.code.trim()
  };

  await assertCategorySchoolChangeAllowed(kind, row, nextPayload.school);
  await ensureCategoryUnique(kind, nextPayload, id);
  await syncCategoryBusinessData(kind, row, nextPayload);

  const updated = (await getCategoryModel(kind).update({
    where: { id },
    data: nextPayload
  })) as AdminCategoryRow;

  const usageMap = await buildRelatedCountMap(kind, [updated.school]);
  return mapCategory(updated, usageMap.get(buildCategoryKey(updated.school, updated.name)) || 0);
}

export async function toggleAdminCategoryStatus(kind: AdminCategoryKind, adminUserId: number, id: number) {
  const { row } = await ensureCategoryAccessible(kind, adminUserId, id);
  const updated = (await getCategoryModel(kind).update({
    where: { id },
    data: {
      status: row.status === "启用" ? "停用" : "启用"
    }
  })) as AdminCategoryRow;

  const usageMap = await buildRelatedCountMap(kind, [updated.school]);
  return mapCategory(updated, usageMap.get(buildCategoryKey(updated.school, updated.name)) || 0);
}

export async function deleteAdminCategory(kind: AdminCategoryKind, adminUserId: number, id: number) {
  const { row } = await ensureCategoryAccessible(kind, adminUserId, id);
  await assertCategoryDeletable(kind, row);
  await getCategoryModel(kind).delete({
    where: { id }
  });
}

export async function batchDeleteAdminCategory(kind: AdminCategoryKind, adminUserId: number, ids: number[]) {
  const scope = await getAdminSchoolScope(adminUserId);
  const rows = (await getCategoryModel(kind).findMany({
    where: {
      id: {
        in: ids
      }
    }
  })) as AdminCategoryRow[];

  rows.forEach((item) => assertSchoolInScope(scope, item.school));

  for (const item of rows) {
    await assertCategoryDeletable(kind, item);
  }

  await getCategoryModel(kind).deleteMany({
    where: {
      id: {
        in: ids
      }
    }
  });
}

export async function batchSetAdminCategoryStatus(
  kind: AdminCategoryKind,
  adminUserId: number,
  ids: number[],
  status: string
) {
  const scope = await getAdminSchoolScope(adminUserId);
  const rows = (await getCategoryModel(kind).findMany({
    where: {
      id: {
        in: ids
      }
    }
  })) as AdminCategoryRow[];

  rows.forEach((item) => assertSchoolInScope(scope, item.school));

  await getCategoryModel(kind).updateMany({
    where: {
      id: {
        in: ids
      }
    },
    data: {
      status
    }
  });
}
