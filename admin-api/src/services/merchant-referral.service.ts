import { env } from "../config/env";
import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/api-error";
import { ERROR_CODES } from "../constants/error-codes";
import { formatDateTime } from "../utils/time";
import { createUnlimitedMiniCode } from "./wechat-mini-code.service";

const SCENE_PREFIX = "m_";

export function buildMerchantReferralScene(accountId: number) {
  return `${SCENE_PREFIX}${accountId}`;
}

export function parseMerchantReferralScene(scene: string) {
  const value = String(scene || "").trim();
  if (!value.startsWith(SCENE_PREFIX)) return 0;
  const id = Number(value.slice(SCENE_PREFIX.length));
  return Number.isInteger(id) && id > 0 ? id : 0;
}

function centsToYuan(cents: number) {
  return Number((Number(cents || 0) / 100).toFixed(2));
}

export async function recordMerchantReferral(userId: number, scene?: string) {
  const accountId = parseMerchantReferralScene(String(scene || ""));
  if (!accountId) return null;

  const existing = await prisma.merchantReferral.findUnique({
    where: { userId }
  });
  if (existing) return existing;

  const account = await prisma.merchantAccount.findUnique({
    where: { id: accountId },
    select: {
      id: true,
      storeId: true,
      status: true
    }
  });

  if (!account || account.status === "鍋滅敤") {
    return null;
  }

  return prisma.merchantReferral.create({
    data: {
      merchantAccountId: account.id,
      storeId: account.storeId,
      userId,
      scene: buildMerchantReferralScene(account.id),
      unitPriceCents: env.merchantReferralUnitPriceCents,
      billable: true,
      status: "pending"
    }
  });
}

export async function getMerchantReferralOverview(accountId: number) {
  const account = await prisma.merchantAccount.findUnique({
    where: { id: accountId },
    include: {
      store: {
        select: {
          id: true,
          name: true,
          school: true
        }
      }
    }
  });

  if (!account) {
    throw new ApiError("Merchant account not found", ERROR_CODES.NOT_FOUND, 404);
  }

  const scene = buildMerchantReferralScene(account.id);
  const [miniCode, totalCount, billableCount, recentRows] = await Promise.all([
    createUnlimitedMiniCode(scene, "pages/store-detail/store-detail"),
    prisma.merchantReferral.count({
      where: { merchantAccountId: account.id }
    }),
    prisma.merchantReferral.count({
      where: {
        merchantAccountId: account.id,
        billable: true,
        status: "pending"
      }
    }),
    prisma.merchantReferral.findMany({
      where: { merchantAccountId: account.id },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            avatarUrl: true,
            school: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 20
    })
  ]);

  const unitPriceCents = env.merchantReferralUnitPriceCents;
  return {
    store: {
      id: account.store.id,
      name: account.store.name,
      school: account.store.school
    },
    scene,
    page: "pages/store-detail/store-detail",
    miniCode: {
      dataUrl: `data:${miniCode.mimeType};base64,${miniCode.base64}`,
      mocked: miniCode.mocked
    },
    summary: {
      totalCount,
      billableCount,
      unitPrice: centsToYuan(unitPriceCents),
      estimatedAmount: centsToYuan(billableCount * unitPriceCents)
    },
    recentUsers: recentRows.map((item) => ({
      id: item.id,
      userId: item.userId,
      nickname: item.user.nickname,
      avatarUrl: item.user.avatarUrl || "",
      school: item.user.school || "",
      billable: item.billable,
      status: item.status,
      amount: item.billable ? centsToYuan(item.unitPriceCents) : 0,
      firstLoginAt: formatDateTime(item.firstLoginAt),
      createdAt: formatDateTime(item.createdAt)
    }))
  };
}
