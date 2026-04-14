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
  wechatPayMchId: process.env.WECHAT_PAY_MCH_ID || "",
  wechatPayNotifyUrl: process.env.WECHAT_PAY_NOTIFY_URL || "",
  wechatPaySerialNo: process.env.WECHAT_PAY_SERIAL_NO || "",
  payUseMock: process.env.PAY_USE_MOCK !== "false",
  riskUseMock: process.env.RISK_USE_MOCK !== "false",
  riskKeywords: (process.env.RISK_KEYWORDS || "微信,wx,QQ,qq群,兼职刷单,返利,代考,裸聊,赌博,私彩")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean),
  riskPostLimitPerMinute: Number(process.env.RISK_POST_LIMIT_PER_MINUTE || 6),
  riskCommentLimitPerMinute: Number(process.env.RISK_COMMENT_LIMIT_PER_MINUTE || 15)
};
