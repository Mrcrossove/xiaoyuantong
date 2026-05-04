import { prisma } from "../lib/prisma";
import { ERROR_CODES } from "../constants/error-codes";
import { ApiError } from "../utils/api-error";
import {
  MERCHANT_PRODUCT_STATUS,
  normalizeMerchantProductPayload,
  type MerchantProductItem
} from "../utils/merchant-product";
import type { MiniMerchantProductPayload } from "../controllers/mini-commerce-schemas";

type DbClient = any;

function productInclude() {
  return {
    category: true,
    skus: {
      orderBy: [{ sortOrder: "asc" as const }, { id: "asc" as const }]
    }
  };
}

function mapProductRow(row: any): MerchantProductItem {
  const skus = Array.isArray(row.skus)
    ? row.skus.map((sku: any) => ({
        id: String(sku.skuKey),
        name: String(sku.name || ""),
        price: String(sku.priceText || ""),
        stock: Number(sku.stock || 0),
        dailyLimit: Number(sku.dailyLimit || 0),
        status: String(sku.status || MERCHANT_PRODUCT_STATUS.onSale),
        isDefault: Boolean(sku.isDefault)
      }))
    : [];

  return {
    id: String(row.productKey),
    categoryId: row.categoryId ? Number(row.categoryId) : null,
    categoryName: String(row.category?.name || row.categoryName || "默认分类"),
    name: String(row.name || ""),
    desc: String(row.desc || ""),
    detailTitle: String(row.detailTitle || ""),
    detailText: String(row.detailText || ""),
    detailItems: Array.isArray(row.detailItems) ? row.detailItems : [],
    cover: String(row.cover || "poster"),
    recommended: Boolean(row.recommended),
    status: String(row.status || MERCHANT_PRODUCT_STATUS.onSale),
    specMode: row.specMode === "multi" ? "multi" : "single",
    price: String(row.priceText || ""),
    stock: Number(row.stock || 0),
    dailyLimit: Number(row.dailyLimit || 0),
    defaultSkuId: String(row.defaultSkuKey || ""),
    skus
  };
}

function countOnSaleProducts(products: MerchantProductItem[]) {
  return products.filter((item) => String(item.status || MERCHANT_PRODUCT_STATUS.onSale) === MERCHANT_PRODUCT_STATUS.onSale).length;
}

async function listRowsByStoreId(db: DbClient, storeId: number) {
  return db.miniStoreProduct.findMany({
    where: { storeId },
    include: productInclude(),
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }]
  });
}

export async function listStoreProductsByStoreId(db: DbClient, storeId: number) {
  const rows = await listRowsByStoreId(db, storeId);
  return rows.map(mapProductRow);
}

export async function listStoreProductsByDetailId(storeDetailId: string) {
  const store = await prisma.miniStore.findUnique({
    where: { detailId: storeDetailId },
    select: { id: true }
  });

  if (!store) {
    throw new ApiError("店铺不存在", ERROR_CODES.NOT_FOUND, 404);
  }

  return listStoreProductsByStoreId(prisma, store.id);
}

export async function findStoreProductRow(db: DbClient, storeId: number, productKey: string) {
  const row = await db.miniStoreProduct.findFirst({
    where: {
      storeId,
      productKey: String(productKey)
    },
    include: productInclude()
  });

  if (!row) {
    throw new ApiError("商品不存在", ERROR_CODES.NOT_FOUND, 404);
  }

  return row;
}

export async function syncStoreProductSnapshot(db: DbClient, storeId: number) {
  const products = await listStoreProductsByStoreId(db, storeId);
  await db.miniStore.update({
    where: { id: storeId },
    data: {
      products,
      productCount: countOnSaleProducts(products)
    }
  });
  return products;
}

async function getNextSortOrder(db: DbClient, storeId: number) {
  const row = await db.miniStoreProduct.findFirst({
    where: { storeId },
    orderBy: [{ sortOrder: "desc" }, { id: "desc" }],
    select: { sortOrder: true }
  });
  return Number(row?.sortOrder || 0) + 1;
}

function mapProductCategory(row: any, productCount = 0) {
  return {
    id: Number(row.id),
    name: String(row.name || ""),
    sortOrder: Number(row.sortOrder || 0),
    status: String(row.status || "enabled"),
    productCount
  };
}

async function getNextCategorySortOrder(db: DbClient, storeId: number) {
  const row = await db.miniStoreProductCategory.findFirst({
    where: { storeId },
    orderBy: [{ sortOrder: "desc" }, { id: "desc" }],
    select: { sortOrder: true }
  });
  return Number(row?.sortOrder || 0) + 1;
}

export async function ensureDefaultStoreProductCategory(db: DbClient, storeId: number) {
  const current = await db.miniStoreProductCategory.findFirst({
    where: { storeId, status: "enabled" },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }]
  });
  if (current) return current;

  return db.miniStoreProductCategory.create({
    data: {
      storeId,
      name: "默认分类",
      sortOrder: 1,
      status: "enabled"
    }
  });
}

async function resolveProductCategory(db: DbClient, storeId: number, categoryId?: number | null) {
  if (categoryId) {
    const row = await db.miniStoreProductCategory.findFirst({
      where: {
        id: Number(categoryId),
        storeId,
        status: "enabled"
      }
    });
    if (!row) {
      throw new ApiError("商品分类不存在", ERROR_CODES.BAD_REQUEST, 400);
    }
    return row;
  }

  return ensureDefaultStoreProductCategory(db, storeId);
}

export async function listStoreProductCategoriesByStoreId(db: DbClient, storeId: number) {
  await ensureDefaultStoreProductCategory(db, storeId);
  const rows = await db.miniStoreProductCategory.findMany({
    where: { storeId, status: "enabled" },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }]
  });
  const counts = await db.miniStoreProduct.groupBy({
    by: ["categoryId"],
    where: { storeId },
    _count: { _all: true }
  });
  const countMap = new Map<number, number>();
  counts.forEach((item: any) => {
    countMap.set(Number(item.categoryId || 0), Number(item._count?._all || 0));
  });
  return rows.map((row: any) => mapProductCategory(row, countMap.get(Number(row.id)) || 0));
}

export async function createStoreProductCategoryRecord(db: DbClient, storeId: number, name: string) {
  const cleanName = String(name || "").trim();
  const exists = await db.miniStoreProductCategory.findFirst({
    where: { storeId, name: cleanName, status: "enabled" }
  });
  if (exists) {
    throw new ApiError("商品分类已存在", ERROR_CODES.BAD_REQUEST, 400);
  }

  const sortOrder = await getNextCategorySortOrder(db, storeId);
  const row = await db.miniStoreProductCategory.create({
    data: {
      storeId,
      name: cleanName,
      sortOrder,
      status: "enabled"
    }
  });
  return mapProductCategory(row, 0);
}

export async function updateStoreProductCategoryRecord(db: DbClient, storeId: number, categoryId: number, name: string) {
  const cleanName = String(name || "").trim();
  const current = await db.miniStoreProductCategory.findFirst({
    where: { id: Number(categoryId), storeId, status: "enabled" }
  });
  if (!current) {
    throw new ApiError("商品分类不存在", ERROR_CODES.NOT_FOUND, 404);
  }

  const duplicate = await db.miniStoreProductCategory.findFirst({
    where: {
      storeId,
      name: cleanName,
      status: "enabled",
      id: { not: Number(categoryId) }
    }
  });
  if (duplicate) {
    throw new ApiError("商品分类已存在", ERROR_CODES.BAD_REQUEST, 400);
  }

  const row = await db.miniStoreProductCategory.update({
    where: { id: current.id },
    data: { name: cleanName }
  });
  await db.miniStoreProduct.updateMany({
    where: { storeId, categoryId: current.id },
    data: { categoryName: cleanName }
  });
  await syncStoreProductSnapshot(db, storeId);
  const count = await db.miniStoreProduct.count({ where: { storeId, categoryId: current.id } });
  return mapProductCategory(row, count);
}

export async function deleteStoreProductCategoryRecord(db: DbClient, storeId: number, categoryId: number) {
  const current = await db.miniStoreProductCategory.findFirst({
    where: { id: Number(categoryId), storeId, status: "enabled" }
  });
  if (!current) {
    throw new ApiError("商品分类不存在", ERROR_CODES.NOT_FOUND, 404);
  }
  const productCount = await db.miniStoreProduct.count({ where: { storeId, categoryId: current.id } });
  if (productCount > 0) {
    throw new ApiError("该分类下还有商品，请先调整商品分类", ERROR_CODES.BAD_REQUEST, 400);
  }

  await db.miniStoreProductCategory.delete({ where: { id: current.id } });
  return true;
}

export async function moveStoreProductCategoryRecord(
  db: DbClient,
  storeId: number,
  categoryId: number,
  direction: "up" | "down"
) {
  const rows = await db.miniStoreProductCategory.findMany({
    where: { storeId, status: "enabled" },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }]
  });
  const index = rows.findIndex((item: any) => Number(item.id) === Number(categoryId));
  if (index === -1) {
    throw new ApiError("商品分类不存在", ERROR_CODES.NOT_FOUND, 404);
  }
  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= rows.length) {
    return mapProductCategory(rows[index]);
  }

  await db.miniStoreProductCategory.update({
    where: { id: rows[index].id },
    data: { sortOrder: rows[targetIndex].sortOrder }
  });
  await db.miniStoreProductCategory.update({
    where: { id: rows[targetIndex].id },
    data: { sortOrder: rows[index].sortOrder }
  });

  return mapProductCategory(rows[index]);
}

async function replaceProductSkus(
  db: DbClient,
  productId: number,
  normalized: MerchantProductItem
) {
  await db.miniStoreProductSku.deleteMany({
    where: { productId }
  });

  const skus = Array.isArray(normalized.skus) ? normalized.skus : [];
  if (skus.length) {
    await db.miniStoreProductSku.createMany({
      data: skus.map((sku, index) => ({
        skuKey: String(sku.id),
        productId,
        name: String(sku.name || ""),
        priceText: String(sku.price || ""),
        stock: Number(sku.stock || 0),
        dailyLimit: Number(sku.dailyLimit || 0),
        status: String(sku.status || MERCHANT_PRODUCT_STATUS.onSale),
        isDefault: Boolean(sku.isDefault),
        sortOrder: index + 1
      }))
    });
  }
}

export async function createStoreProductRecord(
  db: DbClient,
  storeId: number,
  payload: MiniMerchantProductPayload,
  productKey: string
) {
  const normalized = normalizeMerchantProductPayload(String(productKey), payload);
  const category = await resolveProductCategory(db, storeId, normalized.categoryId);
  const sortOrder = await getNextSortOrder(db, storeId);
  const created = await db.miniStoreProduct.create({
    data: {
      productKey: normalized.id,
      storeId,
      categoryId: category.id,
      categoryName: category.name,
      name: normalized.name,
      desc: normalized.desc,
      detailTitle: normalized.detailTitle || "",
      detailText: normalized.detailText || "",
      detailItems: normalized.detailItems || [],
      cover: normalized.cover || "poster",
      recommended: Boolean(normalized.recommended),
      status: String(normalized.status || MERCHANT_PRODUCT_STATUS.onSale),
      specMode: normalized.specMode === "multi" ? "multi" : "single",
      priceText: String(normalized.price || ""),
      stock: Number(normalized.stock || 0),
      dailyLimit: Number(normalized.dailyLimit || 0),
      defaultSkuKey: String(normalized.defaultSkuId || ""),
      sortOrder
    }
  });

  await replaceProductSkus(db, created.id, normalized);
  await syncStoreProductSnapshot(db, storeId);
  return findStoreProductRow(db, storeId, normalized.id);
}

export async function updateStoreProductRecord(
  db: DbClient,
  storeId: number,
  productKey: string,
  payload: MiniMerchantProductPayload
) {
  const current = await findStoreProductRow(db, storeId, productKey);
  const normalized = normalizeMerchantProductPayload(String(productKey), payload);
  const category = await resolveProductCategory(db, storeId, normalized.categoryId || current.categoryId);

  await db.miniStoreProduct.update({
    where: { id: current.id },
    data: {
      name: normalized.name,
      categoryId: category.id,
      categoryName: category.name,
      desc: normalized.desc,
      detailTitle: normalized.detailTitle || "",
      detailText: normalized.detailText || "",
      detailItems: normalized.detailItems || [],
      cover: normalized.cover || "poster",
      recommended: Boolean(normalized.recommended),
      status: String(normalized.status || MERCHANT_PRODUCT_STATUS.onSale),
      specMode: normalized.specMode === "multi" ? "multi" : "single",
      priceText: String(normalized.price || ""),
      stock: Number(normalized.stock || 0),
      dailyLimit: Number(normalized.dailyLimit || 0),
      defaultSkuKey: String(normalized.defaultSkuId || "")
    }
  });

  await replaceProductSkus(db, current.id, normalized);
  await syncStoreProductSnapshot(db, storeId);
  return findStoreProductRow(db, storeId, productKey);
}

export async function toggleStoreProductStatusRecord(
  db: DbClient,
  storeId: number,
  productKey: string
) {
  const current = await findStoreProductRow(db, storeId, productKey);
  const nextStatus =
    current.status === MERCHANT_PRODUCT_STATUS.onSale ? MERCHANT_PRODUCT_STATUS.offSale : MERCHANT_PRODUCT_STATUS.onSale;

  await db.miniStoreProduct.update({
    where: { id: current.id },
    data: {
      status: nextStatus
    }
  });

  await db.miniStoreProductSku.updateMany({
    where: { productId: current.id },
    data: {
      status: nextStatus === MERCHANT_PRODUCT_STATUS.offSale ? MERCHANT_PRODUCT_STATUS.offSale : MERCHANT_PRODUCT_STATUS.onSale
    }
  });

  await syncStoreProductSnapshot(db, storeId);
  return findStoreProductRow(db, storeId, productKey);
}

export async function deleteStoreProductRecord(
  db: DbClient,
  storeId: number,
  productKey: string
) {
  const current = await findStoreProductRow(db, storeId, productKey);
  await db.miniStoreProductSku.deleteMany({
    where: { productId: current.id }
  });
  await db.miniStoreProduct.delete({
    where: { id: current.id }
  });
  await syncStoreProductSnapshot(db, storeId);
}

export async function moveStoreProductRecord(
  db: DbClient,
  storeId: number,
  productKey: string,
  direction: "up" | "down"
) {
  const rows = await listRowsByStoreId(db, storeId);
  const index = rows.findIndex((item) => String(item.productKey) === String(productKey));

  if (index === -1) {
    throw new ApiError("商品不存在", ERROR_CODES.NOT_FOUND, 404);
  }

  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= rows.length) {
    return rows[index];
  }

  await db.miniStoreProduct.update({
    where: { id: rows[index].id },
    data: { sortOrder: rows[targetIndex].sortOrder }
  });
  await db.miniStoreProduct.update({
    where: { id: rows[targetIndex].id },
    data: { sortOrder: rows[index].sortOrder }
  });

  await syncStoreProductSnapshot(db, storeId);
  return findStoreProductRow(db, storeId, productKey);
}

export async function batchDownStoreProducts(
  db: DbClient,
  storeId: number,
  productKeys: string[]
) {
  const keys = productKeys.map((item) => String(item));
  await db.miniStoreProduct.updateMany({
    where: {
      storeId,
      productKey: { in: keys }
    },
    data: {
      status: MERCHANT_PRODUCT_STATUS.offSale
    }
  });

  const productIds = await db.miniStoreProduct.findMany({
    where: {
      storeId,
      productKey: { in: keys }
    },
    select: { id: true }
  });

  if (productIds.length) {
    await db.miniStoreProductSku.updateMany({
      where: {
        productId: { in: productIds.map((item) => item.id) }
      },
      data: {
        status: MERCHANT_PRODUCT_STATUS.offSale
      }
    });
  }

  await syncStoreProductSnapshot(db, storeId);
}

export async function batchDeleteStoreProducts(
  db: DbClient,
  storeId: number,
  productKeys: string[]
) {
  const rows = await db.miniStoreProduct.findMany({
    where: {
      storeId,
      productKey: { in: productKeys.map((item) => String(item)) }
    },
    select: { id: true }
  });

  if (rows.length) {
    await db.miniStoreProductSku.deleteMany({
      where: {
        productId: { in: rows.map((item) => item.id) }
      }
    });
    await db.miniStoreProduct.deleteMany({
      where: {
        id: { in: rows.map((item) => item.id) }
      }
    });
  }

  await syncStoreProductSnapshot(db, storeId);
}

export function mapStoreProductForApi(row: any) {
  return mapProductRow(row);
}
