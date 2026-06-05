/*
  Warnings:

  - You are about to drop the `TestAssignment` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "TestAssignment" DROP CONSTRAINT "TestAssignment_testId_fkey";

-- DropForeignKey
ALTER TABLE "TestAssignment" DROP CONSTRAINT "TestAssignment_userId_fkey";

-- DropTable
DROP TABLE "TestAssignment";

-- CreateTable
CREATE TABLE "TestInvitation" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "testId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TestInvitation_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TestInvitation" ADD CONSTRAINT "TestInvitation_testId_fkey" FOREIGN KEY ("testId") REFERENCES "Test"("id") ON DELETE CASCADE ON UPDATE CASCADE;
