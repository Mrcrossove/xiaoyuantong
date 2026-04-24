import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/api-error";
import { ERROR_CODES } from "../constants/error-codes";
import { formatDateTime } from "../utils/time";

export const MERCHANT_WITHDRAW_PROFILE_STATUS = {
  pending: "未建档",
  ready: "已建档"
} as const;

function maskPhone(phone: string) {
  const text = String(phone || "");
  if (text.length !== 11) {
    return text || "-";
  }
  return `${text.slice(0, 3)}****${text.slice(-4)}`;
}

function buildBlockedReason(account: {
  miniUser: { openid: string | null };
  withdrawAgreementAcceptedAt: Date | null;
  withdrawRealName: string | null;
}) {
  if (!account.miniUser.openid) {
    return "当前商家尚未通过微信登录绑定 openid";
  }

  if (!account.withdrawAgreementAcceptedAt) {
    return "尚未确认微信提现收款协议";
  }

  if (!account.withdrawRealName) {
    return "已建档，可发起小额提现；大额微信提现前建议补充真实姓名";
  }

  return "";
}

function buildProfileState(account: {
  withdrawChannel: string;
  withdrawRealName: string | null;
  withdrawProfileStatus: string;
  withdrawBlockedReason: string | null;
  withdrawAgreementAcceptedAt: Date | null;
  withdrawOpenidBoundAt: Date | null;
  withdrawProfileCompletedAt: Date | null;
  phone: string;
  miniUser: { openid: string | null };
}) {
  const openidBound = Boolean(account.miniUser.openid);
  const agreementAccepted = Boolean(account.withdrawAgreementAcceptedAt);
  const realNameFilled = Boolean(String(account.withdrawRealName || "").trim());
  const ready = openidBound && agreementAccepted;
  const blockedReason = buildBlockedReason(account);

  return {
    channel: account.withdrawChannel || "微信零钱",
    openidBound,
    openidMasked: openidBound ? `openid已绑定(${maskPhone(account.phone)})` : "未绑定",
    realName: account.withdrawRealName || "",
    realNameFilled,
    agreementAccepted,
    status: ready ? MERCHANT_WITHDRAW_PROFILE_STATUS.ready : MERCHANT_WITHDRAW_PROFILE_STATUS.pending,
    blockedReason,
    openidBoundAt: account.withdrawOpenidBoundAt ? formatDateTime(account.withdrawOpenidBoundAt) : "",
    agreementAcceptedAt: account.withdrawAgreementAcceptedAt ? formatDateTime(account.withdrawAgreementAcceptedAt) : "",
    completedAt: account.withdrawProfileCompletedAt ? formatDateTime(account.withdrawProfileCompletedAt) : "",
    amountLimitNote: realNameFilled
      ? "已补充真实姓名，可继续完善大额提现实名校验能力"
      : "当前版本仅支持 2000 元以下微信零钱提现，大额提现前请先补充真实姓名"
  };
}

export async function refreshMerchantWithdrawProfile(accountId: number) {
  const account = await prisma.merchantAccount.findUnique({
    where: { id: accountId },
    include: {
      miniUser: {
        select: {
          openid: true
        }
      }
    }
  });

  if (!account) {
    throw new ApiError("商家账号不存在", ERROR_CODES.NOT_FOUND, 404);
  }

  const openidBound = Boolean(account.miniUser.openid);
  const agreementAccepted = Boolean(account.withdrawAgreementAcceptedAt);
  const ready = openidBound && agreementAccepted;
  const blockedReason = buildBlockedReason(account);

  const updated = await prisma.merchantAccount.update({
    where: { id: accountId },
    data: {
      withdrawProfileStatus: ready ? MERCHANT_WITHDRAW_PROFILE_STATUS.ready : MERCHANT_WITHDRAW_PROFILE_STATUS.pending,
      withdrawBlockedReason: blockedReason || null,
      withdrawOpenidBoundAt: openidBound ? account.withdrawOpenidBoundAt || new Date() : null,
      withdrawProfileCompletedAt: ready ? account.withdrawProfileCompletedAt || new Date() : null
    },
    include: {
      miniUser: {
        select: {
          openid: true
        }
      }
    }
  });

  return buildProfileState(updated);
}

export async function updateMerchantWithdrawProfile(accountId: number, payload: {
  withdrawRealName?: string;
  acceptWithdrawAgreement?: boolean;
}) {
  await prisma.merchantAccount.update({
    where: { id: accountId },
    data: {
      withdrawRealName: String(payload.withdrawRealName || "").trim() || null,
      withdrawAgreementAcceptedAt: payload.acceptWithdrawAgreement ? new Date() : null
    }
  });

  return refreshMerchantWithdrawProfile(accountId);
}

export async function getMerchantWithdrawProfile(accountId: number) {
  return refreshMerchantWithdrawProfile(accountId);
}

export async function ensureMerchantWithdrawProfileReady(accountId: number) {
  const profile = await refreshMerchantWithdrawProfile(accountId);
  if (!profile.openidBound) {
    throw new ApiError("提现前请先使用微信授权登录小程序，完成微信收款身份绑定", ERROR_CODES.BAD_REQUEST, 400);
  }

  if (!profile.agreementAccepted) {
    throw new ApiError("提现前请先在账号设置中完成微信提现收款建档确认", ERROR_CODES.BAD_REQUEST, 400);
  }

  return profile;
}
