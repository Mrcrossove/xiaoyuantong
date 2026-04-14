import { prisma } from "../lib/prisma";
import { parsePageParams } from "../utils/pagination";
import type { SchoolContentPayload } from "../controllers/schemas";
import { assertSchoolInScope, buildScopedSchoolWhere, getAdminSchoolScope } from "./admin-scope.service";

function toLikeText(value?: string) {
  if (!value) return undefined;
  return { contains: value, mode: "insensitive" as const };
}

async function ensureSchoolContentAccessible(adminUserId: number, id: number) {
  const scope = await getAdminSchoolScope(adminUserId);
  const row = await prisma.schoolContent.findUniqueOrThrow({ where: { id } });
  assertSchoolInScope(scope, row.school);
  return { row, scope };
}

export async function querySchoolContent(adminUserId: number, rawQuery: Record<string, unknown>) {
  const { page, pageSize, skip } = parsePageParams(rawQuery);
  const keyword = String(rawQuery.keyword || "").trim();
  const school = String(rawQuery.school || "").trim();
  const status = String(rawQuery.status || "").trim();
  const scope = await getAdminSchoolScope(adminUserId);

  const where = {
    school: buildScopedSchoolWhere(scope, school),
    status: status || undefined,
    OR: keyword ? [{ school: toLikeText(keyword) }] : undefined
  };

  const [total, list] = await prisma.$transaction([
    prisma.schoolContent.count({ where }),
    prisma.schoolContent.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { id: "desc" }
    })
  ]);

  return { list, page, pageSize, total };
}

export async function createSchoolContent(adminUserId: number, payload: SchoolContentPayload) {
  const scope = await getAdminSchoolScope(adminUserId);
  return prisma.schoolContent.create({
    data: {
      ...payload,
      school: assertSchoolInScope(scope, payload.school)
    }
  });
}

export async function updateSchoolContent(adminUserId: number, id: number, payload: SchoolContentPayload) {
  const { scope } = await ensureSchoolContentAccessible(adminUserId, id);
  return prisma.schoolContent.update({
    where: { id },
    data: {
      ...payload,
      school: assertSchoolInScope(scope, payload.school)
    }
  });
}

export async function toggleSchoolContentStatus(adminUserId: number, id: number) {
  const { row } = await ensureSchoolContentAccessible(adminUserId, id);
  return prisma.schoolContent.update({
    where: { id },
    data: { status: row.status === "启用" ? "停用" : "启用" }
  });
}

export async function deleteSchoolContent(adminUserId: number, id: number) {
  await ensureSchoolContentAccessible(adminUserId, id);
  return prisma.schoolContent.delete({ where: { id } });
}

export async function batchDeleteSchoolContent(adminUserId: number, ids: number[]) {
  const scope = await getAdminSchoolScope(adminUserId);
  const rows = await prisma.schoolContent.findMany({
    where: { id: { in: ids } },
    select: { id: true, school: true }
  });
  rows.forEach((item: any) => assertSchoolInScope(scope, item.school));
  return prisma.schoolContent.deleteMany({ where: { id: { in: ids } } });
}

export async function batchSetSchoolContentStatus(adminUserId: number, ids: number[], status: string) {
  const scope = await getAdminSchoolScope(adminUserId);
  const rows = await prisma.schoolContent.findMany({
    where: { id: { in: ids } },
    select: { id: true, school: true }
  });
  rows.forEach((item: any) => assertSchoolInScope(scope, item.school));
  return prisma.schoolContent.updateMany({ where: { id: { in: ids } }, data: { status } });
}
