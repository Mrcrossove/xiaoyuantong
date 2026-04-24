import { Prisma } from "@prisma/client";
import { env } from "../config/env";
import { ERROR_CODES } from "../constants/error-codes";
import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/api-error";
import {
  MINI_ORDER_STATUS,
  MINI_PAY_STATUS,
  MINI_SETTLEMENT_STATUS,
  reverseMiniOrderSettlement
} from "./mini-order.service";
import {
  createOrSyncMiniProfitSharingReturn,
  MINI_PROFIT_SHARING_RETURN_STATUS
} from "./mini-profit-sharing-return.service";
import { MINI_PROFIT_SHARING_STATUS } from "./mini-profit-sharing.service";
import { createWechatRefund } from "./wechat-pay.service";

function buildRefundRequestNo() {
  return `RF${Date.now()}${Math.floor(Math.random() * 900 + 100)}`;
}

function shouldUseWechatRefund(order: {
  payStatus: string;
  paymentMode?: string | null;
}) {
  return !env.payUseMock && order.payStatus === MINI_PAY_STATUS.paid && order.paymentMode !== "模拟支付";
}

function assertRefundSettlementReady(order: {
  profitSharingStatus?: string | null;
}) {
  if (
    order.profitSharingStatus === MINI_PROFIT_SHARING_STATUS.pending ||
    order.profitSharingStatus === MINI_PROFIT_SHARING_STATUS.processing
  ) {
    throw new ApiError("订单分账处理中，暂不能发起退款", ERROR_CODES.BAD_REQUEST, 400);
  }

  if (order.profitSharingStatus === MINI_PROFIT_SHARING_STATUS.success) {
    throw new ApiError("订单尚未完成反分账，暂不能确认退款", ERROR_CODES.BAD_REQUEST, 400);
  }
}

async function ensureProfitSharingReturnedBeforeRefund(order: {
  id: number;
  profitSharingStatus?: string | null;
}) {
  if (
    order.profitSharingStatus === MINI_PROFIT_SHARING_STATUS.pending ||
    order.profitSharingStatus === MINI_PROFIT_SHARING_STATUS.processing
  ) {
    throw new ApiError("订单分账处理中，暂不能发起退款", ERROR_CODES.BAD_REQUEST, 400);
  }

  if (order.profitSharingStatus !== MINI_PROFIT_SHARING_STATUS.success) {
    return null;
  }

  const returnOrder = await createOrSyncMiniProfitSharingReturn(order.id);
  if (returnOrder.status === MINI_PROFIT_SHARING_RETURN_STATUS.success) {
    return returnOrder;
  }

  if (returnOrder.status === MINI_PROFIT_SHARING_RETURN_STATUS.failed) {
    throw new ApiError(returnOrder.failureReason || "反分账失败，请处理后再退款", ERROR_CODES.BAD_REQUEST, 400);
  }

  throw new ApiError("反分账处理中，请稍后重试退款审核", ERROR_CODES.BAD_REQUEST, 400);
}

async function finalizeRefundSuccessInTx(
  tx: Prisma.TransactionClient,
  refund: any,
  params: {
    refundMeta?: Prisma.InputJsonValue | null;
    refundChannel?: string;
    successAt?: Date | null;
  }
) {
  if (refund.refundSuccessAt && refund.order.payStatus === MINI_PAY_STATUS.refunded) {
    return tx.miniRefundRecord.findUniqueOrThrow({
      where: { id: refund.id },
      include: {
        order: true
      }
    });
  }

  assertRefundSettlementReady(refund.order);

  await tx.miniRefundRecord.update({
    where: { id: refund.id },
    data: {
      refundMeta: params.refundMeta ?? refund.refundMeta,
      refundChannel: params.refundChannel || refund.refundChannel || "微信退款",
      refundSuccessAt: params.successAt || new Date()
    }
  });

  await reverseMiniOrderSettlement(refund.orderId, tx);

  await tx.miniOrder.update({
    where: { id: refund.orderId },
    data: {
      payStatus: MINI_PAY_STATUS.refunded,
      status: refund.order.status === MINI_ORDER_STATUS.finished ? MINI_ORDER_STATUS.finished : MINI_ORDER_STATUS.canceled,
      canceledAt: refund.order.status === MINI_ORDER_STATUS.finished ? refund.order.canceledAt : params.successAt || new Date(),
      settlementStatus: MINI_SETTLEMENT_STATUS.refunded
    }
  });

  return tx.miniRefundRecord.findUniqueOrThrow({
    where: { id: refund.id },
    include: {
      order: true
    }
  });
}

export async function reviewMiniRefundRequest(
  refundId: number,
  reviewerId: number | null,
  payload: {
    status: string;
    reviewNote?: string;
  }
) {
  const refund = await prisma.miniRefundRecord.findUnique({
    where: { id: refundId },
    include: {
      order: true
    }
  });

  if (!refund) {
    throw new ApiError("退款记录不存在", ERROR_CODES.NOT_FOUND, 404);
  }

  if (refund.status !== "待审核") {
    throw new ApiError("当前退款记录不可重复审核", ERROR_CODES.BAD_REQUEST, 400);
  }

  const reviewedAt = new Date();

  if (payload.status !== "已通过") {
    return prisma.miniRefundRecord.update({
      where: { id: refundId },
      data: {
        status: payload.status,
        reviewNote: payload.reviewNote || "",
        reviewerId: reviewerId || undefined,
        reviewedAt
      },
      include: {
        order: true
      }
    });
  }

  await ensureProfitSharingReturnedBeforeRefund(refund.order);

  const store = await prisma.miniStore.findUnique({
    where: {
      detailId: refund.order.storeDetailId
    }
  });

  if (!store) {
    throw new ApiError("订单所属店铺不存在", ERROR_CODES.NOT_FOUND, 404);
  }

  const useWechatRefund = shouldUseWechatRefund(refund.order);
  const refundRequestNo = useWechatRefund ? buildRefundRequestNo() : refund.refundRequestNo || buildRefundRequestNo();
  let refundMeta: Prisma.InputJsonValue | null = refund.refundMeta as Prisma.InputJsonValue | null;
  let refundChannel = useWechatRefund ? "微信退款" : "模拟退款";

  if (useWechatRefund) {
    const wechatRefund = await createWechatRefund({
      outTradeNo: refund.order.orderNo,
      outRefundNo: refundRequestNo,
      totalAmount: Number(refund.order.amount || 0),
      refundAmount: Number(refund.amount || 0),
      reason: refund.reason,
      subMchId: String(store.wechatSubMchId || env.wechatPaySubMchIdFallback || "").trim()
    });
    refundMeta = wechatRefund as Prisma.InputJsonValue;
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.miniRefundRecord.update({
      where: { id: refundId },
      data: {
        status: "已通过",
        reviewNote: payload.reviewNote || "",
        reviewerId: reviewerId || undefined,
        reviewedAt,
        refundRequestNo,
        refundChannel,
        refundMeta
      },
      include: {
        order: true
      }
    });

    if (useWechatRefund) {
      await tx.miniOrder.update({
        where: { id: refund.orderId },
        data: {
          payStatus: MINI_PAY_STATUS.refunding,
          status: refund.order.status === MINI_ORDER_STATUS.finished ? MINI_ORDER_STATUS.finished : MINI_ORDER_STATUS.canceled,
          canceledAt: refund.order.status === MINI_ORDER_STATUS.finished ? refund.order.canceledAt : reviewedAt,
          settlementStatus: MINI_SETTLEMENT_STATUS.refundPending
        }
      });
      return updated;
    }

    return finalizeRefundSuccessInTx(tx, updated, {
      refundMeta,
      refundChannel,
      successAt: reviewedAt
    });
  });
}

export async function confirmWechatRefundSuccessByRequestNo(
  refundRequestNo: string,
  payload: Prisma.InputJsonValue,
  successAt?: Date | null
) {
  const refund = await prisma.miniRefundRecord.findFirst({
    where: {
      refundRequestNo
    },
    include: {
      order: true
    }
  });

  if (!refund) {
    throw new ApiError("退款记录不存在", ERROR_CODES.NOT_FOUND, 404);
  }

  return prisma.$transaction((tx) =>
    finalizeRefundSuccessInTx(tx, refund, {
      refundMeta: payload,
      refundChannel: "微信退款",
      successAt: successAt || new Date()
    })
  );
}
