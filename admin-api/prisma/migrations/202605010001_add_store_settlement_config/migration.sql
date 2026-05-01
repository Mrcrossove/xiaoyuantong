ALTER TABLE "MiniStore"
ADD COLUMN IF NOT EXISTS "wechatSubMchStatus" TEXT NOT NULL DEFAULT 'not_invited',
ADD COLUMN IF NOT EXISTS "commissionRate" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "profitSharingEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS "settlementMode" TEXT NOT NULL DEFAULT 'auto',
ADD COLUMN IF NOT EXISTS "merchantContactName" TEXT,
ADD COLUMN IF NOT EXISTS "merchantContactPhone" TEXT;

ALTER TABLE "MiniOrder"
ADD COLUMN IF NOT EXISTS "commissionRateSnapshot" DOUBLE PRECISION;

UPDATE "MiniStore" s
SET
  "merchantContactName" = COALESCE(s."merchantContactName", a."name"),
  "merchantContactPhone" = COALESCE(s."merchantContactPhone", a."phone")
FROM "MerchantAccount" a
WHERE a."storeId" = s."id";

CREATE INDEX IF NOT EXISTS "MiniStore_school_wechatSubMchStatus_idx"
ON "MiniStore"("school", "wechatSubMchStatus");
