export const MERCHANT_MENU_PATHS = [
  "/dashboard",
  "/store",
  "/product",
  "/order",
  "/refund",
  "/wallet",
  "/message",
  "/stat",
  "/account"
] as const;

export const MERCHANT_PERMISSION_CODES = [
  "dashboard:view",
  "store:view",
  "store:edit",
  "product:view",
  "product:create",
  "product:edit",
  "product:delete",
  "product:status",
  "product:sort",
  "order:view",
  "order:accept",
  "order:finish",
  "refund:view",
  "refund:review",
  "wallet:view",
  "wallet:withdraw",
  "message:view",
  "message:read",
  "stat:view",
  "account:view",
  "account:edit",
  "account:password"
] as const;

export function getDefaultMerchantMenuPaths() {
  return [...MERCHANT_MENU_PATHS];
}

export function getDefaultMerchantPermissionCodes() {
  return [...MERCHANT_PERMISSION_CODES];
}
