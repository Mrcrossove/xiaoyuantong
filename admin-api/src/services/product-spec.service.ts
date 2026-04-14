import { prisma } from "../lib/prisma";
import { parsePageParams } from "../utils/pagination";
import { formatDateTime } from "../utils/time";
import type { ProductSpecPayload } from "../controllers/schemas";
import { assertSchoolInScope, buildScopedSchoolWhere, getAdminSchoolScope } from "./admin-scope.service";

function toLikeText(value?: string) {
  if (!value) return undefined;
  return { contains: value, mode: "insensitive" as const };
}

function mapSpec(item: Awaited<ReturnType<typeof prisma.productSpec.findFirstOrThrow>>) {
  return {
    ...item,
    updatedAt: formatDateTime(item.updatedAt)
  };
}

async function ensureProductSpecAccessible(adminUserId: number, id: number) {
  const scope = await getAdminSchoolScope(adminUserId);
  const row = await prisma.productSpec.findUniqueOrThrow({ where: { id } });
  assertSchoolInScope(scope, row.school);
  return { row, scope };
}

export async function queryProductSpec(adminUserId: number, rawQuery: Record<string, unknown>) {
  const { page, pageSize, skip } = parsePageParams(rawQuery);
  const keyword = String(rawQuery.keyword || "");
  const school = String(rawQuery.school || "");
  const storeName = String(rawQuery.storeName || "");
  const status = String(rawQuery.status || "");
  const scope = await getAdminSchoolScope(adminUserId);

  const where = {
    school: buildScopedSchoolWhere(scope, school),
    storeName: storeName || undefined,
    status: status || undefined,
    OR: keyword ? [{ productName: toLikeText(keyword) }, { specValue: toLikeText(keyword) }] : undefined
  };

  const [total, list] = await prisma.$transaction([
    prisma.productSpec.count({ where }),
    prisma.productSpec.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { id: "desc" }
    })
  ]);

  return {
    list: list.map(mapSpec),
    page,
    pageSize,
    total
  };
}

export async function createProductSpec(adminUserId: number, payload: ProductSpecPayload) {
  const scope = await getAdminSchoolScope(adminUserId);
  const row = await prisma.productSpec.create({
    data: {
      ...payload,
      school: assertSchoolInScope(scope, payload.school)
    }
  });
  return mapSpec(row);
}

export async function updateProductSpec(adminUserId: number, id: number, payload: ProductSpecPayload) {
  const { scope } = await ensureProductSpecAccessible(adminUserId, id);
  const row = await prisma.productSpec.update({
    where: { id },
    data: {
      ...payload,
      school: assertSchoolInScope(scope, payload.school)
    }
  });
  return mapSpec(row);
}

export async function toggleProductSpecStatus(adminUserId: number, id: number) {
  const { row } = await ensureProductSpecAccessible(adminUserId, id);
  const updated = await prisma.productSpec.update({
    where: { id },
    data: { status: row.status === "启用" ? "停用" : "启用" }
  });
  return mapSpec(updated);
}

export async function deleteProductSpec(adminUserId: number, id: number) {
  await ensureProductSpecAccessible(adminUserId, id);
  return prisma.productSpec.delete({ where: { id } });
}

export async function batchDeleteProductSpec(adminUserId: number, ids: number[]) {
  const scope = await getAdminSchoolScope(adminUserId);
  const rows = await prisma.productSpec.findMany({
    where: { id: { in: ids } },
    select: { school: true }
  });
  rows.forEach((item: { school: string }) => assertSchoolInScope(scope, item.school));
  return prisma.productSpec.deleteMany({ where: { id: { in: ids } } });
}

export async function batchSetProductSpecStatus(adminUserId: number, ids: number[], status: string) {
  const scope = await getAdminSchoolScope(adminUserId);
  const rows = await prisma.productSpec.findMany({
    where: { id: { in: ids } },
    select: { school: true }
  });
  rows.forEach((item: { school: string }) => assertSchoolInScope(scope, item.school));
  return prisma.productSpec.updateMany({ where: { id: { in: ids } }, data: { status } });
}
