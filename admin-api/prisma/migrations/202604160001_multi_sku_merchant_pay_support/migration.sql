ALTER TABLE "MiniStore"
ADD COLUMN IF NOT EXISTS "wechatSubMchId" TEXT;

ALTER TABLE "MiniOrder"
ADD COLUMN IF NOT EXISTS "skuId" TEXT,
ADD COLUMN IF NOT EXISTS "skuName" TEXT,
ADD COLUMN IF NOT EXISTS "paymentChannel" TEXT,
ADD COLUMN IF NOT EXISTS "paymentMode" TEXT,
ADD COLUMN IF NOT EXISTS "transactionId" TEXT,
ADD COLUMN IF NOT EXISTS "paymentMeta" JSONB,
ADD COLUMN IF NOT EXISTS "settlementStatus" TEXT,
ADD COLUMN IF NOT EXISTS "settlementAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "platformCommissionAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "merchantIncomeAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "settledAt" TIMESTAMP(3);

UPDATE "MiniOrder"
SET "settlementStatus" = '未结算'
WHERE "settlementStatus" IS NULL;

ALTER TABLE "MiniOrder"
ALTER COLUMN "settlementStatus" SET DEFAULT '未结算';

ALTER TABLE "MiniRefundRecord"
ADD COLUMN IF NOT EXISTS "refundRequestNo" TEXT,
ADD COLUMN IF NOT EXISTS "refundChannel" TEXT,
ADD COLUMN IF NOT EXISTS "refundMeta" JSONB;

CREATE TABLE IF NOT EXISTS "MerchantAccount" (
  "id" SERIAL NOT NULL,
  "miniUserId" INTEGER NOT NULL,
  "storeId" INTEGER NOT NULL,
  "phone" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "password" TEXT,
  "status" TEXT NOT NULL,
  "activatedAt" TIMESTAMP(3),
  "lastLoginAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MerchantAccount_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "MerchantAccount_miniUserId_key" ON "MerchantAccount"("miniUserId");
CREATE UNIQUE INDEX IF NOT EXISTS "MerchantAccount_storeId_key" ON "MerchantAccount"("storeId");
CREATE UNIQUE INDEX IF NOT EXISTS "MerchantAccount_phone_key" ON "MerchantAccount"("phone");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'MerchantAccount_miniUserId_fkey'
  ) THEN
    ALTER TABLE "MerchantAccount"
    ADD CONSTRAINT "MerchantAccount_miniUserId_fkey"
    FOREIGN KEY ("miniUserId") REFERENCES "MiniUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'MerchantAccount_storeId_fkey'
  ) THEN
    ALTER TABLE "MerchantAccount"
    ADD CONSTRAINT "MerchantAccount_storeId_fkey"
    FOREIGN KEY ("storeId") REFERENCES "MiniStore"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "MerchantLoginCode" (
  "id" SERIAL NOT NULL,
  "phone" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "scene" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "consumedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MerchantLoginCode_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "MerchantLoginCode_phone_scene_createdAt_idx"
ON "MerchantLoginCode"("phone", "scene", "createdAt");

CREATE INDEX IF NOT EXISTS "MerchantLoginCode_phone_expiresAt_idx"
ON "MerchantLoginCode"("phone", "expiresAt");
