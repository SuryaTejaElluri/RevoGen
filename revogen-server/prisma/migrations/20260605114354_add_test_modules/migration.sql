/*
  Warnings:

  - You are about to drop the column `category` on the `Test` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Test" DROP COLUMN "category";

-- CreateTable
CREATE TABLE "TestModule" (
    "id" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "questionCount" INTEGER NOT NULL,
    "testId" TEXT NOT NULL,

    CONSTRAINT "TestModule_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TestModule" ADD CONSTRAINT "TestModule_testId_fkey" FOREIGN KEY ("testId") REFERENCES "Test"("id") ON DELETE CASCADE ON UPDATE CASCADE;
