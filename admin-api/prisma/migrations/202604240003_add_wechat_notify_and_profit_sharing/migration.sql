ALTER TABLE "MiniOrder"
ADD COLUMN IF NOT EXISTS "profitSharingStatus" TEXT NOT NULL DEFAULT '未分账',
ADD COLUMN IF NOT EXISTS "profitSharingAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "profitSharedAt" TIMESTAMP(3);

ALTER TABLE "MiniRefundRecord"
ADD COLUMN IF NOT EXISTS "refundSuccessAt" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "MiniProfitSharingOrder" (
  "id" SERIAL NOT NULL,
  "outOrderNo" TEXT NOT NULL,
  "orderId" INTEGER NOT NULL,
  "school" TEXT NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "status" TEXT NOT NULL,
  "wechatStatus" TEXT,
  "receiverType" TEXT NOT NULL,
  "receiverAccount" TEXT NOT NULL,
  "receiverName" TEXT NOT NULL,
  "subMchId" TEXT NOT NULL,
  "transactionId" TEXT,
  "responseCode" TEXT,
  "failureCode" TEXT,
  "failureReason" TEXT,
  "requestPayload" JSONB,
  "responsePayload" JSONB,
  "syncAttempts" INTEGER NOT NULL DEFAULT 0,
  "lastSyncAt" TIMESTAMP(3),
  "finishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "MiniProfitSharingOrder_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "MiniProfitSharingOrder_outOrderNo_key" ON "MiniProfitSharingOrder"("outOrderNo");
CREATE INDEX IF NOT EXISTS "MiniProfitSharingOrder_orderId_status_idx" ON "MiniProfitSharingOrder"("orderId", "status");
CREATE INDEX IF NOT EXISTS "MiniProfitSharingOrder_status_createdAt_idx" ON "MiniProfitSharingOrder"("status", "createdAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'MiniProfitSharingOrder_orderId_fkey'
  ) THEN
    ALTER TABLE "MiniProfitSharingOrder"
    ADD CONSTRAINT "MiniProfitSharingOrder_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "MiniOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
