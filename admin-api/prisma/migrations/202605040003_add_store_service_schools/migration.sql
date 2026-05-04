CREATE TABLE "MiniStoreServiceSchool" (
  "id" SERIAL NOT NULL,
  "storeId" INTEGER NOT NULL,
  "school" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'enabled',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "MiniStoreServiceSchool_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MiniStoreServiceSchool_storeId_school_key" ON "MiniStoreServiceSchool"("storeId", "school");
CREATE INDEX "MiniStoreServiceSchool_school_status_idx" ON "MiniStoreServiceSchool"("school", "status");
CREATE INDEX "MiniStoreServiceSchool_storeId_status_idx" ON "MiniStoreServiceSchool"("storeId", "status");

ALTER TABLE "MiniStoreServiceSchool"
  ADD CONSTRAINT "MiniStoreServiceSchool_storeId_fkey"
  FOREIGN KEY ("storeId") REFERENCES "MiniStore"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "MiniStoreServiceSchool" ("storeId", "school", "status", "createdAt", "updatedAt")
SELECT "id", "school", 'enabled', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "MiniStore"
WHERE COALESCE(TRIM("school"), '') <> ''
ON CONFLICT ("storeId", "school") DO NOTHING;
