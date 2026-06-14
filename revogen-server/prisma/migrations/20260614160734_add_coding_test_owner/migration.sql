/*
  Warnings:

  - Added the required column `createdById` to the `coding_tests` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "coding_tests" ADD COLUMN     "createdById" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "coding_tests" ADD CONSTRAINT "coding_tests_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
