CREATE TABLE IF NOT EXISTS "MiniAddress" (
  "id" SERIAL NOT NULL,
  "userId" INTEGER NOT NULL,
  "school" TEXT NOT NULL,
  "receiverName" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "detail" TEXT NOT NULL,
  "tag" TEXT NOT NULL,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MiniAddress_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "MiniAddress_userId_idx" ON "MiniAddress"("userId");
CREATE INDEX IF NOT EXISTS "MiniAddress_userId_isDefault_idx" ON "MiniAddress"("userId", "isDefault");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'MiniAddress_userId_fkey'
  ) THEN
    ALTER TABLE "MiniAddress"
    ADD CONSTRAINT "MiniAddress_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "MiniUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
