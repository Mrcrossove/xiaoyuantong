-- CreateTable
CREATE TABLE "SchoolAdminApplication" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "school" TEXT NOT NULL,
    "teamSize" INTEGER NOT NULL,
    "contact" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "reviewNote" TEXT,
    "assignedAdminUserId" INTEGER,
    "reviewedById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchoolAdminApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SchoolAdminApplication_school_status_idx" ON "SchoolAdminApplication"("school", "status");

-- CreateIndex
CREATE INDEX "SchoolAdminApplication_userId_createdAt_idx" ON "SchoolAdminApplication"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "SchoolAdminApplication" ADD CONSTRAINT "SchoolAdminApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "MiniUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolAdminApplication" ADD CONSTRAINT "SchoolAdminApplication_assignedAdminUserId_fkey" FOREIGN KEY ("assignedAdminUserId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolAdminApplication" ADD CONSTRAINT "SchoolAdminApplication_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
