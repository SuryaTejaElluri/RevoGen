/*
  Warnings:

  - You are about to drop the column `candidateEmail` on the `assessment_attempts` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `assessment_attempts` table. All the data in the column will be lost.
  - Made the column `riskLevel` on table `assessment_attempts` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "assessment_attempts" DROP COLUMN "candidateEmail",
DROP COLUMN "userId",
ADD COLUMN     "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "riskLevel" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "assessment_attempts" ADD CONSTRAINT "assessment_attempts_codingTestId_fkey" FOREIGN KEY ("codingTestId") REFERENCES "coding_tests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
