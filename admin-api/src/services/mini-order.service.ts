import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { parsePageParams } from "../utils/pagination";
import type { MiniOrderCreatePayload } from "../controllers/schemas";
import { ApiError } from "../utils/api-error";
import { ERROR_CODES } from "../constants/error-codes";
import { createMiniMessage } from "./mini-message.service";

const ORDER_STATUS = {
  pending: "待支付",
  processing: "进行中",
  finished: "已完成",
  canceled: "已取消"
} as const;

const PAY_STATUS = {
  pending: "待支付",
  paid: "已支付"
} as const;

type StoreProduct = {
  id: string;
  name: string;
  desc?: string;
  price?: string;
  cover?: string;
  stock?: number;
  dailyLimit?: number;
};

function toArray(value: Prisma.JsonValue | null | undefined) {
  return Array.isArray(value) ? value : [];
}

function parsePrice(rawPrice: unknown) {
  const text = String(rawPrice || "").replace(/[^\d.]/g, "");
  const price = Number(text);
  if (!Number.isFinite(price) || price <= 0) {
    throw new ApiError("商品价格异常", ERROR_CODES.BAD_REQUEST, 400);
  }
  return Number(price.toFixed(2));
}

function buildOrderNo() {
  return `${Date.now()}${Math.floor(Math.random() * 900 + 100)}`;
}

function formatTime(value: Date | null | undefined) {
  if (!value) return "";
  return value.toISOString().slice(0, 16).replace("T", " ");
}

function mapStatusKey(status: string) {
  if (status === ORDER_STATUS.pending) return "pending";
  if (status === ORDER_STATUS.processing) return "processing";
  if (status === ORDER_STATUS.finished) return "finished";
  if (status === ORDER_STATUS.canceled) return "canceled";
  return "all";
}

function mapSettlementStatus(status: string, payStatus: string) {
  if (status === ORDER_STATUS.finished) return "已结算";
  if (status === ORDER_STATUS.processing) return "待结算";
  if (status === ORDER_STATUS.canceled) return "已关闭";
  if (payStatus === PAY_STATUS.pending) return "未结算";
  return "未结算";
}

function mapOrder(item: any) {
  return {
    id: item.id,
    orderNo: item.orderNo,
    displayNo: `订单编号 ${item.orderNo}`,
    status: mapStatusKey(item.status),
    statusText: item.status,
    payStatus: item.payStatus,
    title: `${item.storeName} ${item.productName}`,
    desc: item.receiverAddress,
    amount: Number(item.amount).toFixed(2),
    time: formatTime(item.createdAt),
    storeDetailId: item.storeDetailId,
    storeName: item.storeName,
    productName: item.productName,
    quantity: item.quantity,
    receiverName: item.receiverName,
    receiverPhone: item.receiverPhone,
    receiverAddress: item.receiverAddress,
    addressTag: item.addressTag || "",
    canPay: item.status === ORDER_STATUS.pending,
    canCancel: item.status === ORDER_STATUS.pending,
    canFinish: item.status === ORDER_STATUS.processing
  };
}

function mapAdminOrder(item: any) {
  return {
    id: item.id,
    orderNo: item.orderNo,
    school: item.school,
    buyer: item.user?.nickname || item.receiverName || "-",
    storeName: item.storeName,
    amount: Number(item.amount || 0),
    payStatus: item.payStatus,
    orderStatus: item.status,
    settlementStatus: mapSettlementStatus(item.status, item.payStatus),
    createdAt: formatTime(item.createdAt)
  };
}

async function findAvailableAddress(userId: number, addressId?: number) {
  const where = addressId
    ? { id: addressId, userId }
    : {
        userId
      };

  const row = await prisma.miniAddress.findFirst({
    where,
    orderBy: addressId ? undefined : [{ isDefault: "desc" }, { id: "desc" }]
  });

  if (!row) {
    throw new ApiError("请先添加收货地址", ERROR_CODES.BAD_REQUEST, 400);
  }

  return row;
}

async function findStoreProduct(storeDetailId: string, productId: string) {
  const store = await prisma.miniStore.findUnique({
    where: { detailId: storeDetailId }
  });

  if (!store) {
    throw new ApiError("店铺不存在", ERROR_CODES.NOT_FOUND, 404);
  }

  const products = toArray(store.products) as StoreProduct[];
  const product = products.find((item) => String(item.id) === String(productId));
  if (!product) {
    throw new ApiError("商品不存在", ERROR_CODES.NOT_FOUND, 404);
  }

  return {
    store,
    product
  };
}

export async function findMiniOrderForUser(userId: number, id: number) {
  const row = await prisma.miniOrder.findFirst({
    where: { id, userId }
  });

  if (!row) {
    throw new ApiError("订单不存在", ERROR_CODES.NOT_FOUND, 404);
  }

  return row;
}

export async function queryMiniOrderList(userId: number, rawQuery: Record<string, unknown>) {
  const status = String(rawQuery.status || "").trim();
  const statusMap: Record<string, string | undefined> = {
    all: undefined,
    pending: ORDER_STATUS.pending,
    processing: ORDER_STATUS.processing,
    finished: ORDER_STATUS.finished,
    canceled: ORDER_STATUS.canceled
  };

  const list = await prisma.miniOrder.findMany({
    where: {
      userId,
      status: statusMap[status] || undefined
    },
    orderBy: { id: "desc" }
  });

  return list.map(mapOrder);
}

export async function queryAdminOrderList(rawQuery: Record<string, unknown>) {
  const { page, pageSize, skip } = parsePageParams(rawQuery);
  const school = String(rawQuery.school || "").trim();
  const payStatus = String(rawQuery.payStatus || "").trim();
  const orderStatus = String(rawQuery.orderStatus || "").trim();
  const keyword = String(rawQuery.keyword || "").trim();

  const where = {
    school: school || undefined,
    payStatus: payStatus || undefined,
    status: orderStatus || undefined,
    OR: keyword
      ? [
          { orderNo: { contains: keyword, mode: "insensitive" as const } },
          { storeName: { contains: keyword, mode: "insensitive" as const } },
          { receiverName: { contains: keyword, mode: "insensitive" as const } }
        ]
      : undefined
  };

  const [total, list] = await prisma.$transaction([
    prisma.miniOrder.count({ where }),
    prisma.miniOrder.findMany({
      where,
      include: {
        user: {
          select: {
            nickname: true
          }
        }
      },
      orderBy: { id: "desc" },
      skip,
      take: pageSize
    })
  ]);

  return {
    list: list.map(mapAdminOrder),
    page,
    pageSize,
    total
  };
}

export async function getMiniOrderDetail(userId: number, id: number) {
  const row = await findMiniOrderForUser(userId, id);
  return mapOrder(row);
}

export async function createMiniOrder(userId: number, payload: MiniOrderCreatePayload) {
  const [address, storeResult] = await Promise.all([
    findAvailableAddress(userId, payload.addressId),
    findStoreProduct(payload.storeDetailId, payload.productId)
  ]);

  const quantity = Number(payload.quantity || 1);
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new ApiError("购买数量必须大于 0", ERROR_CODES.BAD_REQUEST, 400);
  }

  const stock = Number(storeResult.product.stock || 0);
  const dailyLimit = Number(storeResult.product.dailyLimit || 0);
  if (stock > 0 && quantity > stock) {
    throw new ApiError("购买数量超过当前库存", ERROR_CODES.BAD_REQUEST, 400);
  }

  if (dailyLimit > 0 && quantity > dailyLimit) {
    throw new ApiError("购买数量超过每日限量", ERROR_CODES.BAD_REQUEST, 400);
  }

  const unitPrice = parsePrice(storeResult.product.price);
  const amount = Number((unitPrice * quantity).toFixed(2));

  const row = await prisma.miniOrder.create({
    data: {
      orderNo: buildOrderNo(),
      userId,
      school: payload.school,
      storeDetailId: storeResult.store.detailId,
      storeName: storeResult.store.name,
      productId: String(storeResult.product.id),
      productName: storeResult.product.name,
      productDesc: storeResult.product.desc || "",
      productCover: storeResult.product.cover || "",
      unitPrice,
      quantity,
      amount,
      status: ORDER_STATUS.pending,
      payStatus: PAY_STATUS.pending,
      receiverName: address.receiverName,
      receiverPhone: address.phone,
      receiverAddress: address.detail,
      addressTag: address.tag,
      remark: payload.remark || ""
    }
  });

  await createMiniMessage({
    school: payload.school,
    type: "system",
    category: "订单通知",
    content: `你的订单 ${row.orderNo} 已创建，请尽快完成支付`,
    receiverUserId: userId,
    targetType: "order",
    targetId: String(row.id)
  });

  return mapOrder(row);
}

export async function payMiniOrder(userId: number, id: number) {
  const order = await findMiniOrderForUser(userId, id);

  if (order.status !== ORDER_STATUS.pending) {
    throw new ApiError("当前订单不能支付", ERROR_CODES.BAD_REQUEST, 400);
  }

  const row = await prisma.miniOrder.update({
    where: { id },
    data: {
      status: ORDER_STATUS.processing,
      payStatus: PAY_STATUS.paid,
      paidAt: new Date()
    }
  });

  await createMiniMessage({
    school: row.school,
    type: "system",
    category: "订单通知",
    content: `订单 ${row.orderNo} 已支付成功，商家正在处理`,
    receiverUserId: userId,
    targetType: "order",
    targetId: String(row.id)
  });

  const store = await prisma.miniStore.findUnique({
    where: { detailId: row.storeDetailId }
  });

  if (store && store.ownerUserId) {
    await createMiniMessage({
      school: row.school,
      type: "system",
      category: "订单通知",
      content: `你有一笔新订单 ${row.orderNo} 已支付，请尽快处理`,
      receiverUserId: store.ownerUserId,
      targetType: "order",
      targetId: String(row.id)
    });
  }

  return mapOrder(row);
}

export async function cancelMiniOrder(userId: number, id: number) {
  const order = await findMiniOrderForUser(userId, id);

  if (order.status !== ORDER_STATUS.pending) {
    throw new ApiError("只有待支付订单可以取消", ERROR_CODES.BAD_REQUEST, 400);
  }

  const row = await prisma.miniOrder.update({
    where: { id },
    data: {
      status: ORDER_STATUS.canceled,
      canceledAt: new Date()
    }
  });

  await createMiniMessage({
    school: row.school,
    type: "system",
    category: "订单通知",
    content: `订单 ${row.orderNo} 已取消`,
    receiverUserId: userId,
    targetType: "order",
    targetId: String(row.id)
  });

  return mapOrder(row);
}

export async function finishMiniOrder(userId: number, id: number) {
  const order = await findMiniOrderForUser(userId, id);

  if (order.status !== ORDER_STATUS.processing) {
    throw new ApiError("只有进行中订单可以确认完成", ERROR_CODES.BAD_REQUEST, 400);
  }

  const row = await prisma.miniOrder.update({
    where: { id },
    data: {
      status: ORDER_STATUS.finished,
      finishedAt: new Date()
    }
  });

  await createMiniMessage({
    school: row.school,
    type: "system",
    category: "订单通知",
    content: `订单 ${row.orderNo} 已完成，感谢使用校园通`,
    receiverUserId: userId,
    targetType: "order",
    targetId: String(row.id)
  });

  const store = await prisma.miniStore.findUnique({
    where: { detailId: row.storeDetailId }
  });

  if (store && store.ownerUserId) {
    await createMiniMessage({
      school: row.school,
      type: "system",
      category: "订单通知",
      content: `订单 ${row.orderNo} 已由用户确认完成`,
      receiverUserId: store.ownerUserId,
      targetType: "order",
      targetId: String(row.id)
    });
  }

  return mapOrder(row);
}
