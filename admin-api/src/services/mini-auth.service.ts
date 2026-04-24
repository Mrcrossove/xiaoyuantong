import { prisma } from "../lib/prisma";
import { issueToken } from "../utils/token";
import type { MiniLoginPayload } from "../controllers/schemas";
import { fetchWechatSession } from "./wechat-auth.service";
import { ApiError } from "../utils/api-error";
import { ERROR_CODES } from "../constants/error-codes";

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

function createServerDeviceId() {
  return `wechat_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
}

export async function miniLogin(payload: MiniLoginPayload) {
  const loginCode = String(payload.code || "").trim();
  if (!loginCode) {
    throw new ApiError("缺少微信登录 code", ERROR_CODES.BAD_REQUEST, 400);
  }

  const wechatSession = await fetchWechatSession(loginCode);
  const user = await prisma.miniUser.upsert({
    where: { openid: wechatSession.openid },
    create: {
      openid: wechatSession.openid,
      unionId: wechatSession.unionid,
      deviceId: createServerDeviceId(),
      nickname: "校园用户"
    },
    update: {
      unionId: wechatSession.unionid || undefined
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
