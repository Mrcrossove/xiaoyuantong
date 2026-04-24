CREATE TABLE "MiniStoreProduct" (
  "id" SERIAL NOT NULL,
  "productKey" TEXT NOT NULL,
  "storeId" INTEGER NOT NULL,
  "name" TEXT NOT NULL,
  "desc" TEXT NOT NULL,
  "cover" TEXT NOT NULL,
  "recommended" BOOLEAN NOT NULL DEFAULT false,
  "status" TEXT NOT NULL,
  "specMode" TEXT NOT NULL,
  "priceText" TEXT NOT NULL,
  "stock" INTEGER NOT NULL DEFAULT 0,
  "dailyLimit" INTEGER NOT NULL DEFAULT 0,
  "defaultSkuKey" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MiniStoreProduct_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MiniStoreProductSku" (
  "id" SERIAL NOT NULL,
  "skuKey" TEXT NOT NULL,
  "productId" INTEGER NOT NULL,
  "name" TEXT NOT NULL,
  "priceText" TEXT NOT NULL,
  "stock" INTEGER NOT NULL DEFAULT 0,
  "dailyLimit" INTEGER NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MiniStoreProductSku_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdminStoreChangeLog" (
  "id" SERIAL NOT NULL,
  "storeId" INTEGER NOT NULL,
  "school" TEXT NOT NULL,
  "module" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "targetType" TEXT NOT NULL,
  "targetId" TEXT NOT NULL,
  "operatorId" INTEGER NOT NULL,
  "operatorRoleCode" TEXT NOT NULL,
  "operatorScopeType" TEXT NOT NULL,
  "changeMode" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "beforeData" JSONB,
  "afterData" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdminStoreChangeLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StoreProductApproval" (
  "id" SERIAL NOT NULL,
  "storeId" INTEGER NOT NULL,
  "school" TEXT NOT NULL,
  "targetType" TEXT NOT NULL,
  "targetId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "expectedStoreUpdatedAt" TIMESTAMP(3),
  "requestedById" INTEGER NOT NULL,
  "reviewedById" INTEGER,
  "reviewNote" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StoreProductApproval_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MiniStoreProduct_productKey_key" ON "MiniStoreProduct"("productKey");
CREATE UNIQUE INDEX "MiniStoreProductSku_skuKey_key" ON "MiniStoreProductSku"("skuKey");
CREATE INDEX "MiniStoreProduct_storeId_sortOrder_idx" ON "MiniStoreProduct"("storeId", "sortOrder");
CREATE INDEX "MiniStoreProductSku_productId_sortOrder_idx" ON "MiniStoreProductSku"("productId", "sortOrder");
CREATE INDEX "AdminStoreChangeLog_storeId_createdAt_idx" ON "AdminStoreChangeLog"("storeId", "createdAt");
CREATE INDEX "AdminStoreChangeLog_operatorId_createdAt_idx" ON "AdminStoreChangeLog"("operatorId", "createdAt");
CREATE INDEX "AdminStoreChangeLog_school_createdAt_idx" ON "AdminStoreChangeLog"("school", "createdAt");
CREATE INDEX "StoreProductApproval_storeId_status_createdAt_idx" ON "StoreProductApproval"("storeId", "status", "createdAt");
CREATE INDEX "StoreProductApproval_requestedById_createdAt_idx" ON "StoreProductApproval"("requestedById", "createdAt");
CREATE INDEX "StoreProductApproval_school_status_idx" ON "StoreProductApproval"("school", "status");

ALTER TABLE "MiniStoreProduct"
  ADD CONSTRAINT "MiniStoreProduct_storeId_fkey"
  FOREIGN KEY ("storeId") REFERENCES "MiniStore"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "MiniStoreProductSku"
  ADD CONSTRAINT "MiniStoreProductSku_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "MiniStoreProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AdminStoreChangeLog"
  ADD CONSTRAINT "AdminStoreChangeLog_storeId_fkey"
  FOREIGN KEY ("storeId") REFERENCES "MiniStore"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AdminStoreChangeLog"
  ADD CONSTRAINT "AdminStoreChangeLog_operatorId_fkey"
  FOREIGN KEY ("operatorId") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "StoreProductApproval"
  ADD CONSTRAINT "StoreProductApproval_storeId_fkey"
  FOREIGN KEY ("storeId") REFERENCES "MiniStore"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "StoreProductApproval"
  ADD CONSTRAINT "StoreProductApproval_requestedById_fkey"
  FOREIGN KEY ("requestedById") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "StoreProductApproval"
  ADD CONSTRAINT "StoreProductApproval_reviewedById_fkey"
  FOREIGN KEY ("reviewedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

WITH product_rows AS (
  SELECT
    s."id" AS store_id,
    p.value AS product_json,
    p.ordinality::INTEGER AS sort_order,
    COALESCE(NULLIF(p.value->>'id', ''), CONCAT('legacy_p_', s."id", '_', p.ordinality::TEXT)) AS product_key
  FROM "MiniStore" s
  CROSS JOIN LATERAL jsonb_array_elements(COALESCE(s."products"::jsonb, '[]'::jsonb)) WITH ORDINALITY AS p(value, ordinality)
)
INSERT INTO "MiniStoreProduct" (
  "productKey",
  "storeId",
  "name",
  "desc",
  "cover",
  "recommended",
  "status",
  "specMode",
  "priceText",
  "stock",
  "dailyLimit",
  "defaultSkuKey",
  "sortOrder"
)
SELECT
  product_key,
  store_id,
  COALESCE(product_json->>'name', ''),
  COALESCE(product_json->>'desc', ''),
  COALESCE(NULLIF(product_json->>'cover', ''), 'poster'),
  COALESCE((product_json->>'recommended')::BOOLEAN, false),
  COALESCE(NULLIF(product_json->>'status', ''), '已上架'),
  CASE WHEN COALESCE(product_json->>'specMode', 'single') = 'multi' THEN 'multi' ELSE 'single' END,
  COALESCE(product_json->>'price', product_json->>'priceText', '0'),
  COALESCE((product_json->>'stock')::INTEGER, 0),
  COALESCE((product_json->>'dailyLimit')::INTEGER, 0),
  NULLIF(product_json->>'defaultSkuId', ''),
  sort_order
FROM product_rows;

WITH product_rows AS (
  SELECT
    s."id" AS store_id,
    p.value AS product_json,
    p.ordinality::INTEGER AS sort_order,
    COALESCE(NULLIF(p.value->>'id', ''), CONCAT('legacy_p_', s."id", '_', p.ordinality::TEXT)) AS product_key
  FROM "MiniStore" s
  CROSS JOIN LATERAL jsonb_array_elements(COALESCE(s."products"::jsonb, '[]'::jsonb)) WITH ORDINALITY AS p(value, ordinality)
),
explicit_skus AS (
  SELECT
    mp."id" AS product_id,
    COALESCE(NULLIF(sku.value->>'id', ''), CONCAT(mp."productKey", '_sku_', sku.ordinality::TEXT)) AS sku_key,
    COALESCE(NULLIF(sku.value->>'name', ''), CONCAT('规格', sku.ordinality::TEXT)) AS sku_name,
    COALESCE(sku.value->>'price', mp."priceText", '0') AS price_text,
    COALESCE((sku.value->>'stock')::INTEGER, 0) AS stock,
    COALESCE((sku.value->>'dailyLimit')::INTEGER, 0) AS daily_limit,
    COALESCE(NULLIF(sku.value->>'status', ''), mp."status") AS sku_status,
    COALESCE((sku.value->>'isDefault')::BOOLEAN, false) AS is_default,
    sku.ordinality::INTEGER AS sort_order
  FROM product_rows pr
  JOIN "MiniStoreProduct" mp
    ON mp."storeId" = pr.store_id AND mp."productKey" = pr.product_key
  CROSS JOIN LATERAL jsonb_array_elements(COALESCE(pr.product_json->'skus', '[]'::jsonb)) WITH ORDINALITY AS sku(value, ordinality)
),
fallback_skus AS (
  SELECT
    mp."id" AS product_id,
    COALESCE(NULLIF(pr.product_json->>'defaultSkuId', ''), CONCAT(mp."productKey", '_sku_1')) AS sku_key,
    '默认规格' AS sku_name,
    COALESCE(pr.product_json->>'price', mp."priceText", '0') AS price_text,
    COALESCE((pr.product_json->>'stock')::INTEGER, 0) AS stock,
    COALESCE((pr.product_json->>'dailyLimit')::INTEGER, 0) AS daily_limit,
    mp."status" AS sku_status,
    true AS is_default,
    1 AS sort_order
  FROM product_rows pr
  JOIN "MiniStoreProduct" mp
    ON mp."storeId" = pr.store_id AND mp."productKey" = pr.product_key
  WHERE jsonb_array_length(COALESCE(pr.product_json->'skus', '[]'::jsonb)) = 0
)
INSERT INTO "MiniStoreProductSku" (
  "skuKey",
  "productId",
  "name",
  "priceText",
  "stock",
  "dailyLimit",
  "status",
  "isDefault",
  "sortOrder"
)
SELECT * FROM (
  SELECT sku_key, product_id, sku_name, price_text, stock, daily_limit, sku_status, is_default, sort_order FROM explicit_skus
  UNION ALL
  SELECT sku_key, product_id, sku_name, price_text, stock, daily_limit, sku_status, is_default, sort_order FROM fallback_skus
) AS final_skus;

UPDATE "MiniStoreProduct" p
SET "defaultSkuKey" = COALESCE(default_sku."skuKey", p."defaultSkuKey")
FROM LATERAL (
  SELECT s."skuKey"
  FROM "MiniStoreProductSku" s
  WHERE s."productId" = p."id"
  ORDER BY s."isDefault" DESC, s."sortOrder" ASC, s."id" ASC
  LIMIT 1
) AS default_sku;

UPDATE "MiniStore" s
SET "productCount" = COALESCE(src.on_sale_count, 0)
FROM (
  SELECT "storeId", COUNT(*) FILTER (WHERE "status" = '已上架') AS on_sale_count
  FROM "MiniStoreProduct"
  GROUP BY "storeId"
) AS src
WHERE s."id" = src."storeId";
