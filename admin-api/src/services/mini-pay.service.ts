import { env } from "../config/env";
import { ERROR_CODES } from "../constants/error-codes";
import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/api-error";
import { findMiniOrderForUser, markMiniOrderPaid, MINI_ORDER_STATUS } from "./mini-order.service";
import { createWechatJsapiOrder, queryWechatOrderByOutTradeNo } from "./wechat-pay.service";

type WechatMiniPayParams = {
  appId: string;
  timeStamp: string;
  nonceStr: string;
  package: string;
  signType: "RSA";
  paySign: string;
  prepayId: string;
};

async function loadOrderPayContext(userId: number, id: number) {
  const order = await findMiniOrderForUser(userId, id);
  const [user, store] = await Promise.all([
    prisma.miniUser.findUnique({
      where: { id: userId }
    }),
    prisma.miniStore.findFirst({
      where: {
        detailId: order.storeDetailId
      }
    })
  ]);

  if (!user) {
    throw new ApiError("用户不存在", ERROR_CODES.NOT_FOUND, 404);
  }

  if (!store) {
    throw new ApiError("店铺不存在", ERROR_CODES.NOT_FOUND, 404);
  }

  return {
    order,
    user,
    store
  };
}

export async function createMiniOrderPayParams(userId: number, id: number) {
  const { order, user, store } = await loadOrderPayContext(userId, id);

  if (order.status !== MINI_ORDER_STATUS.pending) {
    throw new ApiError("当前订单不可发起支付", ERROR_CODES.BAD_REQUEST, 400);
  }

  if (env.payUseMock) {
    return {
      mode: "mock",
      orderId: order.id,
      orderNo: order.orderNo,
      amount: Number(order.amount).toFixed(2),
      payment: null,
      mockMessage: "当前为本地模拟支付，确认后会直接完成支付。"
    };
  }

  if (!user.openid) {
    throw new ApiError("当前用户缺少微信 openid，请使用真实微信登录后再支付", ERROR_CODES.BAD_REQUEST, 400);
  }

  const paymentResult = await createWechatJsapiOrder({
    description: `${order.storeName}-${order.productName}`,
    outTradeNo: order.orderNo,
    amount: Number(order.amount || 0),
    payerOpenid: user.openid,
    subMchId: store.wechatSubMchId || env.wechatPaySubMchIdFallback
  });

  const payment = paymentResult.payment as WechatMiniPayParams;

  return {
    mode: "wechat",
    orderId: order.id,
    orderNo: order.orderNo,
    amount: Number(order.amount).toFixed(2),
    payment,
    mockMessage: "",
    wechatConfig: {
      mchId: env.wechatPaySpMchId,
      notifyUrl: env.wechatPayNotifyUrl,
      serialNo: env.wechatPayMerchantSerialNo
    }
  };
}

export async function confirmMiniOrderPay(userId: number, id: number) {
  const { order, store } = await loadOrderPayContext(userId, id);

  if (env.payUseMock) {
    return markMiniOrderPaid(userId, id, {
      paymentChannel: "微信支付",
      paymentMode: "模拟支付",
      paymentMeta: { mode: "mock" }
    });
  }

  const result = await queryWechatOrderByOutTradeNo(order.orderNo, store.wechatSubMchId || env.wechatPaySubMchIdFallback);
  if (String(result.trade_state || "") !== "SUCCESS") {
    throw new ApiError(result.trade_state_desc || "微信支付尚未完成", ERROR_CODES.BAD_REQUEST, 400);
  }

  return markMiniOrderPaid(userId, id, {
    paymentChannel: "微信支付",
    paymentMode: "小程序支付",
    transactionId: result.transaction_id || "",
    paymentMeta: result
  });
}
