ALTER TABLE "MiniStoreProduct" ADD COLUMN "detailTitle" TEXT NOT NULL DEFAULT '';
ALTER TABLE "MiniStoreProduct" ADD COLUMN "detailText" TEXT NOT NULL DEFAULT '';
ALTER TABLE "MiniStoreProduct" ADD COLUMN "detailItems" JSONB;
