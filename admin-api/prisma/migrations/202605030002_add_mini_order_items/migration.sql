CREATE TABLE IF NOT EXISTS "MiniOrderItem" (
  "id" SERIAL PRIMARY KEY,
  "orderId" INTEGER NOT NULL,
  "productId" TEXT NOT NULL,
  "skuId" TEXT,
  "skuName" TEXT,
  "productName" TEXT NOT NULL,
  "productDesc" TEXT,
  "productCover" TEXT,
  "unitPrice" DOUBLE PRECISION NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "amount" DOUBLE PRECISION NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MiniOrderItem_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "MiniOrder"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "MiniOrderItem_orderId_idx" ON "MiniOrderItem"("orderId");
CREATE INDEX IF NOT EXISTS "MiniOrderItem_productId_idx" ON "MiniOrderItem"("productId");

INSERT INTO "MiniOrderItem" (
  "orderId",
  "productId",
  "skuId",
  "skuName",
  "productName",
  "productDesc",
  "productCover",
  "unitPrice",
  "quantity",
  "amount",
  "createdAt",
  "updatedAt"
)
SELECT
  "id",
  "productId",
  "skuId",
  "skuName",
  "productName",
  "productDesc",
  "productCover",
  "unitPrice",
  "quantity",
  "amount",
  "createdAt",
  "updatedAt"
FROM "MiniOrder"
WHERE NOT EXISTS (
  SELECT 1 FROM "MiniOrderItem" WHERE "MiniOrderItem"."orderId" = "MiniOrder"."id"
);
