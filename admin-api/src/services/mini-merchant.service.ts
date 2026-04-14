import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import type { MiniMerchantProductPayload, MiniMerchantStoreUpdatePayload } from "../controllers/schemas";
import { ApiError } from "../utils/api-error";
import { ERROR_CODES } from "../constants/error-codes";
import { assertRiskPassed } from "./risk-control.service";

type MerchantProductItem = {
  id: string;
  name: string;
  desc: string;
  price: string;
  cover?: string;
  stock?: number;
  dailyLimit?: number;
  recommended?: boolean;
  status?: string;
};

type MerchantOrderItem = {
  id: number;
  orderNo: string;
  productName: string;
  quantity: number;
  amount: number;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  status: string;
  payStatus: string;
  createdAt: Date;
  paidAt?: Date | null;
  finishedAt?: Date | null;
};

function toArray(value: Prisma.JsonValue | null | undefined) {
  return Array.isArray(value) ? value : [];
}

function mapProduct(item: MerchantProductItem) {
  return {
    id: item.id,
    name: item.name,
    desc: item.desc,
    price: item.price,
    cover: item.cover || "poster",
    stock: Number(item.stock || 0),
    dailyLimit: Number(item.dailyLimit || 0),
    recommended: !!item.recommended,
    status: item.status || "\u5df2\u4e0a\u67b6"
  };
}

function mapStore(store: any) {
  const products = (toArray(store.products) as MerchantProductItem[]).map(mapProduct);
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

function formatTime(value: Date | null | undefined) {
  if (!value) return "";
  return value.toISOString().slice(0, 16).replace("T", " ");
}

function mapMerchantOrder(item: MerchantOrderItem, tone: "new" | "pending" | "finished") {
  return {
    id: item.id,
    orderNo: item.orderNo,
    displayNo: `订单编号 ${item.orderNo}`,
    productName: item.productName,
    quantity: item.quantity,
    amount: Number(item.amount).toFixed(2),
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
      status: "\u5df2\u901a\u8fc7"
    },
    orderBy: { id: "desc" }
  });

  if (!approvedApply) {
    throw new ApiError("\u4f60\u8fd8\u6ca1\u6709\u5df2\u901a\u8fc7\u7684\u5e97\u94fa", ERROR_CODES.BAD_REQUEST, 400);
  }

  throw new ApiError("\u5e97\u94fa\u8fd8\u672a\u521d\u59cb\u5316\uff0c\u8bf7\u8054\u7cfb\u7ba1\u7406\u5458", ERROR_CODES.BAD_REQUEST, 400);
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
      banners: (payload.banners && payload.banners.length ? payload.banners : toArray(store.banners)).slice(0, 5)
    }
  });
  return mapStore(row);
}

export async function createMerchantProduct(userId: number, payload: MiniMerchantProductPayload) {
  await assertRiskPassed({
    userId,
    scene: "merchant_product",
    texts: [payload.name, payload.desc, payload.price]
  });

  const store = await findOwnedStore(userId);
  const currentProducts = toArray(store.products) as MerchantProductItem[];
  const nextId = `p${Date.now()}`;
  const nextProducts = currentProducts.concat([
    {
      id: nextId,
      name: payload.name,
      desc: payload.desc,
      price: payload.price.startsWith("\u00a5") ? payload.price : `\u00a5${payload.price}`,
      cover: payload.cover || "poster",
      stock: payload.stock || 0,
      dailyLimit: payload.dailyLimit || 0,
      recommended: !!payload.recommended,
      status: payload.status || "\u5df2\u4e0a\u67b6"
    }
  ]);

  const row = await prisma.miniStore.update({
    where: { id: store.id },
    data: {
      products: nextProducts,
      productCount: nextProducts.filter((item) => (item.status || "\u5df2\u4e0a\u67b6") === "\u5df2\u4e0a\u67b6").length
    }
  });

  return {
    store: mapStore(row),
    product: mapProduct(nextProducts[nextProducts.length - 1])
  };
}

export async function updateMerchantProduct(userId: number, productId: string, payload: MiniMerchantProductPayload) {
  await assertRiskPassed({
    userId,
    scene: "merchant_product",
    texts: [payload.name, payload.desc, payload.price]
  });

  const store = await findOwnedStore(userId);
  const currentProducts = toArray(store.products) as MerchantProductItem[];
  const index = currentProducts.findIndex((item) => String(item.id) === String(productId));

  if (index === -1) {
    throw new ApiError("\u5546\u54c1\u4e0d\u5b58\u5728", ERROR_CODES.NOT_FOUND, 404);
  }

  currentProducts[index] = {
    ...currentProducts[index],
    name: payload.name,
    desc: payload.desc,
    price: payload.price.startsWith("\u00a5") ? payload.price : `\u00a5${payload.price}`,
    cover: payload.cover || currentProducts[index].cover || "poster",
    stock: payload.stock ?? currentProducts[index].stock ?? 0,
    dailyLimit: payload.dailyLimit ?? currentProducts[index].dailyLimit ?? 0,
    recommended: payload.recommended ?? currentProducts[index].recommended ?? false,
    status: payload.status || currentProducts[index].status || "\u5df2\u4e0a\u67b6"
  };

  const row = await prisma.miniStore.update({
    where: { id: store.id },
    data: {
      products: currentProducts,
      productCount: currentProducts.filter((item) => (item.status || "\u5df2\u4e0a\u67b6") === "\u5df2\u4e0a\u67b6").length
    }
  });

  return {
    store: mapStore(row),
    product: mapProduct(currentProducts[index])
  };
}

export async function toggleMerchantProductStatus(userId: number, productId: string) {
  const store = await findOwnedStore(userId);
  const currentProducts = toArray(store.products) as MerchantProductItem[];
  const index = currentProducts.findIndex((item) => String(item.id) === String(productId));

  if (index === -1) {
    throw new ApiError("\u5546\u54c1\u4e0d\u5b58\u5728", ERROR_CODES.NOT_FOUND, 404);
  }

  const nextStatus = (currentProducts[index].status || "\u5df2\u4e0a\u67b6") === "\u5df2\u4e0a\u67b6" ? "\u5df2\u4e0b\u67b6" : "\u5df2\u4e0a\u67b6";
  currentProducts[index] = {
    ...currentProducts[index],
    status: nextStatus
  };

  const row = await prisma.miniStore.update({
    where: { id: store.id },
    data: {
      products: currentProducts,
      productCount: currentProducts.filter((item) => (item.status || "\u5df2\u4e0a\u67b6") === "\u5df2\u4e0a\u67b6").length
    }
  });

  return {
    store: mapStore(row),
    product: mapProduct(currentProducts[index])
  };
}

export async function deleteMerchantProduct(userId: number, productId: string) {
  const store = await findOwnedStore(userId);
  const currentProducts = toArray(store.products) as MerchantProductItem[];
  const nextProducts = currentProducts.filter((item) => String(item.id) !== String(productId));

  if (nextProducts.length === currentProducts.length) {
    throw new ApiError("\u5546\u54c1\u4e0d\u5b58\u5728", ERROR_CODES.NOT_FOUND, 404);
  }

  const row = await prisma.miniStore.update({
    where: { id: store.id },
    data: {
      products: nextProducts,
      productCount: nextProducts.filter((item) => (item.status || "\u5df2\u4e0a\u67b6") === "\u5df2\u4e0a\u67b6").length
    }
  });

  return mapStore(row);
}

export async function moveMerchantProduct(userId: number, productId: string, direction: "up" | "down") {
  const store = await findOwnedStore(userId);
  const currentProducts = toArray(store.products) as MerchantProductItem[];
  const index = currentProducts.findIndex((item) => String(item.id) === String(productId));

  if (index === -1) {
    throw new ApiError("\u5546\u54c1\u4e0d\u5b58\u5728", ERROR_CODES.NOT_FOUND, 404);
  }

  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= currentProducts.length) {
    return mapStore(store);
  }

  const nextProducts = currentProducts.slice();
  const temp = nextProducts[index];
  nextProducts[index] = nextProducts[targetIndex];
  nextProducts[targetIndex] = temp;

  const row = await prisma.miniStore.update({
    where: { id: store.id },
    data: {
      products: nextProducts
    }
  });

  return mapStore(row);
}

export async function batchDownMerchantProducts(userId: number, productIds: string[]) {
  const store = await findOwnedStore(userId);
  const currentProducts = toArray(store.products) as MerchantProductItem[];
  const idSet = new Set(productIds.map((item) => String(item)));

  const nextProducts = currentProducts.map((item) =>
    idSet.has(String(item.id))
      ? {
          ...item,
          status: "\u5df2\u4e0b\u67b6"
        }
      : item
  );

  const row = await prisma.miniStore.update({
    where: { id: store.id },
    data: {
      products: nextProducts,
      productCount: nextProducts.filter((item) => (item.status || "\u5df2\u4e0a\u67b6") === "\u5df2\u4e0a\u67b6").length
    }
  });

  return mapStore(row);
}

export async function batchDeleteMerchantProducts(userId: number, productIds: string[]) {
  const store = await findOwnedStore(userId);
  const idSet = new Set(productIds.map((item) => String(item)));
  const currentProducts = toArray(store.products) as MerchantProductItem[];
  const nextProducts = currentProducts.filter((item) => !idSet.has(String(item.id)));

  const row = await prisma.miniStore.update({
    where: { id: store.id },
    data: {
      products: nextProducts,
      productCount: nextProducts.filter((item) => (item.status || "\u5df2\u4e0a\u67b6") === "\u5df2\u4e0a\u67b6").length
    }
  });

  return mapStore(row);
}

export async function getCurrentMerchantOrderBoard(userId: number) {
  const store = await findOwnedStore(userId);
  const orders = (await prisma.miniOrder.findMany({
    where: {
      storeDetailId: store.detailId
    },
    orderBy: [{ paidAt: "desc" }, { createdAt: "desc" }]
  })) as unknown as MerchantOrderItem[];

  const now = Date.now();
  const processingOrders = orders.filter((item) => item.status === "进行中");
  const newOrders = processingOrders.filter((item) => {
    const paidAt = item.paidAt ? new Date(item.paidAt).getTime() : 0;
    return paidAt && now - paidAt <= 2 * 60 * 60 * 1000;
  });
  const newOrderIdSet = new Set(newOrders.map((item) => item.id));
  const pendingOrders = processingOrders.filter((item) => !newOrderIdSet.has(item.id));
  const finishedOrders = orders.filter((item) => item.status === "已完成");

  return {
    summary: {
      newOrderCount: newOrders.length,
      pendingOrderCount: pendingOrders.length,
      finishedOrderCount: finishedOrders.length
    },
    newOrders: newOrders.map((item) => mapMerchantOrder(item, "new")),
    pendingOrders: pendingOrders.map((item) => mapMerchantOrder(item, "pending")),
    finishedOrders: finishedOrders.map((item) => mapMerchantOrder(item, "finished"))
  };
}
