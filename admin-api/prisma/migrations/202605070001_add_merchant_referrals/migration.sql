CREATE TABLE IF NOT EXISTS "MerchantReferral" (
  "id" SERIAL PRIMARY KEY,
  "merchantAccountId" INTEGER NOT NULL,
  "storeId" INTEGER NOT NULL,
  "userId" INTEGER NOT NULL,
  "scene" TEXT NOT NULL,
  "source" TEXT NOT NULL DEFAULT 'mini_qr',
  "billable" BOOLEAN NOT NULL DEFAULT true,
  "unitPriceCents" INTEGER NOT NULL DEFAULT 100,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "firstLoginAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MerchantReferral_merchantAccountId_fkey" FOREIGN KEY ("merchantAccountId") REFERENCES "MerchantAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "MerchantReferral_userId_fkey" FOREIGN KEY ("userId") REFERENCES "MiniUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "MerchantReferral_userId_key" ON "MerchantReferral"("userId");
CREATE INDEX IF NOT EXISTS "MerchantReferral_merchantAccountId_createdAt_idx" ON "MerchantReferral"("merchantAccountId", "createdAt");
CREATE INDEX IF NOT EXISTS "MerchantReferral_storeId_createdAt_idx" ON "MerchantReferral"("storeId", "createdAt");
CREATE INDEX IF NOT EXISTS "MerchantReferral_status_createdAt_idx" ON "MerchantReferral"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "MerchantReferral_scene_idx" ON "MerchantReferral"("scene");
