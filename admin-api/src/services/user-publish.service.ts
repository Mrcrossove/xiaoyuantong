import { prisma } from "../lib/prisma";
import { parsePageParams } from "../utils/pagination";
import { formatDateTime } from "../utils/time";
import type { UserPublishPayload } from "../controllers/schemas";
import { assertSchoolInScope, buildScopedSchoolWhere, getAdminSchoolScope } from "./admin-scope.service";

function toLikeText(value?: string) {
  if (!value) return undefined;
  return { contains: value, mode: "insensitive" as const };
}

function mapRecord(item: Awaited<ReturnType<typeof prisma.userPublishRecord.findFirstOrThrow>>) {
  return {
    ...item,
    createdAt: formatDateTime(item.createdAt)
  };
}

async function ensureUserPublishAccessible(adminUserId: number, id: number) {
  const scope = await getAdminSchoolScope(adminUserId);
  const row = await prisma.userPublishRecord.findUniqueOrThrow({ where: { id } });
  assertSchoolInScope(scope, row.school);
  return { row, scope };
}

export async function queryUserPublish(adminUserId: number, rawQuery: Record<string, unknown>) {
  const { page, pageSize, skip } = parsePageParams(rawQuery);
  const keyword = String(rawQuery.keyword || "");
  const school = String(rawQuery.school || "");
  const type = String(rawQuery.type || "");
  const status = String(rawQuery.status || "");
  const scope = await getAdminSchoolScope(adminUserId);

  const where = {
    school: buildScopedSchoolWhere(scope, school),
    type: type || undefined,
    status: status || undefined,
    OR: keyword ? [{ user: toLikeText(keyword) }, { title: toLikeText(keyword) }] : undefined
  };

  const [total, list] = await prisma.$transaction([
    prisma.userPublishRecord.count({ where }),
    prisma.userPublishRecord.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { id: "desc" }
    })
  ]);

  return {
    list: list.map(mapRecord),
    page,
    pageSize,
    total
  };
}

export async function createUserPublish(adminUserId: number, payload: UserPublishPayload) {
  const scope = await getAdminSchoolScope(adminUserId);
  const row = await prisma.userPublishRecord.create({
    data: {
      ...payload,
      school: assertSchoolInScope(scope, payload.school)
    }
  });
  return mapRecord(row);
}

export async function updateUserPublish(adminUserId: number, id: number, payload: UserPublishPayload) {
  const { scope } = await ensureUserPublishAccessible(adminUserId, id);
  const row = await prisma.userPublishRecord.update({
    where: { id },
    data: {
      ...payload,
      school: assertSchoolInScope(scope, payload.school)
    }
  });
  return mapRecord(row);
}

export async function toggleUserPublishStatus(adminUserId: number, id: number) {
  const { row } = await ensureUserPublishAccessible(adminUserId, id);
  const activeStatus = row.type === "商品" ? "已上架" : "已发布";
  const updated = await prisma.userPublishRecord.update({
    where: { id },
    data: { status: row.status === activeStatus ? "已停用" : activeStatus }
  });
  return mapRecord(updated);
}

export async function deleteUserPublish(adminUserId: number, id: number) {
  await ensureUserPublishAccessible(adminUserId, id);
  return prisma.userPublishRecord.delete({ where: { id } });
}

export async function batchDeleteUserPublish(adminUserId: number, ids: number[]) {
  const scope = await getAdminSchoolScope(adminUserId);
  const rows = await prisma.userPublishRecord.findMany({
    where: { id: { in: ids } },
    select: { school: true }
  });
  rows.forEach((item: { school: string }) => assertSchoolInScope(scope, item.school));
  return prisma.userPublishRecord.deleteMany({ where: { id: { in: ids } } });
}

export async function batchSetUserPublishStatus(adminUserId: number, ids: number[], status: string) {
  const scope = await getAdminSchoolScope(adminUserId);
  const rows = await prisma.userPublishRecord.findMany({
    where: { id: { in: ids } },
    select: { school: true }
  });
  rows.forEach((item: { school: string }) => assertSchoolInScope(scope, item.school));
  return prisma.userPublishRecord.updateMany({ where: { id: { in: ids } }, data: { status } });
}
