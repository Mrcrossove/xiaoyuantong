import { env } from "./env";

function isPlaceholder(value: string) {
  const normalized = String(value || "").trim().toLowerCase();
  return !normalized || normalized === "placeholder" || normalized === "your-secret";
}

export function validateRuntimeConfig() {
  if (!env.isProduction) {
    return;
  }

  const errors: string[] = [];

  if (isPlaceholder(env.appSecret) || env.appSecret === "campus-admin-secret") {
    errors.push("APP_SECRET 未配置为生产密钥");
  }

  if (env.wechatUseMock) {
    errors.push("生产环境不允许开启 WECHAT_USE_MOCK");
  }

  if (env.payUseMock) {
    errors.push("生产环境不允许开启 PAY_USE_MOCK");
  }

  if (env.smsProvider === "mock") {
    errors.push("生产环境不允许使用 mock 短信服务");
  }

  if (!env.publicBaseUrl.startsWith("https://")) {
    errors.push("生产环境 PUBLIC_BASE_URL 必须使用 https");
  }

  if (errors.length) {
    throw new Error(`runtime config invalid: ${errors.join("；")}`);
  }
}
