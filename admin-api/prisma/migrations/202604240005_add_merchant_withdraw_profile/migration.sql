ALTER TABLE "MerchantAccount"
ADD COLUMN IF NOT EXISTS "withdrawChannel" TEXT NOT NULL DEFAULT '微信零钱',
ADD COLUMN IF NOT EXISTS "withdrawRealName" TEXT,
ADD COLUMN IF NOT EXISTS "withdrawProfileStatus" TEXT NOT NULL DEFAULT '未建档',
ADD COLUMN IF NOT EXISTS "withdrawBlockedReason" TEXT,
ADD COLUMN IF NOT EXISTS "withdrawAgreementAcceptedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "withdrawOpenidBoundAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "withdrawProfileCompletedAt" TIMESTAMP(3);
