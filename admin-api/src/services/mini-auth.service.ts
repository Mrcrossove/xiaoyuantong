import { prisma } from "../lib/prisma";
import { issueToken } from "../utils/token";
import type { MiniLoginPayload } from "../controllers/schemas";
import { fetchWechatSession } from "./wechat-auth.service";

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
  const nickname = payload.nickname?.trim() || "校园用户";
  const school = payload.school?.trim() || undefined;
  const avatarUrl = payload.avatarUrl?.trim() || undefined;

  if (payload.code?.trim()) {
    const wechatSession = await fetchWechatSession(payload.code.trim());
    const user = await prisma.miniUser.upsert({
      where: { openid: wechatSession.openid },
      create: {
        openid: wechatSession.openid,
        unionId: wechatSession.unionid,
        deviceId: buildDeviceId(payload),
        nickname,
        avatarUrl,
        school
      },
      update: {
        unionId: wechatSession.unionid || undefined,
        nickname,
        avatarUrl,
        school: school || undefined,
        deviceId: buildDeviceId(payload)
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

  const deviceId = buildDeviceId(payload);
  const user = await prisma.miniUser.upsert({
    where: { deviceId },
    create: {
      deviceId,
      nickname,
      avatarUrl,
      school
    },
    update: {
      nickname,
      avatarUrl,
      school: school || undefined
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
