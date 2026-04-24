import { Prisma } from "@prisma/client";
import type { MiniMerchantProductPayload } from "../controllers/mini-commerce-schemas";
import type { RefundReviewPayload } from "../controllers/schemas";
import { ERROR_CODES } from "../constants/error-codes";
import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/api-error";
import { parsePageParams } from "../utils/pagination";
import {
  buildProductDisplayPrice,
  getDefaultSku,
  MERCHANT_PRODUCT_STATUS,
  parseMoneyNumber,
  toMerchantProducts
} from "../utils/merchant-product";
import { getAdminSchoolScope } from "./admin-scope.service";
import { createMiniMessage } from "./mini-message.service";
import {
  MINI_ORDER_STATUS,
  MINI_PAY_STATUS,
  MINI_REFUND_STATUS,
  MINI_SETTLEMENT_STATUS,
  settleMiniOrderIncome
} from "./mini-order.service";
import { reviewMiniRefundRequest } from "./mini-refund.service";
import {
  createStoreProductRecord,
  deleteStoreProductRecord,
  mapStoreProductForApi,
  toggleStoreProductStatusRecord,
  updateStoreProductRecord
} from "./store-product.service";

interface BannerItem {
  id: number;
  tag: string;
  title: string;
  desc: string;
  cta: string;
}

type AdminProductMutationControl = {
  expectedUpdatedAt?: string;
  conflictStrategy?: "reject" | "force" | "submit_for_approval";
  conflictReason?: string;
};

type ApprovalReviewPayload = {
  status: "approved" | "rejected";
  reviewNote?: string;
};

const STORE_STATUS = {
  open: "营业中"
} as const;

function toArray(value: Prisma.JsonValue | null | undefined) {
  return Array.isArray(value) ? value : [];
}

function formatDateTime(value: Date | null | undefined) {
  if (!value) return "";
  return value.toISOString().slice(0, 19).replace("T", " ");
}

function formatIsoTime(value: Date | null | undefined) {
  return value ? value.toISOString() : "";
}

function roundMoney(value: number) {
  return Number(Number(value || 0).toFixed(2));
}

function calcPercent(value: number, total: number) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

function normalizeAdminOrderStatus(status: string) {
  return status === MINI_ORDER_STATUS.accepted ? MINI_ORDER_STATUS.processing : status;
}

function buildSchoolWhere(scope: Awaited<ReturnType<typeof getAdminSchoolScope>>, school: string) {
  if (scope.isAll) {
    return school || undefined;
  }

  if (school) {
    return scope.schools.includes(school) ? school : "__no_school__";
  }

  return {
    in: scope.schools
  };
}

function parseDateRange(rawQuery: Record<string, unknown>) {
  const dateFrom = String(rawQuery.dateFrom || "").trim();
  const dateTo = String(rawQuery.dateTo || "").trim();
  const createdAt: { gte?: Date; lte?: Date } = {};

  if (dateFrom) {
    const start = new Date(`${dateFrom}T00:00:00.000Z`);
    if (!Number.isNaN(start.getTime())) createdAt.gte = start;
  }

  if (dateTo) {
    const end = new Date(`${dateTo}T23:59:59.999Z`);
    if (!Number.isNaN(end.getTime())) createdAt.lte = end;
  }

  return Object.keys(createdAt).length ? createdAt : undefined;
}

function buildBannerList(school: string) {
  const title = school || "当前高校";
  return [
    {
      id: 1,
      tag: "平台推荐",
      title: `${title}创业店铺推荐`,
      desc: "优先展示校园热门商家、学生创业团队和高活跃店铺。",
      cta: "查看更多"
    }
  ];
}

function mapStoreListItem(item: any) {
  const products = toMerchantProducts(item.products);
  const availableProducts = products.filter((entry) => String(entry.status || MERCHANT_PRODUCT_STATUS.onSale) === MERCHANT_PRODUCT_STATUS.onSale);
  const recommendedProduct = availableProducts.find((entry) => Boolean(entry.recommended)) || availableProducts[0] || null;
  const defaultSku = recommendedProduct ? getDefaultSku(recommendedProduct) : null;

  return {
    id: item.id,
    detailId: item.detailId,
    name: item.name,
    school: item.school,
    rating: item.rating,
    monthlySales: item.monthlySales,
    distance: item.distance,
    delivery: item.delivery,
    price: recommendedProduct ? buildProductDisplayPrice(recommendedProduct) : item.priceText,
    priceValue: defaultSku ? parseMoneyNumber(defaultSku.price) : parseMoneyNumber(item.priceText),
    tags: toArray(item.tags).map((entry) => String(entry)),
    badge: item.badge,
    cover: item.cover,
    subtitle: item.subtitle,
    hasRecommendedProduct: Boolean(recommendedProduct?.recommended),
    recommendedProductName: recommendedProduct ? String(recommendedProduct.name || "") : "",
    recommendedProductPrice: recommendedProduct ? buildProductDisplayPrice(recommendedProduct) : "",
    groupKey: item.groupKey,
    groupLabel: item.groupLabel,
    sectionKey: item.sectionKey,
    sectionLabel: item.sectionLabel
  };
}

function mapStoreDetail(item: any) {
  const cover = item.cover || "";
  const products = toMerchantProducts(item.products)
    .filter((entry) => String(entry.status || MERCHANT_PRODUCT_STATUS.onSale) === MERCHANT_PRODUCT_STATUS.onSale)
    .map((entry) => {
      const defaultSku = getDefaultSku(entry);
      return {
        id: entry.id,
        name: entry.name,
        desc: entry.desc,
        price: buildProductDisplayPrice(entry),
        priceValue: defaultSku ? parseMoneyNumber(defaultSku.price) : 0,
        cover: entry.cover,
        stock: Number(entry.stock || 0),
        dailyLimit: Number(entry.dailyLimit || 0),
        recommended: Boolean(entry.recommended),
        specMode: entry.specMode || "single",
        defaultSkuId: entry.defaultSkuId || "",
        skus: (entry.skus || []).filter((sku) => String(sku.status || MERCHANT_PRODUCT_STATUS.onSale) === MERCHANT_PRODUCT_STATUS.onSale)
      };
    });

  return {
    title: item.title,
    storeName: item.name,
    cover,
    notice: item.notice,
    phone: item.phone,
    address: item.address,
    stats: {
      sold: item.soldText,
      amount: item.amountText,
      count: products.length
    },
    banners: (cover ? [cover] : []).concat(toArray(item.banners).map((entry) => String(entry))),
    products
  };
}

function mapAdminStoreItem(item: any) {
  const products = toMerchantProducts(item.products);
  const recommendedCount = products.filter((entry) => Boolean(entry.recommended)).length;

  return {
    id: item.id,
    detailId: item.detailId,
    storeName: item.name,
    owner: item.ownerUser?.nickname || "-",
    ownerPhone: item.ownerUser?.phone || "",
    school: item.school,
    category: item.groupLabel,
    section: item.sectionLabel,
    status: item.status,
    recommend: recommendedCount > 0 ? "推荐中" : "未推荐",
    goodsCount: products.length,
    rating: item.rating,
    createdAt: item.createdAt
  };
}

function mapAdminEditableProduct(item: any) {
  return {
    id: String(item.id || item.productKey || ""),
    name: String(item.name || ""),
    desc: String(item.desc || ""),
    cover: String(item.cover || ""),
    recommended: Boolean(item.recommended),
    status: String(item.status || MERCHANT_PRODUCT_STATUS.onSale),
    specMode: item.specMode === "multi" ? "multi" : "single",
    price: String(item.price || item.priceText || ""),
    stock: Number(item.stock || 0),
    dailyLimit: Number(item.dailyLimit || 0),
    defaultSkuId: String(item.defaultSkuId || item.defaultSkuKey || ""),
    updatedAt: formatIsoTime(item.updatedAt),
    skus: Array.isArray(item.skus)
      ? item.skus.map((sku: any) => ({
          id: String(sku.id || sku.skuKey || ""),
          name: String(sku.name || ""),
          price: String(sku.price || sku.priceText || ""),
          stock: Number(sku.stock || 0),
          dailyLimit: Number(sku.dailyLimit || 0),
          status: String(sku.status || MERCHANT_PRODUCT_STATUS.onSale),
          isDefault: Boolean(sku.isDefault)
        }))
      : []
  };
}

function formatRefundItem(refund: any) {
  return {
    id: refund.id,
    refundNo: refund.refundNo,
    amount: roundMoney(Number(refund.amount || 0)),
    reason: refund.reason,
    status: refund.status,
    reviewNote: refund.reviewNote || "",
    reviewerName: refund.reviewer?.name || "",
    applyTime: formatDateTime(refund.applyTime),
    reviewedAt: formatDateTime(refund.reviewedAt)
  };
}

function mapAdminOrderDetail(order: any) {
  const latestRefund = Array.isArray(order.refunds) && order.refunds.length ? order.refunds[0] : null;
  const hasPendingRefund = Boolean(latestRefund && latestRefund.status === MINI_REFUND_STATUS.pending);
  const canFinish =
    (order.status === MINI_ORDER_STATUS.processing || order.status === MINI_ORDER_STATUS.accepted) &&
    order.payStatus === MINI_PAY_STATUS.paid &&
    !hasPendingRefund;
  const canCancel = order.status === MINI_ORDER_STATUS.pending && order.payStatus === MINI_PAY_STATUS.pending;

  return {
    id: order.id,
    orderNo: order.orderNo,
    school: order.school,
    buyer: order.user?.nickname || order.receiverName || "-",
    storeName: order.storeName,
    productName: order.productName,
    productDesc: order.productDesc || "",
    productCover: order.productCover || "",
    skuName: order.skuName || "",
    quantity: order.quantity,
    unitPrice: roundMoney(Number(order.unitPrice || 0)),
    amount: roundMoney(Number(order.amount || 0)),
    payStatus: order.payStatus,
    orderStatus: normalizeAdminOrderStatus(order.status),
    rawOrderStatus: order.status,
    settlementStatus: order.settlementStatus,
    receiverName: order.receiverName,
    receiverPhone: order.receiverPhone,
    receiverAddress: order.receiverAddress,
    addressTag: order.addressTag || "",
    remark: order.remark || "",
    paymentChannel: order.paymentChannel || "",
    paymentMode: order.paymentMode || "",
    createdAt: formatDateTime(order.createdAt),
    paidAt: formatDateTime(order.paidAt),
    finishedAt: formatDateTime(order.finishedAt),
    canceledAt: formatDateTime(order.canceledAt),
    refunds: Array.isArray(order.refunds) ? order.refunds.map((item: any) => formatRefundItem(item)) : [],
    latestRefund: latestRefund ? formatRefundItem(latestRefund) : null,
    actions: {
      canFinish,
      canCancel,
      canReviewRefund: hasPendingRefund
    }
  };
}

async function getAdminOperatorContext(adminUserId: number) {
  const admin = await prisma.adminUser.findUniqueOrThrow({
    where: { id: adminUserId },
    include: {
      role: {
        select: {
          code: true,
          scopeType: true
        }
      }
    }
  });

  return {
    admin,
    isSuperAdmin: admin.role.code === "super_admin" || admin.role.scopeType === "all"
  };
}

async function findAdminStoreWithScope(adminUserId: number, storeId: number) {
  const scope = await getAdminSchoolScope(adminUserId);

  return prisma.miniStore.findFirst({
    where: {
      id: storeId,
      school: buildSchoolWhere(scope, "")
    },
    include: {
      ownerUser: {
        select: {
          nickname: true,
          phone: true
        }
      }
    }
  });
}

async function findAdminScopedProduct(adminUserId: number, storeId: number, productId: string) {
  const store = await findAdminStoreWithScope(adminUserId, storeId);
  if (!store) {
    throw new ApiError("店铺不存在或无权访问", ERROR_CODES.NOT_FOUND, 404);
  }

  const product = await prisma.miniStoreProduct.findFirst({
    where: {
      storeId: store.id,
      productKey: String(productId)
    },
    include: {
      skus: {
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }]
      }
    }
  });

  if (!product) {
    throw new ApiError("商品不存在", ERROR_CODES.NOT_FOUND, 404);
  }

  return { store, product };
}

async function findAdminStoreOrder(adminUserId: number, storeId: number, orderId: number) {
  const store = await findAdminStoreWithScope(adminUserId, storeId);
  if (!store) {
    throw new ApiError("店铺不存在或无权访问", ERROR_CODES.NOT_FOUND, 404);
  }

  const order = await prisma.miniOrder.findFirst({
    where: {
      id: orderId,
      storeDetailId: store.detailId
    },
    include: {
      user: {
        select: {
          nickname: true
        }
      },
      refunds: {
        orderBy: {
          applyTime: "desc"
        },
        include: {
          reviewer: {
            select: {
              name: true
            }
          }
        }
      }
    }
  });

  if (!order) {
    throw new ApiError("订单不存在或不属于当前店铺", ERROR_CODES.NOT_FOUND, 404);
  }

  return { store, order };
}

function conflict(message: string) {
  throw new ApiError(message, ERROR_CODES.CONFLICT, 409);
}

function assertExpectedUpdatedAt(currentUpdatedAt: Date, expectedUpdatedAt?: string) {
  if (!expectedUpdatedAt) return;
  if (formatIsoTime(currentUpdatedAt) !== String(expectedUpdatedAt).trim()) {
    conflict("商品数据已被其他管理员更新，请刷新后重试");
  }
}

async function createStoreChangeLog(
  tx: any,
  params: {
    store: any;
    operator: Awaited<ReturnType<typeof getAdminOperatorContext>>;
    action: string;
    targetType: string;
    targetId: string;
    summary: string;
    changeMode?: string;
    beforeData?: unknown;
    afterData?: unknown;
  }
) {
  await tx.adminStoreChangeLog.create({
    data: {
      storeId: params.store.id,
      school: params.store.school,
      module: "store_product",
      action: params.action,
      targetType: params.targetType,
      targetId: params.targetId,
      operatorId: params.operator.admin.id,
      operatorRoleCode: params.operator.admin.role.code,
      operatorScopeType: params.operator.admin.role.scopeType,
      changeMode: params.changeMode || "normal",
      summary: params.summary,
      beforeData: (params.beforeData ?? null) as Prisma.InputJsonValue,
      afterData: (params.afterData ?? null) as Prisma.InputJsonValue
    }
  });
}

async function createStoreProductApproval(
  tx: any,
  params: {
    store: any;
    product: any;
    operator: Awaited<ReturnType<typeof getAdminOperatorContext>>;
    action: string;
    payload: Record<string, unknown>;
    reason?: string;
    expectedUpdatedAt?: string;
  }
) {
  const approval = await tx.storeProductApproval.create({
    data: {
      storeId: params.store.id,
      school: params.store.school,
      targetType: "product",
      targetId: String(params.product.productKey),
      action: params.action,
      status: "pending",
      reason: String(params.reason || "并发冲突后提交审批"),
      payload: params.payload as Prisma.InputJsonValue,
      expectedStoreUpdatedAt: params.expectedUpdatedAt ? new Date(params.expectedUpdatedAt) : params.product.updatedAt,
      requestedById: params.operator.admin.id
    }
  });

  await createStoreChangeLog(tx, {
    store: params.store,
    operator: params.operator,
    action: "submit_approval",
    targetType: "product",
    targetId: String(params.product.productKey),
    summary: `提交商品变更审批：${params.product.name}`,
    changeMode: "approval",
    beforeData: mapStoreProductForApi(params.product),
    afterData: params.payload
  });

  return approval;
}

async function executeApprovedAction(
  tx: any,
  approval: any,
  reviewer: Awaited<ReturnType<typeof getAdminOperatorContext>>,
  reviewNote?: string
) {
  const store = await tx.miniStore.findUniqueOrThrow({
    where: { id: approval.storeId },
    include: {
      ownerUser: {
        select: {
          nickname: true,
          phone: true
        }
      }
    }
  });

  const payload = approval.payload as Record<string, unknown>;
  const product = await tx.miniStoreProduct.findFirst({
    where: {
      storeId: approval.storeId,
      productKey: String(approval.targetId)
    },
    include: {
      skus: {
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }]
      }
    }
  });

  if (!product) {
    throw new ApiError("审批目标商品不存在", ERROR_CODES.NOT_FOUND, 404);
  }

  const beforeData = mapStoreProductForApi(product);
  let afterData: unknown = null;

  if (approval.action === "update") {
    const updated = await updateStoreProductRecord(tx, approval.storeId, approval.targetId, payload as any);
    afterData = mapStoreProductForApi(updated);
  } else if (approval.action === "toggle_status") {
    const updated = await toggleStoreProductStatusRecord(tx, approval.storeId, approval.targetId);
    afterData = mapStoreProductForApi(updated);
  } else if (approval.action === "delete") {
    await deleteStoreProductRecord(tx, approval.storeId, approval.targetId);
  } else {
    throw new ApiError("不支持的审批动作", ERROR_CODES.BAD_REQUEST, 400);
  }

  await tx.storeProductApproval.update({
    where: { id: approval.id },
    data: {
      status: "approved",
      reviewedById: reviewer.admin.id,
      reviewNote: reviewNote || "",
      reviewedAt: new Date()
    }
  });

  await createStoreChangeLog(tx, {
    store,
    operator: reviewer,
    action: "approve_approval",
    targetType: "product",
    targetId: String(approval.targetId),
    summary: `审批通过商品变更：${product.name}`,
    changeMode: "approval",
    beforeData,
    afterData
  });
}

export async function queryMiniStores(rawQuery: Record<string, unknown>) {
  const school = String(rawQuery.school || "");
  const keyword = String(rawQuery.keyword || "").trim();
  const groupKey = String(rawQuery.groupKey || "");
  const sectionKey = String(rawQuery.sectionKey || "");

  const where = {
    school: school || undefined,
    groupKey: groupKey || undefined,
    sectionKey: sectionKey || undefined,
    status: STORE_STATUS.open,
    OR: keyword
      ? [
          { name: { contains: keyword, mode: "insensitive" as const } },
          { subtitle: { contains: keyword, mode: "insensitive" as const } },
          { notice: { contains: keyword, mode: "insensitive" as const } }
        ]
      : undefined
  };

  const list = await prisma.miniStore.findMany({
    where,
    orderBy: [{ groupKey: "asc" }, { id: "asc" }]
  });

  return {
    banners: buildBannerList(school || "当前高校"),
    list: list.map(mapStoreListItem)
  };
}

export async function getMiniStoreDetail(detailId: string) {
  const row = await prisma.miniStore.findUniqueOrThrow({
    where: { detailId }
  });
  return mapStoreDetail(row);
}

export async function queryAdminStoreList(adminUserId: number, rawQuery: Record<string, unknown>) {
  const { page, pageSize, skip } = parsePageParams(rawQuery);
  const keyword = String(rawQuery.keyword || "").trim();
  const school = String(rawQuery.school || "").trim();
  const category = String(rawQuery.category || "").trim();
  const scope = await getAdminSchoolScope(adminUserId);

  const where = {
    school: buildSchoolWhere(scope, school),
    groupLabel: category || undefined,
    OR: keyword
      ? [
          { name: { contains: keyword, mode: "insensitive" as const } },
          { ownerUser: { is: { nickname: { contains: keyword, mode: "insensitive" as const } } } }
        ]
      : undefined
  };

  const [total, list] = await prisma.$transaction([
    prisma.miniStore.count({ where }),
    prisma.miniStore.findMany({
      where,
      include: {
        ownerUser: {
          select: {
            nickname: true,
            phone: true
          }
        }
      },
      orderBy: { id: "desc" },
      skip,
      take: pageSize
    })
  ]);

  return {
    list: list.map(mapAdminStoreItem),
    page,
    pageSize,
    total
  };
}

export async function getAdminStoreDashboard(adminUserId: number, storeId: number, rawQuery: Record<string, unknown> = {}) {
  const store = await findAdminStoreWithScope(adminUserId, storeId);
  if (!store) {
    throw new ApiError("店铺不存在或无权访问", ERROR_CODES.NOT_FOUND, 404);
  }

  const createdAt = parseDateRange(rawQuery);
  const trendDays = Math.min(90, Math.max(7, Number(rawQuery.trendDays || 7) || 7));

  const [orders, merchantAccount, productRows] = await prisma.$transaction([
    prisma.miniOrder.findMany({
      where: { storeDetailId: store.detailId, createdAt },
      include: {
        user: {
          select: {
            nickname: true
          }
        },
        refunds: {
          select: {
            id: true,
            status: true
          },
          orderBy: {
            applyTime: "desc"
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    }),
    prisma.merchantAccount.findUnique({
      where: { storeId: store.id },
      select: {
        phone: true,
        status: true,
        activatedAt: true,
        lastLoginAt: true
      }
    }),
    prisma.miniStoreProduct.findMany({
      where: { storeId: store.id },
      include: {
        skus: {
          orderBy: [{ sortOrder: "asc" }, { id: "asc" }]
        }
      },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }]
    })
  ]);

  const products = productRows.map((item: any) => mapStoreProductForApi(item));
  const updatedAtMap = new Map(productRows.map((item: any) => [String(item.productKey), item.updatedAt]));
  const ordersByProductId = new Map<string, number>();
  const revenueByProductId = new Map<string, number>();

  for (const order of orders) {
    const productId = String(order.productId || "");
    if (!productId) continue;
    ordersByProductId.set(productId, (ordersByProductId.get(productId) || 0) + Number(order.quantity || 1));
    revenueByProductId.set(productId, roundMoney((revenueByProductId.get(productId) || 0) + Number(order.amount || 0)));
  }

  const productList = products.map((product: any) => {
    const defaultSku = getDefaultSku(product);
    const status = String(product.status || MERCHANT_PRODUCT_STATUS.onSale);
    const sales = ordersByProductId.get(String(product.id || "")) || 0;
    const revenue = revenueByProductId.get(String(product.id || "")) || 0;

    return {
      id: String(product.id || ""),
      name: String(product.name || ""),
      desc: String(product.desc || ""),
      cover: String(product.cover || ""),
      category: store.sectionLabel,
      price: defaultSku ? parseMoneyNumber(defaultSku.price) : parseMoneyNumber(product.price),
      priceText: buildProductDisplayPrice(product),
      stock: Number(product.stock || 0),
      dailyLimit: Number(product.dailyLimit || 0),
      sales,
      revenue,
      status,
      recommended: Boolean(product.recommended),
      specMode: String(product.specMode || "single"),
      defaultSkuId: String(product.defaultSkuId || ""),
      updatedAt: formatIsoTime(updatedAtMap.get(String(product.id || "")) as Date | undefined),
      skuCount: Array.isArray(product.skus) ? product.skus.length : 0,
      skus: Array.isArray(product.skus)
        ? product.skus.map((sku: any) => ({
            id: String(sku.id || ""),
            name: String(sku.name || ""),
            price: String(sku.price || ""),
            stock: Number(sku.stock || 0),
            dailyLimit: Number(sku.dailyLimit || 0),
            status: String(sku.status || MERCHANT_PRODUCT_STATUS.onSale),
            isDefault: Boolean(sku.isDefault)
          }))
        : []
    };
  });

  const totalOrders = orders.length;
  const paidOrders = orders.filter((item: any) => item.payStatus === MINI_PAY_STATUS.paid).length;
  const finishedOrders = orders.filter((item: any) => item.status === MINI_ORDER_STATUS.finished).length;
  const processingOrders = orders.filter((item: any) =>
    item.status === MINI_ORDER_STATUS.processing || item.status === MINI_ORDER_STATUS.accepted
  ).length;
  const refundedOrders = orders.filter((item: any) => item.payStatus === MINI_PAY_STATUS.refunded).length;
  const refundingOrders = orders.filter((item: any) =>
    item.refunds.some((refund: any) => refund.status === MINI_REFUND_STATUS.pending)
  ).length;
  const totalRevenue = roundMoney(orders.reduce((sum: number, item: any) => sum + Number(item.amount || 0), 0));
  const paidRevenue = roundMoney(
    orders
      .filter((item: any) => item.payStatus === MINI_PAY_STATUS.paid)
      .reduce((sum: number, item: any) => sum + Number(item.amount || 0), 0)
  );
  const settledRevenue = roundMoney(
    orders
      .filter((item: any) => item.settlementStatus === MINI_SETTLEMENT_STATUS.settled)
      .reduce((sum: number, item: any) => sum + Number(item.settlementAmount || item.merchantIncomeAmount || item.amount || 0), 0)
  );
  const pendingSettlementRevenue = roundMoney(
    orders
      .filter(
        (item: any) =>
          item.settlementStatus === MINI_SETTLEMENT_STATUS.pending || item.settlementStatus === MINI_SETTLEMENT_STATUS.waiting
      )
      .reduce((sum: number, item: any) => sum + Number(item.merchantIncomeAmount || item.amount || 0), 0)
  );
  const onSaleProducts = productList.filter((item) => item.status === MERCHANT_PRODUCT_STATUS.onSale).length;
  const recommendedProducts = productList.filter((item) => item.recommended).length;
  const lowStockProducts = productList.filter((item) => item.stock > 0 && item.stock <= 5).length;

  const orderStatusChart = [
    { key: "pending", label: MINI_ORDER_STATUS.pending, value: orders.filter((item: any) => item.status === MINI_ORDER_STATUS.pending).length },
    { key: "processing", label: MINI_ORDER_STATUS.processing, value: processingOrders },
    { key: "finished", label: MINI_ORDER_STATUS.finished, value: finishedOrders },
    { key: "canceled", label: MINI_ORDER_STATUS.canceled, value: orders.filter((item: any) => item.status === MINI_ORDER_STATUS.canceled).length }
  ].map((item) => ({ ...item, percent: calcPercent(item.value, totalOrders) }));

  const payStatusChart = [
    { key: "pending", label: MINI_PAY_STATUS.pending, value: orders.filter((item: any) => item.payStatus === MINI_PAY_STATUS.pending).length },
    { key: "paid", label: MINI_PAY_STATUS.paid, value: paidOrders },
    { key: "refunded", label: MINI_PAY_STATUS.refunded, value: refundedOrders }
  ].map((item) => ({ ...item, percent: calcPercent(item.value, totalOrders) }));

  const settlementChart = [
    { key: "pending", label: MINI_SETTLEMENT_STATUS.pending, value: orders.filter((item: any) => item.settlementStatus === MINI_SETTLEMENT_STATUS.pending).length },
    { key: "waiting", label: MINI_SETTLEMENT_STATUS.waiting, value: orders.filter((item: any) => item.settlementStatus === MINI_SETTLEMENT_STATUS.waiting).length },
    { key: "settled", label: MINI_SETTLEMENT_STATUS.settled, value: orders.filter((item: any) => item.settlementStatus === MINI_SETTLEMENT_STATUS.settled).length },
    { key: "closed", label: MINI_SETTLEMENT_STATUS.closed, value: orders.filter((item: any) => item.settlementStatus === MINI_SETTLEMENT_STATUS.closed).length }
  ].map((item) => ({ ...item, percent: calcPercent(item.value, totalOrders) }));

  const topProducts = [...productList]
    .sort((a, b) => (b.sales === a.sales ? b.revenue - a.revenue : b.sales - a.sales))
    .slice(0, 5)
    .map((item) => ({
      id: item.id,
      name: item.name,
      sales: item.sales,
      revenue: item.revenue
    }));

  const trendMap = new Map<string, { date: string; orders: number; revenue: number }>();
  for (let index = trendDays - 1; index >= 0; index -= 1) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - index);
    const key = date.toISOString().slice(0, 10);
    trendMap.set(key, { date: key, orders: 0, revenue: 0 });
  }
  for (const order of orders) {
    const key = order.createdAt.toISOString().slice(0, 10);
    const current = trendMap.get(key);
    if (!current) continue;
    current.orders += 1;
    current.revenue = roundMoney(current.revenue + Number(order.amount || 0));
  }

  return {
    store: {
      id: store.id,
      detailId: store.detailId,
      storeName: store.name,
      school: store.school,
      category: store.groupLabel,
      section: store.sectionLabel,
      status: store.status,
      rating: store.rating,
      monthlySales: store.monthlySales,
      delivery: store.delivery,
      distance: store.distance,
      subtitle: store.subtitle,
      notice: store.notice,
      phone: store.phone,
      address: store.address,
      cover: store.cover,
      createdAt: formatDateTime(store.createdAt),
      owner: store.ownerUser?.nickname || "-",
      ownerPhone: store.ownerUser?.phone || "",
      merchantPhone: merchantAccount?.phone || "",
      merchantStatus: merchantAccount?.status || "",
      merchantActivatedAt: formatDateTime(merchantAccount?.activatedAt),
      merchantLastLoginAt: formatDateTime(merchantAccount?.lastLoginAt)
    },
    summary: {
      totalOrders,
      paidOrders,
      processingOrders,
      finishedOrders,
      refundedOrders,
      refundingOrders,
      totalRevenue,
      paidRevenue,
      settledRevenue,
      pendingSettlementRevenue,
      avgOrderValue: totalOrders ? roundMoney(totalRevenue / totalOrders) : 0,
      productCount: productList.length,
      onSaleProducts,
      recommendedProducts,
      lowStockProducts
    },
    charts: {
      orderStatus: orderStatusChart,
      payStatus: payStatusChart,
      settlement: settlementChart,
      topProducts,
      recentTrend: Array.from(trendMap.values())
    },
    products: productList,
    orders: orders.slice(0, 20).map((item: any) => ({
      id: item.id,
      orderNo: item.orderNo,
      buyer: item.user?.nickname || item.receiverName || "-",
      receiverName: item.receiverName,
      receiverPhone: item.receiverPhone,
      productName: item.productName,
      skuName: item.skuName || "",
      quantity: item.quantity,
      amount: roundMoney(Number(item.amount || 0)),
      payStatus: item.payStatus,
      orderStatus: normalizeAdminOrderStatus(item.status),
      settlementStatus: item.settlementStatus,
      createdAt: formatDateTime(item.createdAt)
    }))
  };
}

export async function createAdminStoreProduct(adminUserId: number, storeId: number, payload: MiniMerchantProductPayload) {
  const store = await findAdminStoreWithScope(adminUserId, storeId);
  if (!store) {
    throw new ApiError("店铺不存在或无权访问", ERROR_CODES.NOT_FOUND, 404);
  }

  const operator = await getAdminOperatorContext(adminUserId);
  const row = await prisma.$transaction(async (tx) => {
    const created = await createStoreProductRecord(tx, store.id, payload, `p${Date.now()}`);
    await createStoreChangeLog(tx, {
      store,
      operator,
      action: "create",
      targetType: "product",
      targetId: String(created.productKey),
      summary: `新增商品：${created.name}`,
      beforeData: null,
      afterData: mapStoreProductForApi(created)
    });
    return created;
  });

  return {
    storeId: store.id,
    product: mapAdminEditableProduct(row)
  };
}

export async function updateAdminStoreProduct(
  adminUserId: number,
  storeId: number,
  productId: string,
  payload: MiniMerchantProductPayload & AdminProductMutationControl
) {
  const operator = await getAdminOperatorContext(adminUserId);
  const { store, product } = await findAdminScopedProduct(adminUserId, storeId, productId);
  const beforeData = mapStoreProductForApi(product);
  const strategy = payload.conflictStrategy || "reject";

  try {
    if (strategy !== "force") {
      assertExpectedUpdatedAt(product.updatedAt, payload.expectedUpdatedAt);
    } else if (!operator.isSuperAdmin) {
      conflict("只有超级管理员可以强制覆盖其他人的变更");
    }
  } catch (error) {
    if (!operator.isSuperAdmin) {
      const approval = await prisma.$transaction((tx) =>
        createStoreProductApproval(tx, {
          store,
          product,
          operator,
          action: "update",
          payload,
          reason: payload.conflictReason,
          expectedUpdatedAt: payload.expectedUpdatedAt
        })
      );

      return {
        storeId: store.id,
        approvalCreated: true,
        approvalId: approval.id,
        product: mapAdminEditableProduct(product)
      };
    }
    throw error;
  }

  const row = await prisma.$transaction(async (tx) => {
    const updated = await updateStoreProductRecord(tx, store.id, String(productId), payload);
    await createStoreChangeLog(tx, {
      store,
      operator,
      action: "update",
      targetType: "product",
      targetId: String(product.productKey),
      summary: `编辑商品：${product.name}`,
      changeMode: strategy === "force" ? "force" : "normal",
      beforeData,
      afterData: mapStoreProductForApi(updated)
    });
    return updated;
  });

  return {
    storeId: store.id,
    product: mapAdminEditableProduct(row)
  };
}

export async function toggleAdminStoreProductStatus(
  adminUserId: number,
  storeId: number,
  productId: string,
  payload: AdminProductMutationControl = {}
) {
  const operator = await getAdminOperatorContext(adminUserId);
  const { store, product } = await findAdminScopedProduct(adminUserId, storeId, productId);
  const beforeData = mapStoreProductForApi(product);
  const strategy = payload.conflictStrategy || "reject";

  try {
    if (strategy !== "force") {
      assertExpectedUpdatedAt(product.updatedAt, payload.expectedUpdatedAt);
    } else if (!operator.isSuperAdmin) {
      conflict("只有超级管理员可以强制覆盖其他人的变更");
    }
  } catch (error) {
    if (!operator.isSuperAdmin) {
      const approval = await prisma.$transaction((tx) =>
        createStoreProductApproval(tx, {
          store,
          product,
          operator,
          action: "toggle_status",
          payload,
          reason: payload.conflictReason,
          expectedUpdatedAt: payload.expectedUpdatedAt
        })
      );

      return {
        storeId: store.id,
        approvalCreated: true,
        approvalId: approval.id,
        product: mapAdminEditableProduct(product)
      };
    }
    throw error;
  }

  const row = await prisma.$transaction(async (tx) => {
    const updated = await toggleStoreProductStatusRecord(tx, store.id, String(productId));
    await createStoreChangeLog(tx, {
      store,
      operator,
      action: "toggle_status",
      targetType: "product",
      targetId: String(product.productKey),
      summary: `切换商品状态：${product.name}`,
      changeMode: strategy === "force" ? "force" : "normal",
      beforeData,
      afterData: mapStoreProductForApi(updated)
    });
    return updated;
  });

  return {
    storeId: store.id,
    product: mapAdminEditableProduct(row)
  };
}

export async function deleteAdminStoreProduct(
  adminUserId: number,
  storeId: number,
  productId: string,
  payload: AdminProductMutationControl = {}
) {
  const operator = await getAdminOperatorContext(adminUserId);
  const { store, product } = await findAdminScopedProduct(adminUserId, storeId, productId);
  const beforeData = mapStoreProductForApi(product);
  const strategy = payload.conflictStrategy || "reject";

  try {
    if (strategy !== "force") {
      assertExpectedUpdatedAt(product.updatedAt, payload.expectedUpdatedAt);
    } else if (!operator.isSuperAdmin) {
      conflict("只有超级管理员可以强制覆盖其他人的变更");
    }
  } catch (error) {
    if (!operator.isSuperAdmin) {
      const approval = await prisma.$transaction((tx) =>
        createStoreProductApproval(tx, {
          store,
          product,
          operator,
          action: "delete",
          payload,
          reason: payload.conflictReason,
          expectedUpdatedAt: payload.expectedUpdatedAt
        })
      );

      return {
        storeId: store.id,
        approvalCreated: true,
        approvalId: approval.id,
        deletedProductId: String(productId)
      };
    }
    throw error;
  }

  await prisma.$transaction(async (tx) => {
    await deleteStoreProductRecord(tx, store.id, String(productId));
    await createStoreChangeLog(tx, {
      store,
      operator,
      action: "delete",
      targetType: "product",
      targetId: String(product.productKey),
      summary: `删除商品：${product.name}`,
      changeMode: strategy === "force" ? "force" : "normal",
      beforeData,
      afterData: null
    });
  });

  return {
    storeId: store.id,
    deletedProductId: String(productId)
  };
}

export async function queryAdminStoreOrders(adminUserId: number, storeId: number, rawQuery: Record<string, unknown>) {
  const { page, pageSize, skip } = parsePageParams(rawQuery);
  const store = await findAdminStoreWithScope(adminUserId, storeId);
  if (!store) {
    throw new ApiError("店铺不存在或无权访问", ERROR_CODES.NOT_FOUND, 404);
  }

  const keyword = String(rawQuery.keyword || "").trim();
  const payStatus = String(rawQuery.payStatus || "").trim();
  const orderStatus = String(rawQuery.orderStatus || "").trim();
  const createdAt = parseDateRange(rawQuery);

  const where = {
    storeDetailId: store.detailId,
    createdAt,
    payStatus: payStatus || undefined,
    status: orderStatus || undefined,
    OR: keyword
      ? [
          { orderNo: { contains: keyword, mode: "insensitive" as const } },
          { receiverName: { contains: keyword, mode: "insensitive" as const } },
          { productName: { contains: keyword, mode: "insensitive" as const } }
        ]
      : undefined
  };

  const [total, list] = await prisma.$transaction([
    prisma.miniOrder.count({ where }),
    prisma.miniOrder.findMany({
      where,
      include: {
        user: {
          select: {
            nickname: true
          }
        }
      },
      orderBy: { id: "desc" },
      skip,
      take: pageSize
    })
  ]);

  return {
    list: list.map((item: any) => ({
      id: item.id,
      orderNo: item.orderNo,
      buyer: item.user?.nickname || item.receiverName || "-",
      receiverName: item.receiverName,
      receiverPhone: item.receiverPhone,
      productName: item.productName,
      skuName: item.skuName || "",
      quantity: item.quantity,
      amount: roundMoney(Number(item.amount || 0)),
      payStatus: item.payStatus,
      orderStatus: normalizeAdminOrderStatus(item.status),
      settlementStatus: item.settlementStatus,
      createdAt: formatDateTime(item.createdAt)
    })),
    page,
    pageSize,
    total
  };
}

export async function getAdminStoreOrderDetail(adminUserId: number, storeId: number, orderId: number) {
  const { order } = await findAdminStoreOrder(adminUserId, storeId, orderId);
  return mapAdminOrderDetail(order);
}

export async function finishAdminStoreOrder(adminUserId: number, storeId: number, orderId: number) {
  const { order } = await findAdminStoreOrder(adminUserId, storeId, orderId);
  const latestRefund = Array.isArray(order.refunds) && order.refunds.length ? order.refunds[0] : null;

  if (latestRefund && latestRefund.status !== MINI_REFUND_STATUS.rejected) {
    throw new ApiError("\u5f53\u524d\u8ba2\u5355\u5b58\u5728\u9000\u6b3e\u7533\u8bf7\uff0c\u6682\u65f6\u4e0d\u80fd\u76f4\u63a5\u5b8c\u6210", ERROR_CODES.BAD_REQUEST, 400);
  }

  if (
    (order.status !== MINI_ORDER_STATUS.processing && order.status !== MINI_ORDER_STATUS.accepted) ||
    order.payStatus !== MINI_PAY_STATUS.paid
  ) {
    throw new ApiError("\u5f53\u524d\u8ba2\u5355\u72b6\u6001\u4e0d\u5141\u8bb8\u6267\u884c\u5b8c\u6210\u64cd\u4f5c", ERROR_CODES.BAD_REQUEST, 400);
  }

  await prisma.miniOrder.update({
    where: { id: orderId },
    data: {
      status: MINI_ORDER_STATUS.finished,
      finishedAt: order.finishedAt || new Date()
    }
  });

  await settleMiniOrderIncome(orderId);

  await createMiniMessage({
    school: order.school,
    type: "system",
    category: "\u8ba2\u5355\u901a\u77e5",
    content: `\u7ba1\u7406\u5458\u5df2\u5c06\u8ba2\u5355 ${order.orderNo} \u6807\u8bb0\u4e3a\u5df2\u5b8c\u6210\u3002`,
    receiverUserId: order.userId,
    targetType: "order",
    targetId: String(order.id)
  });

  return getAdminStoreOrderDetail(adminUserId, storeId, orderId);
}

export async function cancelAdminStoreOrder(adminUserId: number, storeId: number, orderId: number) {
  const { order } = await findAdminStoreOrder(adminUserId, storeId, orderId);

  if (order.status !== MINI_ORDER_STATUS.pending || order.payStatus !== MINI_PAY_STATUS.pending) {
    throw new ApiError("只有未支付订单才允许直接取消，已支付订单请走退款流程", ERROR_CODES.BAD_REQUEST, 400);
  }

  await prisma.miniOrder.update({
    where: { id: orderId },
    data: {
      status: MINI_ORDER_STATUS.canceled,
      canceledAt: new Date(),
      settlementStatus: MINI_SETTLEMENT_STATUS.closed
    }
  });

  await createMiniMessage({
    school: order.school,
    type: "system",
    category: "订单通知",
    content: `管理员已取消订单 ${order.orderNo}。`,
    receiverUserId: order.userId,
    targetType: "order",
    targetId: String(order.id)
  });

  return getAdminStoreOrderDetail(adminUserId, storeId, orderId);
}

export async function reviewAdminStoreOrderRefund(
  adminUserId: number,
  storeId: number,
  orderId: number,
  refundId: number,
  payload: RefundReviewPayload
) {
  const { order } = await findAdminStoreOrder(adminUserId, storeId, orderId);
  const refund = Array.isArray(order.refunds) ? order.refunds.find((item: any) => item.id === refundId) : null;

  if (!refund) {
    throw new ApiError("\u9000\u6b3e\u8bb0\u5f55\u4e0d\u5b58\u5728", ERROR_CODES.NOT_FOUND, 404);
  }

  if (refund.status !== MINI_REFUND_STATUS.pending) {
    throw new ApiError("\u5f53\u524d\u9000\u6b3e\u8bb0\u5f55\u4e0d\u53ef\u91cd\u590d\u5ba1\u6838", ERROR_CODES.BAD_REQUEST, 400);
  }

  await reviewMiniRefundRequest(refundId, adminUserId, payload);

  await createMiniMessage({
    school: order.school,
    type: "system",
    category: "\u9000\u6b3e\u901a\u77e5",
    content:
      payload.status === MINI_REFUND_STATUS.approved
        ? `\u7ba1\u7406\u5458\u5df2\u901a\u8fc7\u9000\u6b3e\u7533\u8bf7 ${refund.refundNo}\uff0c\u9000\u6b3e\u7ed3\u679c\u5c06\u6309\u7cfb\u7edf\u5904\u7406\u7ed3\u679c\u66f4\u65b0\u3002`
        : `\u7ba1\u7406\u5458\u5df2\u9a73\u56de\u9000\u6b3e\u7533\u8bf7 ${refund.refundNo}\uff0c\u539f\u56e0\uff1a${payload.reviewNote || "\u8bf7\u8054\u7cfb\u5e73\u53f0\u7ba1\u7406\u5458\u4e86\u89e3\u8be6\u60c5"}`,
    receiverUserId: order.userId,
    targetType: "refund",
    targetId: String(refund.id)
  });

  return getAdminStoreOrderDetail(adminUserId, storeId, orderId);
}

export async function queryStoreProductApprovals(adminUserId: number, rawQuery: Record<string, unknown>) {
  const { page, pageSize, skip } = parsePageParams(rawQuery);
  const operator = await getAdminOperatorContext(adminUserId);
  const status = String(rawQuery.status || "").trim();
  const keyword = String(rawQuery.keyword || "").trim();
  const where = operator.isSuperAdmin
    ? {
        status: status || undefined,
        OR: keyword
          ? [
              { school: { contains: keyword, mode: "insensitive" as const } },
              { targetId: { contains: keyword, mode: "insensitive" as const } },
              { reason: { contains: keyword, mode: "insensitive" as const } }
            ]
          : undefined
      }
    : {
        requestedById: adminUserId,
        status: status || undefined
      };

  const [total, list] = await prisma.$transaction([
    prisma.storeProductApproval.count({ where }),
    prisma.storeProductApproval.findMany({
      where,
      include: {
        store: {
          select: {
            name: true
          }
        },
        requestedBy: {
          select: {
            name: true,
            account: true
          }
        },
        reviewedBy: {
          select: {
            name: true
          }
        }
      },
      orderBy: [{ createdAt: "desc" }],
      skip,
      take: pageSize
    })
  ]);

  return {
    list: list.map((item: any) => ({
      id: item.id,
      school: item.school,
      storeName: item.store?.name || "-",
      targetType: item.targetType,
      targetId: item.targetId,
      action: item.action,
      status: item.status,
      reason: item.reason,
      requestedByName: item.requestedBy?.name || "",
      requestedByAccount: item.requestedBy?.account || "",
      reviewedByName: item.reviewedBy?.name || "",
      reviewNote: item.reviewNote || "",
      createdAt: formatDateTime(item.createdAt),
      reviewedAt: formatDateTime(item.reviewedAt),
      payload: item.payload
    })),
    page,
    pageSize,
    total
  };
}

export async function reviewStoreProductApproval(adminUserId: number, approvalId: number, payload: ApprovalReviewPayload) {
  const reviewer = await getAdminOperatorContext(adminUserId);
  if (!reviewer.isSuperAdmin) {
    throw new ApiError("只有超级管理员可以审批商品变更", ERROR_CODES.FORBIDDEN, 403);
  }

  const approval = await prisma.storeProductApproval.findUnique({
    where: { id: approvalId }
  });

  if (!approval) {
    throw new ApiError("审批记录不存在", ERROR_CODES.NOT_FOUND, 404);
  }

  if (approval.status !== "pending") {
    throw new ApiError("该审批记录已处理", ERROR_CODES.BAD_REQUEST, 400);
  }

  if (payload.status === "approved") {
    await prisma.$transaction((tx) => executeApprovedAction(tx, approval, reviewer, payload.reviewNote));
  } else {
    await prisma.$transaction(async (tx) => {
      await tx.storeProductApproval.update({
        where: { id: approvalId },
        data: {
          status: "rejected",
          reviewedById: reviewer.admin.id,
          reviewNote: payload.reviewNote || "",
          reviewedAt: new Date()
        }
      });

      const store = await tx.miniStore.findUniqueOrThrow({
        where: { id: approval.storeId },
        include: {
          ownerUser: {
            select: {
              nickname: true,
              phone: true
            }
          }
        }
      });

      await createStoreChangeLog(tx, {
        store,
        operator: reviewer,
        action: "reject_approval",
        targetType: approval.targetType,
        targetId: approval.targetId,
        summary: `驳回商品变更审批：${approval.targetId}`,
        changeMode: "approval",
        beforeData: approval.payload,
        afterData: null
      });
    });
  }

  return prisma.storeProductApproval.findUniqueOrThrow({
    where: { id: approvalId },
    include: {
      store: {
        select: {
          name: true
        }
      },
      requestedBy: {
        select: {
          name: true,
          account: true
        }
      },
      reviewedBy: {
        select: {
          name: true
        }
      }
    }
  });
}
