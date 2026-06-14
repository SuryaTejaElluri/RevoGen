-- CreateTable
CREATE TABLE "assessment_attempts" (
    "id" TEXT NOT NULL,
    "codingTestId" TEXT NOT NULL,
    "totalQuestions" INTEGER NOT NULL,
    "completedQuestions" INTEGER NOT NULL,
    "totalScore" INTEGER NOT NULL,
    "percentage" INTEGER NOT NULL,
    "securityViolations" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assessment_attempts_pkey" PRIMARY KEY ("id")
);
