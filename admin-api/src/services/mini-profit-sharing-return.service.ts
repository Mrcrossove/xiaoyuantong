import { Prisma } from "@prisma/client";
import { env } from "../config/env";
import { ERROR_CODES } from "../constants/error-codes";
import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/api-error";
import { MINI_PROFIT_SHARING_STATUS } from "./mini-profit-sharing.service";
import { createWechatProfitSharingReturnOrder, queryWechatProfitSharingReturnOrder } from "./wechat-pay.service";

export const MINI_PROFIT_SHARING_RETURN_STATUS = {
  pending: "待回退分账",
  processing: "回退分账中",
  success: "已回退分账",
  failed: "回退分账失败"
} as const;

const MINI_SETTLEMENT_STATUS = {
  settled: "已结算",
  refundPending: "退款处理中",
  refunded: "已退款"
} as const;

function roundMoney(value: number) {
  return Number(Number(value || 0).toFixed(2));
}

function buildReturnOutNo(orderNo: string) {
  return `PR${String(orderNo || "").trim()}`;
}

function getLocalReturnStatus(wechatStatus: string) {
  if (wechatStatus === "FINISHED") return MINI_PROFIT_SHARING_RETURN_STATUS.success;
  if (wechatStatus === "PROCESSING" || wechatStatus === "ACCEPTED") return MINI_PROFIT_SHARING_RETURN_STATUS.processing;
  if (wechatStatus === "CLOSED") return MINI_PROFIT_SHARING_RETURN_STATUS.failed;
  return MINI_PROFIT_SHARING_RETURN_STATUS.pending;
}

async function getReturnContext(orderId: number) {
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
    throw new ApiError("订单所属店铺不存在或未绑定商家", ERROR_CODES.BAD_REQUEST, 400);
  }

  const profitSharingOrder = await prisma.miniProfitSharingOrder.findFirst({
    where: {
      orderId,
      status: {
        in: [MINI_PROFIT_SHARING_STATUS.success, MINI_PROFIT_SHARING_STATUS.processing, MINI_PROFIT_SHARING_STATUS.pending]
      }
    },
    orderBy: {
      id: "desc"
    }
  });

  if (!profitSharingOrder) {
    throw new ApiError("未找到可回退的分账记录", ERROR_CODES.BAD_REQUEST, 400);
  }

  return {
    order,
    store,
    profitSharingOrder
  };
}

async function finalizeProfitSharingReturnSuccess(
  returnOrderId: number,
  payload: {
    wechatStatus?: string;
    responsePayload?: Prisma.InputJsonValue | null;
    successAt?: Date | null;
  },
  txClient?: Prisma.TransactionClient
) {
  const db = txClient || prisma;
  const record = await db.miniProfitSharingReturnOrder.findUnique({
    where: { id: returnOrderId },
    include: {
      order: true
    }
  });

  if (!record) {
    throw new ApiError("反分账记录不存在", ERROR_CODES.NOT_FOUND, 404);
  }

  if (
    record.status === MINI_PROFIT_SHARING_RETURN_STATUS.success &&
    record.order.profitSharingStatus === MINI_PROFIT_SHARING_STATUS.returned
  ) {
    return record;
  }

  const store = await db.miniStore.findUnique({
    where: {
      detailId: record.order.storeDetailId
    }
  });

  if (!store || !store.ownerUserId) {
    throw new ApiError("订单所属店铺不存在或未绑定商家", ERROR_CODES.BAD_REQUEST, 400);
  }

  if (
    record.order.settlementStatus === MINI_SETTLEMENT_STATUS.settled &&
    Number(record.order.merchantIncomeAmount || 0) > 0
  ) {
    await db.miniWalletAccount.update({
      where: { userId: store.ownerUserId },
      data: {
        balance: {
          decrement: roundMoney(record.order.merchantIncomeAmount || 0)
        },
        withdrawableAmount: {
          decrement: roundMoney(record.order.merchantIncomeAmount || 0)
        },
        totalIncome: {
          decrement: roundMoney(record.order.merchantIncomeAmount || 0)
        }
      }
    });
  }

  await db.miniOrder.update({
    where: { id: record.orderId },
    data: {
      profitSharingStatus: MINI_PROFIT_SHARING_STATUS.returned,
      settlementStatus:
        record.order.settlementStatus === MINI_SETTLEMENT_STATUS.refunded
          ? MINI_SETTLEMENT_STATUS.refunded
          : MINI_SETTLEMENT_STATUS.refundPending
    }
  });

  return db.miniProfitSharingReturnOrder.update({
    where: { id: returnOrderId },
    data: {
      status: MINI_PROFIT_SHARING_RETURN_STATUS.success,
      wechatStatus: payload.wechatStatus || "FINISHED",
      responsePayload: payload.responsePayload ?? undefined,
      finishedAt: payload.successAt || new Date(),
      lastSyncAt: new Date(),
      syncAttempts: {
        increment: 1
      },
      failureCode: null,
      failureReason: null
    }
  });
}

async function updateReturnOrderStatus(
  returnOrderId: number,
  payload: {
    status: string;
    wechatStatus?: string;
    responsePayload?: Prisma.InputJsonValue | null;
    failureCode?: string;
    failureReason?: string;
    successAt?: Date | null;
  }
) {
  if (payload.status === MINI_PROFIT_SHARING_RETURN_STATUS.success) {
    return prisma.$transaction((tx) =>
      finalizeProfitSharingReturnSuccess(
        returnOrderId,
        {
          wechatStatus: payload.wechatStatus,
          responsePayload: payload.responsePayload,
          successAt: payload.successAt
        },
        tx
      )
    );
  }

  return prisma.miniProfitSharingReturnOrder.update({
    where: { id: returnOrderId },
    data: {
      status: payload.status,
      wechatStatus: payload.wechatStatus,
      responsePayload: payload.responsePayload ?? undefined,
      failureCode: payload.failureCode || null,
      failureReason: payload.failureReason || null,
      lastSyncAt: new Date(),
      syncAttempts: {
        increment: 1
      }
    }
  });
}

export async function createOrSyncMiniProfitSharingReturn(orderId: number) {
  const context = await getReturnContext(orderId);
  const { order, profitSharingOrder } = context;

  if (order.profitSharingStatus === MINI_PROFIT_SHARING_STATUS.returned) {
    const existingSuccess = await prisma.miniProfitSharingReturnOrder.findFirst({
      where: {
        orderId,
        status: MINI_PROFIT_SHARING_RETURN_STATUS.success
      },
      orderBy: {
        id: "desc"
      }
    });
    if (existingSuccess) {
      return existingSuccess;
    }
  }

  const outReturnNo = buildReturnOutNo(order.orderNo);
  const existing = await prisma.miniProfitSharingReturnOrder.findUnique({
    where: { outReturnNo }
  });

  if (existing?.status === MINI_PROFIT_SHARING_RETURN_STATUS.success) {
    return existing;
  }

  if (
    existing &&
    [MINI_PROFIT_SHARING_RETURN_STATUS.pending, MINI_PROFIT_SHARING_RETURN_STATUS.processing].includes(existing.status)
  ) {
    return syncMiniProfitSharingReturnOrder(existing.id);
  }

  const requestPayload = {
    outOrderNo: profitSharingOrder.outOrderNo,
    outReturnNo,
    amount: roundMoney(order.merchantIncomeAmount || profitSharingOrder.amount || 0),
    description: `refund_${order.orderNo}`,
    subMchId: profitSharingOrder.subMchId,
    returnMchId: profitSharingOrder.subMchId
  };

  const record = existing
    ? await prisma.miniProfitSharingReturnOrder.update({
        where: { id: existing.id },
        data: {
          profitSharingOrderId: profitSharingOrder.id,
          school: order.school,
          amount: requestPayload.amount,
          status: MINI_PROFIT_SHARING_RETURN_STATUS.pending,
          description: requestPayload.description,
          subMchId: requestPayload.subMchId,
          outOrderNo: requestPayload.outOrderNo,
          transactionId: order.transactionId || "",
          requestPayload: requestPayload as Prisma.InputJsonValue,
          failureCode: null,
          failureReason: null,
          responsePayload: Prisma.JsonNull
        }
      })
    : await prisma.miniProfitSharingReturnOrder.create({
        data: {
          outReturnNo,
          orderId: order.id,
          profitSharingOrderId: profitSharingOrder.id,
          school: order.school,
          amount: requestPayload.amount,
          status: MINI_PROFIT_SHARING_RETURN_STATUS.pending,
          description: requestPayload.description,
          subMchId: requestPayload.subMchId,
          outOrderNo: requestPayload.outOrderNo,
          transactionId: order.transactionId || "",
          requestPayload: requestPayload as Prisma.InputJsonValue
        }
      });

  if (env.payUseMock || !env.wechatPayUseServiceProvider || !env.wechatPayProfitSharing) {
    return updateReturnOrderStatus(record.id, {
      status: MINI_PROFIT_SHARING_RETURN_STATUS.success,
      wechatStatus: "FINISHED",
      responsePayload: {
        mock: true,
        out_return_no: outReturnNo
      } as Prisma.InputJsonValue,
      successAt: new Date()
    });
  }

  try {
    const response = await createWechatProfitSharingReturnOrder(requestPayload);
    const wechatStatus = String(response?.result || response?.status || "");
    const localStatus = getLocalReturnStatus(wechatStatus);

    return updateReturnOrderStatus(record.id, {
      status: localStatus,
      wechatStatus,
      responsePayload: response as Prisma.InputJsonValue,
      failureCode: String(response?.error_code || ""),
      failureReason: String(response?.error_description || response?.message || ""),
      successAt: localStatus === MINI_PROFIT_SHARING_RETURN_STATUS.success ? new Date() : null
    });
  } catch (error: any) {
    await updateReturnOrderStatus(record.id, {
      status: MINI_PROFIT_SHARING_RETURN_STATUS.failed,
      failureReason: error?.message || "反分账请求失败"
    });
    throw error;
  }
}

export async function syncMiniProfitSharingReturnOrder(recordId: number) {
  const record = await prisma.miniProfitSharingReturnOrder.findUnique({
    where: { id: recordId }
  });

  if (!record) {
    throw new ApiError("反分账记录不存在", ERROR_CODES.NOT_FOUND, 404);
  }

  if (record.status === MINI_PROFIT_SHARING_RETURN_STATUS.success) {
    return record;
  }

  const response = await queryWechatProfitSharingReturnOrder({
    outReturnNo: record.outReturnNo,
    subMchId: record.subMchId
  });

  const wechatStatus = String(response?.result || response?.status || "");
  const localStatus = getLocalReturnStatus(wechatStatus);

  return updateReturnOrderStatus(record.id, {
    status: localStatus,
    wechatStatus,
    responsePayload: response as Prisma.InputJsonValue,
    failureCode: String(response?.error_code || ""),
    failureReason: String(response?.error_description || response?.message || ""),
    successAt: localStatus === MINI_PROFIT_SHARING_RETURN_STATUS.success ? new Date() : null
  });
}

export async function syncPendingMiniProfitSharingReturnOrders(limit = 20) {
  const list = await prisma.miniProfitSharingReturnOrder.findMany({
    where: {
      status: {
        in: [MINI_PROFIT_SHARING_RETURN_STATUS.pending, MINI_PROFIT_SHARING_RETURN_STATUS.processing]
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
      const synced = await syncMiniProfitSharingReturnOrder(item.id);
      results.push({
        id: item.id,
        outReturnNo: item.outReturnNo,
        status: synced.status
      });
    } catch (error: any) {
      results.push({
        id: item.id,
        outReturnNo: item.outReturnNo,
        status: "error",
        error: error?.message || "sync_failed"
      });
    }
  }

  return results;
}
