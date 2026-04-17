import { env } from "../config/env";
import { getDefaultMerchantMenuPaths, getDefaultMerchantPermissionCodes } from "../constants/merchant-auth";
import type {
  MerchantActivatePayload,
  MerchantCodeLoginPayload,
  MerchantPasswordLoginPayload,
  MerchantSendCodePayload
} from "../controllers/merchant-schemas";
import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/api-error";
import { ERROR_CODES } from "../constants/error-codes";
import { sendVerificationCode } from "./sms.service";
import { issueToken } from "../utils/token";

function generateCode() {
  return `${Math.floor(100000 + Math.random() * 900000)}`;
}

function buildMerchantSession(account: {
  id: number;
  phone: string;
  name: string;
  status: string;
  activatedAt: Date | null;
  store: {
    id: number;
    detailId: string;
    name: string;
    school: string;
    status: string;
  };
}) {
  if (account.status === "停用") {
    throw new ApiError("商家账号已停用", ERROR_CODES.FORBIDDEN, 403);
  }

  return {
    profile: {
      id: account.id,
      phone: account.phone,
      name: account.name,
      status: account.status,
      isActivated: Boolean(account.activatedAt),
      storeId: account.store.id,
      storeDetailId: account.store.detailId,
      storeName: account.store.name,
      school: account.store.school,
      storeStatus: account.store.status
    },
    menuPaths: getDefaultMerchantMenuPaths(),
    permissions: getDefaultMerchantPermissionCodes()
  };
}

async function loadAccountByPhone(phone: string) {
  const account = await prisma.merchantAccount.findUnique({
    where: { phone },
    include: {
      store: {
        select: {
          id: true,
          detailId: true,
          name: true,
          school: true,
          status: true
        }
      }
    }
  });

  if (!account) {
    throw new ApiError("该手机号未绑定商家账号", ERROR_CODES.NOT_FOUND, 404);
  }

  return account;
}

async function loadAccountById(accountId: number) {
  return prisma.merchantAccount.findUniqueOrThrow({
    where: { id: accountId },
    include: {
      store: {
        select: {
          id: true,
          detailId: true,
          name: true,
          school: true,
          status: true
        }
      }
    }
  });
}

async function consumeLoginCode(phone: string, code: string) {
  const row = await prisma.merchantLoginCode.findFirst({
    where: {
      phone,
      code,
      scene: "login",
      consumedAt: null,
      expiresAt: {
        gt: new Date()
      }
    },
    orderBy: { id: "desc" }
  });

  if (!row) {
    throw new ApiError("验证码错误或已过期", ERROR_CODES.BAD_REQUEST, 400);
  }

  await prisma.merchantLoginCode.update({
    where: { id: row.id },
    data: {
      consumedAt: new Date()
    }
  });
}

async function touchLogin(accountId: number) {
  await prisma.merchantAccount.update({
    where: { id: accountId },
    data: {
      lastLoginAt: new Date()
    }
  });
}

export async function merchantSendLoginCode(payload: MerchantSendCodePayload) {
  const account = await loadAccountByPhone(payload.phone);
  const code = generateCode();
  const expiresAt = new Date(Date.now() + env.smsCodeExpireMinutes * 60 * 1000);

  await prisma.merchantLoginCode.create({
    data: {
      phone: payload.phone,
      code,
      scene: payload.scene,
      expiresAt
    }
  });

  const smsResult = await sendVerificationCode({
    phone: payload.phone,
    code,
    expiresMinutes: env.smsCodeExpireMinutes,
    scene: "merchant_login"
  });

  return {
    phone: payload.phone,
    expiresAt: expiresAt.toISOString(),
    isActivated: Boolean(account.activatedAt),
    provider: smsResult.provider,
    devCode: smsResult.devCode || ""
  };
}

export async function merchantCodeLogin(payload: MerchantCodeLoginPayload) {
  await consumeLoginCode(payload.phone, payload.code);
  const account = await loadAccountByPhone(payload.phone);
  await touchLogin(account.id);

  return {
    token: issueToken({ typ: "merchant", uid: account.id, storeId: account.store.id }),
    ...buildMerchantSession(account)
  };
}

export async function merchantPasswordLogin(payload: MerchantPasswordLoginPayload) {
  const account = await loadAccountByPhone(payload.phone);

  if (!account.password) {
    throw new ApiError("该账号尚未激活，请先使用验证码登录并设置密码", ERROR_CODES.BAD_REQUEST, 400);
  }

  if (account.password !== payload.password) {
    throw new ApiError("手机号或密码错误", ERROR_CODES.BAD_REQUEST, 400);
  }

  await touchLogin(account.id);
  return {
    token: issueToken({ typ: "merchant", uid: account.id, storeId: account.store.id }),
    ...buildMerchantSession(account)
  };
}

export async function merchantActivate(accountId: number, payload: MerchantActivatePayload) {
  const account = await loadAccountById(accountId);
  const row = await prisma.merchantAccount.update({
    where: { id: accountId },
    data: {
      password: payload.password,
      status: "启用",
      activatedAt: account.activatedAt || new Date()
    },
    include: {
      store: {
        select: {
          id: true,
          detailId: true,
          name: true,
          school: true,
          status: true
        }
      }
    }
  });

  return buildMerchantSession(row);
}

export async function getMerchantSession(accountId: number) {
  const account = await loadAccountById(accountId);
  return buildMerchantSession(account);
}
