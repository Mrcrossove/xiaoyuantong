import crypto from "crypto";
import { env } from "../config/env";
import { ERROR_CODES } from "../constants/error-codes";
import { ApiError } from "../utils/api-error";

const TENCENT_SMS_HOST = "sms.tencentcloudapi.com";
const TENCENT_SMS_SERVICE = "sms";
const TENCENT_SMS_ACTION = "SendSms";
const TENCENT_SMS_VERSION = "2021-01-11";

type SmsSendScene = "merchant_login";

type SendVerificationCodeParams = {
  phone: string;
  code: string;
  expiresMinutes: number;
  scene: SmsSendScene;
};

type TencentSmsResponse = {
  Response?: {
    RequestId?: string;
    SendStatusSet?: Array<{
      Code?: string;
      Message?: string;
      SerialNo?: string;
      PhoneNumber?: string;
      Fee?: number;
    }>;
  };
};

function hmacSha256(key: string | Buffer, value: string) {
  return crypto.createHmac("sha256", key).update(value, "utf8").digest();
}

function sha256Hex(value: string) {
  return crypto.createHash("sha256").update(value, "utf8").digest("hex");
}

function buildTencentAuthorization(payload: {
  body: string;
  timestamp: number;
  date: string;
}) {
  const signedHeaders = "content-type;host;x-tc-action";
  const canonicalHeaders = `content-type:application/json; charset=utf-8\nhost:${TENCENT_SMS_HOST}\nx-tc-action:${TENCENT_SMS_ACTION.toLowerCase()}\n`;
  const canonicalRequest = ["POST", "/", "", canonicalHeaders, signedHeaders, sha256Hex(payload.body)].join("\n");

  const credentialScope = `${payload.date}/${TENCENT_SMS_SERVICE}/tc3_request`;
  const stringToSign = ["TC3-HMAC-SHA256", String(payload.timestamp), credentialScope, sha256Hex(canonicalRequest)].join(
    "\n"
  );

  const secretDate = hmacSha256(`TC3${env.smsTencentSecretKey}`, payload.date);
  const secretService = hmacSha256(secretDate, TENCENT_SMS_SERVICE);
  const secretSigning = hmacSha256(secretService, "tc3_request");
  const signature = crypto.createHmac("sha256", secretSigning).update(stringToSign, "utf8").digest("hex");

  return `TC3-HMAC-SHA256 Credential=${env.smsTencentSecretId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
}

async function sendTencentSms(params: SendVerificationCodeParams) {
  if (
    !env.smsTencentSecretId ||
    !env.smsTencentSecretKey ||
    !env.smsTencentSdkAppId ||
    !env.smsTencentSignName ||
    !env.smsTencentTemplateId
  ) {
    throw new ApiError("短信服务参数未配置完整", ERROR_CODES.BAD_REQUEST, 400);
  }

  const body = JSON.stringify({
    SmsSdkAppId: env.smsTencentSdkAppId,
    SignName: env.smsTencentSignName,
    TemplateId: env.smsTencentTemplateId,
    TemplateParamSet: [params.code, String(params.expiresMinutes)],
    PhoneNumberSet: [`+86${params.phone}`],
    SessionContext: params.scene
  });
  const timestamp = Math.floor(Date.now() / 1000);
  const date = new Date(timestamp * 1000).toISOString().slice(0, 10);
  const authorization = buildTencentAuthorization({ body, timestamp, date });

  const response = await fetch(`https://${TENCENT_SMS_HOST}`, {
    method: "POST",
    headers: {
      Authorization: authorization,
      "Content-Type": "application/json; charset=utf-8",
      Host: TENCENT_SMS_HOST,
      "X-TC-Action": TENCENT_SMS_ACTION,
      "X-TC-Version": TENCENT_SMS_VERSION,
      "X-TC-Region": env.smsTencentRegion,
      "X-TC-Timestamp": String(timestamp)
    },
    body
  });

  const result = (await response.json()) as TencentSmsResponse;
  const status = result.Response?.SendStatusSet?.[0];

  if (!response.ok || !status || status.Code !== "Ok") {
    throw new ApiError(status?.Message || "短信发送失败", ERROR_CODES.BAD_REQUEST, 400);
  }

  return {
    provider: "tencent",
    requestId: result.Response?.RequestId || "",
    serialNo: status.SerialNo || ""
  };
}

export async function sendVerificationCode(params: SendVerificationCodeParams) {
  if (env.smsProvider === "tencent") {
    const result = await sendTencentSms(params);
    return {
      ...result,
      devCode: ""
    };
  }

  return {
    provider: "mock",
    requestId: "",
    serialNo: "",
    devCode: params.code
  };
}
