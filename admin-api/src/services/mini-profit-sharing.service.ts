import { Prisma } from "@prisma/client";
import { env } from "../config/env";
import { ERROR_CODES } from "../constants/error-codes";
import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/api-error";
import { createWechatProfitSharingOrder, queryWechatProfitSharingOrder } from "./wechat-pay.service";

export const MINI_PROFIT_SHARING_STATUS = {
  pending: "待分账",
  processing: "分账中",
  success: "已分账",
  returned: "已回退分账",
  failed: "分账失败",
  skipped: "无需分账"
} as const;

const MINI_PAY_STATUS_PAID = "已支付";
const MINI_SETTLEMENT_STATUS_WAITING = "待结算";
const MINI_SETTLEMENT_STATUS_SETTLED = "已结算";

function roundMoney(value: number) {
  return Number(Number(value || 0).toFixed(2));
}

function normalizeCommissionRate(value: unknown) {
  const rate = Number(value);
  if (!Number.isFinite(rate) || rate < 0 || rate > 0.3) {
    return Number(env.wechatPayCommissionRate || 0);
  }
  return Number(rate.toFixed(4));
}

function buildProfitSharingOutOrderNo(orderNo: string) {
  return `PS${String(orderNo || "").trim()}`;
}

function normalizeWechatProfitSharingStatus(response: any) {
  const directStatus = String(response?.status || response?.state || "").trim();
  const receiverStatus = Array.isArray(response?.receivers)
    ? String(response.receivers.find((item: any) => item?.result || item?.status || item?.state)?.result || "").trim()
    : "";
  return directStatus || receiverStatus;
}

function getLocalProfitSharingStatus(wechatStatus: string) {
  if (wechatStatus === "FINISHED" || wechatStatus === "SUCCESS") return MINI_PROFIT_SHARING_STATUS.success;
  if (wechatStatus === "PROCESSING" || wechatStatus === "ACCEPTED" || wechatStatus === "PENDING") return MINI_PROFIT_SHARING_STATUS.processing;
  if (wechatStatus === "CLOSED" || wechatStatus === "FAILED" || wechatStatus === "FAIL") return MINI_PROFIT_SHARING_STATUS.failed;
  return MINI_PROFIT_SHARING_STATUS.pending;
}

async function getOrderProfitSharingContext(orderId: number) {
  const order = await prisma.miniOrder.findUnique({
    where: { id: orderId }
  });

  if (!order) {
    throw new ApiError("订单不存在", ERROR_CODES.NOT_FOUND, 404);
  }

  const store = await prisma.miniStore.findUnique({
    where: {
      detailId: order.storeDetailId
    }
  });

  if (!store || !store.ownerUserId) {
    return {
      order,
      store: null,
      ownerUserId: null,
      subMchId: ""
    };
  }

  return {
    order,
    store,
    ownerUserId: store.ownerUserId,
    subMchId: String(store.wechatSubMchId || env.wechatPaySubMchIdFallback || "").trim()
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

async function finalizeMiniOrderSettlementWithProfitSharing(
  orderId: number,
  meta: {
    ownerUserId: number;
    school: string;
    merchantIncomeAmount: number;
    platformCommissionAmount: number;
    amount: number;
    finishedAt?: Date | null;
  },
  txClient?: Prisma.TransactionClient
) {
  const db = txClient || prisma;
  const current = await db.miniOrder.findUnique({
    where: { id: orderId }
  });

  if (!current) {
    throw new ApiError("订单不存在", ERROR_CODES.NOT_FOUND, 404);
  }

  if (current.settlementStatus === MINI_SETTLEMENT_STATUS_SETTLED) {
    return current;
  }

  await ensureWalletAccountInDb(db, meta.ownerUserId, meta.school);

  await db.miniWalletAccount.update({
    where: { userId: meta.ownerUserId },
    data: {
      balance: {
        increment: meta.merchantIncomeAmount
      },
      withdrawableAmount: {
        increment: meta.merchantIncomeAmount
      },
      totalIncome: {
        increment: meta.merchantIncomeAmount
      }
    }
  });

  return db.miniOrder.update({
    where: { id: orderId },
    data: {
      settlementStatus: MINI_SETTLEMENT_STATUS_SETTLED,
      settlementAmount: roundMoney(meta.amount),
      platformCommissionAmount: meta.platformCommissionAmount,
      merchantIncomeAmount: meta.merchantIncomeAmount,
      settledAt: current.settledAt || new Date(),
      commissionRateSnapshot: Number((meta.platformCommissionAmount / Math.max(meta.amount, 1)).toFixed(4)),
      profitSharingStatus: MINI_PROFIT_SHARING_STATUS.success,
      profitSharingAmount: meta.platformCommissionAmount,
      profitSharedAt: meta.finishedAt || new Date()
    }
  });
}

async function updateProfitSharingOrderStatus(
  recordId: number,
  params: {
    localStatus: string;
    wechatStatus?: string;
    responsePayload?: Prisma.InputJsonValue | null;
    failureCode?: string;
    failureReason?: string;
    finishedAt?: Date | null;
  },
  txClient?: Prisma.TransactionClient
) {
  const db = txClient || prisma;
  return db.miniProfitSharingOrder.update({
    where: { id: recordId },
    data: {
      status: params.localStatus,
      wechatStatus: params.wechatStatus,
      responsePayload: params.responsePayload ?? undefined,
      failureCode: params.failureCode || null,
      failureReason: params.failureReason || null,
      lastSyncAt: new Date(),
      finishedAt: params.finishedAt || undefined,
      syncAttempts: {
        increment: 1
      }
    }
  });
}

export async function createOrSyncMiniOrderProfitSharing(orderId: number) {
  const context = await getOrderProfitSharingContext(orderId);
  const { order, store, ownerUserId, subMchId } = context;

  if (order.payStatus !== MINI_PAY_STATUS_PAID) {
    return {
      skipped: true,
      reason: "order_not_paid"
    };
  }

  const commissionRate = normalizeCommissionRate(order.commissionRateSnapshot ?? store?.commissionRate ?? env.wechatPayCommissionRate);
  const merchantIncomeAmount = roundMoney(Number(order.amount || 0) * (1 - commissionRate));
  const platformCommissionAmount = roundMoney(Number(order.amount || 0) - merchantIncomeAmount);
  const receiverType = String(env.wechatPayProfitSharingReceiverType || "MERCHANT_ID").trim();
  const receiverAccount = String(env.wechatPayProfitSharingReceiverAccount || env.wechatPaySpMchId || "").trim();
  const receiverName = String(env.wechatPayProfitSharingReceiverName || "platform_commission").trim();

  if (
    !store ||
    !ownerUserId ||
    !subMchId ||
    !receiverAccount ||
    platformCommissionAmount <= 0 ||
    !store.profitSharingEnabled ||
    store.settlementMode === "disabled" ||
    env.payUseMock ||
    !env.wechatPayUseServiceProvider ||
    !env.wechatPayProfitSharing
  ) {
    await prisma.miniOrder.update({
      where: { id: order.id },
      data: {
        profitSharingStatus: MINI_PROFIT_SHARING_STATUS.skipped,
        settlementStatus: store?.settlementMode === "manual" ? MINI_SETTLEMENT_STATUS_WAITING : order.settlementStatus,
        commissionRateSnapshot: commissionRate,
        platformCommissionAmount,
        merchantIncomeAmount,
        profitSharingAmount: platformCommissionAmount
      }
    });

    return {
      skipped: true,
      reason: "profit_sharing_not_enabled"
    };
  }

  const outOrderNo = buildProfitSharingOutOrderNo(order.orderNo);
  const existing = await prisma.miniProfitSharingOrder.findUnique({
    where: { outOrderNo }
  });

  if (existing?.status === MINI_PROFIT_SHARING_STATUS.success) {
    await finalizeMiniOrderSettlementWithProfitSharing(order.id, {
      ownerUserId,
      school: store.school,
      merchantIncomeAmount,
      platformCommissionAmount,
      amount: Number(order.amount || 0),
      finishedAt: existing.finishedAt
    });
    return existing;
  }

  if (existing && (existing.status === MINI_PROFIT_SHARING_STATUS.pending || existing.status === MINI_PROFIT_SHARING_STATUS.processing)) {
    return syncMiniProfitSharingOrder(existing.id);
  }

  const requestPayload = {
    outTradeNo: order.orderNo,
    outOrderNo,
    transactionId: order.transactionId || "",
    amount: platformCommissionAmount,
    receiverType,
    receiverName,
    receiverAccount,
    subMchId
  };

  const record = existing
    ? await prisma.miniProfitSharingOrder.update({
        where: { id: existing.id },
        data: {
          status: MINI_PROFIT_SHARING_STATUS.pending,
          school: store.school,
          amount: platformCommissionAmount,
          receiverType,
          receiverAccount,
          receiverName,
          subMchId,
          transactionId: order.transactionId || "",
          requestPayload: requestPayload as Prisma.InputJsonValue,
          failureCode: null,
          failureReason: null
        }
      })
    : await prisma.miniProfitSharingOrder.create({
        data: {
          outOrderNo,
          orderId: order.id,
          school: store.school,
          amount: platformCommissionAmount,
          status: MINI_PROFIT_SHARING_STATUS.pending,
          receiverType,
          receiverAccount,
          receiverName,
          subMchId,
          transactionId: order.transactionId || "",
          requestPayload: requestPayload as Prisma.InputJsonValue
        }
      });

  await prisma.miniOrder.update({
    where: { id: order.id },
    data: {
      settlementStatus: MINI_SETTLEMENT_STATUS_WAITING,
      commissionRateSnapshot: commissionRate,
      profitSharingStatus: MINI_PROFIT_SHARING_STATUS.pending,
      platformCommissionAmount,
      merchantIncomeAmount,
      profitSharingAmount: platformCommissionAmount
    }
  });

  try {
    const response = await createWechatProfitSharingOrder(requestPayload);
    const wechatStatus = normalizeWechatProfitSharingStatus(response);
    const localStatus = getLocalProfitSharingStatus(wechatStatus);
    const finishedAt = localStatus === MINI_PROFIT_SHARING_STATUS.success ? new Date() : null;

    await updateProfitSharingOrderStatus(record.id, {
      localStatus,
      wechatStatus,
      responsePayload: response as Prisma.InputJsonValue,
      failureCode: String(response?.error_code || ""),
      failureReason: String(response?.error_description || response?.message || ""),
      finishedAt
    });

    await prisma.miniOrder.update({
      where: { id: order.id },
      data: {
        settlementStatus: MINI_SETTLEMENT_STATUS_WAITING,
        commissionRateSnapshot: commissionRate,
        profitSharingStatus: localStatus,
        platformCommissionAmount,
        merchantIncomeAmount,
        profitSharingAmount: platformCommissionAmount,
        profitSharedAt: finishedAt || undefined
      }
    });

    if (localStatus === MINI_PROFIT_SHARING_STATUS.success) {
      await finalizeMiniOrderSettlementWithProfitSharing(order.id, {
        ownerUserId,
        school: store.school,
        merchantIncomeAmount,
        platformCommissionAmount,
        amount: Number(order.amount || 0),
        finishedAt
      });
    }

    return prisma.miniProfitSharingOrder.findUniqueOrThrow({
      where: { id: record.id }
    });
  } catch (error: any) {
    await updateProfitSharingOrderStatus(record.id, {
      localStatus: MINI_PROFIT_SHARING_STATUS.failed,
      failureReason: error?.message || "分账请求失败"
    });

    await prisma.miniOrder.update({
      where: { id: order.id },
      data: {
        settlementStatus: MINI_SETTLEMENT_STATUS_WAITING,
        profitSharingStatus: MINI_PROFIT_SHARING_STATUS.failed,
        platformCommissionAmount,
        merchantIncomeAmount,
        profitSharingAmount: platformCommissionAmount
      }
    });

    throw error;
  }
}

export async function syncMiniProfitSharingOrder(recordId: number) {
  const record = await prisma.miniProfitSharingOrder.findUnique({
    where: { id: recordId },
    include: {
      order: true
    }
  });

  if (!record) {
    throw new ApiError("分账记录不存在", ERROR_CODES.NOT_FOUND, 404);
  }

  if (record.status === MINI_PROFIT_SHARING_STATUS.success) {
    return record;
  }

  const store = await prisma.miniStore.findUnique({
    where: {
      detailId: record.order.storeDetailId
    }
  });

  if (!store || !store.ownerUserId) {
    throw new ApiError("订单所属店铺不存在或未绑定商家", ERROR_CODES.BAD_REQUEST, 400);
  }

  const response = await queryWechatProfitSharingOrder({
    outOrderNo: record.outOrderNo,
    subMchId: record.subMchId,
    transactionId: record.transactionId || undefined
  });

  const wechatStatus = normalizeWechatProfitSharingStatus(response);
  const localStatus = getLocalProfitSharingStatus(wechatStatus);
  const finishedAt = localStatus === MINI_PROFIT_SHARING_STATUS.success ? new Date() : null;
  const platformCommissionAmount = roundMoney(Number(record.amount || 0));
  const merchantIncomeAmount = roundMoney(Number(record.order.amount || 0) - platformCommissionAmount);

  await updateProfitSharingOrderStatus(record.id, {
    localStatus,
    wechatStatus,
    responsePayload: response as Prisma.InputJsonValue,
    failureCode: String(response?.error_code || ""),
    failureReason: String(response?.error_description || response?.message || ""),
    finishedAt
  });

  await prisma.miniOrder.update({
    where: { id: record.orderId },
    data: {
      settlementStatus: localStatus === MINI_PROFIT_SHARING_STATUS.success ? MINI_SETTLEMENT_STATUS_SETTLED : MINI_SETTLEMENT_STATUS_WAITING,
      profitSharingStatus: localStatus,
      platformCommissionAmount,
      merchantIncomeAmount,
      profitSharingAmount: platformCommissionAmount,
      profitSharedAt: finishedAt || undefined
    }
  });

  if (localStatus === MINI_PROFIT_SHARING_STATUS.success) {
    await finalizeMiniOrderSettlementWithProfitSharing(record.orderId, {
      ownerUserId: store.ownerUserId,
      school: store.school,
      merchantIncomeAmount,
      platformCommissionAmount,
      amount: Number(record.order.amount || 0),
      finishedAt
    });
  }

  return prisma.miniProfitSharingOrder.findUniqueOrThrow({
    where: { id: record.id }
  });
}

export async function syncPendingMiniProfitSharingOrders(limit = 20) {
  const list = await prisma.miniProfitSharingOrder.findMany({
    where: {
      status: {
        in: [MINI_PROFIT_SHARING_STATUS.pending, MINI_PROFIT_SHARING_STATUS.processing]
      }
    },
    orderBy: {
      createdAt: "asc"
    },
    take: limit
  });

  const results: Array<Record<string, unknown>> = [];
  for (const item of list) {
    try {
      const synced = await syncMiniProfitSharingOrder(item.id);
      results.push({
        id: item.id,
        outOrderNo: item.outOrderNo,
        status: synced.status
      });
    } catch (error: any) {
      results.push({
        id: item.id,
        outOrderNo: item.outOrderNo,
        status: "error",
        error: error?.message || "sync_failed"
      });
    }
  }

  return results;
}
