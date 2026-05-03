import { Prisma } from "@prisma/client";

export const MERCHANT_PRODUCT_STATUS = {
  onSale: "已上架",
  offSale: "已下架"
} as const;

export type MerchantProductSkuItem = {
  id: string;
  name: string;
  price: string;
  stock?: number;
  dailyLimit?: number;
  status?: string;
  isDefault?: boolean;
};

export type MerchantProductItem = {
  id: string;
  name: string;
  desc: string;
  detailTitle?: string;
  detailText?: string;
  detailItems?: MerchantProductDetailItem[];
  cover?: string;
  recommended?: boolean;
  status?: string;
  specMode?: "single" | "multi";
  price?: string;
  stock?: number;
  dailyLimit?: number;
  defaultSkuId?: string;
  skus?: MerchantProductSkuItem[];
};

export type MerchantProductDetailItem = {
  label: string;
  value: string;
};

type ProductPayloadLike = {
  name: string;
  desc: string;
  detailTitle?: string;
  detailText?: string;
  detailItems?: MerchantProductDetailItem[];
  cover?: string;
  recommended?: boolean;
  status?: string;
  price?: string;
  stock?: number;
  dailyLimit?: number;
  specMode?: "single" | "multi";
  skus?: Array<
    Omit<MerchantProductSkuItem, "id"> & {
      id?: string;
    }
  >;
};

function toArray(value: Prisma.JsonValue | null | undefined) {
  return Array.isArray(value) ? value : [];
}

export function parseMoneyNumber(rawValue: unknown) {
  const value = Number(String(rawValue || "").replace(/[^\d.]/g, ""));
  return Number.isFinite(value) ? Number(value.toFixed(2)) : 0;
}

export function ensureCurrencyText(rawValue: unknown) {
  const amount = parseMoneyNumber(rawValue);
  const text = Number.isInteger(amount) ? String(amount) : amount.toFixed(2);
  return `¥${text}`;
}

function normalizeSku(item: any, index: number): MerchantProductSkuItem {
  const skuId = String(item?.id || `sku_${index + 1}`);
  const skuName = String(item?.name || `规格${index + 1}`).trim() || `规格${index + 1}`;
  return {
    id: skuId,
    name: skuName,
    price: ensureCurrencyText(item?.price || 0),
    stock: Math.max(0, Number(item?.stock || 0)),
    dailyLimit: Math.max(0, Number(item?.dailyLimit || 0)),
    status: item?.status === MERCHANT_PRODUCT_STATUS.offSale ? MERCHANT_PRODUCT_STATUS.offSale : MERCHANT_PRODUCT_STATUS.onSale,
    isDefault: Boolean(item?.isDefault)
  };
}

function normalizeDetailItems(value: unknown): MerchantProductDetailItem[] {
  return (Array.isArray(value) ? value : [])
    .map((item: any) => ({
      label: String(item?.label || "").trim(),
      value: String(item?.value || "").trim()
    }))
    .filter((item) => item.label && item.value)
    .slice(0, 20);
}

function buildSingleSkuFromProduct(product: any): MerchantProductSkuItem {
  return {
    id: String(product?.defaultSkuId || product?.id || "sku_default"),
    name: "默认规格",
    price: ensureCurrencyText(product?.price || 0),
    stock: Math.max(0, Number(product?.stock || 0)),
    dailyLimit: Math.max(0, Number(product?.dailyLimit || 0)),
    status: product?.status === MERCHANT_PRODUCT_STATUS.offSale ? MERCHANT_PRODUCT_STATUS.offSale : MERCHANT_PRODUCT_STATUS.onSale,
    isDefault: true
  };
}

export function normalizeMerchantProduct(item: any, index = 0): MerchantProductItem {
  const rawSkuList = Array.isArray(item?.skus) ? item.skus : [];
  const skuList: MerchantProductSkuItem[] = (rawSkuList.length ? rawSkuList : [buildSingleSkuFromProduct(item)]).map(normalizeSku);
  const explicitDefault = String(item?.defaultSkuId || "").trim();
  const defaultSku =
    skuList.find((sku: MerchantProductSkuItem) => sku.id === explicitDefault) ||
    skuList.find((sku: MerchantProductSkuItem) => sku.isDefault) ||
    skuList[0];

  const normalizedSkus: MerchantProductSkuItem[] = skuList.map((sku: MerchantProductSkuItem) => ({
    ...sku,
    isDefault: sku.id === defaultSku.id
  }));
  const productStatus =
    item?.status === MERCHANT_PRODUCT_STATUS.offSale ? MERCHANT_PRODUCT_STATUS.offSale : MERCHANT_PRODUCT_STATUS.onSale;

  return {
    id: String(item?.id || `p${index + 1}`),
    name: String(item?.name || "").trim(),
    desc: String(item?.desc || "").trim(),
    detailTitle: String(item?.detailTitle || "").trim(),
    detailText: String(item?.detailText || "").trim(),
    detailItems: normalizeDetailItems(item?.detailItems),
    cover: String(item?.cover || "poster").trim() || "poster",
    recommended: Boolean(item?.recommended),
    status: productStatus,
    specMode: normalizedSkus.length > 1 || item?.specMode === "multi" ? "multi" : "single",
    price: defaultSku.price,
    stock: normalizedSkus.reduce((sum: number, sku: MerchantProductSkuItem) => sum + Number(sku.stock || 0), 0),
    dailyLimit: Number(defaultSku.dailyLimit || 0),
    defaultSkuId: defaultSku.id,
    skus: normalizedSkus
  };
}

export function toMerchantProducts(value: Prisma.JsonValue | null | undefined) {
  return toArray(value).map((item, index) => normalizeMerchantProduct(item, index));
}

export function getAvailableSkus(product: MerchantProductItem) {
  return (product.skus || []).filter((sku) => String(sku.status || MERCHANT_PRODUCT_STATUS.onSale) === MERCHANT_PRODUCT_STATUS.onSale);
}

export function getDefaultSku(product: MerchantProductItem) {
  const skus = getAvailableSkus(product);
  return skus.find((sku) => sku.id === product.defaultSkuId) || skus.find((sku) => sku.isDefault) || skus[0] || null;
}

export function buildProductDisplayPrice(product: MerchantProductItem) {
  const skus = getAvailableSkus(product);
  if (!skus.length) return "¥0";
  const prices = skus.map((sku) => parseMoneyNumber(sku.price)).filter((item) => item > 0);
  if (!prices.length) return "¥0";
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  if (min === max) return ensureCurrencyText(min);
  return `${ensureCurrencyText(min)} 起`;
}

export function normalizeMerchantProductPayload(productId: string, payload: ProductPayloadLike) {
  const singleSku = {
    id: `${productId}_sku_default`,
    name: "默认规格",
    price: payload.price || 0,
    stock: payload.stock || 0,
    dailyLimit: payload.dailyLimit || 0,
    status: payload.status || MERCHANT_PRODUCT_STATUS.onSale,
    isDefault: true
  };
  const normalized = normalizeMerchantProduct(
    {
      id: productId,
      name: payload.name,
      desc: payload.desc,
      detailTitle: payload.detailTitle || "",
      detailText: payload.detailText || "",
      detailItems: payload.detailItems || [],
      cover: payload.cover || "poster",
      recommended: !!payload.recommended,
      status: payload.status || MERCHANT_PRODUCT_STATUS.onSale,
      specMode: "single",
      price: payload.price || 0,
      stock: payload.stock || 0,
      dailyLimit: payload.dailyLimit || 0,
      skus: [singleSku]
    },
    0
  );

  if (!normalized.skus?.length) {
    throw new Error("商品至少需要一个规格");
  }

  return normalized;
}
