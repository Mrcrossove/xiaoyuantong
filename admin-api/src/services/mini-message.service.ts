import { prisma } from "../lib/prisma";
import { formatDateTime } from "../utils/time";
import { ApiError } from "../utils/api-error";
import { ERROR_CODES } from "../constants/error-codes";
import type { MiniMessageReadAllPayload } from "../controllers/schemas";

interface CreateMiniMessageInput {
  school: string;
  type: "system" | "interactive";
  category: string;
  content: string;
  receiverUserId?: number | null;
  targetType?: string;
  targetId?: string;
}

function mapMessage(item: any) {
  return {
    id: item.id,
    school: item.school,
    type: item.type,
    category: item.category,
    content: item.content,
    status: item.status,
    time: formatDateTime(item.createdAt),
    read: !!item.read,
    targetType: item.targetType || "",
    targetId: item.targetId || ""
  };
}

export async function createMiniMessage(input: CreateMiniMessageInput) {
  return prisma.miniMessage.create({
    data: {
      school: input.school,
      type: input.type,
      category: input.category,
      content: input.content,
      status: "\u5df2\u53d1\u9001",
      receiverUserId: input.receiverUserId ?? null,
      targetType: input.targetType || "",
      targetId: input.targetId || ""
    }
  });
}

async function buildReadMap(userId: number, messageIds: number[]) {
  if (!messageIds.length) {
    return new Set<number>();
  }
  const reads = await prisma.miniMessageRead.findMany({
    where: {
      userId,
      messageId: {
        in: messageIds
      }
    }
  });
  return new Set(reads.map((item: any) => item.messageId));
}

export async function queryMiniMessages(userId: number, rawQuery: Record<string, unknown>) {
  const school = String(rawQuery.school || "");
  const keyword = String(rawQuery.keyword || "").trim();

  const andFilters: any[] = [];

  if (keyword) {
    andFilters.push({
      OR: [
        {
          school: {
            contains: keyword
          }
        },
        {
          category: {
            contains: keyword
          }
        },
        {
          content: {
            contains: keyword
          }
        }
      ]
    });
  }

  const list = await prisma.miniMessage.findMany({
    where: {
      AND: andFilters,
      OR: [
        {
          receiverUserId: userId
        },
        {
          receiverUserId: null,
          school: school || undefined
        }
      ]
    },
    orderBy: { id: "desc" }
  });

  const readMap = await buildReadMap(
    userId,
    list.map((item: any) => item.id)
  );

  const mapped = list.map((item: any) =>
    mapMessage({
      ...item,
      read: readMap.has(item.id)
    })
  );

  const systemMessages = mapped.filter((item: any) => item.type === "system");
  const interactiveMessages = mapped.filter((item: any) => item.type === "interactive");

  return {
    systemMessages,
    interactiveMessages,
    unreadCount: {
      system: systemMessages.filter((item: any) => !item.read).length,
      interactive: interactiveMessages.filter((item: any) => !item.read).length
    }
  };
}

export async function markMiniMessageRead(userId: number, id: number) {
  const message = await prisma.miniMessage.findFirst({
    where: {
      id,
      OR: [{ receiverUserId: userId }, { receiverUserId: null }]
    }
  });

  if (!message) {
    throw new ApiError("\u6d88\u606f\u4e0d\u5b58\u5728", ERROR_CODES.NOT_FOUND, 404);
  }

  await prisma.miniMessageRead.upsert({
    where: {
      messageId_userId: {
        messageId: id,
        userId
      }
    },
    update: {
      readAt: new Date()
    },
    create: {
      messageId: id,
      userId
    }
  });

  return {
    id,
    read: true
  };
}

export async function markAllMiniMessagesRead(userId: number, payload: MiniMessageReadAllPayload, rawQuery: Record<string, unknown>) {
  const school = String(rawQuery.school || "");
  const type = payload.type || undefined;

  const list = await prisma.miniMessage.findMany({
    where: {
      type,
      OR: [
        {
          receiverUserId: userId
        },
        {
          receiverUserId: null,
          school: school || undefined
        }
      ]
    },
    select: {
      id: true
    }
  });

  if (!list.length) {
    return {
      count: 0
    };
  }

  await prisma.miniMessageRead.createMany({
    data: list.map((item: any) => ({
      messageId: item.id,
      userId
    })),
    skipDuplicates: true
  });

  return {
    count: list.length
  };
}

export async function getMiniMessageUnreadSummary(userId: number, rawQuery: Record<string, unknown>) {
  const data = await queryMiniMessages(userId, rawQuery);
  return data.unreadCount;
}
