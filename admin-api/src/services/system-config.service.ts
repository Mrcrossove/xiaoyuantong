import { prisma } from "../lib/prisma";
import { parsePageParams } from "../utils/pagination";
import { formatDateTime } from "../utils/time";
import type { BasicConfigPayload, DictItemPayload, DictTypePayload } from "../controllers/schemas";

function toLikeText(value?: string) {
  if (!value) return undefined;
  return { contains: value, mode: "insensitive" as const };
}

function mapBasicConfig(item: any) {
  return {
    id: item.id,
    sectionKey: item.sectionKey,
    sectionTitle: item.sectionTitle,
    configKey: item.configKey,
    label: item.label,
    value: item.valueType === "switch" ? item.value === "true" : item.value,
    valueType: item.valueType,
    suffix: item.suffix || "",
    sort: item.sort,
    status: item.status,
    remark: item.remark || "",
    updatedAt: formatDateTime(item.updatedAt)
  };
}

function mapDictType(item: any) {
  return {
    id: item.id,
    name: item.name,
    code: item.code,
    status: item.status,
    remark: item.remark || "",
    sort: item.sort,
    updatedAt: formatDateTime(item.updatedAt)
  };
}

function mapDictItem(item: any) {
  return {
    id: item.id,
    typeId: item.typeId,
    label: item.label,
    value: item.value,
    sort: item.sort,
    status: item.status,
    remark: item.remark || "",
    updatedAt: formatDateTime(item.updatedAt)
  };
}

function normalizeBasicPayload(payload: BasicConfigPayload) {
  return {
    ...payload,
    value: payload.valueType === "switch" ? String(payload.value === true || payload.value === "true") : String(payload.value ?? "")
  };
}

export async function queryBasicConfigList(rawQuery: Record<string, unknown>) {
  const { page, pageSize, skip } = parsePageParams(rawQuery);
  const keyword = String(rawQuery.keyword || "").trim();
  const status = String(rawQuery.status || "").trim();
  const sectionKey = String(rawQuery.sectionKey || "").trim();

  const where = {
    sectionKey: sectionKey || undefined,
    status: status || undefined,
    OR: keyword ? [{ label: toLikeText(keyword) }, { configKey: toLikeText(keyword) }] : undefined
  };

  const [total, rows, allRows] = await prisma.$transaction([
    prisma.adminSystemConfig.count({ where }),
    prisma.adminSystemConfig.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: [{ sectionKey: "asc" }, { sort: "asc" }, { id: "desc" }]
    }),
    prisma.adminSystemConfig.findMany({
      orderBy: [{ sectionKey: "asc" }, { sort: "asc" }, { id: "desc" }]
    })
  ]);

  return {
    list: rows.map(mapBasicConfig),
    page,
    pageSize,
    total,
    summary: {
      total,
      enabledCount: allRows.filter((item: any) => item.status === "启用").length,
      sectionOptions: [...new Set(allRows.map((item: any) => item.sectionTitle))]
    }
  };
}

export async function createBasicConfig(payload: BasicConfigPayload) {
  const row = await prisma.adminSystemConfig.create({
    data: normalizeBasicPayload(payload)
  });
  return mapBasicConfig(row);
}

export async function updateBasicConfig(id: number, payload: BasicConfigPayload) {
  const row = await prisma.adminSystemConfig.update({
    where: { id },
    data: normalizeBasicPayload(payload)
  });
  return mapBasicConfig(row);
}

export async function toggleBasicConfigStatus(id: number) {
  const row = await prisma.adminSystemConfig.findUniqueOrThrow({ where: { id } });
  const updated = await prisma.adminSystemConfig.update({
    where: { id },
    data: {
      status: row.status === "启用" ? "停用" : "启用"
    }
  });
  return mapBasicConfig(updated);
}

export async function deleteBasicConfig(id: number) {
  await prisma.adminSystemConfig.delete({ where: { id } });
}

export async function queryDictConfig() {
  const rows = await prisma.adminDictType.findMany({
    include: {
      items: {
        orderBy: [{ sort: "asc" }, { id: "desc" }]
      }
    },
    orderBy: [{ sort: "asc" }, { id: "asc" }]
  });

  const types = rows.map(mapDictType);
  const items = rows.reduce(
    (result: Record<number, ReturnType<typeof mapDictItem>[]>, item: any) => {
      result[item.id] = item.items.map(mapDictItem);
      return result;
    },
    {}
  );

  return {
    types,
    items,
    summary: {
      typeCount: types.length,
      itemCount: rows.reduce((sum: number, item: any) => sum + item.items.length, 0)
    }
  };
}

export async function createDictType(payload: DictTypePayload) {
  const row = await prisma.adminDictType.create({
    data: payload
  });
  return mapDictType(row);
}

export async function updateDictType(id: number, payload: DictTypePayload) {
  const row = await prisma.adminDictType.update({
    where: { id },
    data: payload
  });
  return mapDictType(row);
}

export async function toggleDictTypeStatus(id: number) {
  const row = await prisma.adminDictType.findUniqueOrThrow({ where: { id } });
  const updated = await prisma.adminDictType.update({
    where: { id },
    data: {
      status: row.status === "启用" ? "停用" : "启用"
    }
  });
  return mapDictType(updated);
}

export async function deleteDictType(id: number) {
  await prisma.adminDictType.delete({ where: { id } });
}

export async function createDictItem(payload: DictItemPayload) {
  const row = await prisma.adminDictItem.create({
    data: payload
  });
  return mapDictItem(row);
}

export async function updateDictItem(id: number, payload: DictItemPayload) {
  const row = await prisma.adminDictItem.update({
    where: { id },
    data: payload
  });
  return mapDictItem(row);
}

export async function toggleDictItemStatus(id: number) {
  const row = await prisma.adminDictItem.findUniqueOrThrow({ where: { id } });
  const updated = await prisma.adminDictItem.update({
    where: { id },
    data: {
      status: row.status === "启用" ? "停用" : "启用"
    }
  });
  return mapDictItem(updated);
}

export async function deleteDictItem(id: number) {
  await prisma.adminDictItem.delete({ where: { id } });
}
