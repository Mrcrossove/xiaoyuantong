import { prisma } from "../lib/prisma";
import { parsePageParams } from "../utils/pagination";
import { formatDateTime } from "../utils/time";
import type { MessageTemplatePayload } from "../controllers/schemas";
import { assertSchoolInScope, buildScopedSchoolWhere, getAdminSchoolScope } from "./admin-scope.service";

function paginateList<T>(list: T[], page: number, pageSize: number) {
  const start = (page - 1) * pageSize;
  return list.slice(start, start + pageSize);
}

function toLikeText(value?: string) {
  if (!value) return undefined;
  return { contains: value, mode: "insensitive" as const };
}

function mapTemplate(item: any) {
  return {
    id: item.id,
    code: item.code,
    name: item.name,
    school: item.school,
    channel: item.channel,
    status: item.status,
    content: item.content,
    remark: item.remark || "",
    createdAt: formatDateTime(item.createdAt),
    updatedAt: formatDateTime(item.updatedAt)
  };
}

function buildSummarySchoolText(value: string | null | undefined) {
  return String(value || "").trim() || "全部高校";
}

async function ensureMessageTemplateAccessible(adminUserId: number, id: number) {
  const scope = await getAdminSchoolScope(adminUserId);
  const row = await prisma.adminMessageTemplate.findUniqueOrThrow({
    where: { id }
  });
  assertSchoolInScope(scope, row.school);
  return { row, scope };
}

export async function queryAdminSystemMessageList(adminUserId: number, rawQuery: Record<string, unknown>) {
  const { page, pageSize } = parsePageParams(rawQuery);
  const keyword = String(rawQuery.keyword || "").trim();
  const status = String(rawQuery.status || "").trim();
  const channel = String(rawQuery.channel || "").trim();
  const scope = await getAdminSchoolScope(adminUserId);

  const rows = await prisma.miniMessage.findMany({
    where: {
      type: "system",
      school: buildScopedSchoolWhere(scope)
    },
    orderBy: { id: "desc" }
  });

  const mapped = rows.map((item: any) => ({
    id: item.id,
    title: item.content,
    school: buildSummarySchoolText(item.school),
    target: item.receiverUserId ? "指定用户" : "全校用户",
    channel: "小程序站内信",
    updatedAt: formatDateTime(item.createdAt),
    status: item.status
  }));

  const filtered = mapped.filter((item: any) => {
    const matchKeyword = !keyword || item.title.includes(keyword) || item.school.includes(keyword);
    const matchStatus = !status || item.status === status;
    const matchChannel = !channel || item.channel === channel;
    return matchKeyword && matchStatus && matchChannel;
  });

  return {
    list: paginateList(filtered, page, pageSize),
    page,
    pageSize,
    total: filtered.length,
    summary: {
      total: filtered.length,
      enabledCount: filtered.filter((item: any) => item.status === "已发送").length,
      channelOptions: [...new Set(mapped.map((item: any) => item.channel))]
    }
  };
}

export async function queryAdminSendRecordList(adminUserId: number, rawQuery: Record<string, unknown>) {
  const { page, pageSize } = parsePageParams(rawQuery);
  const school = String(rawQuery.school || "").trim();
  const status = String(rawQuery.status || "").trim();
  const scope = await getAdminSchoolScope(adminUserId);

  const rows = await prisma.miniMessage.groupBy({
    by: ["school", "type", "status", "createdAt", "content"],
    where: {
      type: "system",
      school: buildScopedSchoolWhere(scope, school)
    },
    _count: {
      _all: true
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  const mapped = rows.map((item: any, index: number) => ({
    id: index + 1,
    title: item.content,
    school: buildSummarySchoolText(item.school),
    channel: "小程序站内信",
    targetCount: item._count._all,
    operator: "管理员",
    sendTime: formatDateTime(item.createdAt),
    status: item.status === "已发送" ? "发送成功" : item.status
  }));

  const filtered = mapped.filter((item: any) => {
    const matchSchool = !school || item.school === school;
    const matchStatus = !status || item.status === status;
    return matchSchool && matchStatus;
  });

  return {
    list: paginateList(filtered, page, pageSize),
    page,
    pageSize,
    total: filtered.length,
    summary: {
      total: filtered.length,
      successCount: filtered.filter((item: any) => item.status === "发送成功").length,
      targetTotal: filtered.reduce((sum: number, item: any) => sum + item.targetCount, 0),
      schoolOptions: [...new Set(mapped.map((item: any) => item.school))]
    }
  };
}

export async function queryAdminInteractiveMessageList(adminUserId: number, rawQuery: Record<string, unknown>) {
  const { page, pageSize } = parsePageParams(rawQuery);
  const keyword = String(rawQuery.keyword || "").trim();
  const type = String(rawQuery.type || "").trim();
  const scope = await getAdminSchoolScope(adminUserId);

  const rows = await prisma.miniMessage.findMany({
    where: {
      type: "interactive",
      school: buildScopedSchoolWhere(scope)
    },
    include: {
      _count: {
        select: {
          reads: true
        }
      }
    },
    orderBy: { id: "desc" }
  });

  const mapped = rows.map((item: any) => ({
    id: item.id,
    school: buildSummarySchoolText(item.school),
    user: item.receiverUserId ? `用户${item.receiverUserId}` : "全体用户",
    type: item.category || "互动消息",
    target: item.targetType ? `${item.targetType}:${item.targetId || "-"}` : "推荐内容",
    content: item.content,
    status: item._count.reads > 0 ? "已读" : "未读",
    createdAt: formatDateTime(item.createdAt)
  }));

  const filtered = mapped.filter((item: any) => {
    const matchKeyword =
      !keyword || item.school.includes(keyword) || item.content.includes(keyword) || item.target.includes(keyword);
    const matchType = !type || item.type === type;
    return matchKeyword && matchType;
  });

  return {
    list: paginateList(filtered, page, pageSize),
    page,
    pageSize,
    total: filtered.length,
    summary: {
      total: filtered.length,
      unreadCount: filtered.filter((item: any) => item.status === "未读").length,
      typeOptions: [...new Set(mapped.map((item: any) => item.type))]
    }
  };
}

export async function queryMessageTemplateList(adminUserId: number, rawQuery: Record<string, unknown>) {
  const { page, pageSize, skip } = parsePageParams(rawQuery);
  const keyword = String(rawQuery.keyword || "").trim();
  const status = String(rawQuery.status || "").trim();
  const school = String(rawQuery.school || "").trim();
  const scope = await getAdminSchoolScope(adminUserId);

  const where = {
    school: buildScopedSchoolWhere(scope, school),
    status: status || undefined,
    OR: keyword ? [{ name: toLikeText(keyword) }, { code: toLikeText(keyword) }] : undefined
  };

  const [total, rows, allRows] = await prisma.$transaction([
    prisma.adminMessageTemplate.count({ where }),
    prisma.adminMessageTemplate.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }]
    }),
    prisma.adminMessageTemplate.findMany({
      where: {
        school: buildScopedSchoolWhere(scope)
      },
      orderBy: [{ channel: "asc" }, { school: "asc" }, { id: "desc" }]
    })
  ]);

  return {
    list: rows.map(mapTemplate),
    page,
    pageSize,
    total,
    summary: {
      total,
      enabledCount: allRows.filter((item: any) => item.status === "启用").length,
      channelOptions: [...new Set(allRows.map((item: any) => item.channel))],
      schoolOptions: [...new Set(allRows.map((item: any) => item.school))]
    }
  };
}

export async function createMessageTemplate(adminUserId: number, payload: MessageTemplatePayload) {
  const scope = await getAdminSchoolScope(adminUserId);
  const row = await prisma.adminMessageTemplate.create({
    data: {
      ...payload,
      school: assertSchoolInScope(scope, payload.school)
    }
  });
  return mapTemplate(row);
}

export async function updateMessageTemplate(adminUserId: number, id: number, payload: MessageTemplatePayload) {
  const { scope } = await ensureMessageTemplateAccessible(adminUserId, id);
  const row = await prisma.adminMessageTemplate.update({
    where: { id },
    data: {
      ...payload,
      school: assertSchoolInScope(scope, payload.school)
    }
  });
  return mapTemplate(row);
}

export async function toggleMessageTemplateStatus(adminUserId: number, id: number) {
  const { row } = await ensureMessageTemplateAccessible(adminUserId, id);
  const updated = await prisma.adminMessageTemplate.update({
    where: { id },
    data: {
      status: row.status === "启用" ? "停用" : "启用"
    }
  });
  return mapTemplate(updated);
}

export async function deleteMessageTemplate(adminUserId: number, id: number) {
  await ensureMessageTemplateAccessible(adminUserId, id);
  await prisma.adminMessageTemplate.delete({
    where: { id }
  });
}
