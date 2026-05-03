import { prisma } from "../lib/prisma";
import { issueToken } from "../utils/token";
import type { MiniLoginPayload, MiniProfileUpdatePayload } from "../controllers/schemas";
import { fetchWechatSession } from "./wechat-auth.service";
import { ApiError } from "../utils/api-error";
import { ERROR_CODES } from "../constants/error-codes";

const VERIFY_STATUS_VERIFIED_LIST = ["已认证", "宸茶璇?"];
const DEFAULT_AVATAR_COUNT = 8;
const LEGACY_DEFAULT_NICKNAMES = new Set(["校园用户", "鏍″洯鐢ㄦ埛"]);

function buildVerifyInfo(user: {
  verifyStatus: string;
  phone: string | null;
  school: string | null;
  verifiedAt: Date | null;
}) {
  return {
    verified: VERIFY_STATUS_VERIFIED_LIST.includes(user.verifyStatus),
    statusText: user.verifyStatus,
    phone: user.phone || "",
    school: user.school || "",
    verifiedAt: user.verifiedAt ? user.verifiedAt.toISOString() : ""
  };
}

function createServerDeviceId() {
  return `wechat_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
}

function createDefaultAvatar() {
  return `default-avatar-${Math.floor(Math.random() * DEFAULT_AVATAR_COUNT) + 1}`;
}

function createDefaultNickname() {
  return `校友${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`;
}

function mapMiniProfile(user: {
  id: number;
  nickname: string;
  avatarUrl: string | null;
  school: string | null;
  verifyStatus: string;
}) {
  return {
    id: user.id,
    nickname: user.nickname,
    avatarUrl: user.avatarUrl || createDefaultAvatar(),
    school: user.school || "",
    verifyStatus: user.verifyStatus
  };
}

async function ensureDefaultProfile<T extends { id: number; avatarUrl: string | null; nickname: string }>(user: T) {
  const data: { avatarUrl?: string; nickname?: string } = {};

  if (!user.avatarUrl) {
    data.avatarUrl = createDefaultAvatar();
  }

  if (!user.nickname || LEGACY_DEFAULT_NICKNAMES.has(user.nickname)) {
    data.nickname = createDefaultNickname();
  }

  if (!data.avatarUrl && !data.nickname) {
    return user;
  }

  return prisma.miniUser.update({
    where: { id: user.id },
    data
  });
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
      nickname: createDefaultNickname(),
      avatarUrl: createDefaultAvatar()
    },
    update: {
      unionId: wechatSession.unionid || undefined
    }
  });
  const profileUser = await ensureDefaultProfile(user);

  return {
    token: issueToken({ typ: "mini", uid: profileUser.id, deviceId: profileUser.deviceId }, 30 * 24 * 60 * 60),
    profile: mapMiniProfile(profileUser),
    verification: buildVerifyInfo(profileUser)
  };
}

export async function getMiniProfile(userId: number) {
  const user = await prisma.miniUser.findUniqueOrThrow({
    where: { id: userId }
  });
  const profileUser = await ensureDefaultProfile(user);
  return mapMiniProfile(profileUser);
}

export async function updateMiniProfile(userId: number, payload: MiniProfileUpdatePayload) {
  const user = await prisma.miniUser.update({
    where: { id: userId },
    data: {
      nickname: payload.nickname,
      avatarUrl: payload.avatarUrl || createDefaultAvatar()
    }
  });
  return mapMiniProfile(user);
}
