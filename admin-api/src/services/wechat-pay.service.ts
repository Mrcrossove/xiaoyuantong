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

type CreateWechatProfitSharingOrderParams = {
  outTradeNo: string;
  outOrderNo?: string;
  transactionId?: string;
  amount: number;
  receiverType?: string;
  receiverName: string;
  receiverAccount: string;
  subMchId: string;
};

type CreateWechatProfitSharingReturnOrderParams = {
  outOrderNo: string;
  outReturnNo: string;
  amount: number;
  description: string;
  subMchId: string;
  returnMchId?: string;
};

type CreateWechatTransferBillParams = {
  outBillNo: string;
  subMchId: string;
  openid: string;
  amount: number;
  remark: string;
  sceneId: string;
  userRecvPerception?: string;
  userName?: string;
};

type WechatPayNotifyHeaders = {
  timestamp: string;
  nonce: string;
  signature: string;
};

type WechatPayNotifyResource = {
  algorithm: string;
  ciphertext: string;
  associated_data?: string;
  nonce: string;
};

type WechatRequestOptions = {
  headers?: Record<string, string>;
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
    throw new ApiError("子商户号未配置", ERROR_CODES.BAD_REQUEST, 400);
  }
  return value;
}

function ensurePlatformPublicKeyReady() {
  if (!String(env.wechatPayPlatformPublicKey || "").trim()) {
    throw new ApiError("微信支付平台公钥未配置", ERROR_CODES.BAD_REQUEST, 400);
  }
}

function ensureApiV3KeyReady() {
  if (String(env.wechatPayApiV3Key || "").trim().length !== 32) {
    throw new ApiError("微信支付 APIv3 Key 未正确配置", ERROR_CODES.BAD_REQUEST, 400);
  }
}

function ensureTransferEncryptReady() {
  ensurePlatformPublicKeyReady();
  if (!String(env.wechatPayPublicKeyId || "").trim()) {
    throw new ApiError("微信提现公钥ID未配置", ERROR_CODES.BAD_REQUEST, 400);
  }
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

async function requestWechatPay<T>(
  method: RequestMethod,
  urlPath: string,
  body?: Record<string, unknown>,
  options?: WechatRequestOptions
) {
  const rawBody = body ? JSON.stringify(body) : "";
  const auth = buildAuthorization(method, urlPath, rawBody);
  const response = await fetch(`https://api.mch.weixin.qq.com${urlPath}`, {
    method,
    headers: {
      Accept: "application/json",
      Authorization: auth.header,
      "Content-Type": "application/json",
      "User-Agent": "campus-admin-api",
      ...(options?.headers || {})
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

function getTransferHeaders() {
  ensureTransferEncryptReady();
  return {
    "Wechatpay-Serial": env.wechatPayPublicKeyId
  };
}

export function encryptWechatPaySensitiveField(value: string) {
  ensureTransferEncryptReady();
  return crypto.publicEncrypt(
    {
      key: normalizePem(env.wechatPayPlatformPublicKey),
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: "sha1"
    },
    Buffer.from(String(value || ""), "utf8")
  ).toString("base64");
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
    },
    settle_info: {
      profit_sharing: env.wechatPayProfitSharing
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

export async function createWechatProfitSharingOrder(params: CreateWechatProfitSharingOrderParams) {
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
    out_order_no: params.outOrderNo || `share_${params.outTradeNo}`,
    receivers: [
      {
        type: params.receiverType || "MERCHANT_ID",
        account: params.receiverAccount,
        amount: Math.round(Number(params.amount || 0) * 100),
        description: params.receiverName || "platform_commission"
      }
    ],
    unfreeze_unsplit: true
  });
}

export async function queryWechatProfitSharingOrder(params: {
  outOrderNo: string;
  subMchId: string;
  transactionId?: string;
}) {
  const subMchId = ensureSubMchId(params.subMchId);
  const search = new URLSearchParams({
    sub_mchid: subMchId
  });
  if (params.transactionId) {
    search.set("transaction_id", params.transactionId);
  }
  return requestWechatPay<any>("GET", `/v3/profitsharing/orders/${encodeURIComponent(params.outOrderNo)}?${search.toString()}`);
}

export async function createWechatProfitSharingReturnOrder(params: CreateWechatProfitSharingReturnOrderParams) {
  const subMchId = ensureSubMchId(params.subMchId);
  return requestWechatPay<any>("POST", "/v3/profitsharing/return-orders", {
    sub_mchid: subMchId,
    out_order_no: params.outOrderNo,
    out_return_no: params.outReturnNo,
    return_mchid: params.returnMchId || subMchId,
    amount: Math.round(Number(params.amount || 0) * 100),
    description: params.description
  });
}

export async function queryWechatProfitSharingReturnOrder(params: {
  outReturnNo: string;
  subMchId: string;
}) {
  const subMchId = ensureSubMchId(params.subMchId);
  const search = new URLSearchParams({
    sub_mchid: subMchId
  });
  return requestWechatPay<any>(
    "GET",
    `/v3/profitsharing/return-orders/${encodeURIComponent(params.outReturnNo)}?${search.toString()}`
  );
}

export async function createWechatTransferBill(params: CreateWechatTransferBillParams) {
  const subMchId = ensureSubMchId(params.subMchId);
  const body: Record<string, unknown> = {
    sp_appid: env.wechatPaySpAppId,
    sp_mchid: env.wechatPaySpMchId,
    sub_mchid: subMchId,
    out_bill_no: params.outBillNo,
    transfer_scene_id: params.sceneId,
    openid: params.openid,
    transfer_amount: Math.round(Number(params.amount || 0) * 100),
    transfer_remark: params.remark,
    notify_url: env.wechatPayTransferNotifyUrl || undefined,
    user_recv_perception: params.userRecvPerception || env.wechatPayTransferUserRecvPerception
  };

  if (params.userName) {
    body.user_name = encryptWechatPaySensitiveField(params.userName);
  }

  return requestWechatPay<any>(
    "POST",
    "/v3/fund-app/mch-transfer/partner/transfer-bills",
    body,
    {
      headers: getTransferHeaders()
    }
  );
}

export async function queryWechatTransferBill(params: { outBillNo: string; subMchId: string }) {
  const subMchId = ensureSubMchId(params.subMchId);
  const search = new URLSearchParams({
    sp_mchid: env.wechatPaySpMchId,
    sub_mchid: subMchId
  });
  return requestWechatPay<any>(
    "GET",
    `/v3/fund-app/mch-transfer/partner/transfer-bills/out-bill-no/${encodeURIComponent(params.outBillNo)}?${search.toString()}`,
    undefined,
    {
      headers: getTransferHeaders()
    }
  );
}

export function verifyWechatPaySignature(rawBody: string, headers: WechatPayNotifyHeaders) {
  ensurePlatformPublicKeyReady();
  const message = `${headers.timestamp}\n${headers.nonce}\n${rawBody}\n`;
  const verifier = crypto.createVerify("RSA-SHA256");
  verifier.update(message);
  verifier.end();
  return verifier.verify(normalizePem(env.wechatPayPlatformPublicKey), headers.signature, "base64");
}

export function decryptWechatPayResource<T = Record<string, unknown>>(resource: WechatPayNotifyResource): T {
  ensureApiV3KeyReady();

  if (resource.algorithm !== "AEAD_AES_256_GCM") {
    throw new ApiError(`unsupported wechat pay algorithm: ${resource.algorithm}`, ERROR_CODES.BAD_REQUEST, 400);
  }

  const key = Buffer.from(env.wechatPayApiV3Key, "utf8");
  const nonce = Buffer.from(resource.nonce, "utf8");
  const cipherText = Buffer.from(resource.ciphertext, "base64");
  const authTag = cipherText.subarray(cipherText.length - 16);
  const encrypted = cipherText.subarray(0, cipherText.length - 16);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, nonce);

  if (resource.associated_data) {
    decipher.setAAD(Buffer.from(resource.associated_data, "utf8"));
  }

  decipher.setAuthTag(authTag);
  const plain = Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
  return JSON.parse(plain) as T;
}
