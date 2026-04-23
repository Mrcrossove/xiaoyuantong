ALTER TABLE "MiniPost"
ADD COLUMN "reviewNote" TEXT,
ADD COLUMN "reviewerId" INTEGER,
ADD COLUMN "reviewedAt" TIMESTAMP(3);

ALTER TABLE "MiniPost"
ADD CONSTRAINT "MiniPost_reviewerId_fkey"
FOREIGN KEY ("reviewerId") REFERENCES "AdminUser"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "MiniPost_school_status_idx" ON "MiniPost"("school", "status");
CREATE INDEX "MiniPost_reviewerId_idx" ON "MiniPost"("reviewerId");
