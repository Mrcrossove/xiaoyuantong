import { env } from "../config/env";
import { ApiError } from "../utils/api-error";
import { ERROR_CODES } from "../constants/error-codes";

type AccessTokenResponse = {
  access_token?: string;
  expires_in?: number;
  errcode?: number;
  errmsg?: string;
};

type TokenCache = {
  token: string;
  expiresAt: number;
};

let tokenCache: TokenCache | null = null;

export async function getWechatAccessToken() {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 60 * 1000) {
    return tokenCache.token;
  }

  const query = new URLSearchParams({
    grant_type: "client_credential",
    appid: env.wechatAppId,
    secret: env.wechatAppSecret
  });

  const response = await fetch(`https://api.weixin.qq.com/cgi-bin/token?${query.toString()}`);
  const payload = (await response.json()) as AccessTokenResponse;

  if (!response.ok || payload.errcode || !payload.access_token) {
    throw new ApiError(payload.errmsg || "Wechat access token request failed", ERROR_CODES.BAD_REQUEST, 400);
  }

  tokenCache = {
    token: payload.access_token,
    expiresAt: Date.now() + Math.max(Number(payload.expires_in || 7200) - 300, 300) * 1000
  };
  return tokenCache.token;
}

export async function createUnlimitedMiniCode(scene: string, page = "pages/index/index") {
  if (env.wechatUseMock || !env.wechatAppId || !env.wechatAppSecret) {
    return {
      mimeType: "text/plain",
      base64: Buffer.from(`mock-mini-code:${page}?scene=${scene}`).toString("base64"),
      mocked: true
    };
  }

  const token = await getWechatAccessToken();
  const response = await fetch(`https://api.weixin.qq.com/wxa/getwxacodeunlimit?access_token=${encodeURIComponent(token)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      scene,
      page,
      check_path: false
    })
  });

  const contentType = response.headers.get("content-type") || "";
  const buffer = Buffer.from(await response.arrayBuffer());

  if (contentType.includes("application/json")) {
    const payload = JSON.parse(buffer.toString("utf8")) as { errcode?: number; errmsg?: string };
    throw new ApiError(payload.errmsg || "Mini program code request failed", ERROR_CODES.BAD_REQUEST, 400);
  }

  if (!response.ok || !buffer.length) {
    throw new ApiError("Mini program code request failed", ERROR_CODES.BAD_REQUEST, 400);
  }

  return {
    mimeType: contentType.includes("image/") ? contentType : "image/png",
    base64: buffer.toString("base64"),
    mocked: false
  };
}
