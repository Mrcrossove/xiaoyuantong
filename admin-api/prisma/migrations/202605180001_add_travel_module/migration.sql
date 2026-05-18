CREATE TABLE "TravelProvider" (
  "id" SERIAL NOT NULL,
  "name" TEXT NOT NULL,
  "contactName" TEXT NOT NULL,
  "contactPhone" TEXT NOT NULL,
  "licenseNo" TEXT,
  "licenseImages" JSONB,
  "businessLicense" JSONB,
  "status" TEXT NOT NULL DEFAULT 'enabled',
  "remark" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TravelProvider_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TravelRoute" (
  "id" SERIAL NOT NULL,
  "providerId" INTEGER,
  "title" TEXT NOT NULL,
  "tripType" TEXT NOT NULL,
  "destination" TEXT NOT NULL,
  "cover" TEXT NOT NULL,
  "banners" JSONB NOT NULL,
  "highlights" JSONB NOT NULL,
  "itinerary" JSONB NOT NULL,
  "feeIncluded" TEXT NOT NULL,
  "feeExcluded" TEXT NOT NULL,
  "notice" TEXT NOT NULL,
  "refundRule" TEXT NOT NULL,
  "serviceSchools" JSONB NOT NULL,
  "status" TEXT NOT NULL,
  "sort" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TravelRoute_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TravelSchedule" (
  "id" SERIAL NOT NULL,
  "routeId" INTEGER NOT NULL,
  "departDate" TIMESTAMP(3) NOT NULL,
  "returnDate" TIMESTAMP(3),
  "gatherTime" TEXT NOT NULL,
  "gatherPlace" TEXT NOT NULL,
  "price" DOUBLE PRECISION NOT NULL,
  "minGroupSize" INTEGER NOT NULL,
  "maxGroupSize" INTEGER NOT NULL,
  "signupDeadline" TIMESTAMP(3) NOT NULL,
  "paymentDeadline" TIMESTAMP(3),
  "signupCount" INTEGER NOT NULL DEFAULT 0,
  "confirmedCount" INTEGER NOT NULL DEFAULT 0,
  "paidCount" INTEGER NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TravelSchedule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TravelBooking" (
  "id" SERIAL NOT NULL,
  "bookingNo" TEXT NOT NULL,
  "userId" INTEGER NOT NULL,
  "school" TEXT NOT NULL,
  "routeId" INTEGER NOT NULL,
  "scheduleId" INTEGER NOT NULL,
  "contactName" TEXT NOT NULL,
  "contactPhone" TEXT NOT NULL,
  "participantCount" INTEGER NOT NULL DEFAULT 1,
  "participants" JSONB,
  "emergencyName" TEXT,
  "emergencyPhone" TEXT,
  "remark" TEXT,
  "status" TEXT NOT NULL,
  "paymentStatus" TEXT NOT NULL DEFAULT 'unpaid',
  "orderId" INTEGER,
  "reviewedById" INTEGER,
  "reviewNote" TEXT,
  "notifiedAt" TIMESTAMP(3),
  "paidAt" TIMESTAMP(3),
  "canceledAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TravelBooking_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TravelOrder" (
  "id" SERIAL NOT NULL,
  "orderNo" TEXT NOT NULL,
  "bookingId" INTEGER NOT NULL,
  "userId" INTEGER NOT NULL,
  "school" TEXT NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "status" TEXT NOT NULL,
  "payStatus" TEXT NOT NULL,
  "paymentChannel" TEXT,
  "paymentMode" TEXT,
  "transactionId" TEXT,
  "paymentMeta" JSONB,
  "paidAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TravelOrder_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TravelBookingLog" (
  "id" SERIAL NOT NULL,
  "bookingId" INTEGER NOT NULL,
  "action" TEXT NOT NULL,
  "operatorId" INTEGER,
  "beforeData" JSONB,
  "afterData" JSONB,
  "remark" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TravelBookingLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TravelBooking_bookingNo_key" ON "TravelBooking"("bookingNo");
CREATE UNIQUE INDEX "TravelOrder_orderNo_key" ON "TravelOrder"("orderNo");
CREATE INDEX "TravelRoute_status_sort_idx" ON "TravelRoute"("status", "sort");
CREATE INDEX "TravelSchedule_routeId_status_idx" ON "TravelSchedule"("routeId", "status");
CREATE INDEX "TravelSchedule_departDate_idx" ON "TravelSchedule"("departDate");
CREATE INDEX "TravelBooking_userId_createdAt_idx" ON "TravelBooking"("userId", "createdAt");
CREATE INDEX "TravelBooking_school_status_idx" ON "TravelBooking"("school", "status");
CREATE INDEX "TravelBooking_scheduleId_status_idx" ON "TravelBooking"("scheduleId", "status");
CREATE INDEX "TravelOrder_bookingId_idx" ON "TravelOrder"("bookingId");
CREATE UNIQUE INDEX "TravelOrder_bookingId_active_key" ON "TravelOrder"("bookingId") WHERE "payStatus" IN ('pending', 'paid');
CREATE INDEX "TravelOrder_userId_createdAt_idx" ON "TravelOrder"("userId", "createdAt");
CREATE INDEX "TravelBookingLog_bookingId_createdAt_idx" ON "TravelBookingLog"("bookingId", "createdAt");

ALTER TABLE "TravelRoute"
  ADD CONSTRAINT "TravelRoute_providerId_fkey"
  FOREIGN KEY ("providerId") REFERENCES "TravelProvider"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "TravelSchedule"
  ADD CONSTRAINT "TravelSchedule_routeId_fkey"
  FOREIGN KEY ("routeId") REFERENCES "TravelRoute"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TravelBooking"
  ADD CONSTRAINT "TravelBooking_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "MiniUser"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TravelBooking"
  ADD CONSTRAINT "TravelBooking_routeId_fkey"
  FOREIGN KEY ("routeId") REFERENCES "TravelRoute"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TravelBooking"
  ADD CONSTRAINT "TravelBooking_scheduleId_fkey"
  FOREIGN KEY ("scheduleId") REFERENCES "TravelSchedule"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TravelBooking"
  ADD CONSTRAINT "TravelBooking_reviewedById_fkey"
  FOREIGN KEY ("reviewedById") REFERENCES "AdminUser"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "TravelOrder"
  ADD CONSTRAINT "TravelOrder_bookingId_fkey"
  FOREIGN KEY ("bookingId") REFERENCES "TravelBooking"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TravelOrder"
  ADD CONSTRAINT "TravelOrder_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "MiniUser"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TravelBookingLog"
  ADD CONSTRAINT "TravelBookingLog_bookingId_fkey"
  FOREIGN KEY ("bookingId") REFERENCES "TravelBooking"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TravelBookingLog"
  ADD CONSTRAINT "TravelBookingLog_operatorId_fkey"
  FOREIGN KEY ("operatorId") REFERENCES "AdminUser"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
