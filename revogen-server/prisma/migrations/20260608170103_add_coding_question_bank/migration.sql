/*
  Warnings:

  - You are about to drop the `CodeAnswer` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CodingQuestion` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CodingSubmission` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CodingTest` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CodingTestCase` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "CodingCategory" AS ENUM ('ARRAYS', 'STRINGS', 'LINKED_LIST', 'STACK', 'QUEUE', 'TREE', 'GRAPH', 'DP', 'GREEDY', 'BINARY_SEARCH', 'RECURSION', 'MATH');

-- DropForeignKey
ALTER TABLE "CodeAnswer" DROP CONSTRAINT "CodeAnswer_submissionId_fkey";

-- DropForeignKey
ALTER TABLE "CodingQuestion" DROP CONSTRAINT "CodingQuestion_codingTestId_fkey";

-- DropForeignKey
ALTER TABLE "CodingTestCase" DROP CONSTRAINT "CodingTestCase_codingQuestionId_fkey";

-- DropTable
DROP TABLE "CodeAnswer";

-- DropTable
DROP TABLE "CodingQuestion";

-- DropTable
DROP TABLE "CodingSubmission";

-- DropTable
DROP TABLE "CodingTest";

-- DropTable
DROP TABLE "CodingTestCase";

-- CreateTable
CREATE TABLE "coding_questions" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "constraints" TEXT NOT NULL,
    "inputFormat" TEXT NOT NULL,
    "outputFormat" TEXT NOT NULL,
    "difficulty" "Difficulty" NOT NULL,
    "category" "CodingCategory" NOT NULL,
    "starterCode" JSONB,
    "solutionCode" TEXT,
    "timeLimit" INTEGER NOT NULL DEFAULT 1000,
    "memoryLimit" INTEGER NOT NULL DEFAULT 256,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coding_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coding_test_cases" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "input" TEXT NOT NULL,
    "expectedOutput" TEXT NOT NULL,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coding_test_cases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "coding_questions_slug_key" ON "coding_questions"("slug");

-- AddForeignKey
ALTER TABLE "coding_test_cases" ADD CONSTRAINT "coding_test_cases_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "coding_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
