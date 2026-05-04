ALTER TABLE "MiniStore"
  ADD COLUMN IF NOT EXISTS "latitude" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "longitude" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "locationName" TEXT,
  ADD COLUMN IF NOT EXISTS "locationAddress" TEXT;

CREATE INDEX IF NOT EXISTS "MiniStore_school_location_idx"
  ON "MiniStore"("school", "latitude", "longitude");
