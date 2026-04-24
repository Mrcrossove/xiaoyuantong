ALTER TABLE "MiniWithdrawRecord"
ADD COLUMN IF NOT EXISTS "transferStatus" TEXT,
ADD COLUMN IF NOT EXISTS "transferOutBillNo" TEXT,
ADD COLUMN IF NOT EXISTS "transferBillNo" TEXT,
ADD COLUMN IF NOT EXISTS "transferFailReason" TEXT,
ADD COLUMN IF NOT EXISTS "transferAppliedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "transferSuccessAt" TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "MiniWithdrawRecord_transferOutBillNo_key"
ON "MiniWithdrawRecord"("transferOutBillNo");

CREATE INDEX IF NOT EXISTS "MiniWithdrawRecord_status_transferStatus_idx"
ON "MiniWithdrawRecord"("status", "transferStatus");

CREATE TABLE IF NOT EXISTS "MiniProfitSharingReturnOrder" (
  "id" SERIAL NOT NULL,
  "outReturnNo" TEXT NOT NULL,
  "orderId" INTEGER NOT NULL,
  "profitSharingOrderId" INTEGER,
  "school" TEXT NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "status" TEXT NOT NULL,
  "wechatStatus" TEXT,
  "description" TEXT,
  "subMchId" TEXT NOT NULL,
  "outOrderNo" TEXT NOT NULL,
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

  CONSTRAINT "MiniProfitSharingReturnOrder_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "MiniProfitSharingReturnOrder_outReturnNo_key"
ON "MiniProfitSharingReturnOrder"("outReturnNo");

CREATE INDEX IF NOT EXISTS "MiniProfitSharingReturnOrder_orderId_status_idx"
ON "MiniProfitSharingReturnOrder"("orderId", "status");

CREATE INDEX IF NOT EXISTS "MiniProfitSharingReturnOrder_status_createdAt_idx"
ON "MiniProfitSharingReturnOrder"("status", "createdAt");

CREATE INDEX IF NOT EXISTS "MiniProfitSharingReturnOrder_profitSharingOrderId_idx"
ON "MiniProfitSharingReturnOrder"("profitSharingOrderId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'MiniProfitSharingReturnOrder_orderId_fkey'
  ) THEN
    ALTER TABLE "MiniProfitSharingReturnOrder"
    ADD CONSTRAINT "MiniProfitSharingReturnOrder_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "MiniOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'MiniProfitSharingReturnOrder_profitSharingOrderId_fkey'
  ) THEN
    ALTER TABLE "MiniProfitSharingReturnOrder"
    ADD CONSTRAINT "MiniProfitSharingReturnOrder_profitSharingOrderId_fkey"
    FOREIGN KEY ("profitSharingOrderId") REFERENCES "MiniProfitSharingOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "MiniWithdrawTransferBill" (
  "id" SERIAL NOT NULL,
  "withdrawRecordId" INTEGER NOT NULL,
  "school" TEXT NOT NULL,
  "userId" INTEGER NOT NULL,
  "outBillNo" TEXT NOT NULL,
  "transferBillNo" TEXT,
  "subMchId" TEXT NOT NULL,
  "openid" TEXT NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "status" TEXT NOT NULL,
  "wechatStatus" TEXT,
  "sceneId" TEXT,
  "userName" TEXT,
  "failReason" TEXT,
  "packageInfo" TEXT,
  "requestPayload" JSONB,
  "responsePayload" JSONB,
  "syncAttempts" INTEGER NOT NULL DEFAULT 0,
  "lastSyncAt" TIMESTAMP(3),
  "acceptedAt" TIMESTAMP(3),
  "successAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "MiniWithdrawTransferBill_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "MiniWithdrawTransferBill_outBillNo_key"
ON "MiniWithdrawTransferBill"("outBillNo");

CREATE INDEX IF NOT EXISTS "MiniWithdrawTransferBill_withdrawRecordId_status_idx"
ON "MiniWithdrawTransferBill"("withdrawRecordId", "status");

CREATE INDEX IF NOT EXISTS "MiniWithdrawTransferBill_status_createdAt_idx"
ON "MiniWithdrawTransferBill"("status", "createdAt");

CREATE INDEX IF NOT EXISTS "MiniWithdrawTransferBill_userId_status_idx"
ON "MiniWithdrawTransferBill"("userId", "status");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'MiniWithdrawTransferBill_withdrawRecordId_fkey'
  ) THEN
    ALTER TABLE "MiniWithdrawTransferBill"
    ADD CONSTRAINT "MiniWithdrawTransferBill_withdrawRecordId_fkey"
    FOREIGN KEY ("withdrawRecordId") REFERENCES "MiniWithdrawRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
