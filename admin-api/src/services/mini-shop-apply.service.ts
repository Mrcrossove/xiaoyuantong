import { prisma } from "../lib/prisma";
import { parsePageParams } from "../utils/pagination";
import { formatDateTime } from "../utils/time";
import type { MiniShopApplyPayload, MiniShopApplyReviewPayload, MiniShopApplyTakedownPayload } from "../controllers/schemas";
import { ApiError } from "../utils/api-error";
import { ERROR_CODES } from "../constants/error-codes";
import { assertRiskPassed } from "./risk-control.service";
import { createMiniMessage } from "./mini-message.service";
import { env } from "../config/env";
import { hashPassword } from "../utils/password";
import { assertSchoolInScope, buildScopedSchoolWhere, getAdminSchoolScope } from "./admin-scope.service";
import { MERCHANT_PRODUCT_STATUS } from "../utils/merchant-product";
import { syncStoreProductSnapshot } from "./store-product.service";

const STATUS = {
  pending: "待审核",
  approved: "已通过",
  rejected: "已驳回"
} as const;

const ERROR_MESSAGES = {
  pendingExists: "你已有待审核的开店申请",
  approvedExists: "你已有审核通过的店铺申请"
} as const;

const STORE_STATUS = {
  open: "\u8425\u4e1a\u4e2d",
  takedown: "\u5df2\u4e0b\u67b6"
} as const;

const MERCHANT_ACCOUNT_STATUS = {
  enabled: "\u542f\u7528",
  disabled: "\u505c\u7528"
} as const;

const STORE_CATEGORY_MAP: Record<
  string,
  { groupKey: string; groupLabel: string; sectionKey: string; sectionLabel: string; cover: string; badge: string }
> = {
  学生商家: {
    groupKey: "student",
    groupLabel: "学生商家",
    sectionKey: "life",
    sectionLabel: "生活服务",
    cover: "store-mini",
    badge: "新店"
  },
  宿舍超市: {
    groupKey: "dorm",
    groupLabel: "宿舍超市",
    sectionKey: "snacks",
    sectionLabel: "零食饮料",
    cover: "store-mini",
    badge: "宿舍"
  },
  校内商家: {
    groupKey: "campus",
    groupLabel: "校内商家",
    sectionKey: "service",
    sectionLabel: "校园服务",
    cover: "store-canteen",
    badge: "校内"
  },
  校外商家: {
    groupKey: "offCampus",
    groupLabel: "校外商家",
    sectionKey: "restaurant",
    sectionLabel: "餐饮美食",
    cover: "store-flower",
    badge: "推荐"
  }
};

function mapApply(item: any, store?: any) {
  const statusClass =
    item.status === STATUS.pending ? "pending" : item.status === STATUS.approved ? "approved" : "rejected";

  return {
    id: item.id,
    userId: item.userId,
    school: item.school,
    storeName: item.storeName,
    category: item.category,
    contactName: item.contactName,
    contactPhone: item.contactPhone,
    description: item.description,
    latitude: item.latitude ?? null,
    longitude: item.longitude ?? null,
    locationName: item.locationName || "",
    locationAddress: item.locationAddress || "",
    status: item.status,
    statusClass,
    storeId: store?.id || 0,
    storeStatus: store?.status || "",
    reviewNote: item.reviewNote || "",
    reviewedAt: item.reviewedAt ? formatDateTime(item.reviewedAt) : "",
    createdAt: formatDateTime(item.createdAt)
  };
}

function buildDetailId(applyId: number) {
  return `apply-store-${applyId}`;
}

function generateMerchantInitialPassword() {
  return `xy${Math.floor(100000 + Math.random() * 900000)}`;
}

async function createStoreForApprovedApply(apply: any) {
  const existingStore = await prisma.miniStore.findFirst({
    where: {
      OR: [{ ownerUserId: apply.userId }, { detailId: buildDetailId(apply.id) }]
    }
  });

  if (existingStore) {
    return existingStore;
  }

  const mapped = STORE_CATEGORY_MAP[apply.category] || STORE_CATEGORY_MAP["学生商家"];

  return prisma.miniStore.create({
    data: {
      detailId: buildDetailId(apply.id),
      ownerUserId: apply.userId,
      school: apply.school,
      name: apply.storeName,
      groupKey: mapped.groupKey,
      groupLabel: mapped.groupLabel,
      sectionKey: mapped.sectionKey,
      sectionLabel: mapped.sectionLabel,
      subtitle: `${apply.category} / 新店开业`,
      rating: 5,
      monthlySales: "0",
      distance: "校内配送",
      delivery: "商家自营",
      priceText: "到店咨询",
      tags: [apply.category, "新店入驻"],
      badge: mapped.badge,
      cover: mapped.cover,
      title: "店铺首页",
      notice: apply.description,
      phone: apply.contactPhone,
      address: apply.locationAddress || apply.locationName || `${apply.school} 校园商家服务区`,
      latitude: apply.latitude ?? null,
      longitude: apply.longitude ?? null,
      locationName: apply.locationName || "",
      locationAddress: apply.locationAddress || "",
      soldText: "0单",
      amountText: "0.00",
      productCount: 0,
      banners: [],
      products: [],
      status: "营业中"
    }
  });
}

async function createMerchantAccountForApprovedApply(apply: any, storeId: number) {
  const existing = await prisma.merchantAccount.findFirst({
    where: {
      OR: [{ miniUserId: apply.userId }, { phone: apply.contactPhone }, { storeId }]
    }
  });

  const now = new Date();
  const loginUrl = env.merchantWebUrl;
  const initialPassword = existing?.password ? null : generateMerchantInitialPassword();

  const account = existing
    ? await prisma.merchantAccount.update({
        where: { id: existing.id },
        data: {
          miniUserId: apply.userId,
          storeId,
          phone: apply.contactPhone,
          name: apply.contactName,
          status: "启用",
          password: existing.password || hashPassword(initialPassword!),
          activatedAt: existing.activatedAt || now,
          mustChangePassword: false,
          initialPasswordSentAt: existing.initialPasswordSentAt || now
        }
      })
    : await prisma.merchantAccount.create({
        data: {
          miniUserId: apply.userId,
          storeId,
          phone: apply.contactPhone,
          name: apply.contactName,
          password: hashPassword(initialPassword!),
          status: "启用",
          mustChangePassword: false,
          activatedAt: now,
          initialPasswordSentAt: now
        }
      });

  await createMiniMessage({
    school: apply.school,
    type: "system",
    category: "商家后台账号开通",
    content: initialPassword
      ? `你的店铺已审核通过，商家后台已开通。后台地址：${loginUrl}；登录账号：${apply.contactPhone}；初始密码：${initialPassword}。你也可以在短信服务可用后使用手机号验证码登录。`
      : `你的店铺已审核通过，商家后台已开通。后台地址：${loginUrl}；登录账号：${apply.contactPhone}。该账号已有密码，请使用原密码登录；短信服务可用后也可使用验证码登录。`,
    receiverUserId: apply.userId,
    targetType: "merchant_account",
    targetId: String(account.id)
  });

  return account;
}

export async function getCurrentMiniShopApply(userId: number) {
  const row = await prisma.miniShopApply.findFirst({
    where: { userId },
    orderBy: { id: "desc" }
  });

  if (!row) {
    return null;
  }

  return mapApply(row);
}

export async function createMiniShopApply(userId: number, payload: MiniShopApplyPayload) {
  const hasLatitude = payload.latitude !== undefined && payload.latitude !== null;
  const hasLongitude = payload.longitude !== undefined && payload.longitude !== null;
  if (hasLatitude !== hasLongitude) {
    throw new ApiError("店铺导航位置需要同时填写经纬度", ERROR_CODES.BAD_REQUEST, 400);
  }

  await assertRiskPassed({
    userId,
    scene: "shop_apply",
    texts: [
      payload.school,
      payload.storeName,
      payload.category,
      payload.contactName,
      payload.contactPhone,
      payload.description,
      payload.locationName || "",
      payload.locationAddress || ""
    ]
  });

  const latest = await prisma.miniShopApply.findFirst({
    where: { userId },
    orderBy: { id: "desc" }
  });

  if (latest?.status === STATUS.pending) {
    throw new ApiError(ERROR_MESSAGES.pendingExists, ERROR_CODES.BAD_REQUEST, 400);
  }

  if (latest?.status === STATUS.approved) {
    throw new ApiError(ERROR_MESSAGES.approvedExists, ERROR_CODES.BAD_REQUEST, 400);
  }

  const row = await prisma.miniShopApply.create({
    data: {
      userId,
      school: payload.school,
      storeName: payload.storeName,
      category: payload.category,
      contactName: payload.contactName,
      contactPhone: payload.contactPhone,
      description: payload.description,
      latitude: hasLatitude ? payload.latitude : null,
      longitude: hasLongitude ? payload.longitude : null,
      locationName: payload.locationName || "",
      locationAddress: payload.locationAddress || "",
      status: STATUS.pending
    }
  });

  return mapApply(row);
}

export async function queryAdminShopApplyList(adminUserId: number, rawQuery: Record<string, unknown>) {
  const { page, pageSize, skip } = parsePageParams(rawQuery);
  const scope = await getAdminSchoolScope(adminUserId);
  const school = String(rawQuery.school || "").trim();
  const status = String(rawQuery.status || "");
  const keyword = String(rawQuery.keyword || "").trim();

  const where = {
    school: buildScopedSchoolWhere(scope, school),
    status: status || undefined,
    OR: keyword
      ? [
          { storeName: { contains: keyword, mode: "insensitive" as const } },
          { category: { contains: keyword, mode: "insensitive" as const } },
          { contactName: { contains: keyword, mode: "insensitive" as const } },
          { contactPhone: { contains: keyword, mode: "insensitive" as const } }
        ]
      : undefined
  };

  const [total, list] = await prisma.$transaction([
    prisma.miniShopApply.count({ where }),
    prisma.miniShopApply.findMany({
      where,
      orderBy: { id: "desc" },
      skip,
      take: pageSize
    })
  ]);

  const stores = list.length
    ? await prisma.miniStore.findMany({
        where: {
          detailId: {
            in: list.map((item: any) => buildDetailId(item.id))
          }
        },
        select: {
          id: true,
          detailId: true,
          status: true
        }
      })
    : [];
  const storeMap = new Map(stores.map((item: any) => [String(item.detailId), item]));

  return {
    list: list.map((item: any) => mapApply(item, storeMap.get(buildDetailId(item.id)))),
    page,
    pageSize,
    total
  };
}

export async function reviewMiniShopApply(adminUserId: number, id: number, payload: MiniShopApplyReviewPayload) {
  const scope = await getAdminSchoolScope(adminUserId);
  const current = await prisma.miniShopApply.findUniqueOrThrow({
    where: { id }
  });
  assertSchoolInScope(scope, current.school);

  const reviewedAt = new Date();
  const row = await prisma.miniShopApply.update({
    where: { id },
    data: {
      status: payload.status,
      reviewNote: payload.reviewNote || "",
      reviewedAt
    }
  });

  if (payload.status === STATUS.approved) {
    const store = await createStoreForApprovedApply(row);
    await createMerchantAccountForApprovedApply(row, store.id);
  }

  return mapApply(row);
}

export async function takedownApprovedMiniShopApply(
  adminUserId: number,
  id: number,
  payload: MiniShopApplyTakedownPayload
) {
  const scope = await getAdminSchoolScope(adminUserId);
  const [current, operator] = await Promise.all([
    prisma.miniShopApply.findUniqueOrThrow({
      where: { id }
    }),
    prisma.adminUser.findUniqueOrThrow({
      where: { id: adminUserId },
      include: {
        role: {
          select: {
            code: true,
            scopeType: true
          }
        }
      }
    })
  ]);
  assertSchoolInScope(scope, current.school);

  if (current.status !== STATUS.approved) {
    throw new ApiError("\u53ea\u80fd\u4e0b\u67b6\u5df2\u901a\u8fc7\u7684\u5e97\u94fa\u7533\u8bf7", ERROR_CODES.BAD_REQUEST, 400);
  }

  const store = await prisma.miniStore.findUnique({
    where: {
      detailId: buildDetailId(current.id)
    },
    include: {
      merchantAccount: true,
      productRows: {
        select: { id: true }
      },
      serviceSchools: true
    }
  });

  if (!store) {
    throw new ApiError("\u5df2\u901a\u8fc7\u7533\u8bf7\u5c1a\u672a\u627e\u5230\u5bf9\u5e94\u5e97\u94fa", ERROR_CODES.NOT_FOUND, 404);
  }

  if (store.status !== STORE_STATUS.open) {
    throw new ApiError("\u5e97\u94fa\u5df2\u4e0d\u662f\u8425\u4e1a\u4e2d\u72b6\u6001", ERROR_CODES.BAD_REQUEST, 400);
  }

  const reason = String(payload.reason || "").trim();

  await prisma.$transaction(async (tx) => {
    await tx.miniStore.update({
      where: { id: store.id },
      data: {
        status: STORE_STATUS.takedown,
        profitSharingEnabled: false,
        settlementMode: "disabled",
        productCount: 0
      }
    });

    if (store.merchantAccount) {
      await tx.merchantAccount.update({
        where: { id: store.merchantAccount.id },
        data: {
          status: MERCHANT_ACCOUNT_STATUS.disabled,
          withdrawBlockedReason: reason || "\u5e97\u94fa\u5df2\u4e0b\u67b6"
        }
      });
    }

    await tx.miniStoreServiceSchool.updateMany({
      where: { storeId: store.id },
      data: { status: "disabled" }
    });

    await tx.miniStoreProduct.updateMany({
      where: { storeId: store.id },
      data: {
        status: MERCHANT_PRODUCT_STATUS.offSale,
        recommended: false
      }
    });

    const productIds = store.productRows.map((item: any) => item.id);
    if (productIds.length) {
      await tx.miniStoreProductSku.updateMany({
        where: {
          productId: {
            in: productIds
          }
        },
        data: {
          status: MERCHANT_PRODUCT_STATUS.offSale
        }
      });
    }

    await syncStoreProductSnapshot(tx, store.id);

    await tx.adminStoreChangeLog.create({
      data: {
        storeId: store.id,
        school: store.school,
        module: "store_apply",
        action: "takedown_store",
        targetType: "store",
        targetId: String(store.id),
        operatorId: operator.id,
        operatorRoleCode: operator.role.code,
        operatorScopeType: operator.role.scopeType,
        changeMode: "normal",
        summary: `\u4e0b\u67b6\u5e97\u94fa\uff1a${store.name}\uff1b\u539f\u56e0\uff1a${reason}`,
        beforeData: {
          storeStatus: store.status,
          merchantStatus: store.merchantAccount?.status || "",
          serviceSchoolCount: store.serviceSchools.length,
          productCount: store.productRows.length
        },
        afterData: {
          storeStatus: STORE_STATUS.takedown,
          merchantStatus: store.merchantAccount ? MERCHANT_ACCOUNT_STATUS.disabled : "",
          serviceSchoolStatus: "disabled",
          productStatus: MERCHANT_PRODUCT_STATUS.offSale,
          reason
        }
      }
    });
  });

  const updatedStore = await prisma.miniStore.findUnique({
    where: { id: store.id },
    select: { id: true, detailId: true, status: true }
  });

  return mapApply(current, updatedStore);
}
