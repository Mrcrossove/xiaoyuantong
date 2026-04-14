import { prisma } from "../lib/prisma";
import { parsePageParams } from "../utils/pagination";
import { formatDateTime } from "../utils/time";
import type { MiniShopApplyPayload, MiniShopApplyReviewPayload } from "../controllers/schemas";
import { ApiError } from "../utils/api-error";
import { ERROR_CODES } from "../constants/error-codes";
import { assertRiskPassed } from "./risk-control.service";

const STATUS = {
  pending: "待审核",
  approved: "已通过",
  rejected: "已驳回"
};

const ERROR_MESSAGES = {
  pendingExists: "你已有待审核的开店申请",
  approvedExists: "你已有审核通过的店铺申请"
};

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

function mapApply(item: any) {
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
    status: item.status,
    statusClass,
    reviewNote: item.reviewNote || "",
    reviewedAt: item.reviewedAt ? formatDateTime(item.reviewedAt) : "",
    createdAt: formatDateTime(item.createdAt)
  };
}

function buildDetailId(applyId: number) {
  return `apply-store-${applyId}`;
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
      subtitle: `${apply.category} / 新店开张`,
      rating: 5,
      monthlySales: "0",
      distance: "校内配送",
      delivery: "商家自营",
      priceText: "到店咨询",
      tags: [apply.category, "新店入驻"],
      badge: mapped.badge,
      cover: mapped.cover,
      title: "店铺主页",
      notice: apply.description,
      phone: apply.contactPhone,
      address: `${apply.school} 校园商家服务区`,
      soldText: "0单",
      amountText: "0.00",
      productCount: 0,
      banners: [],
      products: [],
      status: "营业中"
    }
  });
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
  await assertRiskPassed({
    userId,
    scene: "shop_apply",
    texts: [payload.school, payload.storeName, payload.category, payload.contactName, payload.contactPhone, payload.description]
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
      status: STATUS.pending
    }
  });

  return mapApply(row);
}

export async function queryAdminShopApplyList(rawQuery: Record<string, unknown>) {
  const { page, pageSize, skip } = parsePageParams(rawQuery);
  const school = String(rawQuery.school || "");
  const status = String(rawQuery.status || "");
  const keyword = String(rawQuery.keyword || "").trim();

  const where = {
    school: school || undefined,
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

  return {
    list: list.map(mapApply),
    page,
    pageSize,
    total
  };
}

export async function reviewMiniShopApply(id: number, payload: MiniShopApplyReviewPayload) {
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
    await createStoreForApprovedApply(row);
  }

  return mapApply(row);
}
