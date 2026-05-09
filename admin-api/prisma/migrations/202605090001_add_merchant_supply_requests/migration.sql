CREATE TABLE "MerchantSupplyRequest" (
    "id" SERIAL NOT NULL,
    "requestNo" TEXT NOT NULL,
    "merchantAccountId" INTEGER NOT NULL,
    "storeId" INTEGER NOT NULL,
    "storeName" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "school" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "remark" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "adminNote" TEXT NOT NULL DEFAULT '',
    "handledById" INTEGER,
    "handledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MerchantSupplyRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MerchantSupplyRequest_requestNo_key" ON "MerchantSupplyRequest"("requestNo");
CREATE INDEX "MerchantSupplyRequest_merchantAccountId_createdAt_idx" ON "MerchantSupplyRequest"("merchantAccountId", "createdAt");
CREATE INDEX "MerchantSupplyRequest_storeId_createdAt_idx" ON "MerchantSupplyRequest"("storeId", "createdAt");
CREATE INDEX "MerchantSupplyRequest_school_status_createdAt_idx" ON "MerchantSupplyRequest"("school", "status", "createdAt");
CREATE INDEX "MerchantSupplyRequest_status_createdAt_idx" ON "MerchantSupplyRequest"("status", "createdAt");

ALTER TABLE "MerchantSupplyRequest" ADD CONSTRAINT "MerchantSupplyRequest_merchantAccountId_fkey" FOREIGN KEY ("merchantAccountId") REFERENCES "MerchantAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MerchantSupplyRequest" ADD CONSTRAINT "MerchantSupplyRequest_handledById_fkey" FOREIGN KEY ("handledById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
