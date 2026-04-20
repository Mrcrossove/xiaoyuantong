import crypto from "crypto";
import { ApiError } from "./api-error";
import { ERROR_CODES } from "../constants/error-codes";
import { env } from "../config/env";

type TokenType = "admin" | "mini" | "merchant";

export interface TokenPayload {
  typ: TokenType;
  uid: number;
  roleCode?: string;
  deviceId?: string;
  storeId?: number;
  exp: number;
}

function getSecret() {
  return env.appSecret;
}

function toBase64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function sign(value: string) {
  return crypto.createHmac("sha256", getSecret()).update(value).digest("base64url");
}

export function issueToken(payload: Omit<TokenPayload, "exp">, expiresInSeconds = 7 * 24 * 60 * 60) {
  const fullPayload: TokenPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + expiresInSeconds
  };
  const encoded = toBase64Url(JSON.stringify(fullPayload));
  const signature = sign(encoded);
  return `${encoded}.${signature}`;
}

export function verifyToken(token: string) {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) {
    throw new ApiError("登录状态无效，请重新登录", ERROR_CODES.UNAUTHORIZED, 401);
  }

  if (sign(encoded) !== signature) {
    throw new ApiError("登录状态无效，请重新登录", ERROR_CODES.UNAUTHORIZED, 401);
  }

  const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as TokenPayload;
  if (payload.exp <= Math.floor(Date.now() / 1000)) {
    throw new ApiError("登录已过期，请重新登录", ERROR_CODES.UNAUTHORIZED, 401);
  }
  return payload;
}
