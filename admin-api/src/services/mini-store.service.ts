import { Prisma } from "@prisma/client";
import type { MiniMerchantProductPayload } from "../controllers/mini-commerce-schemas";
import { parsePageParams } from "../utils/pagination";
import { prisma } from "../lib/prisma";
import { getAdminSchoolScope } from "./admin-scope.service";
import {
  buildProductDisplayPrice,
  getDefaultSku,
  MERCHANT_PRODUCT_STATUS,
  normalizeMerchantProductPayload,
  parseMoneyNumber,
  toMerchantProducts
} from "../utils/merchant-product";
import { ApiError } from "../utils/api-error";
import { ERROR_CODES } from "../constants/error-codes";
import {
  MINI_ORDER_STATUS,
  MINI_PAY_STATUS,
  MINI_REFUND_STATUS,
  MINI_SETTLEMENT_STATUS,
  reverseMiniOrderSettlement,
  settleMiniOrderIncome
} from "./mini-order.service";
import type { RefundReviewPayload } from "../controllers/schemas";
import { createMiniMessage } from "./mini-message.service";

interface BannerItem {
  id: number;
  tag: string;
  title: string;
  desc: string;
  cta: string;
}

const SCHOOLS = {
  current: "当前高校",
  liupanshui: "六盘水师范学院",
  pku: "北京大学",
  tsinghua: "清华大学",
  fudan: "复旦大学",
  gzu: "贵州大学"
};

const STORE_STATUS = {
  open: "营业中"
} as const;

function toArray(value: Prisma.JsonValue | null | undefined) {
  return Array.isArray(value) ? value : [];
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

function buildBannerList(school: string) {
  const fallback: BannerItem = {
    id: 1,
    tag: "平台推荐",
    title: `${school}创业店铺推荐`,
    desc: "优先展示学生商家、宿舍超市、校内商家和校外商家中的优质店铺。",
    cta: "查看更多"
  };

  const schoolMap: Record<string, BannerItem> = {
    [SCHOOLS.liupanshui]: {
      id: 1,
      tag: "本校推荐",
      title: "六盘水师范学院创业店铺推荐",
      desc: "围绕宿舍配送、校内餐饮和学生服务，优先展示本校热门创业店铺。",
      cta: "查看本校热榜"
    },
    [SCHOOLS.pku]: {
      id: 1,
      tag: "燕园精选",
      title: "北京大学创业店铺精选",
      desc: "优先展示学习资料、轻食咖啡和校园文创等热门创业店铺。",
      cta: "查看燕园推荐"
    },
    [SCHOOLS.tsinghua]: {
      id: 1,
      tag: "清华推荐",
      title: "清华大学创业店铺优选",
      desc: "围绕宿舍补给、校内餐饮和跑腿代取，优先展示高频店铺。",
      cta: "查看清华热卖"
    },
    [SCHOOLS.fudan]: {
      id: 1,
      tag: "复旦推荐",
      title: "复旦大学创业店铺精选",
      desc: "优先展示校外餐饮、生活服务和学生自营店铺。",
      cta: "查看复旦精选"
    },
    [SCHOOLS.gzu]: {
      id: 1,
      tag: "贵大推荐",
      title: "贵州大学创业店铺推荐",
      desc: "优先展示校园餐饮、宿舍补给和校外生活服务热门商家。",
      cta: "查看贵大热卖"
    }
  };

  return [schoolMap[school] || fallback];
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
    banners: buildBannerList(school || SCHOOLS.current),
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

function formatDateTime(value: Date | null | undefined) {
  if (!value) return "";
  return value.toISOString().slice(0, 19).replace("T", " ");
}

function roundMoney(value: number) {
  return Number(Number(value || 0).toFixed(2));
}

function normalizeAdminOrderStatus(status: string) {
  return status === MINI_ORDER_STATUS.accepted ? MINI_ORDER_STATUS.processing : status;
}

function calcPercent(value: number, total: number) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

function countOnSaleProducts(products: Array<{ status?: string }>) {
  return products.filter((item) => String(item.status || MERCHANT_PRODUCT_STATUS.onSale) === MERCHANT_PRODUCT_STATUS.onSale).length;
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

async function saveAdminStoreProducts(storeId: number, products: any[]) {
  return prisma.miniStore.update({
    where: { id: storeId },
    data: {
      products,
      productCount: countOnSaleProducts(products)
    }
  });
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

export async function getAdminStoreDashboard(adminUserId: number, storeId: number) {
  const store = await findAdminStoreWithScope(adminUserId, storeId);
  if (!store) {
    throw new ApiError("店铺不存在或无权访问", ERROR_CODES.NOT_FOUND, 404);
  }

  const [orders, merchantAccount] = await prisma.$transaction([
    prisma.miniOrder.findMany({
      where: { storeDetailId: store.detailId },
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
    })
  ]);

  const products = toMerchantProducts(store.products);
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
  for (let index = 6; index >= 0; index -= 1) {
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

function mapAdminEditableProduct(item: any) {
  return {
    id: String(item.id || ""),
    name: String(item.name || ""),
    desc: String(item.desc || ""),
    cover: String(item.cover || ""),
    recommended: Boolean(item.recommended),
    status: String(item.status || MERCHANT_PRODUCT_STATUS.onSale),
    specMode: item.specMode === "multi" ? "multi" : "single",
    price: String(item.price || ""),
    stock: Number(item.stock || 0),
    dailyLimit: Number(item.dailyLimit || 0),
    defaultSkuId: String(item.defaultSkuId || ""),
    skus: Array.isArray(item.skus)
      ? item.skus.map((sku: any) => ({
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
}

export async function createAdminStoreProduct(adminUserId: number, storeId: number, payload: MiniMerchantProductPayload) {
  const store = await findAdminStoreWithScope(adminUserId, storeId);
  if (!store) {
    throw new ApiError("店铺不存在或无权访问", ERROR_CODES.NOT_FOUND, 404);
  }

  const products = toMerchantProducts(store.products);
  const productId = `p${Date.now()}`;
  const nextProduct = normalizeMerchantProductPayload(productId, payload);
  const row = await saveAdminStoreProducts(store.id, products.concat(nextProduct));

  return {
    storeId: row.id,
    product: mapAdminEditableProduct(nextProduct)
  };
}

export async function updateAdminStoreProduct(
  adminUserId: number,
  storeId: number,
  productId: string,
  payload: MiniMerchantProductPayload
) {
  const store = await findAdminStoreWithScope(adminUserId, storeId);
  if (!store) {
    throw new ApiError("店铺不存在或无权访问", ERROR_CODES.NOT_FOUND, 404);
  }

  const products = toMerchantProducts(store.products);
  const index = products.findIndex((item) => String(item.id) === String(productId));
  if (index === -1) {
    throw new ApiError("商品不存在", ERROR_CODES.NOT_FOUND, 404);
  }

  const nextProduct = normalizeMerchantProductPayload(String(productId), payload);
  const nextProducts = products.slice();
  nextProducts[index] = nextProduct;
  await saveAdminStoreProducts(store.id, nextProducts);

  return {
    storeId: store.id,
    product: mapAdminEditableProduct(nextProduct)
  };
}

export async function toggleAdminStoreProductStatus(adminUserId: number, storeId: number, productId: string) {
  const store = await findAdminStoreWithScope(adminUserId, storeId);
  if (!store) {
    throw new ApiError("店铺不存在或无权访问", ERROR_CODES.NOT_FOUND, 404);
  }

  const products = toMerchantProducts(store.products);
  const index = products.findIndex((item) => String(item.id) === String(productId));
  if (index === -1) {
    throw new ApiError("商品不存在", ERROR_CODES.NOT_FOUND, 404);
  }

  const current = products[index];
  const nextStatus =
    current.status === MERCHANT_PRODUCT_STATUS.onSale ? MERCHANT_PRODUCT_STATUS.offSale : MERCHANT_PRODUCT_STATUS.onSale;
  const nextProducts = products.slice();
  nextProducts[index] = {
    ...current,
    status: nextStatus,
    skus: (current.skus || []).map((sku: any) => ({
      ...sku,
      status: nextStatus === MERCHANT_PRODUCT_STATUS.offSale ? MERCHANT_PRODUCT_STATUS.offSale : sku.status
    }))
  };
  await saveAdminStoreProducts(store.id, nextProducts);

  return {
    storeId: store.id,
    product: mapAdminEditableProduct(nextProducts[index])
  };
}

export async function deleteAdminStoreProduct(adminUserId: number, storeId: number, productId: string) {
  const store = await findAdminStoreWithScope(adminUserId, storeId);
  if (!store) {
    throw new ApiError("店铺不存在或无权访问", ERROR_CODES.NOT_FOUND, 404);
  }

  const products = toMerchantProducts(store.products);
  const nextProducts = products.filter((item) => String(item.id) !== String(productId));
  if (nextProducts.length === products.length) {
    throw new ApiError("商品不存在", ERROR_CODES.NOT_FOUND, 404);
  }

  await saveAdminStoreProducts(store.id, nextProducts);
  return {
    storeId: store.id,
    deletedProductId: String(productId)
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
    throw new ApiError("当前订单存在退款申请，暂时不能直接完成", ERROR_CODES.BAD_REQUEST, 400);
  }

  if (
    (order.status !== MINI_ORDER_STATUS.processing && order.status !== MINI_ORDER_STATUS.accepted) ||
    order.payStatus !== MINI_PAY_STATUS.paid
  ) {
    throw new ApiError("当前订单状态不允许执行完成操作", ERROR_CODES.BAD_REQUEST, 400);
  }

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.miniOrder.update({
      where: { id: orderId },
      data: {
        status: MINI_ORDER_STATUS.finished,
        finishedAt: order.finishedAt || new Date()
      }
    });
    await settleMiniOrderIncome(orderId, tx);
  });

  await createMiniMessage({
    school: order.school,
    type: "system",
    category: "订单通知",
    content: `管理员已将订单 ${order.orderNo} 标记为已完成。`,
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
    throw new ApiError("退款记录不存在", ERROR_CODES.NOT_FOUND, 404);
  }

  if (refund.status !== MINI_REFUND_STATUS.pending) {
    throw new ApiError("当前退款记录不可重复审核", ERROR_CODES.BAD_REQUEST, 400);
  }

  const reviewedAt = new Date();
  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.miniRefundRecord.update({
      where: { id: refundId },
      data: {
        status: payload.status,
        reviewNote: payload.reviewNote || "",
        reviewerId: adminUserId,
        reviewedAt
      }
    });

    if (payload.status === MINI_REFUND_STATUS.approved) {
      await reverseMiniOrderSettlement(order.id, tx);
      await tx.miniOrder.update({
        where: { id: order.id },
        data: {
          payStatus: MINI_PAY_STATUS.refunded,
          status: order.status === MINI_ORDER_STATUS.finished ? MINI_ORDER_STATUS.finished : MINI_ORDER_STATUS.canceled,
          canceledAt: order.status === MINI_ORDER_STATUS.finished ? order.canceledAt : reviewedAt,
          settlementStatus: MINI_SETTLEMENT_STATUS.refunded
        }
      });
    }
  });

  await createMiniMessage({
    school: order.school,
    type: "system",
    category: "退款通知",
    content:
      payload.status === MINI_REFUND_STATUS.approved
        ? `管理员已通过退款申请 ${refund.refundNo}，退款将按原路返回。`
        : `管理员已驳回退款申请 ${refund.refundNo}，原因：${payload.reviewNote || "请联系平台管理员了解详情"}`,
    receiverUserId: order.userId,
    targetType: "refund",
    targetId: String(refund.id)
  });

  return getAdminStoreOrderDetail(adminUserId, storeId, orderId);
}
