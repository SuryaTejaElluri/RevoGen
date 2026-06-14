-- AlterTable
ALTER TABLE "coding_submissions" ADD COLUMN     "stdout" TEXT,
ADD COLUMN     "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "security_events" (
    "id" TEXT NOT NULL,
    "codingTestId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "security_events_pkey" PRIMARY KEY ("id")
);
