import { Prisma } from "@prisma/client";
import type { MiniMerchantProductPayload, MiniMerchantStoreUpdatePayload } from "../controllers/mini-commerce-schemas";
import { ERROR_CODES } from "../constants/error-codes";
import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/api-error";
import { buildProductDisplayPrice, MERCHANT_PRODUCT_STATUS, parseMoneyNumber, toMerchantProducts } from "../utils/merchant-product";
import { assertRiskPassed } from "./risk-control.service";
import {
  batchDeleteStoreProducts,
  batchDownStoreProducts,
  createStoreProductRecord,
  mapStoreProductForApi,
  moveStoreProductRecord,
  toggleStoreProductStatusRecord,
  updateStoreProductRecord,
  deleteStoreProductRecord
} from "./store-product.service";

type MerchantOrderTone = "new" | "pending" | "finished";

const ORDER_STATUS = {
  pending: "待支付",
  processing: "进行中",
  accepted: "待处理",
  finished: "已完成"
} as const;

function toArray(value: Prisma.JsonValue | null | undefined) {
  return Array.isArray(value) ? value : [];
}

function formatTime(value: Date | null | undefined) {
  if (!value) return "";
  return value.toISOString().slice(0, 16).replace("T", " ");
}

function mapProduct(item: any) {
  return {
    id: item.id,
    name: item.name,
    desc: item.desc,
    cover: item.cover || "poster",
    recommended: Boolean(item.recommended),
    status: item.status || MERCHANT_PRODUCT_STATUS.onSale,
    specMode: item.specMode || "single",
    price: buildProductDisplayPrice(item),
    priceValue: parseMoneyNumber(item.price),
    stock: Number(item.stock || 0),
    dailyLimit: Number(item.dailyLimit || 0),
    defaultSkuId: item.defaultSkuId || "",
    skus: (item.skus || []).map((sku: any) => ({
      id: String(sku.id),
      name: sku.name,
      price: sku.price,
      stock: Number(sku.stock || 0),
      dailyLimit: Number(sku.dailyLimit || 0),
      status: sku.status || MERCHANT_PRODUCT_STATUS.onSale,
      isDefault: Boolean(sku.isDefault)
    }))
  };
}

function mapStore(store: any) {
  const products = toMerchantProducts(store.products).map(mapProduct);
  return {
    id: store.id,
    detailId: store.detailId,
    school: store.school,
    name: store.name,
    subtitle: store.subtitle,
    notice: store.notice,
    phone: store.phone,
    address: store.address,
    cover: store.cover || "",
    status: store.status,
    groupLabel: store.groupLabel,
    sectionLabel: store.sectionLabel,
    soldText: store.soldText,
    amountText: store.amountText,
    banners: toArray(store.banners).map((item) => String(item)),
    products
  };
}

function mapMerchantOrder(item: any, tone: MerchantOrderTone) {
  return {
    id: item.id,
    orderNo: item.orderNo,
    displayNo: `订单编号 ${item.orderNo}`,
    productName: item.productName,
    skuName: item.skuName || "",
    quantity: item.quantity,
    amount: Number(item.amount || 0).toFixed(2),
    receiverName: item.receiverName,
    receiverPhone: item.receiverPhone,
    receiverAddress: item.receiverAddress,
    statusText: item.status,
    payStatusText: item.payStatus,
    createdAt: formatTime(item.createdAt),
    paidAt: formatTime(item.paidAt),
    finishedAt: formatTime(item.finishedAt),
    tone
  };
}

async function findOwnedStore(userId: number) {
  const store = await prisma.miniStore.findFirst({
    where: {
      ownerUserId: userId
    },
    orderBy: { id: "desc" }
  });

  if (store) {
    return store;
  }

  const approvedApply = await prisma.miniShopApply.findFirst({
    where: {
      userId,
      status: "已通过"
    },
    orderBy: { id: "desc" }
  });

  if (!approvedApply) {
    throw new ApiError("你还没有已通过的店铺", ERROR_CODES.BAD_REQUEST, 400);
  }

  throw new ApiError("店铺还未初始化，请联系管理员", ERROR_CODES.BAD_REQUEST, 400);
}

export async function getCurrentMerchantStore(userId: number) {
  const store = await findOwnedStore(userId);
  return mapStore(store);
}

export async function updateCurrentMerchantStore(userId: number, payload: MiniMerchantStoreUpdatePayload) {
  await assertRiskPassed({
    userId,
    scene: "merchant_store",
    texts: [payload.name, payload.subtitle, payload.notice, payload.phone, payload.address]
  });

  const store = await findOwnedStore(userId);
  const row = await prisma.miniStore.update({
    where: { id: store.id },
    data: {
      name: payload.name,
      subtitle: payload.subtitle,
      notice: payload.notice,
      phone: payload.phone,
      address: payload.address,
      cover: payload.cover || store.cover,
      banners: (payload.banners?.length ? payload.banners : toArray(store.banners)).slice(0, 5)
    }
  });
  return mapStore(row);
}

export async function createMerchantProduct(userId: number, payload: MiniMerchantProductPayload) {
  await assertRiskPassed({
    userId,
    scene: "merchant_product",
    texts: [
      payload.name,
      payload.desc,
      payload.price,
      ...(payload.skus || []).flatMap((sku) => [sku.name, sku.price])
    ]
  });

  const store = await findOwnedStore(userId);
  const result = await prisma.$transaction(async (tx: any) => {
    const productRow = await createStoreProductRecord(tx, store.id, payload, `p${Date.now()}`);
    const refreshedStore = await tx.miniStore.findUniqueOrThrow({
      where: { id: store.id }
    });
    return {
      store: refreshedStore,
      product: mapStoreProductForApi(productRow)
    };
  });

  return {
    store: mapStore(result.store),
    product: mapProduct(result.product)
  };
}

export async function updateMerchantProduct(userId: number, productId: string, payload: MiniMerchantProductPayload) {
  await assertRiskPassed({
    userId,
    scene: "merchant_product",
    texts: [
      payload.name,
      payload.desc,
      payload.price,
      ...(payload.skus || []).flatMap((sku) => [sku.name, sku.price])
    ]
  });

  const store = await findOwnedStore(userId);
  const result = await prisma.$transaction(async (tx: any) => {
    const productRow = await updateStoreProductRecord(tx, store.id, String(productId), payload);
    const refreshedStore = await tx.miniStore.findUniqueOrThrow({
      where: { id: store.id }
    });
    return {
      store: refreshedStore,
      product: mapStoreProductForApi(productRow)
    };
  });

  return {
    store: mapStore(result.store),
    product: mapProduct(result.product)
  };
}

export async function toggleMerchantProductStatus(userId: number, productId: string) {
  const store = await findOwnedStore(userId);
  const result = await prisma.$transaction(async (tx: any) => {
    const productRow = await toggleStoreProductStatusRecord(tx, store.id, String(productId));
    const refreshedStore = await tx.miniStore.findUniqueOrThrow({
      where: { id: store.id }
    });
    return {
      store: refreshedStore,
      product: mapStoreProductForApi(productRow)
    };
  });

  return {
    store: mapStore(result.store),
    product: mapProduct(result.product)
  };
}

export async function deleteMerchantProduct(userId: number, productId: string) {
  const store = await findOwnedStore(userId);
  const row = await prisma.$transaction(async (tx: any) => {
    await deleteStoreProductRecord(tx, store.id, String(productId));
    return tx.miniStore.findUniqueOrThrow({
      where: { id: store.id }
    });
  });
  return mapStore(row);
}

export async function moveMerchantProduct(userId: number, productId: string, direction: "up" | "down") {
  const store = await findOwnedStore(userId);
  const row = await prisma.$transaction(async (tx: any) => {
    await moveStoreProductRecord(tx, store.id, String(productId), direction);
    return tx.miniStore.findUniqueOrThrow({
      where: { id: store.id }
    });
  });
  return mapStore(row);
}

export async function batchDownMerchantProducts(userId: number, productIds: string[]) {
  const store = await findOwnedStore(userId);
  const row = await prisma.$transaction(async (tx: any) => {
    await batchDownStoreProducts(tx, store.id, productIds);
    return tx.miniStore.findUniqueOrThrow({
      where: { id: store.id }
    });
  });
  return mapStore(row);
}

export async function batchDeleteMerchantProducts(userId: number, productIds: string[]) {
  const store = await findOwnedStore(userId);
  const row = await prisma.$transaction(async (tx: any) => {
    await batchDeleteStoreProducts(tx, store.id, productIds);
    return tx.miniStore.findUniqueOrThrow({
      where: { id: store.id }
    });
  });
  return mapStore(row);
}

export async function getCurrentMerchantOrderBoard(userId: number) {
  const store = await findOwnedStore(userId);
  const orders = await prisma.miniOrder.findMany({
    where: {
      storeDetailId: store.detailId
    },
    orderBy: [{ paidAt: "desc" }, { createdAt: "desc" }]
  });

  const newOrders = orders.filter((item: any) => item.status === ORDER_STATUS.processing);
  const pendingOrders = orders.filter((item: any) => item.status === ORDER_STATUS.accepted);
  const finishedOrders = orders.filter((item: any) => item.status === ORDER_STATUS.finished);

  return {
    summary: {
      newOrderCount: newOrders.length,
      pendingOrderCount: pendingOrders.length,
      finishedOrderCount: finishedOrders.length
    },
    newOrders: newOrders.map((item: any) => mapMerchantOrder(item, "new")),
    pendingOrders: pendingOrders.map((item: any) => mapMerchantOrder(item, "pending")),
    finishedOrders: finishedOrders.map((item: any) => mapMerchantOrder(item, "finished"))
  };
}
