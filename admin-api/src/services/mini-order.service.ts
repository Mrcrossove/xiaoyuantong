import { Prisma } from "@prisma/client";
import type { MiniOrderCreatePayload, MiniRefundApplyPayload } from "../controllers/mini-commerce-schemas";
import { env } from "../config/env";
import { ERROR_CODES } from "../constants/error-codes";
import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/api-error";
import { parsePageParams } from "../utils/pagination";
import { createMiniMessage } from "./mini-message.service";
import { createOrSyncMiniOrderProfitSharing, MINI_PROFIT_SHARING_STATUS } from "./mini-profit-sharing.service";
import { getDefaultSku, parseMoneyNumber } from "../utils/merchant-product";
import { listStoreProductsByDetailId } from "./store-product.service";

export const MINI_ORDER_STATUS = {
  pending: "\u5f85\u652f\u4ed8",
  processing: "\u8fdb\u884c\u4e2d",
  accepted: "\u5f85\u5904\u7406",
  finished: "\u5df2\u5b8c\u6210",
  canceled: "\u5df2\u53d6\u6d88"
} as const;

export const MINI_PAY_STATUS = {
  pending: "\u5f85\u652f\u4ed8",
  paid: "\u5df2\u652f\u4ed8",
  refunding: "\u9000\u6b3e\u4e2d",
  refunded: "\u5df2\u9000\u6b3e"
} as const;

export const MINI_SETTLEMENT_STATUS = {
  pending: "\u672a\u7ed3\u7b97",
  waiting: "\u5f85\u7ed3\u7b97",
  settled: "\u5df2\u7ed3\u7b97",
  refundPending: "\u9000\u6b3e\u5904\u7406\u4e2d",
  refunded: "\u5df2\u9000\u6b3e",
  closed: "\u5df2\u5173\u95ed"
} as const;

export const MINI_REFUND_STATUS = {
  pending: "\u5f85\u5ba1\u6838",
  approved: "\u5df2\u901a\u8fc7",
  rejected: "\u5df2\u9a73\u56de"
} as const;

type StoreProductMatch = {
  store: any;
  product: any;
  sku: any;
};

type ResolvedOrderItem = StoreProductMatch & {
  quantity: number;
  unitPrice: number;
  amount: number;
};

function buildOrderNo() {
  return `${Date.now()}${Math.floor(Math.random() * 900 + 100)}`;
}

function buildRefundNo() {
  return `TK${Date.now()}${Math.floor(Math.random() * 900 + 100)}`;
}

function roundMoney(value: number) {
  return Number(Number(value || 0).toFixed(2));
}

function formatTime(value: Date | null | undefined) {
  if (!value) return "";
  return value.toISOString().slice(0, 16).replace("T", " ");
}

function formatAmount(value: number | string | null | undefined) {
  return roundMoney(Number(value || 0)).toFixed(2);
}

function formatAmountText(value: number | string | null | undefined) {
  return `¥${formatAmount(value)}`;
}

function normalizeUserOrderStatus(status: string) {
  if (status === MINI_ORDER_STATUS.accepted) {
    return MINI_ORDER_STATUS.processing;
  }
  return status;
}

function mapStatusKey(status: string) {
  const displayStatus = normalizeUserOrderStatus(status);
  if (displayStatus === MINI_ORDER_STATUS.pending) return "pending";
  if (displayStatus === MINI_ORDER_STATUS.processing) return "processing";
  if (displayStatus === MINI_ORDER_STATUS.finished) return "finished";
  if (displayStatus === MINI_ORDER_STATUS.canceled) return "canceled";
  return "all";
}

function mapStatusTone(status: string) {
  const displayStatus = normalizeUserOrderStatus(status);
  if (displayStatus === MINI_ORDER_STATUS.pending) return "pending";
  if (displayStatus === MINI_ORDER_STATUS.processing) return "processing";
  if (displayStatus === MINI_ORDER_STATUS.finished) return "finished";
  if (displayStatus === MINI_ORDER_STATUS.canceled) return "canceled";
  return "default";
}

function mapRefundTone(status: string) {
  if (status === MINI_REFUND_STATUS.pending) return "pending";
  if (status === MINI_REFUND_STATUS.approved) return "success";
  if (status === MINI_REFUND_STATUS.rejected) return "danger";
  return "default";
}

function deriveSettlementStatus(item: any) {
  if (item.settlementStatus) {
    return item.settlementStatus;
  }

  if (item.payStatus === MINI_PAY_STATUS.refunded) return MINI_SETTLEMENT_STATUS.refunded;
  if (item.payStatus === MINI_PAY_STATUS.refunding) return MINI_SETTLEMENT_STATUS.refundPending;
  if (item.status === MINI_ORDER_STATUS.finished) return MINI_SETTLEMENT_STATUS.settled;
  if (item.status === MINI_ORDER_STATUS.processing || item.status === MINI_ORDER_STATUS.accepted) {
    return MINI_SETTLEMENT_STATUS.waiting;
  }
  if (item.status === MINI_ORDER_STATUS.canceled) return MINI_SETTLEMENT_STATUS.closed;
  return MINI_SETTLEMENT_STATUS.pending;
}

function mapRefund(item: any) {
  return {
    id: item.id,
    refundNo: item.refundNo,
    amount: formatAmount(item.amount),
    amountText: formatAmountText(item.amount),
    reason: item.reason,
    status: item.status,
    statusText: item.status,
    statusTone: mapRefundTone(item.status),
    reviewNote: item.reviewNote || "",
    refundRequestNo: item.refundRequestNo || "",
    refundChannel: item.refundChannel || "",
    applyTime: formatTime(item.applyTime),
    reviewedAt: formatTime(item.reviewedAt)
  };
}

function mapOrderItem(item: any) {
  return {
    id: item.id,
    productId: String(item.productId || ""),
    skuId: String(item.skuId || ""),
    productName: item.productName || "",
    productDesc: item.productDesc || "",
    productCover: item.productCover || "",
    skuName: item.skuName || "",
    quantity: Number(item.quantity || 0),
    unitPrice: formatAmount(item.unitPrice),
    unitPriceText: formatAmountText(item.unitPrice),
    amount: formatAmount(item.amount),
    amountText: formatAmountText(item.amount)
  };
}

function getOrderItems(item: any) {
  const rows = Array.isArray(item.items) && item.items.length
    ? item.items
    : [
        {
          id: 0,
          productId: item.productId,
          skuId: item.skuId,
          productName: item.productName,
          productDesc: item.productDesc,
          productCover: item.productCover,
          skuName: item.skuName,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          amount: item.amount
        }
      ];
  return rows.map((entry: any) => mapOrderItem(entry));
}

function getLatestRefund(item: any) {
  if (!Array.isArray(item?.refunds) || !item.refunds.length) {
    return null;
  }

  const sorted = [...item.refunds].sort((a, b) => {
    return new Date(b.applyTime).getTime() - new Date(a.applyTime).getTime();
  });

  return sorted[0] || null;
}

function buildOrderStatusDescription(item: any, latestRefund: any) {
  if (latestRefund?.status === MINI_REFUND_STATUS.pending) {
    return "退款申请已提交，等待商家审核。";
  }

  if (latestRefund?.status === MINI_REFUND_STATUS.approved) {
    return "退款已处理完成，资金将按原路返回。";
  }

  if (latestRefund?.status === MINI_REFUND_STATUS.rejected) {
    return "退款申请未通过，你可以修改原因后重新提交。";
  }

  if (item.status === MINI_ORDER_STATUS.pending) {
    return "订单已创建，请尽快完成支付。";
  }

  if (item.status === MINI_ORDER_STATUS.processing || item.status === MINI_ORDER_STATUS.accepted) {
    return "订单已支付成功，商家正在处理商品或服务。";
  }

  if (item.status === MINI_ORDER_STATUS.finished) {
    return "订单已完成，如有问题可继续联系商家。";
  }

  if (item.status === MINI_ORDER_STATUS.canceled) {
    return item.payStatus === MINI_PAY_STATUS.refunded ? "订单已关闭，退款已处理完成。" : "订单已取消。";
  }

  return "订单状态已更新。";
}

function buildOrderTimeline(item: any, latestRefund: any) {
  const timeline = [
    {
      title: "下单成功",
      time: formatTime(item.createdAt),
      desc: `订单已创建，订单编号 ${item.orderNo}`
    }
  ];

  if (item.paidAt) {
    timeline.push({
      title: "支付成功",
      time: formatTime(item.paidAt),
      desc: `支付方式：${item.paymentMode || item.paymentChannel || "微信支付"}`
    });
  } else if (item.status === MINI_ORDER_STATUS.pending) {
    timeline.push({
      title: "等待支付",
      time: "",
      desc: "请尽快完成支付，超时未支付订单可能会自动关闭。"
    });
  }

  if (item.status === MINI_ORDER_STATUS.processing || item.status === MINI_ORDER_STATUS.accepted) {
    timeline.push({
      title: "商家处理中",
      time: "",
      desc: "商家正在备货或准备服务，请留意后续状态。"
    });
  }

  if (item.finishedAt) {
    timeline.push({
      title: "订单完成",
      time: formatTime(item.finishedAt),
      desc: "订单已确认完成。"
    });
  }

  if (item.canceledAt && item.status === MINI_ORDER_STATUS.canceled) {
    timeline.push({
      title: "订单关闭",
      time: formatTime(item.canceledAt),
      desc: item.payStatus === MINI_PAY_STATUS.refunded ? "订单已关闭并退款。" : "订单已取消。"
    });
  }

  if (latestRefund?.status === MINI_REFUND_STATUS.pending) {
    timeline.push({
      title: "退款审核中",
      time: latestRefund.applyTime || "",
      desc: `退款原因：${latestRefund.reason}`
    });
  }

  if (latestRefund?.status === MINI_REFUND_STATUS.approved) {
    timeline.push({
      title: "退款完成",
      time: latestRefund.reviewedAt || "",
      desc: latestRefund.reviewNote || "退款将按原路返回。"
    });
  }

  if (latestRefund?.status === MINI_REFUND_STATUS.rejected) {
    timeline.push({
      title: "退款未通过",
      time: latestRefund.reviewedAt || "",
      desc: latestRefund.reviewNote || "你可以修改原因后重新提交。"
    });
  }

  return timeline;
}

function mapOrder(item: any) {
  const statusText = normalizeUserOrderStatus(item.status);
  const settlementStatus = deriveSettlementStatus(item);
  const refunds = Array.isArray(item.refunds) ? item.refunds.map((refund: any) => mapRefund(refund)) : [];
  const items = getOrderItems(item);
  const itemCount = items.length;
  const totalQuantity = items.reduce((sum: number, entry: any) => sum + Number(entry.quantity || 0), 0);
  const firstItem = items[0] || null;
  const summaryTitle = firstItem ? `${firstItem.productName}${itemCount > 1 ? ` 等 ${itemCount} 件` : ""}` : item.productName;
  const latestRefund = refunds[0] || null;
  const hasRefundInProgress = latestRefund && latestRefund.status !== MINI_REFUND_STATUS.rejected;
  const canRefund =
    item.payStatus === MINI_PAY_STATUS.paid &&
    (item.status === MINI_ORDER_STATUS.processing ||
      item.status === MINI_ORDER_STATUS.accepted ||
      item.status === MINI_ORDER_STATUS.finished) &&
    !hasRefundInProgress;

  return {
    id: item.id,
    orderNo: item.orderNo,
    displayNo: `订单编号 ${item.orderNo}`,
    status: mapStatusKey(item.status),
    statusText,
    statusTone: mapStatusTone(item.status),
    statusDescription: buildOrderStatusDescription(item, latestRefund),
    payStatus: item.payStatus,
    payStatusText: item.payStatus,
    paymentChannel: item.paymentChannel || "",
    paymentMode: item.paymentMode || "",
    settlementStatus,
    settlementStatusText: settlementStatus,
    title: `${item.storeName} ${summaryTitle}`,
    desc: item.receiverAddress,
    amount: formatAmount(item.amount),
    amountText: formatAmountText(item.amount),
    unitPrice: formatAmount(item.unitPrice),
    unitPriceText: formatAmountText(item.unitPrice),
    time: formatTime(item.createdAt),
    createdAt: formatTime(item.createdAt),
    paidAt: formatTime(item.paidAt),
    finishedAt: formatTime(item.finishedAt),
    canceledAt: formatTime(item.canceledAt),
    storeDetailId: item.storeDetailId,
    storeName: item.storeName,
    productId: item.productId,
    productName: item.productName,
    productDesc: item.productDesc || "",
    productCover: item.productCover || "",
    skuId: item.skuId || "",
    skuName: item.skuName || "",
    quantity: item.quantity,
    items,
    itemCount,
    totalQuantity,
    summaryTitle,
    receiverName: item.receiverName,
    receiverPhone: item.receiverPhone,
    receiverAddress: item.receiverAddress,
    addressTag: item.addressTag || "",
    remark: item.remark || "",
    refunds,
    latestRefund,
    afterSaleStatusText: latestRefund?.statusText || "",
    afterSaleStatusTone: latestRefund?.statusTone || "",
    timeline: buildOrderTimeline(item, latestRefund),
    canPay: item.status === MINI_ORDER_STATUS.pending,
    canCancel: item.status === MINI_ORDER_STATUS.pending,
    canFinish:
      (item.status === MINI_ORDER_STATUS.processing || item.status === MINI_ORDER_STATUS.accepted) && !hasRefundInProgress,
    canRefund,
    refundButtonText: latestRefund?.status === MINI_REFUND_STATUS.rejected ? "重新申请退款" : "申请退款"
  };
}

function mapAdminOrder(item: any) {
  return {
    id: item.id,
    orderNo: item.orderNo,
    school: item.school,
    buyer: item.user?.nickname || item.receiverName || "-",
    storeName: item.storeName,
    productName: item.productName,
    skuName: item.skuName || "",
    amount: Number(item.amount || 0),
    payStatus: item.payStatus,
    orderStatus: normalizeUserOrderStatus(item.status),
    settlementStatus: deriveSettlementStatus(item),
    createdAt: formatTime(item.createdAt)
  };
}

function buildMiniOrderStatusWhere(status: string) {
  if (status === "pending") return MINI_ORDER_STATUS.pending;
  if (status === "processing") {
    return {
      in: [MINI_ORDER_STATUS.processing, MINI_ORDER_STATUS.accepted]
    };
  }
  if (status === "finished") return MINI_ORDER_STATUS.finished;
  if (status === "canceled") return MINI_ORDER_STATUS.canceled;
  return undefined;
}

function buildAdminOrderStatusWhere(status: string) {
  if (!status) return undefined;
  if (status === MINI_ORDER_STATUS.processing) {
    return {
      in: [MINI_ORDER_STATUS.processing, MINI_ORDER_STATUS.accepted]
    };
  }
  return status;
}

async function findAvailableAddress(userId: number, addressId?: number) {
  const where = addressId ? { id: addressId, userId } : { userId };

  const row = await prisma.miniAddress.findFirst({
    where,
    orderBy: addressId ? undefined : [{ isDefault: "desc" }, { id: "desc" }]
  });

  if (!row) {
    throw new ApiError("请先添加收货地址", ERROR_CODES.BAD_REQUEST, 400);
  }

  return row;
}

async function findStoreProduct(storeDetailId: string, productId: string, skuId?: string): Promise<StoreProductMatch> {
  const store = await prisma.miniStore.findUnique({
    where: { detailId: storeDetailId }
  });

  if (!store) {
    throw new ApiError("店铺不存在", ERROR_CODES.NOT_FOUND, 404);
  }

  const products = await listStoreProductsByDetailId(storeDetailId);
  const product = products.find((item) => String(item.id) === String(productId));
  if (!product) {
    throw new ApiError("商品不存在", ERROR_CODES.NOT_FOUND, 404);
  }

  const skuList = product.skus || [];
  const sku = skuList.find((item) => String(item.id) === String(skuId || "")) || getDefaultSku(product);

  if (!sku) {
    throw new ApiError("商品规格不存在", ERROR_CODES.NOT_FOUND, 404);
  }

  if (String(product.status || "") === "已下架" || String(sku.status || "") === "已下架") {
    throw new ApiError("当前商品已下架", ERROR_CODES.BAD_REQUEST, 400);
  }

  return {
    store,
    product,
    sku
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

async function findMiniOrderWithRefundsForUser(userId: number, id: number) {
  const row = await prisma.miniOrder.findFirst({
    where: { id, userId },
    include: {
      items: {
        orderBy: { id: "asc" }
      },
      refunds: {
        orderBy: {
          applyTime: "desc"
        }
      }
    }
  });

  if (!row) {
    throw new ApiError("订单不存在", ERROR_CODES.NOT_FOUND, 404);
  }

  return row;
}

export async function findMiniOrderById(id: number) {
  const row = await prisma.miniOrder.findUnique({
    where: { id }
  });

  if (!row) {
    throw new ApiError("订单不存在", ERROR_CODES.NOT_FOUND, 404);
  }

  return row;
}

async function getStoreOwnerContext(storeDetailId: string) {
  const store = await prisma.miniStore.findUnique({
    where: { detailId: storeDetailId }
  });

  if (!store || !store.ownerUserId) {
    return null;
  }

  return {
    ownerUserId: store.ownerUserId,
    school: store.school,
    store
  };
}

async function ensureWalletAccountInDb(db: Prisma.TransactionClient | typeof prisma, userId: number, school: string) {
  const user = await db.miniUser.findUnique({
    where: { id: userId }
  });

  if (!user) {
    throw new ApiError("商家用户不存在", ERROR_CODES.NOT_FOUND, 404);
  }

  const accountName = user.nickname || "校园商家";
  const finalSchool = user.school || school || "当前高校";

  return db.miniWalletAccount.upsert({
    where: { userId },
    update: {
      school: finalSchool,
      accountName
    },
    create: {
      userId,
      school: finalSchool,
      accountName,
      status: "正常",
      balance: 0,
      frozenAmount: 0,
      withdrawableAmount: 0,
      totalIncome: 0,
      totalWithdrawn: 0
    }
  });
}

export async function settleMiniOrderIncome(orderId: number, txClient?: Prisma.TransactionClient) {
  const db = txClient || prisma;
  const order = await db.miniOrder.findUnique({
    where: { id: orderId }
  });

  if (!order) {
    throw new ApiError("订单不存在", ERROR_CODES.NOT_FOUND, 404);
  }

  if (order.payStatus !== MINI_PAY_STATUS.paid) {
    return order;
  }

  if (order.settlementStatus === MINI_SETTLEMENT_STATUS.settled) {
    return order;
  }

  const storeContext = await getStoreOwnerContext(order.storeDetailId);
  if (!storeContext) {
    return db.miniOrder.update({
      where: { id: order.id },
      data: {
        settlementStatus: MINI_SETTLEMENT_STATUS.waiting
      }
    });
  }

  const merchantIncomeAmount = roundMoney(order.amount * (1 - env.wechatPayCommissionRate));
  const platformCommissionAmount = roundMoney(order.amount - merchantIncomeAmount);

  const shouldUseWechatProfitSharing =
    !env.payUseMock &&
    env.wechatPayUseServiceProvider &&
    env.wechatPayProfitSharing &&
    order.paymentMode !== "模拟支付" &&
    Boolean(order.transactionId) &&
    Boolean(storeContext.store.wechatSubMchId || env.wechatPaySubMchIdFallback);

  if (shouldUseWechatProfitSharing) {
    await prisma.miniOrder.update({
      where: { id: order.id },
      data: {
        settlementStatus: MINI_SETTLEMENT_STATUS.waiting,
        profitSharingAmount: merchantIncomeAmount
      }
    });

    await createOrSyncMiniOrderProfitSharing(order.id);
    return prisma.miniOrder.findUniqueOrThrow({
      where: { id: order.id }
    });
  }

  await ensureWalletAccountInDb(db, storeContext.ownerUserId, storeContext.school);

  await db.miniWalletAccount.update({
    where: { userId: storeContext.ownerUserId },
    data: {
      balance: {
        increment: merchantIncomeAmount
      },
      withdrawableAmount: {
        increment: merchantIncomeAmount
      },
      totalIncome: {
        increment: merchantIncomeAmount
      }
    }
  });

  return db.miniOrder.update({
    where: { id: order.id },
    data: {
      settlementStatus: MINI_SETTLEMENT_STATUS.settled,
      settlementAmount: roundMoney(order.amount),
      platformCommissionAmount,
      merchantIncomeAmount,
      settledAt: order.settledAt || new Date(),
      profitSharingStatus: MINI_PROFIT_SHARING_STATUS.skipped,
      profitSharingAmount: merchantIncomeAmount
    }
  });
}

export async function reverseMiniOrderSettlement(orderId: number, txClient?: Prisma.TransactionClient) {
  const db = txClient || prisma;
  const order = await db.miniOrder.findUnique({
    where: { id: orderId }
  });

  if (!order) {
    throw new ApiError("订单不存在", ERROR_CODES.NOT_FOUND, 404);
  }

  if (
    order.profitSharingStatus === MINI_PROFIT_SHARING_STATUS.success ||
    order.profitSharingStatus === MINI_PROFIT_SHARING_STATUS.processing
  ) {
    throw new ApiError("订单已进入分账流程，退款前需要先完成反分账处理", ERROR_CODES.BAD_REQUEST, 400);
  }

  if (order.settlementStatus !== MINI_SETTLEMENT_STATUS.settled || Number(order.merchantIncomeAmount || 0) <= 0) {
    return order;
  }

  const storeContext = await getStoreOwnerContext(order.storeDetailId);
  if (storeContext) {
    await db.miniWalletAccount.update({
      where: { userId: storeContext.ownerUserId },
      data: {
        balance: {
          decrement: roundMoney(order.merchantIncomeAmount || 0)
        },
        withdrawableAmount: {
          decrement: roundMoney(order.merchantIncomeAmount || 0)
        },
        totalIncome: {
          decrement: roundMoney(order.merchantIncomeAmount || 0)
        }
      }
    });
  }

  return db.miniOrder.update({
    where: { id: order.id },
    data: {
      settlementStatus: MINI_SETTLEMENT_STATUS.refunded
    }
  });
}

export async function queryMiniOrderList(userId: number, rawQuery: Record<string, unknown>) {
  const status = String(rawQuery.status || "").trim();

  const list = await prisma.miniOrder.findMany({
    where: {
      userId,
      status: buildMiniOrderStatusWhere(status)
    },
    include: {
      items: {
        orderBy: { id: "asc" }
      },
      refunds: {
        orderBy: {
          applyTime: "desc"
        }
      }
    },
    orderBy: { id: "desc" }
  });

  return list.map((item: any) => mapOrder(item));
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
    status: buildAdminOrderStatusWhere(orderStatus),
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
        items: {
          orderBy: { id: "asc" }
        },
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
    list: list.map((item: any) => mapAdminOrder(item)),
    page,
    pageSize,
    total
  };
}

export async function getMiniOrderDetail(userId: number, id: number) {
  const row = await findMiniOrderWithRefundsForUser(userId, id);
  return mapOrder(row);
}

export async function createMiniOrder(userId: number, payload: MiniOrderCreatePayload) {
  const rawItems = Array.isArray(payload.items) && payload.items.length
    ? payload.items
    : payload.productId
      ? [{ productId: payload.productId, skuId: payload.skuId || "", quantity: payload.quantity || 1 }]
      : [];

  if (!rawItems.length) {
    throw new ApiError("请至少选择一件商品", ERROR_CODES.BAD_REQUEST, 400);
  }

  const itemMap = new Map<string, { productId: string; skuId: string; quantity: number }>();
  for (const rawItem of rawItems) {
    const productId = String(rawItem.productId || "").trim();
    const skuId = String(rawItem.skuId || "").trim();
    const quantity = Number(rawItem.quantity || 1);
    if (!productId || !Number.isInteger(quantity) || quantity <= 0) {
      throw new ApiError("商品或购买数量不正确", ERROR_CODES.BAD_REQUEST, 400);
    }
    const key = `${productId}::${skuId}`;
    const current = itemMap.get(key);
    itemMap.set(key, {
      productId,
      skuId,
      quantity: (current?.quantity || 0) + quantity
    });
  }

  const [address, ...resolvedItems] = await Promise.all([
    findAvailableAddress(userId, payload.addressId),
    ...Array.from(itemMap.values()).map(async (entry): Promise<ResolvedOrderItem> => {
      const storeResult = await findStoreProduct(payload.storeDetailId, entry.productId, entry.skuId);
      const stock = Number(storeResult.sku.stock || 0);
      const dailyLimit = Number(storeResult.sku.dailyLimit || 0);

      if (stock > 0 && entry.quantity > stock) {
        throw new ApiError(`${storeResult.product.name} 库存不足`, ERROR_CODES.BAD_REQUEST, 400);
      }

      if (dailyLimit > 0 && entry.quantity > dailyLimit) {
        throw new ApiError(`${storeResult.product.name} 超过每日限购`, ERROR_CODES.BAD_REQUEST, 400);
      }

      const unitPrice = roundMoney(parseMoneyNumber(storeResult.sku.price));
      if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
        throw new ApiError(`${storeResult.product.name} 价格异常`, ERROR_CODES.BAD_REQUEST, 400);
      }

      return {
        ...storeResult,
        quantity: entry.quantity,
        unitPrice,
        amount: roundMoney(unitPrice * entry.quantity)
      };
    })
  ]);

  const firstItem = resolvedItems[0];
  if (!firstItem) {
    throw new ApiError("请至少选择一件商品", ERROR_CODES.BAD_REQUEST, 400);
  }

  const totalQuantity = resolvedItems.reduce((sum, item) => sum + item.quantity, 0);
  const amount = roundMoney(resolvedItems.reduce((sum, item) => sum + item.amount, 0));

  const row = await prisma.miniOrder.create({
    data: {
      orderNo: buildOrderNo(),
      userId,
      school: payload.school,
      storeDetailId: firstItem.store.detailId,
      storeName: firstItem.store.name,
      productId: String(firstItem.product.id),
      skuId: String(firstItem.sku.id || ""),
      skuName: firstItem.sku.name || "",
      productName: firstItem.product.name,
      productDesc: firstItem.product.desc || "",
      productCover: firstItem.product.cover || "",
      unitPrice: firstItem.unitPrice,
      quantity: totalQuantity,
      amount,
      status: MINI_ORDER_STATUS.pending,
      payStatus: MINI_PAY_STATUS.pending,
      paymentChannel: "",
      paymentMode: "",
      receiverName: address.receiverName,
      receiverPhone: address.phone,
      receiverAddress: address.detail,
      addressTag: address.tag,
      remark: payload.remark || "",
      settlementStatus: MINI_SETTLEMENT_STATUS.pending,
      items: {
        create: resolvedItems.map((entry) => ({
          productId: String(entry.product.id),
          skuId: String(entry.sku.id || ""),
          skuName: entry.sku.name || "",
          productName: entry.product.name,
          productDesc: entry.product.desc || "",
          productCover: entry.product.cover || "",
          unitPrice: entry.unitPrice,
          quantity: entry.quantity,
          amount: entry.amount
        }))
      }
    }
  });

  await createMiniMessage({
    school: payload.school,
    type: "system",
    category: "订单通知",
    content: `你的订单 ${row.orderNo} 已创建，请尽快完成支付。`,
    receiverUserId: userId,
    targetType: "order",
    targetId: String(row.id)
  });

  return getMiniOrderDetail(userId, row.id);
}

async function createMiniOrderLegacy(userId: number, payload: MiniOrderCreatePayload) {
  const [address, storeResult] = await Promise.all([
    findAvailableAddress(userId, payload.addressId),
    findStoreProduct(payload.storeDetailId, payload.productId, payload.skuId)
  ]);

  const quantity = Number(payload.quantity || 1);
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new ApiError("购买数量必须大于 0", ERROR_CODES.BAD_REQUEST, 400);
  }

  const stock = Number(storeResult.sku.stock || 0);
  const dailyLimit = Number(storeResult.sku.dailyLimit || 0);
  if (stock > 0 && quantity > stock) {
    throw new ApiError("购买数量超过当前库存", ERROR_CODES.BAD_REQUEST, 400);
  }

  if (dailyLimit > 0 && quantity > dailyLimit) {
    throw new ApiError("购买数量超过每日限购", ERROR_CODES.BAD_REQUEST, 400);
  }

  const unitPrice = roundMoney(parseMoneyNumber(storeResult.sku.price));
  if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
    throw new ApiError("商品价格异常", ERROR_CODES.BAD_REQUEST, 400);
  }
  const amount = roundMoney(unitPrice * quantity);

  const row = await prisma.miniOrder.create({
    data: {
      orderNo: buildOrderNo(),
      userId,
      school: payload.school,
      storeDetailId: storeResult.store.detailId,
      storeName: storeResult.store.name,
      productId: String(storeResult.product.id),
      skuId: String(storeResult.sku.id || ""),
      skuName: storeResult.sku.name || "",
      productName: storeResult.product.name,
      productDesc: storeResult.product.desc || "",
      productCover: storeResult.product.cover || "",
      unitPrice,
      quantity,
      amount,
      status: MINI_ORDER_STATUS.pending,
      payStatus: MINI_PAY_STATUS.pending,
      paymentChannel: "",
      paymentMode: "",
      receiverName: address.receiverName,
      receiverPhone: address.phone,
      receiverAddress: address.detail,
      addressTag: address.tag,
      remark: payload.remark || "",
      settlementStatus: MINI_SETTLEMENT_STATUS.pending
    }
  });

  await createMiniMessage({
    school: payload.school,
    type: "system",
    category: "订单通知",
    content: `你的订单 ${row.orderNo} 已创建，请尽快完成支付。`,
    receiverUserId: userId,
    targetType: "order",
    targetId: String(row.id)
  });

  return getMiniOrderDetail(userId, row.id);
}

export async function markMiniOrderPaid(
  userId: number,
  id: number,
  options?: {
    paymentChannel?: string;
    paymentMode?: string;
    transactionId?: string;
    paymentMeta?: Prisma.InputJsonValue;
    paidAt?: Date;
  }
) {
  const order = await findMiniOrderForUser(userId, id);

  if (order.payStatus === MINI_PAY_STATUS.paid || order.payStatus === MINI_PAY_STATUS.refunded) {
    return getMiniOrderDetail(userId, id);
  }

  if (order.status !== MINI_ORDER_STATUS.pending) {
    throw new ApiError("\u5f53\u524d\u8ba2\u5355\u4e0d\u80fd\u652f\u4ed8", ERROR_CODES.BAD_REQUEST, 400);
  }

  const paidAt = options?.paidAt || new Date();
  const row = await prisma.miniOrder.update({
    where: { id },
    data: {
      status: MINI_ORDER_STATUS.processing,
      payStatus: MINI_PAY_STATUS.paid,
      paidAt,
      paymentChannel: options?.paymentChannel || "\u5fae\u4fe1\u652f\u4ed8",
      paymentMode: options?.paymentMode || "\u5c0f\u7a0b\u5e8f\u652f\u4ed8",
      transactionId: options?.transactionId || order.transactionId,
      paymentMeta: options?.paymentMeta || order.paymentMeta,
      settlementStatus: MINI_SETTLEMENT_STATUS.waiting
    }
  });

  await createMiniMessage({
    school: row.school,
    type: "system",
    category: "\u8ba2\u5355\u901a\u77e5",
    content: `\u8ba2\u5355 ${row.orderNo} \u652f\u4ed8\u6210\u529f\uff0c\u5546\u5bb6\u6b63\u5728\u5904\u7406\u4e2d\u3002`,
    receiverUserId: userId,
    targetType: "order",
    targetId: String(row.id)
  });

  const store = await prisma.miniStore.findUnique({
    where: { detailId: row.storeDetailId }
  });

  if (store?.ownerUserId) {
    await createMiniMessage({
      school: row.school,
      type: "system",
      category: "\u8ba2\u5355\u901a\u77e5",
      content: `\u4f60\u6709\u4e00\u7b14\u65b0\u8ba2\u5355 ${row.orderNo} \u5df2\u652f\u4ed8\uff0c\u8bf7\u5c3d\u5feb\u63a5\u5355\u5904\u7406\u3002`,
      receiverUserId: store.ownerUserId,
      targetType: "order",
      targetId: String(row.id)
    });
  }

  return getMiniOrderDetail(userId, id);
}

export async function markMiniOrderPaidByOutTradeNo(
  outTradeNo: string,
  options?: {
    paymentChannel?: string;
    paymentMode?: string;
    transactionId?: string;
    paymentMeta?: Prisma.InputJsonValue;
    paidAt?: Date;
  }
) {
  const order = await prisma.miniOrder.findUnique({
    where: {
      orderNo: outTradeNo
    }
  });

  if (!order) {
    throw new ApiError("\u8ba2\u5355\u4e0d\u5b58\u5728", ERROR_CODES.NOT_FOUND, 404);
  }

  if (order.payStatus === MINI_PAY_STATUS.paid || order.payStatus === MINI_PAY_STATUS.refunded) {
    return order;
  }

  if (order.status !== MINI_ORDER_STATUS.pending) {
    return order;
  }

  const paidAt = options?.paidAt || new Date();
  const row = await prisma.miniOrder.update({
    where: { id: order.id },
    data: {
      status: MINI_ORDER_STATUS.processing,
      payStatus: MINI_PAY_STATUS.paid,
      paidAt,
      paymentChannel: options?.paymentChannel || "\u5fae\u4fe1\u652f\u4ed8",
      paymentMode: options?.paymentMode || "\u5c0f\u7a0b\u5e8f\u652f\u4ed8",
      transactionId: options?.transactionId || order.transactionId,
      paymentMeta: options?.paymentMeta || order.paymentMeta,
      settlementStatus: MINI_SETTLEMENT_STATUS.waiting
    }
  });

  await createMiniMessage({
    school: row.school,
    type: "system",
    category: "\u8ba2\u5355\u901a\u77e5",
    content: `\u8ba2\u5355 ${row.orderNo} \u652f\u4ed8\u6210\u529f\uff0c\u5546\u5bb6\u6b63\u5728\u5904\u7406\u4e2d\u3002`,
    receiverUserId: row.userId,
    targetType: "order",
    targetId: String(row.id)
  });

  const store = await prisma.miniStore.findUnique({
    where: { detailId: row.storeDetailId }
  });

  if (store?.ownerUserId) {
    await createMiniMessage({
      school: row.school,
      type: "system",
      category: "\u8ba2\u5355\u901a\u77e5",
      content: `\u4f60\u6709\u4e00\u7b14\u65b0\u8ba2\u5355 ${row.orderNo} \u5df2\u652f\u4ed8\uff0c\u8bf7\u5c3d\u5feb\u63a5\u5355\u5904\u7406\u3002`,
      receiverUserId: store.ownerUserId,
      targetType: "order",
      targetId: String(row.id)
    });
  }

  return row;
}

export async function payMiniOrder(userId: number, id: number) {
  return markMiniOrderPaid(userId, id, {
    paymentChannel: "微信支付",
    paymentMode: env.payUseMock ? "模拟支付" : "小程序支付",
    paymentMeta: env.payUseMock ? ({ mode: "mock" } as Prisma.InputJsonValue) : undefined
  });
}

export async function cancelMiniOrder(userId: number, id: number) {
  const order = await findMiniOrderWithRefundsForUser(userId, id);

  if (order.status !== MINI_ORDER_STATUS.pending) {
    throw new ApiError("只有待支付订单可以取消", ERROR_CODES.BAD_REQUEST, 400);
  }

  const row = await prisma.miniOrder.update({
    where: { id },
    data: {
      status: MINI_ORDER_STATUS.canceled,
      canceledAt: new Date(),
      settlementStatus: MINI_SETTLEMENT_STATUS.closed
    }
  });

  await createMiniMessage({
    school: row.school,
    type: "system",
    category: "订单通知",
    content: `订单 ${row.orderNo} 已取消。`,
    receiverUserId: userId,
    targetType: "order",
    targetId: String(row.id)
  });

  return getMiniOrderDetail(userId, id);
}

export async function finishMiniOrder(userId: number, id: number) {
  const order = await findMiniOrderWithRefundsForUser(userId, id);
  const latestRefund = getLatestRefund(order);

  if (latestRefund && latestRefund.status !== MINI_REFUND_STATUS.rejected) {
    throw new ApiError("\u5f53\u524d\u8ba2\u5355\u5b58\u5728\u9000\u6b3e\u7533\u8bf7\uff0c\u6682\u65f6\u65e0\u6cd5\u786e\u8ba4\u5b8c\u6210", ERROR_CODES.BAD_REQUEST, 400);
  }

  if (order.status !== MINI_ORDER_STATUS.processing && order.status !== MINI_ORDER_STATUS.accepted) {
    throw new ApiError("\u53ea\u6709\u8fdb\u884c\u4e2d\u7684\u8ba2\u5355\u53ef\u4ee5\u786e\u8ba4\u5b8c\u6210", ERROR_CODES.BAD_REQUEST, 400);
  }

  const row = await prisma.miniOrder.update({
    where: { id },
    data: {
      status: MINI_ORDER_STATUS.finished,
      finishedAt: new Date()
    }
  });

  await settleMiniOrderIncome(id);

  await createMiniMessage({
    school: row.school,
    type: "system",
    category: "\u8ba2\u5355\u901a\u77e5",
    content: `\u8ba2\u5355 ${row.orderNo} \u5df2\u5b8c\u6210\uff0c\u611f\u8c22\u4f60\u7684\u4f7f\u7528\u3002`,
    receiverUserId: userId,
    targetType: "order",
    targetId: String(row.id)
  });

  const store = await prisma.miniStore.findUnique({
    where: { detailId: row.storeDetailId }
  });

  if (store?.ownerUserId) {
    await createMiniMessage({
      school: row.school,
      type: "system",
      category: "\u8ba2\u5355\u901a\u77e5",
      content: `\u8ba2\u5355 ${row.orderNo} \u5df2\u7531\u7528\u6237\u786e\u8ba4\u5b8c\u6210\uff0c\u6536\u5165\u5df2\u8fdb\u5165\u7ed3\u7b97\u6d41\u7a0b\u3002`,
      receiverUserId: store.ownerUserId,
      targetType: "order",
      targetId: String(row.id)
    });
  }

  return getMiniOrderDetail(userId, id);
}

export async function createMiniRefund(userId: number, orderId: number, payload: MiniRefundApplyPayload) {
  const order = await findMiniOrderWithRefundsForUser(userId, orderId);
  const latestRefund = getLatestRefund(order);

  if (order.payStatus !== MINI_PAY_STATUS.paid) {
    throw new ApiError("只有已支付订单可以申请退款", ERROR_CODES.BAD_REQUEST, 400);
  }

  if (
    order.status !== MINI_ORDER_STATUS.processing &&
    order.status !== MINI_ORDER_STATUS.accepted &&
    order.status !== MINI_ORDER_STATUS.finished
  ) {
    throw new ApiError("当前订单暂不支持申请退款", ERROR_CODES.BAD_REQUEST, 400);
  }

  if (latestRefund && latestRefund.status !== MINI_REFUND_STATUS.rejected) {
    throw new ApiError("当前订单已有退款申请，请勿重复提交", ERROR_CODES.BAD_REQUEST, 400);
  }

  const refund = await prisma.miniRefundRecord.create({
    data: {
      refundNo: buildRefundNo(),
      orderId: order.id,
      userId,
      school: order.school,
      amount: roundMoney(order.amount),
      reason: payload.reason,
      status: MINI_REFUND_STATUS.pending
    }
  });

  await createMiniMessage({
    school: order.school,
    type: "system",
    category: "退款通知",
    content: `你的退款申请 ${refund.refundNo} 已提交，请等待商家审核。`,
    receiverUserId: userId,
    targetType: "refund",
    targetId: String(refund.id)
  });

  const store = await prisma.miniStore.findUnique({
    where: {
      detailId: order.storeDetailId
    }
  });

  if (store?.ownerUserId) {
    await createMiniMessage({
      school: order.school,
      type: "system",
      category: "退款通知",
      content: `你收到订单 ${order.orderNo} 的退款申请，请尽快处理。`,
      receiverUserId: store.ownerUserId,
      targetType: "refund",
      targetId: String(refund.id)
    });
  }

  return getMiniOrderDetail(userId, orderId);
}
