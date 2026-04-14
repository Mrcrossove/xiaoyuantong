import { env } from "../config/env";
import { ApiError } from "../utils/api-error";
import { ERROR_CODES } from "../constants/error-codes";
import { findMiniOrderForUser, payMiniOrder } from "./mini-order.service";

type WechatMiniPayParams = {
  appId: string;
  timeStamp: string;
  nonceStr: string;
  package: string;
  signType: "RSA";
  paySign: string;
  prepayId: string;
};

export async function createMiniOrderPayParams(userId: number, id: number) {
  const order = await findMiniOrderForUser(userId, id);

  if (order.status !== "待支付") {
    throw new ApiError("当前订单不可发起支付", ERROR_CODES.BAD_REQUEST, 400);
  }

  if (env.payUseMock) {
    return {
      mode: "mock",
      orderId: order.id,
      orderNo: order.orderNo,
      amount: Number(order.amount).toFixed(2),
      payment: null,
      mockMessage: "当前为本地模拟支付，确认后会直接完成支付"
    };
  }

  const payment: WechatMiniPayParams = {
    appId: env.wechatAppId,
    timeStamp: `${Math.floor(Date.now() / 1000)}`,
    nonceStr: `nonce_${Date.now()}`,
    package: "prepay_id=REPLACE_WITH_REAL_PREPAY_ID",
    signType: "RSA",
    paySign: "REPLACE_WITH_REAL_PAY_SIGN",
    prepayId: "REPLACE_WITH_REAL_PREPAY_ID"
  };

  return {
    mode: "wechat",
    orderId: order.id,
    orderNo: order.orderNo,
    amount: Number(order.amount).toFixed(2),
    payment,
    mockMessage: "",
    wechatConfig: {
      mchId: env.wechatPayMchId,
      notifyUrl: env.wechatPayNotifyUrl,
      serialNo: env.wechatPaySerialNo
    }
  };
}

export async function confirmMiniOrderPay(userId: number, id: number) {
  return payMiniOrder(userId, id);
}
