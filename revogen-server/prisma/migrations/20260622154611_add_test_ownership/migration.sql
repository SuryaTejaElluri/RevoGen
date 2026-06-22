/*
  Warnings:

  - You are about to drop the column `candidateName` on the `CodingAttempt` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "CodingAttempt" DROP COLUMN "candidateName",
ALTER COLUMN "status" SET DEFAULT 'IN_PROGRESS',
ALTER COLUMN "riskLevel" DROP NOT NULL,
ALTER COLUMN "riskScore" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Test" ADD COLUMN     "createdById" TEXT;

-- AddForeignKey
ALTER TABLE "Test" ADD CONSTRAINT "Test_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
