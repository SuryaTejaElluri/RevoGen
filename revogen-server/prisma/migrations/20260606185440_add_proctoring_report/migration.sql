-- CreateEnum
CREATE TYPE "SecurityLevel" AS ENUM ('BASIC', 'PRO');

-- AlterTable
ALTER TABLE "Test" ADD COLUMN     "securityLevel" "SecurityLevel" NOT NULL DEFAULT 'BASIC';

-- CreateTable
CREATE TABLE "ProctoringReport" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "cameraEnabled" BOOLEAN NOT NULL DEFAULT false,
    "microphoneEnabled" BOOLEAN NOT NULL DEFAULT false,
    "tabSwitches" INTEGER NOT NULL DEFAULT 0,
    "fullscreenViolations" INTEGER NOT NULL DEFAULT 0,
    "idleEvents" INTEGER NOT NULL DEFAULT 0,
    "resizeEvents" INTEGER NOT NULL DEFAULT 0,
    "riskScore" INTEGER NOT NULL DEFAULT 0,
    "securityScore" INTEGER NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProctoringReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProctoringReport_attemptId_key" ON "ProctoringReport"("attemptId");

-- AddForeignKey
ALTER TABLE "ProctoringReport" ADD CONSTRAINT "ProctoringReport_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "Attempt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
