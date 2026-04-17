import dotenv from "dotenv";
import path from "path";

dotenv.config();

export const env = {
  port: Number(process.env.PORT || 3001),
  databaseUrl: process.env.DATABASE_URL || "",
  publicBaseUrl: process.env.PUBLIC_BASE_URL || `http://127.0.0.1:${Number(process.env.PORT || 3001)}`,
  uploadsDir: process.env.UPLOADS_DIR || path.resolve(process.cwd(), "uploads"),

  wechatAppId: process.env.WECHAT_APP_ID || "",
  wechatAppSecret: process.env.WECHAT_APP_SECRET || "",
  wechatUseMock: process.env.WECHAT_USE_MOCK !== "false",

  payUseMock: process.env.PAY_USE_MOCK !== "false",
  wechatPayMchId: process.env.WECHAT_PAY_MCH_ID || "",
  wechatPayNotifyUrl: process.env.WECHAT_PAY_NOTIFY_URL || "",
  wechatPayRefundNotifyUrl: process.env.WECHAT_PAY_REFUND_NOTIFY_URL || "",
  wechatPaySerialNo: process.env.WECHAT_PAY_SERIAL_NO || process.env.WECHAT_PAY_MERCHANT_SERIAL_NO || "",
  wechatPayMerchantSerialNo: process.env.WECHAT_PAY_MERCHANT_SERIAL_NO || process.env.WECHAT_PAY_SERIAL_NO || "",
  wechatPayPrivateKey: process.env.WECHAT_PAY_PRIVATE_KEY || "",
  wechatPayPlatformPublicKey: process.env.WECHAT_PAY_PLATFORM_PUBLIC_KEY || "",
  wechatPayApiV3Key: process.env.WECHAT_PAY_API_V3_KEY || "",
  wechatPayUseServiceProvider: process.env.WECHAT_PAY_USE_SERVICE_PROVIDER !== "false",
  wechatPaySpAppId: process.env.WECHAT_PAY_SP_APP_ID || process.env.WECHAT_APP_ID || "",
  wechatPaySpMchId: process.env.WECHAT_PAY_SP_MCH_ID || process.env.WECHAT_PAY_MCH_ID || "",
  wechatPaySubMchIdFallback: process.env.WECHAT_PAY_SUB_MCH_ID || "",
  wechatPayCommissionRate: Number(process.env.WECHAT_PAY_COMMISSION_RATE || 0.05),
  wechatPayProfitSharing: process.env.WECHAT_PAY_PROFIT_SHARING !== "false",

  smsProvider: (process.env.SMS_PROVIDER || "mock").trim().toLowerCase(),
  smsCodeExpireMinutes: Number(process.env.SMS_CODE_EXPIRE_MINUTES || 10),
  smsTencentSecretId: process.env.SMS_TENCENT_SECRET_ID || "",
  smsTencentSecretKey: process.env.SMS_TENCENT_SECRET_KEY || "",
  smsTencentSdkAppId: process.env.SMS_TENCENT_SDK_APP_ID || "",
  smsTencentSignName: process.env.SMS_TENCENT_SIGN_NAME || "",
  smsTencentTemplateId: process.env.SMS_TENCENT_TEMPLATE_ID || "",
  smsTencentRegion: process.env.SMS_TENCENT_REGION || "ap-guangzhou",

  riskUseMock: process.env.RISK_USE_MOCK !== "false",
  riskKeywords: (process.env.RISK_KEYWORDS || "微信,wx,QQ,qq群,兼职刷单,返利,代考,裸聊,赌博,私彩")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean),
  riskPostLimitPerMinute: Number(process.env.RISK_POST_LIMIT_PER_MINUTE || 6),
  riskCommentLimitPerMinute: Number(process.env.RISK_COMMENT_LIMIT_PER_MINUTE || 15)
};
