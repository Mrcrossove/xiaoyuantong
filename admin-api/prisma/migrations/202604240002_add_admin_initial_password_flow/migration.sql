ALTER TABLE "AdminUser"
ADD COLUMN "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "passwordUpdatedAt" TIMESTAMP(3),
ADD COLUMN "initialPasswordSentAt" TIMESTAMP(3);
