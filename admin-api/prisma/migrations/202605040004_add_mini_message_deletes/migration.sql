CREATE TABLE "MiniMessageDelete" (
  "id" SERIAL NOT NULL,
  "messageId" INTEGER NOT NULL,
  "userId" INTEGER NOT NULL,
  "deletedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "MiniMessageDelete_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MiniMessageDelete_messageId_userId_key" ON "MiniMessageDelete"("messageId", "userId");
CREATE INDEX "MiniMessageDelete_userId_deletedAt_idx" ON "MiniMessageDelete"("userId", "deletedAt");

ALTER TABLE "MiniMessageDelete"
ADD CONSTRAINT "MiniMessageDelete_messageId_fkey"
FOREIGN KEY ("messageId") REFERENCES "MiniMessage"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "MiniMessageDelete"
ADD CONSTRAINT "MiniMessageDelete_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "MiniUser"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
