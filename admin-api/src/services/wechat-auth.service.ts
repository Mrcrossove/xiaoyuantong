import { env } from "../config/env";
import { ApiError } from "../utils/api-error";
import { ERROR_CODES } from "../constants/error-codes";

type WechatSessionResult = {
  openid: string;
  unionid?: string;
  session_key?: string;
  errmsg?: string;
  errcode?: number;
};

export async function fetchWechatSession(code: string) {
  if (!code) {
    throw new ApiError("缺少微信登录 code", ERROR_CODES.BAD_REQUEST, 400);
  }

  if (env.wechatUseMock || !env.wechatAppId || !env.wechatAppSecret) {
    return {
      openid: `mock_openid_${code}`,
      unionid: `mock_unionid_${code}`
    };
  }

  const query = new URLSearchParams({
    appid: env.wechatAppId,
    secret: env.wechatAppSecret,
    js_code: code,
    grant_type: "authorization_code"
  });

  const response = await fetch(`https://api.weixin.qq.com/sns/jscode2session?${query.toString()}`);
  const payload = (await response.json()) as WechatSessionResult;

  if (!response.ok || payload.errcode || !payload.openid) {
    throw new ApiError(payload.errmsg || "微信登录失败", ERROR_CODES.BAD_REQUEST, 400);
  }

  return {
    openid: payload.openid,
    unionid: payload.unionid
  };
}
