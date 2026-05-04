CREATE TABLE IF NOT EXISTS "MiniStoreProductCategory" (
  "id" SERIAL PRIMARY KEY,
  "storeId" INTEGER NOT NULL,
  "name" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'enabled',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MiniStoreProductCategory_storeId_fkey"
    FOREIGN KEY ("storeId") REFERENCES "MiniStore"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "MiniStoreProductCategory_storeId_sortOrder_idx"
  ON "MiniStoreProductCategory"("storeId", "sortOrder");

ALTER TABLE "MiniStoreProduct"
  ADD COLUMN IF NOT EXISTS "categoryId" INTEGER,
  ADD COLUMN IF NOT EXISTS "categoryName" TEXT NOT NULL DEFAULT '默认分类';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'MiniStoreProduct_categoryId_fkey'
      AND table_name = 'MiniStoreProduct'
  ) THEN
    ALTER TABLE "MiniStoreProduct"
      ADD CONSTRAINT "MiniStoreProduct_categoryId_fkey"
      FOREIGN KEY ("categoryId") REFERENCES "MiniStoreProductCategory"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "MiniStoreProduct_categoryId_sortOrder_idx"
  ON "MiniStoreProduct"("categoryId", "sortOrder");

INSERT INTO "MiniStoreProductCategory" ("storeId", "name", "sortOrder", "status", "createdAt", "updatedAt")
SELECT
  "MiniStore"."id",
  '默认分类',
  1,
  'enabled',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "MiniStore"
WHERE NOT EXISTS (
  SELECT 1
  FROM "MiniStoreProductCategory"
  WHERE "MiniStoreProductCategory"."storeId" = "MiniStore"."id"
);

UPDATE "MiniStoreProduct"
SET
  "categoryId" = fallback."id",
  "categoryName" = fallback."name"
FROM (
  SELECT DISTINCT ON ("storeId") "id", "storeId", "name"
  FROM "MiniStoreProductCategory"
  WHERE "status" = 'enabled'
  ORDER BY "storeId", "sortOrder" ASC, "id" ASC
) AS fallback
WHERE "MiniStoreProduct"."storeId" = fallback."storeId"
  AND "MiniStoreProduct"."categoryId" IS NULL;
