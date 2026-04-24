import type { Prisma } from "@prisma/client";
import { ERROR_CODES } from "../constants/error-codes";
import { ApiError } from "../utils/api-error";
import { markMiniOrderPaidByOutTradeNo } from "./mini-order.service";
import { confirmWechatRefundSuccessByRequestNo } from "./mini-refund.service";
import { confirmMiniWithdrawTransferByOutBillNo } from "./mini-withdraw-transfer.service";
import { decryptWechatPayResource, verifyWechatPaySignature } from "./wechat-pay.service";

type NotifyHeaders = {
  timestamp: string;
  nonce: string;
  signature: string;
};

function parseNotifyBody(rawBody: string) {
  if (!rawBody) {
    throw new ApiError("微信支付回调体为空", ERROR_CODES.BAD_REQUEST, 400);
  }

  return JSON.parse(rawBody);
}

function assertNotifyHeaders(rawBody: string, headers: NotifyHeaders) {
  if (!headers.timestamp || !headers.nonce || !headers.signature) {
    throw new ApiError("微信支付回调签名头缺失", ERROR_CODES.BAD_REQUEST, 400);
  }

  if (!verifyWechatPaySignature(rawBody, headers)) {
    throw new ApiError("微信支付回调验签失败", ERROR_CODES.BAD_REQUEST, 400);
  }
}

export async function handleWechatPayNotify(rawBody: string, headers: NotifyHeaders) {
  assertNotifyHeaders(rawBody, headers);
  const body = parseNotifyBody(rawBody);
  const resource = decryptWechatPayResource<any>(body.resource);

  if (String(resource.trade_state || "") === "SUCCESS" && resource.out_trade_no) {
    await markMiniOrderPaidByOutTradeNo(String(resource.out_trade_no), {
      paymentChannel: "\u5fae\u4fe1\u652f\u4ed8",
      paymentMode: "\u5c0f\u7a0b\u5e8f\u652f\u4ed8",
      transactionId: String(resource.transaction_id || ""),
      paymentMeta: resource as Prisma.InputJsonValue,
      paidAt: resource.success_time ? new Date(resource.success_time) : new Date()
    });
  }

  return {
    eventType: String(body.event_type || ""),
    resource
  };
}

export async function handleWechatRefundNotify(rawBody: string, headers: NotifyHeaders) {
  assertNotifyHeaders(rawBody, headers);
  const body = parseNotifyBody(rawBody);
  const resource = decryptWechatPayResource<any>(body.resource);

  if (String(resource.refund_status || "") === "SUCCESS" && resource.out_refund_no) {
    await confirmWechatRefundSuccessByRequestNo(
      String(resource.out_refund_no),
      resource as Prisma.InputJsonValue,
      resource.success_time ? new Date(resource.success_time) : new Date()
    );
  }

  return {
    eventType: String(body.event_type || ""),
    resource
  };
}

export async function handleWechatTransferNotify(rawBody: string, headers: NotifyHeaders) {
  assertNotifyHeaders(rawBody, headers);
  const body = parseNotifyBody(rawBody);
  const resource = decryptWechatPayResource<any>(body.resource);

  if (resource.out_bill_no) {
    await confirmMiniWithdrawTransferByOutBillNo(
      String(resource.out_bill_no),
      resource as Prisma.InputJsonValue,
      String(resource.state || ""),
      resource.update_time ? new Date(resource.update_time) : undefined
    );
  }

  return {
    eventType: String(body.event_type || ""),
    resource
  };
}
