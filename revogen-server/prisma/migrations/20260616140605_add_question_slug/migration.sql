/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `CodingQuestionBank` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slug` to the `CodingQuestionBank` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CodingQuestionBank" ADD COLUMN     "slug" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "CodingQuestionBank_slug_key" ON "CodingQuestionBank"("slug");
