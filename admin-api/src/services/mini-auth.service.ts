import { prisma } from "../lib/prisma";
import { issueToken } from "../utils/token";
import type { MiniLoginPayload } from "../controllers/schemas";
import { fetchWechatSession } from "./wechat-auth.service";
import { ApiError } from "../utils/api-error";
import { ERROR_CODES } from "../constants/error-codes";
import { env } from "../config/env";

const VERIFY_STATUS_VERIFIED = "已认证";

function buildVerifyInfo(user: {
  verifyStatus: string;
  phone: string | null;
  school: string | null;
  verifiedAt: Date | null;
}) {
  return {
    verified: user.verifyStatus === VERIFY_STATUS_VERIFIED,
    statusText: user.verifyStatus,
    phone: user.phone || "",
    school: user.school || "",
    verifiedAt: user.verifiedAt ? user.verifiedAt.toISOString() : ""
  };
}

function buildDeviceId(payload: MiniLoginPayload) {
  const raw = String(payload.deviceId || "").trim();
  return raw || `wechat_${Date.now()}`;
}

export async function miniLogin(payload: MiniLoginPayload) {
  const deviceId = buildDeviceId(payload);
  const nickname = payload.nickname?.trim() || "校园用户";
  const school = payload.school?.trim() || undefined;
  const avatarUrl = payload.avatarUrl?.trim() || undefined;

  if (!payload.code?.trim()) {
    throw new ApiError("缺少微信登录 code", ERROR_CODES.BAD_REQUEST, 400);
  }

  const wechatSession = env.wechatUseMock
    ? {
        openid: `mock_openid_${deviceId}`,
        unionid: `mock_unionid_${deviceId}`
      }
    : await fetchWechatSession(payload.code.trim());

  const user = await prisma.miniUser.upsert({
    where: { openid: wechatSession.openid },
    create: {
      openid: wechatSession.openid,
      unionId: wechatSession.unionid,
      deviceId,
      nickname,
      avatarUrl,
      school
    },
    update: {
      unionId: wechatSession.unionid || undefined,
      nickname,
      avatarUrl,
      school: school || undefined,
      deviceId
    }
  });

  return {
    token: issueToken({ typ: "mini", uid: user.id, deviceId: user.deviceId }, 30 * 24 * 60 * 60),
    profile: {
      id: user.id,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl || "",
      school: user.school || "",
      verifyStatus: user.verifyStatus
    },
    verification: buildVerifyInfo(user)
  };
}
