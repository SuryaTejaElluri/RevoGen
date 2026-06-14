-- AlterTable
ALTER TABLE "assessment_attempts" ADD COLUMN     "userId" TEXT;

-- AlterTable
ALTER TABLE "coding_submissions" ADD COLUMN     "attemptId" TEXT;

-- CreateTable
CREATE TABLE "assessment_question_results" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "codingQuestionId" TEXT NOT NULL,
    "questionTitle" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "maxScore" INTEGER NOT NULL,
    "passedCases" INTEGER NOT NULL,
    "totalCases" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assessment_question_results_pkey" PRIMARY KEY ("id")
);
