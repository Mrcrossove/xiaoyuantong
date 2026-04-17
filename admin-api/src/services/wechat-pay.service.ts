import crypto from "crypto";
import { env } from "../config/env";
import { ERROR_CODES } from "../constants/error-codes";
import { ApiError } from "../utils/api-error";

type RequestMethod = "GET" | "POST";

type CreateWechatJsapiOrderParams = {
  description: string;
  outTradeNo: string;
  amount: number;
  payerOpenid: string;
  subMchId: string;
};

type CreateWechatRefundParams = {
  outTradeNo: string;
  outRefundNo: string;
  totalAmount: number;
  refundAmount: number;
  reason: string;
  subMchId: string;
};

function normalizePem(value: string) {
  return String(value || "").replace(/\\n/g, "\n").trim();
}

function ensureWechatPayReady() {
  const required = [
    env.wechatPaySpAppId,
    env.wechatPaySpMchId,
    env.wechatPayMerchantSerialNo,
    env.wechatPayPrivateKey
  ];

  if (required.some((item) => !String(item || "").trim())) {
    throw new ApiError("微信支付参数未配置完整", ERROR_CODES.BAD_REQUEST, 400);
  }
}

function ensureSubMchId(subMchId?: string) {
  const value = String(subMchId || env.wechatPaySubMchIdFallback || "").trim();
  if (!value) {
    throw new ApiError("商家子商户号未配置", ERROR_CODES.BAD_REQUEST, 400);
  }
  return value;
}

function buildNonceStr() {
  return crypto.randomBytes(16).toString("hex");
}

function signMessage(message: string) {
  const privateKey = normalizePem(env.wechatPayPrivateKey);
  return crypto.createSign("RSA-SHA256").update(message).sign(privateKey, "base64");
}

function buildAuthorization(method: RequestMethod, urlPath: string, body: string) {
  ensureWechatPayReady();
  const nonceStr = buildNonceStr();
  const timestamp = `${Math.floor(Date.now() / 1000)}`;
  const message = `${method}\n${urlPath}\n${timestamp}\n${nonceStr}\n${body}\n`;
  const signature = signMessage(message);

  return {
    timestamp,
    nonceStr,
    header: `WECHATPAY2-SHA256-RSA2048 mchid="${env.wechatPaySpMchId}",nonce_str="${nonceStr}",timestamp="${timestamp}",serial_no="${env.wechatPayMerchantSerialNo}",signature="${signature}"`
  };
}

async function requestWechatPay<T>(method: RequestMethod, urlPath: string, body?: Record<string, unknown>) {
  const rawBody = body ? JSON.stringify(body) : "";
  const auth = buildAuthorization(method, urlPath, rawBody);
  const response = await fetch(`https://api.mch.weixin.qq.com${urlPath}`, {
    method,
    headers: {
      Accept: "application/json",
      Authorization: auth.header,
      "Content-Type": "application/json",
      "User-Agent": "campus-admin-api"
    },
    body: method === "GET" ? undefined : rawBody
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new ApiError(data.message || data.detail || "微信支付请求失败", ERROR_CODES.BAD_REQUEST, response.status);
  }

  return data as T;
}

function buildMiniProgramPaySign(appId: string, timeStamp: string, nonceStr: string, prepayId: string) {
  const pkg = `prepay_id=${prepayId}`;
  const message = `${appId}\n${timeStamp}\n${nonceStr}\n${pkg}\n`;
  return {
    appId,
    timeStamp,
    nonceStr,
    package: pkg,
    signType: "RSA" as const,
    paySign: signMessage(message),
    prepayId
  };
}

export async function createWechatJsapiOrder(params: CreateWechatJsapiOrderParams) {
  const subMchId = ensureSubMchId(params.subMchId);
  const result = await requestWechatPay<{ prepay_id: string }>("POST", "/v3/pay/partner/transactions/jsapi", {
    sp_appid: env.wechatPaySpAppId,
    sp_mchid: env.wechatPaySpMchId,
    sub_mchid: subMchId,
    description: params.description,
    out_trade_no: params.outTradeNo,
    notify_url: env.wechatPayNotifyUrl,
    amount: {
      total: Math.round(Number(params.amount || 0) * 100),
      currency: "CNY"
    },
    payer: {
      sp_openid: params.payerOpenid
    }
  });

  const timeStamp = `${Math.floor(Date.now() / 1000)}`;
  const nonceStr = buildNonceStr();

  return {
    prepayId: result.prepay_id,
    payment: buildMiniProgramPaySign(env.wechatPaySpAppId, timeStamp, nonceStr, result.prepay_id),
    raw: result
  };
}

export async function queryWechatOrderByOutTradeNo(outTradeNo: string, subMchId?: string) {
  const finalSubMchId = ensureSubMchId(subMchId);
  const urlPath = `/v3/pay/partner/transactions/out-trade-no/${encodeURIComponent(outTradeNo)}?sp_mchid=${encodeURIComponent(
    env.wechatPaySpMchId
  )}&sub_mchid=${encodeURIComponent(finalSubMchId)}`;
  return requestWechatPay<any>("GET", urlPath);
}

export async function createWechatRefund(params: CreateWechatRefundParams) {
  const subMchId = ensureSubMchId(params.subMchId);
  return requestWechatPay<any>("POST", "/v3/refund/domestic/refunds", {
    sub_mchid: subMchId,
    out_trade_no: params.outTradeNo,
    out_refund_no: params.outRefundNo,
    reason: params.reason,
    notify_url: env.wechatPayRefundNotifyUrl || env.wechatPayNotifyUrl,
    amount: {
      refund: Math.round(Number(params.refundAmount || 0) * 100),
      total: Math.round(Number(params.totalAmount || 0) * 100),
      currency: "CNY"
    }
  });
}

export async function createWechatProfitSharingOrder(params: {
  outTradeNo: string;
  transactionId?: string;
  amount: number;
  receiverName: string;
  receiverAccount: string;
  subMchId: string;
}) {
  if (!env.wechatPayProfitSharing) {
    return {
      skipped: true,
      reason: "profit_sharing_disabled"
    };
  }

  const subMchId = ensureSubMchId(params.subMchId);
  return requestWechatPay<any>("POST", "/v3/profitsharing/orders", {
    appid: env.wechatPaySpAppId,
    sub_mchid: subMchId,
    transaction_id: params.transactionId || undefined,
    out_order_no: `share_${params.outTradeNo}`,
    receivers: [
      {
        type: "MERCHANT_ID",
        account: subMchId,
        amount: Math.round(Number(params.amount || 0) * 100),
        description: params.receiverName || "商家收入"
      }
    ],
    unfreeze_unsplit: true
  });
}
