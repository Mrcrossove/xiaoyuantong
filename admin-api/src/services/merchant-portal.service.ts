import { Prisma } from "@prisma/client";
import type {
  MiniMerchantBatchIdsPayload,
  MiniMerchantMovePayload,
  MiniMerchantProductCategoryPayload,
  MiniMerchantProductPayload,
  MiniMerchantStoreUpdatePayload,
  MiniMessageReadAllPayload,
  MiniWithdrawCreatePayload,
  RefundReviewPayload
} from "../controllers/mini-commerce-schemas";
import type { MerchantPasswordUpdatePayload, MerchantProfileUpdatePayload } from "../controllers/merchant-schemas";
import { ERROR_CODES } from "../constants/error-codes";
import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/api-error";
import { formatDateTime } from "../utils/time";
import {
  batchDeleteMerchantProducts,
  batchDownMerchantProducts,
  createMerchantProductCategory,
  createMerchantProduct,
  deleteMerchantProductCategory,
  deleteMerchantProduct,
  getCurrentMerchantOrderBoard,
  getCurrentMerchantStore,
  listMerchantProductCategories,
  moveMerchantProductCategory,
  moveMerchantProduct,
  toggleMerchantProductStatus,
  updateMerchantProductCategory,
  updateCurrentMerchantStore,
  updateMerchantProduct
} from "./mini-merchant.service";
import {
  createMiniMessage,
  markAllMiniMessagesRead,
  markMiniMessageRead,
  queryMiniMessages
} from "./mini-message.service";
import {
  findMiniOrderById,
  MINI_ORDER_STATUS,
  MINI_PAY_STATUS,
  reverseMiniOrderSettlement,
  settleMiniOrderIncome
} from "./mini-order.service";
import { createMiniWithdraw, queryMiniWalletSummary } from "./mini-wallet.service";
import { reviewMiniRefundRequest } from "./mini-refund.service";
import { buildProductDisplayPrice, parseMoneyNumber } from "../utils/merchant-product";
import { env } from "../config/env";
import { hashPassword, verifyPassword } from "../utils/password";
import { listStoreProductsByStoreId } from "./store-product.service";
import {
  ensureMerchantWithdrawProfileReady,
  getMerchantWithdrawProfile,
  updateMerchantWithdrawProfile
} from "./merchant-withdraw-profile.service";
import { assertRiskPassed } from "./risk-control.service";

const REFUND_STATUS = {
  pending: "待审核",
  approved: "已通过",
  rejected: "已驳回"
} as const;

function toArray(value: Prisma.JsonValue | null | undefined) {
  return Array.isArray(value) ? value : [];
}

function buildRefundRequestNo() {
  return `RF${Date.now()}${Math.floor(Math.random() * 900 + 100)}`;
}

async function getMerchantContext(accountId: number) {
  const account = await prisma.merchantAccount.findUnique({
    where: { id: accountId },
    include: {
      store: true,
      miniUser: {
        select: {
          openid: true
        }
      }
    }
  });

  if (!account) {
    throw new ApiError("商家账号不存在", ERROR_CODES.NOT_FOUND, 404);
  }

  return account;
}

async function findMerchantOrder(accountId: number, orderId: number) {
  const context = await getMerchantContext(accountId);
  const order = await prisma.miniOrder.findFirst({
    where: {
      id: orderId,
      storeDetailId: context.store.detailId
    }
  });

  if (!order) {
    throw new ApiError("订单不存在或不属于当前店铺", ERROR_CODES.NOT_FOUND, 404);
  }

  return {
    context,
    order
  };
}

async function findMerchantRefund(accountId: number, refundId: number) {
  const context = await getMerchantContext(accountId);
  const refund = await prisma.miniRefundRecord.findFirst({
    where: {
      id: refundId,
      order: {
        storeDetailId: context.store.detailId
      }
    },
    include: {
      order: true
    }
  });

  if (!refund) {
    throw new ApiError("退款记录不存在或不属于当前店铺", ERROR_CODES.NOT_FOUND, 404);
  }

  return {
    context,
    refund
  };
}

function mapMerchantOrderFlow(status: string) {
  if (status === MINI_ORDER_STATUS.pending) return "待支付";
  if (status === MINI_ORDER_STATUS.processing) return "待接单";
  if (status === MINI_ORDER_STATUS.accepted) return "处理中";
  if (status === MINI_ORDER_STATUS.finished) return "已完成";
  if (status === MINI_ORDER_STATUS.canceled) return "已取消";
  return status;
}

function mapMerchantProduct(item: any) {
  return {
    id: String(item.id),
    name: item.name,
    desc: item.desc,
    price: buildProductDisplayPrice(item),
    priceValue: parseMoneyNumber(item.price),
    cover: item.cover || "",
    stock: Number(item.stock || 0),
    dailyLimit: Number(item.dailyLimit || 0),
    recommended: Boolean(item.recommended),
    status: item.status || "已上架",
    specMode: item.specMode || "single",
    defaultSkuId: item.defaultSkuId || "",
    skus: (item.skus || []).map((sku: any) => ({
      id: String(sku.id),
      name: sku.name,
      price: sku.price,
      stock: Number(sku.stock || 0),
      dailyLimit: Number(sku.dailyLimit || 0),
      status: sku.status || "已上架",
      isDefault: Boolean(sku.isDefault)
    }))
  };
}

function mapMerchantOrder(item: any) {
  return {
    id: item.id,
    orderNo: item.orderNo,
    productName: item.productName,
    skuName: item.skuName || "",
    amount: Number(item.amount || 0).toFixed(2),
    quantity: item.quantity,
    receiverName: item.receiverName,
    receiverPhone: item.receiverPhone,
    receiverAddress: item.receiverAddress,
    status: item.status,
    payStatus: item.payStatus,
    settlementStatus: item.settlementStatus || "",
    merchantStatusText: mapMerchantOrderFlow(item.status),
    createdAt: formatDateTime(item.createdAt),
    paidAt: item.paidAt ? formatDateTime(item.paidAt) : "",
    finishedAt: item.finishedAt ? formatDateTime(item.finishedAt) : "",
    canAccept: item.status === MINI_ORDER_STATUS.processing && item.payStatus === MINI_PAY_STATUS.paid,
    canFinish:
      (item.status === MINI_ORDER_STATUS.processing || item.status === MINI_ORDER_STATUS.accepted) &&
      item.payStatus === MINI_PAY_STATUS.paid
  };
}

function mapMerchantRefund(item: any) {
  return {
    id: item.id,
    refundNo: item.refundNo,
    refundRequestNo: item.refundRequestNo || "",
    orderNo: item.order.orderNo,
    productName: item.order.productName,
    skuName: item.order.skuName || "",
    amount: Number(item.amount || 0).toFixed(2),
    reason: item.reason,
    status: item.status,
    reviewNote: item.reviewNote || "",
    applyTime: formatDateTime(item.applyTime),
    reviewedAt: item.reviewedAt ? formatDateTime(item.reviewedAt) : "",
    canReview: item.status === REFUND_STATUS.pending
  };
}

function buildMerchantOrderTimeline(order: any, refunds: any[] = []) {
  const timeline = [
    {
      title: "用户下单",
      time: formatDateTime(order.createdAt),
      desc: `订单已创建，订单号 ${order.orderNo}`
    }
  ];

  if (order.paidAt) {
    timeline.push({
      title: "用户支付",
      time: formatDateTime(order.paidAt),
      desc: `支付状态：${order.payStatus}`
    });
  }

  if (order.status === MINI_ORDER_STATUS.processing) {
    timeline.push({
      title: "等待接单",
      time: "",
      desc: "订单已支付，等待商家接单处理"
    });
  }

  if (order.status === MINI_ORDER_STATUS.accepted) {
    timeline.push({
      title: "商家处理中",
      time: "",
      desc: "商家已接单，正在处理订单"
    });
  }

  if (order.finishedAt) {
    timeline.push({
      title: "订单完成",
      time: formatDateTime(order.finishedAt),
      desc: "订单已完成并进入结算"
    });
  }

  if (order.canceledAt) {
    timeline.push({
      title: "订单关闭",
      time: formatDateTime(order.canceledAt),
      desc: "订单已取消或关闭"
    });
  }

  const approvedRefund = refunds.find((item) => item.status === REFUND_STATUS.approved && item.reviewedAt);
  if (approvedRefund?.reviewedAt) {
    timeline.push({
      title: "退款完成",
      time: formatDateTime(approvedRefund.reviewedAt),
      desc: `退款单号 ${approvedRefund.refundNo}`
    });
  }

  return timeline;
}

function buildMerchantRefundTimeline(refund: any) {
  const timeline = [
    {
      title: "用户申请退款",
      time: formatDateTime(refund.applyTime),
      desc: `退款原因：${refund.reason}`
    }
  ];

  if (refund.status === REFUND_STATUS.pending) {
    timeline.push({
      title: "待商家处理",
      time: "",
      desc: "当前退款申请等待商家审核"
    });
  }

  if (refund.status === REFUND_STATUS.approved && refund.reviewedAt) {
    timeline.push({
      title: "商家同意退款",
      time: formatDateTime(refund.reviewedAt),
      desc: refund.reviewNote || "退款将按原路返回"
    });
  }

  if (refund.status === REFUND_STATUS.rejected && refund.reviewedAt) {
    timeline.push({
      title: "商家驳回退款",
      time: formatDateTime(refund.reviewedAt),
      desc: refund.reviewNote || "请联系商家了解详情"
    });
  }

  return timeline;
}

function buildMerchantOrderStatusWhere(status: string) {
  if (!status) return undefined;
  if (status === "待支付") return MINI_ORDER_STATUS.pending;
  if (status === "待接单") return MINI_ORDER_STATUS.processing;
  if (status === "处理中") return MINI_ORDER_STATUS.accepted;
  if (status === "已完成") return MINI_ORDER_STATUS.finished;
  if (status === "已取消") return MINI_ORDER_STATUS.canceled;
  return undefined;
}

export async function queryMerchantDashboard(accountId: number) {
  const context = await getMerchantContext(accountId);
  const [wallet, refundPendingCount, messageCount, board] = await Promise.all([
    prisma.miniWalletAccount.findFirst({
      where: { userId: context.miniUserId }
    }),
    prisma.miniRefundRecord.count({
      where: {
        order: {
          storeDetailId: context.store.detailId
        },
        status: REFUND_STATUS.pending
      }
    }),
    prisma.miniMessage.count({
      where: {
        OR: [{ school: context.store.school }, { receiverUserId: context.miniUserId }]
      }
    }),
    getCurrentMerchantOrderBoard(context.miniUserId)
  ]);

  const recentOrders = await prisma.miniOrder.findMany({
    where: {
      storeDetailId: context.store.detailId
    },
    orderBy: { createdAt: "desc" },
    take: 5
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayOrders = recentOrders.filter((item: any) => item.createdAt >= today);
  const todayAmount = todayOrders.reduce((sum: number, item: any) => sum + Number(item.amount || 0), 0);

  return {
    summary: {
      todayOrderCount: todayOrders.length,
      todayAmount: Number(todayAmount.toFixed(2)),
      pendingOrderCount: board.summary.pendingOrderCount + board.summary.newOrderCount,
      refundPendingCount,
      balance: Number(wallet?.balance || 0),
      withdrawableAmount: Number(wallet?.withdrawableAmount || 0),
      messageCount
    },
    recentOrders: recentOrders.map((item: any) => ({
      id: item.id,
      orderNo: item.orderNo,
      productName: item.productName,
      skuName: item.skuName || "",
      amount: Number(item.amount || 0).toFixed(2),
      quantity: item.quantity,
      status: mapMerchantOrderFlow(item.status),
      payStatus: item.payStatus,
      createdAt: formatDateTime(item.createdAt)
    }))
  };
}

export async function queryMerchantProductList(accountId: number) {
  const context = await getMerchantContext(accountId);
  const [productRows, categoriesResult] = await Promise.all([
    listStoreProductsByStoreId(prisma, context.store.id),
    listMerchantProductCategories(context.miniUserId)
  ]);
  const products = productRows.map(mapMerchantProduct);

  return {
    list: products,
    categories: categoriesResult.list,
    total: products.length,
    summary: {
      total: products.length,
      onSaleCount: products.filter((item) => item.status === "已上架").length,
      recommendedCount: products.filter((item) => item.recommended).length
    }
  };
}

export async function queryMerchantOrderList(accountId: number, rawQuery: Record<string, unknown>) {
  const context = await getMerchantContext(accountId);
  const keyword = String(rawQuery.keyword || "").trim();
  const status = String(rawQuery.status || "").trim();
  const payStatus = String(rawQuery.payStatus || "").trim();

  const list = await prisma.miniOrder.findMany({
    where: {
      storeDetailId: context.store.detailId,
      status: buildMerchantOrderStatusWhere(status),
      payStatus: payStatus || undefined,
      OR: keyword
        ? [
            { orderNo: { contains: keyword, mode: "insensitive" } },
            { productName: { contains: keyword, mode: "insensitive" } },
            { skuName: { contains: keyword, mode: "insensitive" } },
            { receiverName: { contains: keyword, mode: "insensitive" } },
            { receiverPhone: { contains: keyword, mode: "insensitive" } }
          ]
        : undefined
    },
    orderBy: [{ createdAt: "desc" }]
  });

  return {
    list: list.map((item: any) => mapMerchantOrder(item)),
    total: list.length
  };
}

export async function queryMerchantOrderDetail(accountId: number, orderId: number) {
  const context = await getMerchantContext(accountId);
  const row = await prisma.miniOrder.findFirst({
    where: {
      id: orderId,
      storeDetailId: context.store.detailId
    },
    include: {
      refunds: {
        include: {
          order: {
            select: {
              orderNo: true,
              productName: true,
              skuName: true
            }
          }
        },
        orderBy: {
          applyTime: "desc"
        }
      }
    }
  });

  if (!row) {
    throw new ApiError("订单不存在或不属于当前店铺", ERROR_CODES.NOT_FOUND, 404);
  }

  return {
    ...mapMerchantOrder(row),
    school: row.school,
    storeName: row.storeName,
    storeDetailId: row.storeDetailId,
    payStatusText: row.payStatus,
    canceledAt: row.canceledAt ? formatDateTime(row.canceledAt) : "",
    remark: row.remark || "",
    product: {
      id: row.productId,
      skuId: row.skuId || "",
      skuName: row.skuName || "",
      name: row.productName,
      desc: row.productDesc || "",
      cover: row.productCover || "",
      unitPrice: Number(row.unitPrice || 0).toFixed(2),
      quantity: row.quantity,
      amount: Number(row.amount || 0).toFixed(2)
    },
    receiver: {
      name: row.receiverName,
      phone: row.receiverPhone,
      address: row.receiverAddress,
      tag: row.addressTag || ""
    },
    refunds: row.refunds.map((item: any) => mapMerchantRefund(item)),
    timeline: buildMerchantOrderTimeline(row, row.refunds)
  };
}

export async function merchantAcceptOrder(accountId: number, orderId: number) {
  const { order } = await findMerchantOrder(accountId, orderId);

  if (order.status !== MINI_ORDER_STATUS.processing || order.payStatus !== MINI_PAY_STATUS.paid) {
    throw new ApiError("当前订单不能执行接单", ERROR_CODES.BAD_REQUEST, 400);
  }

  const row = await prisma.miniOrder.update({
    where: { id: orderId },
    data: {
      status: MINI_ORDER_STATUS.accepted
    }
  });

  await createMiniMessage({
    school: row.school,
    type: "system",
    category: "订单通知",
    content: `商家已接单，订单 ${row.orderNo} 正在处理中。`,
    receiverUserId: row.userId,
    targetType: "order",
    targetId: String(row.id)
  });

  return mapMerchantOrder(row);
}

export async function merchantFinishOrder(accountId: number, orderId: number) {
  const { order } = await findMerchantOrder(accountId, orderId);

  if (
    (order.status !== MINI_ORDER_STATUS.processing && order.status !== MINI_ORDER_STATUS.accepted) ||
    order.payStatus !== MINI_PAY_STATUS.paid
  ) {
    throw new ApiError("\u5f53\u524d\u8ba2\u5355\u4e0d\u80fd\u6267\u884c\u5b8c\u6210", ERROR_CODES.BAD_REQUEST, 400);
  }

  await prisma.miniOrder.update({
    where: { id: orderId },
    data: {
      status: MINI_ORDER_STATUS.finished,
      finishedAt: order.finishedAt || new Date()
    }
  });

  await settleMiniOrderIncome(orderId);

  const latest = await findMiniOrderById(orderId);

  await createMiniMessage({
    school: latest.school,
    type: "system",
    category: "\u8ba2\u5355\u901a\u77e5",
    content: `\u5546\u5bb6\u5df2\u5b8c\u6210\u8ba2\u5355 ${latest.orderNo}\uff0c\u8bf7\u7559\u610f\u6536\u8d27\u72b6\u6001\u3002`,
    receiverUserId: latest.userId,
    targetType: "order",
    targetId: String(latest.id)
  });

  return mapMerchantOrder(latest);
}

export async function queryMerchantRefundList(accountId: number) {
  const context = await getMerchantContext(accountId);
  const rows = await prisma.miniRefundRecord.findMany({
    where: {
      order: {
        storeDetailId: context.store.detailId
      }
    },
    include: {
      order: {
        select: {
          orderNo: true,
          productName: true,
          skuName: true
        }
      }
    },
    orderBy: { applyTime: "desc" }
  });

  return {
    list: rows.map((item: any) => mapMerchantRefund(item)),
    total: rows.length,
    summary: {
      pendingCount: rows.filter((item: any) => item.status === REFUND_STATUS.pending).length,
      approvedCount: rows.filter((item: any) => item.status === REFUND_STATUS.approved).length,
      rejectedCount: rows.filter((item: any) => item.status === REFUND_STATUS.rejected).length
    }
  };
}

export async function queryMerchantRefundDetail(accountId: number, refundId: number) {
  const context = await getMerchantContext(accountId);
  const row = await prisma.miniRefundRecord.findFirst({
    where: {
      id: refundId,
      order: {
        storeDetailId: context.store.detailId
      }
    },
    include: {
      order: true
    }
  });

  if (!row) {
    throw new ApiError("退款记录不存在或不属于当前店铺", ERROR_CODES.NOT_FOUND, 404);
  }

  return {
    ...mapMerchantRefund(row),
    school: row.school,
    timeline: buildMerchantRefundTimeline(row),
    order: {
      id: row.order.id,
      orderNo: row.order.orderNo,
      storeName: row.order.storeName,
      productName: row.order.productName,
      skuName: row.order.skuName || "",
      productDesc: row.order.productDesc || "",
      productCover: row.order.productCover || "",
      unitPrice: Number(row.order.unitPrice || 0).toFixed(2),
      quantity: row.order.quantity,
      amount: Number(row.order.amount || 0).toFixed(2),
      receiverName: row.order.receiverName,
      receiverPhone: row.order.receiverPhone,
      receiverAddress: row.order.receiverAddress,
      addressTag: row.order.addressTag || "",
      merchantStatusText: mapMerchantOrderFlow(row.order.status),
      payStatus: row.order.payStatus,
      createdAt: formatDateTime(row.order.createdAt),
      paidAt: row.order.paidAt ? formatDateTime(row.order.paidAt) : "",
      finishedAt: row.order.finishedAt ? formatDateTime(row.order.finishedAt) : "",
      canceledAt: row.order.canceledAt ? formatDateTime(row.order.canceledAt) : ""
    }
  };
}

export async function merchantReviewRefund(accountId: number, refundId: number, payload: RefundReviewPayload) {
  const { refund } = await findMerchantRefund(accountId, refundId);

  if (refund.status !== REFUND_STATUS.pending) {
    throw new ApiError("\u5f53\u524d\u9000\u6b3e\u8bb0\u5f55\u4e0d\u53ef\u91cd\u590d\u5904\u7406", ERROR_CODES.BAD_REQUEST, 400);
  }

  const updated = await reviewMiniRefundRequest(refundId, null, payload);

  await createMiniMessage({
    school: refund.school,
    type: "system",
    category: "\u9000\u6b3e\u901a\u77e5",
    content:
      payload.status === REFUND_STATUS.approved
        ? `\u5546\u5bb6\u5df2\u540c\u610f\u9000\u6b3e\uff0c\u9000\u6b3e\u7533\u8bf7 ${refund.refundNo} \u7684\u7ed3\u679c\u5c06\u6309\u7cfb\u7edf\u5904\u7406\u7ed3\u679c\u66f4\u65b0\u3002`
        : `\u5546\u5bb6\u5df2\u9a73\u56de\u9000\u6b3e\u7533\u8bf7 ${refund.refundNo}\uff0c\u539f\u56e0\uff1a${payload.reviewNote || "\u8bf7\u8054\u7cfb\u5546\u5bb6\u4e86\u89e3\u8be6\u60c5"}`,
    receiverUserId: refund.userId,
    targetType: "refund",
    targetId: String(refund.id)
  });

  return mapMerchantRefund(updated);
}

export async function queryMerchantWallet(accountId: number) {
  const context = await getMerchantContext(accountId);
  const [data, withdrawProfile] = await Promise.all([
    queryMiniWalletSummary(context.miniUserId),
    getMerchantWithdrawProfile(accountId)
  ]);

  return {
    summary: {
      balance: Number(data.wallet.total || 0),
      frozenAmount: Number(data.wallet.frozen || 0),
      withdrawableAmount: Number(data.wallet.available || 0),
      totalIncome: Number(data.wallet.totalIncome || 0),
      totalWithdrawn: Number(data.wallet.totalWithdrawn || 0),
      status: data.wallet.status
    },
    withdrawProfile,
    withdraws: data.withdrawRecords
  };
}

export async function queryMerchantProductCategoryList(accountId: number) {
  const context = await getMerchantContext(accountId);
  return listMerchantProductCategories(context.miniUserId);
}

export async function merchantCreateWithdraw(accountId: number, payload: MiniWithdrawCreatePayload) {
  const context = await getMerchantContext(accountId);
  await ensureMerchantWithdrawProfileReady(accountId);
  return createMiniWithdraw(context.miniUserId, {
    ...payload,
    accountType: "微信零钱",
    accountNo: `微信零钱账户(${context.phone.slice(-4)})`
  });
}

export async function queryMerchantMessageList(accountId: number, rawQuery: Record<string, unknown>) {
  const context = await getMerchantContext(accountId);
  const type = String(rawQuery.type || "").trim();
  const result = await queryMiniMessages(context.miniUserId, {
    ...rawQuery,
    school: context.store.school
  });

  const merged = [...result.systemMessages, ...result.interactiveMessages]
    .filter((item) => (type ? item.type === type : true))
    .sort((a, b) => b.id - a.id)
    .map((item) => ({
      id: item.id,
      type: item.type,
      typeLabel: item.type === "system" ? "系统消息" : "互动消息",
      category: item.category,
      content: item.content,
      read: Boolean(item.read),
      status: item.read ? "已读" : "未读",
      createdAt: item.time,
      targetType: item.targetType || "",
      targetId: item.targetId || ""
    }));

  return {
    list: merged,
    total: merged.length,
    unreadCount: result.unreadCount.system + result.unreadCount.interactive,
    summary: {
      systemUnread: result.unreadCount.system,
      interactiveUnread: result.unreadCount.interactive
    }
  };
}

export async function merchantMarkMessageRead(accountId: number, id: number) {
  const context = await getMerchantContext(accountId);
  return markMiniMessageRead(context.miniUserId, id);
}

export async function merchantMarkAllMessagesRead(
  accountId: number,
  payload: MiniMessageReadAllPayload,
  rawQuery: Record<string, unknown>
) {
  const context = await getMerchantContext(accountId);
  return markAllMiniMessagesRead(context.miniUserId, payload, {
    ...rawQuery,
    school: context.store.school
  });
}

export async function queryMerchantStat(accountId: number) {
  const context = await getMerchantContext(accountId);
  const [orders, refunds] = await Promise.all([
    prisma.miniOrder.findMany({
      where: { storeDetailId: context.store.detailId },
      orderBy: { createdAt: "desc" }
    }),
    prisma.miniRefundRecord.findMany({
      where: {
        order: {
          storeDetailId: context.store.detailId
        }
      }
    })
  ]);

  const paidOrders = orders.filter((item: any) => item.payStatus === MINI_PAY_STATUS.paid);
  const totalAmount = paidOrders.reduce((sum: number, item: any) => sum + Number(item.amount || 0), 0);
  const productStats = new Map<string, { productName: string; skuName: string; quantity: number; amount: number }>();

  paidOrders.forEach((item: any) => {
    const key = `${item.productId}_${item.skuId || ""}`;
    const current = productStats.get(key) || {
      productName: item.productName,
      skuName: item.skuName || "",
      quantity: 0,
      amount: 0
    };
    current.quantity += item.quantity;
    current.amount += Number(item.amount || 0);
    productStats.set(key, current);
  });

  return {
    cards: {
      orderCount: orders.length,
      paidOrderCount: paidOrders.length,
      totalAmount: Number(totalAmount.toFixed(2)),
      refundCount: refunds.length,
      refundAmount: Number(refunds.reduce((sum: number, item: any) => sum + Number(item.amount || 0), 0).toFixed(2))
    },
    hotProducts: Array.from(productStats.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10)
      .map((item) => ({
        productName: item.productName,
        skuName: item.skuName,
        quantity: item.quantity,
        amount: Number(item.amount.toFixed(2))
      }))
  };
}

export async function getMerchantAccountProfile(accountId: number) {
  const context = await getMerchantContext(accountId);
  const withdrawProfile = await getMerchantWithdrawProfile(accountId);
  return {
    id: context.id,
    phone: context.phone,
    name: context.name,
    status: context.status,
    isActivated: Boolean(context.activatedAt),
    mustChangePassword: Boolean(context.mustChangePassword),
    lastLoginAt: context.lastLoginAt ? formatDateTime(context.lastLoginAt) : "",
    storeName: context.store.name,
    school: context.store.school,
    withdrawProfile
  };
}

export async function updateMerchantAccountProfile(accountId: number, payload: MerchantProfileUpdatePayload) {
  const context = await getMerchantContext(accountId);
  const nextStoreName = String(payload.storeName || context.store.name || "").trim();

  await assertRiskPassed({
    userId: context.miniUserId,
    scene: "merchant_store",
    texts: [payload.name, nextStoreName]
  });

  const [row, store] = await prisma.$transaction([
    prisma.merchantAccount.update({
      where: { id: accountId },
      data: {
        name: payload.name
      }
    }),
    prisma.miniStore.update({
      where: { id: context.storeId },
      data: {
        name: nextStoreName
      }
    })
  ]);

  const withdrawProfile = await updateMerchantWithdrawProfile(accountId, {
    withdrawRealName: payload.withdrawRealName,
    acceptWithdrawAgreement: payload.acceptWithdrawAgreement
  });

  return {
    id: row.id,
    phone: row.phone,
    name: row.name,
    status: row.status,
    isActivated: Boolean(row.activatedAt),
    mustChangePassword: Boolean(row.mustChangePassword),
    lastLoginAt: row.lastLoginAt ? formatDateTime(row.lastLoginAt) : "",
    storeName: store.name,
    school: store.school,
    withdrawProfile
  };
}

export async function updateMerchantPassword(accountId: number, payload: MerchantPasswordUpdatePayload) {
  const account = await prisma.merchantAccount.findUniqueOrThrow({
    where: { id: accountId }
  });

  if (!account.password) {
    throw new ApiError("该账号尚未设置密码，请先完成激活", ERROR_CODES.BAD_REQUEST, 400);
  }

  if (!verifyPassword(payload.oldPassword, account.password)) {
    throw new ApiError("原密码错误", ERROR_CODES.BAD_REQUEST, 400);
  }

  await prisma.merchantAccount.update({
    where: { id: accountId },
    data: {
      password: hashPassword(payload.newPassword)
    }
  });

  return true;
}

export async function merchantGetStore(accountId: number) {
  const context = await getMerchantContext(accountId);
  return getCurrentMerchantStore(context.miniUserId);
}

export async function merchantCreateProductCategory(accountId: number, payload: MiniMerchantProductCategoryPayload) {
  const context = await getMerchantContext(accountId);
  return createMerchantProductCategory(context.miniUserId, payload);
}

export async function merchantUpdateProductCategory(accountId: number, categoryId: number, payload: MiniMerchantProductCategoryPayload) {
  const context = await getMerchantContext(accountId);
  return updateMerchantProductCategory(context.miniUserId, categoryId, payload);
}

export async function merchantDeleteProductCategory(accountId: number, categoryId: number) {
  const context = await getMerchantContext(accountId);
  return deleteMerchantProductCategory(context.miniUserId, categoryId);
}

export async function merchantMoveProductCategory(accountId: number, categoryId: number, direction: "up" | "down") {
  const context = await getMerchantContext(accountId);
  return moveMerchantProductCategory(context.miniUserId, categoryId, direction);
}

export async function merchantUpdateStore(accountId: number, payload: MiniMerchantStoreUpdatePayload) {
  const context = await getMerchantContext(accountId);
  return updateCurrentMerchantStore(context.miniUserId, payload);
}

export async function merchantCreateProduct(accountId: number, payload: MiniMerchantProductPayload) {
  const context = await getMerchantContext(accountId);
  return createMerchantProduct(context.miniUserId, payload);
}

export async function merchantUpdateProduct(accountId: number, productId: string, payload: MiniMerchantProductPayload) {
  const context = await getMerchantContext(accountId);
  return updateMerchantProduct(context.miniUserId, productId, payload);
}

export async function merchantToggleProductStatus(accountId: number, productId: string) {
  const context = await getMerchantContext(accountId);
  return toggleMerchantProductStatus(context.miniUserId, productId);
}

export async function merchantDeleteProduct(accountId: number, productId: string) {
  const context = await getMerchantContext(accountId);
  return deleteMerchantProduct(context.miniUserId, productId);
}

export async function merchantMoveProduct(accountId: number, productId: string, payload: MiniMerchantMovePayload) {
  const context = await getMerchantContext(accountId);
  return moveMerchantProduct(context.miniUserId, productId, payload.direction);
}

export async function merchantBatchDownProducts(accountId: number, payload: MiniMerchantBatchIdsPayload) {
  const context = await getMerchantContext(accountId);
  return batchDownMerchantProducts(context.miniUserId, payload.ids);
}

export async function merchantBatchDeleteProducts(accountId: number, payload: MiniMerchantBatchIdsPayload) {
  const context = await getMerchantContext(accountId);
  return batchDeleteMerchantProducts(context.miniUserId, payload.ids);
}
