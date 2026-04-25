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

  if (!["local", "tencent_cos"].includes(env.uploadStorageProvider)) {
    errors.push("UPLOAD_STORAGE_PROVIDER 仅支持 local 或 tencent_cos");
  }

  if (env.uploadStorageProvider === "local") {
    const uploadBaseUrl = env.uploadPublicBaseUrl || `${env.publicBaseUrl}/uploads`;
    if (!uploadBaseUrl.startsWith("https://")) {
      errors.push("生产环境本地上传模式的图片访问地址必须使用 https");
    }
  }

  if (env.uploadStorageProvider === "tencent_cos") {
    if (!env.tencentCosSecretId || !env.tencentCosSecretKey || !env.tencentCosBucket || !env.tencentCosRegion) {
      errors.push("UPLOAD_STORAGE_PROVIDER=tencent_cos 时必须完整配置腾讯云 COS 参数");
    }

    const publicAssetBase = env.tencentCosPublicBaseUrl || `https://${env.tencentCosBucket}.cos.${env.tencentCosRegion}.myqcloud.com`;
    if (!publicAssetBase.startsWith("https://")) {
      errors.push("腾讯云 COS 图片访问地址必须使用 https");
    }
  }

  if (errors.length) {
    throw new Error(`runtime config invalid: ${errors.join("；")}`);
  }
}
