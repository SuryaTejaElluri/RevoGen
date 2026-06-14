-- AlterTable
ALTER TABLE "assessment_attempts" ADD COLUMN     "candidateEmail" TEXT,
ADD COLUMN     "riskLevel" TEXT DEFAULT 'LOW',
ADD COLUMN     "riskScore" INTEGER NOT NULL DEFAULT 0;

-- AddForeignKey
ALTER TABLE "coding_submissions" ADD CONSTRAINT "coding_submissions_codingQuestionId_fkey" FOREIGN KEY ("codingQuestionId") REFERENCES "coding_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
