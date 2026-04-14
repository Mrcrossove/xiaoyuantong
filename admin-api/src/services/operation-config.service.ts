import { prisma } from "../lib/prisma";
import { parsePageParams } from "../utils/pagination";
import { formatDateTime } from "../utils/time";
import type {
  BannerConfigPayload,
  HelpCenterPayload,
  RecommendConfigPayload,
  SearchWordPayload
} from "../controllers/schemas";
import { assertSchoolInScope, buildScopedSchoolWhere, getAdminSchoolScope } from "./admin-scope.service";

function toLikeText(value?: string) {
  if (!value) return undefined;
  return { contains: value, mode: "insensitive" as const };
}

function mapSearchWord(item: any) {
  return {
    id: item.id,
    school: item.school,
    keyword: item.keyword,
    searchCount: item.searchCount,
    sort: item.sort,
    status: item.status,
    updatedAt: formatDateTime(item.updatedAt)
  };
}

function mapHelpArticle(item: any) {
  return {
    id: item.id,
    category: item.category,
    title: item.title,
    school: item.school,
    status: item.status,
    content: item.content,
    sort: item.sort,
    updatedAt: formatDateTime(item.updatedAt)
  };
}

function mapBanner(item: any) {
  return {
    id: item.id,
    title: item.title,
    position: item.position,
    school: item.school,
    imageUrl: item.imageUrl || "",
    linkUrl: item.linkUrl || "",
    sort: item.sort,
    status: item.status,
    remark: item.remark || "",
    updatedAt: formatDateTime(item.updatedAt)
  };
}

function mapRecommend(item: any) {
  return {
    id: item.id,
    title: item.title,
    type: item.type,
    school: item.school,
    targetName: item.targetName || "",
    targetId: item.targetId || "",
    sort: item.sort,
    status: item.status,
    remark: item.remark || "",
    updatedAt: formatDateTime(item.updatedAt)
  };
}

async function ensureSearchWordAccessible(adminUserId: number, id: number) {
  const scope = await getAdminSchoolScope(adminUserId);
  const row = await prisma.adminSearchWord.findUniqueOrThrow({ where: { id } });
  assertSchoolInScope(scope, row.school);
  return { row, scope };
}

async function ensureHelpCenterAccessible(adminUserId: number, id: number) {
  const scope = await getAdminSchoolScope(adminUserId);
  const row = await prisma.adminHelpArticle.findUniqueOrThrow({ where: { id } });
  assertSchoolInScope(scope, row.school);
  return { row, scope };
}

async function ensureBannerAccessible(adminUserId: number, id: number) {
  const scope = await getAdminSchoolScope(adminUserId);
  const row = await prisma.adminBannerConfig.findUniqueOrThrow({ where: { id } });
  assertSchoolInScope(scope, row.school);
  return { row, scope };
}

async function ensureRecommendAccessible(adminUserId: number, id: number) {
  const scope = await getAdminSchoolScope(adminUserId);
  const row = await prisma.adminRecommendConfig.findUniqueOrThrow({ where: { id } });
  assertSchoolInScope(scope, row.school);
  return { row, scope };
}

export async function querySearchWordList(adminUserId: number, rawQuery: Record<string, unknown>) {
  const { page, pageSize, skip } = parsePageParams(rawQuery);
  const keyword = String(rawQuery.keyword || "").trim();
  const school = String(rawQuery.school || "").trim();
  const scope = await getAdminSchoolScope(adminUserId);

  const where = {
    school: buildScopedSchoolWhere(scope, school),
    OR: keyword ? [{ keyword: toLikeText(keyword) }, { school: toLikeText(keyword) }] : undefined
  };

  const [total, rows, allRows] = await prisma.$transaction([
    prisma.adminSearchWord.count({ where }),
    prisma.adminSearchWord.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: [{ sort: "asc" }, { id: "desc" }]
    }),
    prisma.adminSearchWord.findMany({
      where: {
        school: buildScopedSchoolWhere(scope)
      },
      orderBy: [{ school: "asc" }, { sort: "asc" }, { id: "desc" }]
    })
  ]);

  return {
    list: rows.map(mapSearchWord),
    page,
    pageSize,
    total,
    summary: {
      total,
      enabledCount: allRows.filter((item: any) => item.status === "启用").length,
      schoolOptions: [...new Set(allRows.map((item: any) => item.school))]
    }
  };
}

export async function createSearchWord(adminUserId: number, payload: SearchWordPayload) {
  const scope = await getAdminSchoolScope(adminUserId);
  const row = await prisma.adminSearchWord.create({
    data: {
      ...payload,
      school: assertSchoolInScope(scope, payload.school)
    }
  });
  return mapSearchWord(row);
}

export async function updateSearchWord(adminUserId: number, id: number, payload: SearchWordPayload) {
  const { scope } = await ensureSearchWordAccessible(adminUserId, id);
  const row = await prisma.adminSearchWord.update({
    where: { id },
    data: {
      ...payload,
      school: assertSchoolInScope(scope, payload.school)
    }
  });
  return mapSearchWord(row);
}

export async function toggleSearchWordStatus(adminUserId: number, id: number) {
  const { row } = await ensureSearchWordAccessible(adminUserId, id);
  const updated = await prisma.adminSearchWord.update({
    where: { id },
    data: {
      status: row.status === "启用" ? "停用" : "启用"
    }
  });
  return mapSearchWord(updated);
}

export async function deleteSearchWord(adminUserId: number, id: number) {
  await ensureSearchWordAccessible(adminUserId, id);
  await prisma.adminSearchWord.delete({ where: { id } });
}

export async function queryHelpCenterList(adminUserId: number, rawQuery: Record<string, unknown>) {
  const { page, pageSize, skip } = parsePageParams(rawQuery);
  const keyword = String(rawQuery.keyword || "").trim();
  const school = String(rawQuery.school || "").trim();
  const category = String(rawQuery.category || "").trim();
  const status = String(rawQuery.status || "").trim();
  const scope = await getAdminSchoolScope(adminUserId);

  const where = {
    school: buildScopedSchoolWhere(scope, school),
    category: category || undefined,
    status: status || undefined,
    OR: keyword ? [{ title: toLikeText(keyword) }, { content: toLikeText(keyword) }] : undefined
  };

  const [total, rows, allRows] = await prisma.$transaction([
    prisma.adminHelpArticle.count({ where }),
    prisma.adminHelpArticle.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: [{ sort: "asc" }, { updatedAt: "desc" }, { id: "desc" }]
    }),
    prisma.adminHelpArticle.findMany({
      where: {
        school: buildScopedSchoolWhere(scope)
      },
      orderBy: [{ category: "asc" }, { sort: "asc" }, { id: "desc" }]
    })
  ]);

  return {
    list: rows.map(mapHelpArticle),
    page,
    pageSize,
    total,
    summary: {
      total,
      publishedCount: allRows.filter((item: any) => item.status === "发布中").length,
      categoryOptions: [...new Set(allRows.map((item: any) => item.category))],
      schoolOptions: [...new Set(allRows.map((item: any) => item.school))]
    }
  };
}

export async function createHelpCenter(adminUserId: number, payload: HelpCenterPayload) {
  const scope = await getAdminSchoolScope(adminUserId);
  const row = await prisma.adminHelpArticle.create({
    data: {
      ...payload,
      school: assertSchoolInScope(scope, payload.school)
    }
  });
  return mapHelpArticle(row);
}

export async function updateHelpCenter(adminUserId: number, id: number, payload: HelpCenterPayload) {
  const { scope } = await ensureHelpCenterAccessible(adminUserId, id);
  const row = await prisma.adminHelpArticle.update({
    where: { id },
    data: {
      ...payload,
      school: assertSchoolInScope(scope, payload.school)
    }
  });
  return mapHelpArticle(row);
}

export async function toggleHelpCenterStatus(adminUserId: number, id: number) {
  const { row } = await ensureHelpCenterAccessible(adminUserId, id);
  const updated = await prisma.adminHelpArticle.update({
    where: { id },
    data: {
      status: row.status === "发布中" ? "草稿" : "发布中"
    }
  });
  return mapHelpArticle(updated);
}

export async function deleteHelpCenter(adminUserId: number, id: number) {
  await ensureHelpCenterAccessible(adminUserId, id);
  await prisma.adminHelpArticle.delete({ where: { id } });
}

export async function queryBannerConfigList(adminUserId: number, rawQuery: Record<string, unknown>) {
  const { page, pageSize, skip } = parsePageParams(rawQuery);
  const keyword = String(rawQuery.keyword || "").trim();
  const school = String(rawQuery.school || "").trim();
  const position = String(rawQuery.position || "").trim();
  const status = String(rawQuery.status || "").trim();
  const scope = await getAdminSchoolScope(adminUserId);

  const where = {
    school: buildScopedSchoolWhere(scope, school),
    position: position || undefined,
    status: status || undefined,
    OR: keyword ? [{ title: toLikeText(keyword) }, { remark: toLikeText(keyword) }] : undefined
  };

  const [total, rows, allRows] = await prisma.$transaction([
    prisma.adminBannerConfig.count({ where }),
    prisma.adminBannerConfig.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: [{ sort: "asc" }, { id: "desc" }]
    }),
    prisma.adminBannerConfig.findMany({
      where: {
        school: buildScopedSchoolWhere(scope)
      },
      orderBy: [{ position: "asc" }, { sort: "asc" }, { id: "desc" }]
    })
  ]);

  return {
    list: rows.map(mapBanner),
    page,
    pageSize,
    total,
    summary: {
      total,
      enabledCount: allRows.filter((item: any) => item.status === "启用").length,
      positionOptions: [...new Set(allRows.map((item: any) => item.position))],
      schoolOptions: [...new Set(allRows.map((item: any) => item.school))]
    }
  };
}

export async function createBannerConfig(adminUserId: number, payload: BannerConfigPayload) {
  const scope = await getAdminSchoolScope(adminUserId);
  const row = await prisma.adminBannerConfig.create({
    data: {
      ...payload,
      school: assertSchoolInScope(scope, payload.school)
    }
  });
  return mapBanner(row);
}

export async function updateBannerConfig(adminUserId: number, id: number, payload: BannerConfigPayload) {
  const { scope } = await ensureBannerAccessible(adminUserId, id);
  const row = await prisma.adminBannerConfig.update({
    where: { id },
    data: {
      ...payload,
      school: assertSchoolInScope(scope, payload.school)
    }
  });
  return mapBanner(row);
}

export async function toggleBannerConfigStatus(adminUserId: number, id: number) {
  const { row } = await ensureBannerAccessible(adminUserId, id);
  const updated = await prisma.adminBannerConfig.update({
    where: { id },
    data: {
      status: row.status === "启用" ? "停用" : "启用"
    }
  });
  return mapBanner(updated);
}

export async function deleteBannerConfig(adminUserId: number, id: number) {
  await ensureBannerAccessible(adminUserId, id);
  await prisma.adminBannerConfig.delete({ where: { id } });
}

export async function queryRecommendConfigList(adminUserId: number, rawQuery: Record<string, unknown>) {
  const { page, pageSize, skip } = parsePageParams(rawQuery);
  const keyword = String(rawQuery.keyword || "").trim();
  const school = String(rawQuery.school || "").trim();
  const type = String(rawQuery.type || "").trim();
  const status = String(rawQuery.status || "").trim();
  const scope = await getAdminSchoolScope(adminUserId);

  const where = {
    school: buildScopedSchoolWhere(scope, school),
    type: type || undefined,
    status: status || undefined,
    OR: keyword ? [{ title: toLikeText(keyword) }, { targetName: toLikeText(keyword) }] : undefined
  };

  const [total, rows, allRows] = await prisma.$transaction([
    prisma.adminRecommendConfig.count({ where }),
    prisma.adminRecommendConfig.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: [{ sort: "asc" }, { id: "desc" }]
    }),
    prisma.adminRecommendConfig.findMany({
      where: {
        school: buildScopedSchoolWhere(scope)
      },
      orderBy: [{ type: "asc" }, { sort: "asc" }, { id: "desc" }]
    })
  ]);

  return {
    list: rows.map(mapRecommend),
    page,
    pageSize,
    total,
    summary: {
      total,
      enabledCount: allRows.filter((item: any) => item.status === "启用").length,
      typeOptions: [...new Set(allRows.map((item: any) => item.type))],
      schoolOptions: [...new Set(allRows.map((item: any) => item.school))]
    }
  };
}

export async function createRecommendConfig(adminUserId: number, payload: RecommendConfigPayload) {
  const scope = await getAdminSchoolScope(adminUserId);
  const row = await prisma.adminRecommendConfig.create({
    data: {
      ...payload,
      school: assertSchoolInScope(scope, payload.school)
    }
  });
  return mapRecommend(row);
}

export async function updateRecommendConfig(adminUserId: number, id: number, payload: RecommendConfigPayload) {
  const { scope } = await ensureRecommendAccessible(adminUserId, id);
  const row = await prisma.adminRecommendConfig.update({
    where: { id },
    data: {
      ...payload,
      school: assertSchoolInScope(scope, payload.school)
    }
  });
  return mapRecommend(row);
}

export async function toggleRecommendConfigStatus(adminUserId: number, id: number) {
  const { row } = await ensureRecommendAccessible(adminUserId, id);
  const updated = await prisma.adminRecommendConfig.update({
    where: { id },
    data: {
      status: row.status === "启用" ? "停用" : "启用"
    }
  });
  return mapRecommend(updated);
}

export async function deleteRecommendConfig(adminUserId: number, id: number) {
  await ensureRecommendAccessible(adminUserId, id);
  await prisma.adminRecommendConfig.delete({ where: { id } });
}
