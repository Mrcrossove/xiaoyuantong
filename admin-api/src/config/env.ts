import dotenv from "dotenv";
import path from "path";

dotenv.config();

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  isProduction: (process.env.NODE_ENV || "development") === "production",
  port: Number(process.env.PORT || 3001),
  databaseUrl: process.env.DATABASE_URL || "",
  publicBaseUrl: process.env.PUBLIC_BASE_URL || `http://127.0.0.1:${Number(process.env.PORT || 3001)}`,
  corsOrigins: (process.env.CORS_ORIGINS || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean),
  uploadsDir: process.env.UPLOADS_DIR || path.resolve(process.cwd(), "uploads"),
  uploadStorageProvider: (process.env.UPLOAD_STORAGE_PROVIDER || "local").trim().toLowerCase() as "local" | "tencent_cos",
  uploadPublicBaseUrl: (process.env.UPLOAD_PUBLIC_BASE_URL || "").trim(),
  tencentCosSecretId: process.env.TENCENT_COS_SECRET_ID || "",
  tencentCosSecretKey: process.env.TENCENT_COS_SECRET_KEY || "",
  tencentCosBucket: process.env.TENCENT_COS_BUCKET || "",
  tencentCosRegion: process.env.TENCENT_COS_REGION || "",
  tencentCosPathPrefix: process.env.TENCENT_COS_PATH_PREFIX || "uploads",
  tencentCosPublicBaseUrl: (process.env.TENCENT_COS_PUBLIC_BASE_URL || "").trim(),
  appSecret: process.env.APP_SECRET || "campus-admin-secret",

  wechatAppId: process.env.WECHAT_APP_ID || "",
  wechatAppSecret: process.env.WECHAT_APP_SECRET || "",
  wechatUseMock: process.env.WECHAT_USE_MOCK !== "false",
  allowMiniDevAccountSwitch: process.env.ALLOW_MINI_DEV_ACCOUNT_SWITCH === "true",

  payUseMock: process.env.PAY_USE_MOCK !== "false",
  wechatPayMchId: process.env.WECHAT_PAY_MCH_ID || "",
  wechatPayNotifyUrl: process.env.WECHAT_PAY_NOTIFY_URL || "",
  wechatPayRefundNotifyUrl: process.env.WECHAT_PAY_REFUND_NOTIFY_URL || "",
  wechatPaySerialNo: process.env.WECHAT_PAY_SERIAL_NO || process.env.WECHAT_PAY_MERCHANT_SERIAL_NO || "",
  wechatPayMerchantSerialNo: process.env.WECHAT_PAY_MERCHANT_SERIAL_NO || process.env.WECHAT_PAY_SERIAL_NO || "",
  wechatPayPrivateKey: process.env.WECHAT_PAY_PRIVATE_KEY || "",
  wechatPayPlatformPublicKey: process.env.WECHAT_PAY_PLATFORM_PUBLIC_KEY || "",
  wechatPayPlatformSerialNo: process.env.WECHAT_PAY_PLATFORM_SERIAL_NO || "",
  wechatPayPublicKeyId: process.env.WECHAT_PAY_PUBLIC_KEY_ID || process.env.WECHAT_PAY_PLATFORM_SERIAL_NO || "",
  wechatPayApiV3Key: process.env.WECHAT_PAY_API_V3_KEY || "",
  wechatPayUseServiceProvider: process.env.WECHAT_PAY_USE_SERVICE_PROVIDER !== "false",
  wechatPaySpAppId: process.env.WECHAT_PAY_SP_APP_ID || process.env.WECHAT_APP_ID || "",
  wechatPaySpMchId: process.env.WECHAT_PAY_SP_MCH_ID || process.env.WECHAT_PAY_MCH_ID || "",
  wechatPaySubMchIdFallback: process.env.WECHAT_PAY_SUB_MCH_ID || "",
  wechatPayCommissionRate: Number(process.env.WECHAT_PAY_COMMISSION_RATE || 0.05),
  wechatPayProfitSharing: process.env.WECHAT_PAY_PROFIT_SHARING !== "false",
  wechatPayTransferNotifyUrl: process.env.WECHAT_PAY_TRANSFER_NOTIFY_URL || "",
  wechatPayTransferSceneId: process.env.WECHAT_PAY_TRANSFER_SCENE_ID || "",
  wechatPayTransferUserRecvPerception: process.env.WECHAT_PAY_TRANSFER_USER_RECV_PERCEPTION || "校园通商家提现",

  smsProvider: (process.env.SMS_PROVIDER || "mock").trim().toLowerCase(),
  smsCodeExpireMinutes: Number(process.env.SMS_CODE_EXPIRE_MINUTES || 10),
  smsTencentSecretId: process.env.SMS_TENCENT_SECRET_ID || "",
  smsTencentSecretKey: process.env.SMS_TENCENT_SECRET_KEY || "",
  smsTencentSdkAppId: process.env.SMS_TENCENT_SDK_APP_ID || "",
  smsTencentSignName: process.env.SMS_TENCENT_SIGN_NAME || "",
  smsTencentTemplateId: process.env.SMS_TENCENT_TEMPLATE_ID || "",
  smsTencentRegion: process.env.SMS_TENCENT_REGION || "ap-guangzhou",
  allowDevCodeExposure: process.env.ALLOW_DEV_CODE_EXPOSURE === "true",
  adminLoginWindowMs: Number(process.env.ADMIN_LOGIN_WINDOW_MS || 10 * 60 * 1000),
  adminLoginMaxAttempts: Number(process.env.ADMIN_LOGIN_MAX_ATTEMPTS || 10),
  merchantLoginWindowMs: Number(process.env.MERCHANT_LOGIN_WINDOW_MS || 10 * 60 * 1000),
  merchantLoginMaxAttempts: Number(process.env.MERCHANT_LOGIN_MAX_ATTEMPTS || 10),
  merchantSendCodeWindowMs: Number(process.env.MERCHANT_SEND_CODE_WINDOW_MS || 10 * 60 * 1000),
  merchantSendCodeMaxAttempts: Number(process.env.MERCHANT_SEND_CODE_MAX_ATTEMPTS || 5),
  merchantSendCodeCooldownMs: Number(process.env.MERCHANT_SEND_CODE_COOLDOWN_MS || 60 * 1000),

  riskUseMock: process.env.RISK_USE_MOCK !== "false",
  riskKeywords: (process.env.RISK_KEYWORDS || "微信,wx,QQ,qq群,兼职刷单,返利,代考,裸聊,赌博,私彩")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean),
  riskPostLimitPerMinute: Number(process.env.RISK_POST_LIMIT_PER_MINUTE || 6),
  riskCommentLimitPerMinute: Number(process.env.RISK_COMMENT_LIMIT_PER_MINUTE || 15)
};
