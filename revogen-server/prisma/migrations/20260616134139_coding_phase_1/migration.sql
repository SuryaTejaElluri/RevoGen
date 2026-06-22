-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "CodingDifficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "CodingSecurityLevel" AS ENUM ('BASIC', 'PRO');

-- CreateTable
CREATE TABLE "CodingTest" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "duration" INTEGER NOT NULL,
    "securityLevel" "CodingSecurityLevel" NOT NULL,
    "createdById" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CodingTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CodingQuestionBank" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "difficulty" "CodingDifficulty" NOT NULL,
    "description" TEXT NOT NULL,
    "inputFormat" TEXT,
    "outputFormat" TEXT,
    "constraints" TEXT,
    "examples" JSONB,
    "starterCodes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CodingQuestionBank_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CodingQuestionTestCase" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "input" TEXT NOT NULL,
    "expectedOutput" TEXT NOT NULL,
    "explanation" TEXT,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CodingQuestionTestCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CodingTestQuestion" (
    "id" TEXT NOT NULL,
    "codingTestId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "scoreWeight" INTEGER NOT NULL DEFAULT 100,

    CONSTRAINT "CodingTestQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CodingTestQuestion_codingTestId_questionId_key" ON "CodingTestQuestion"("codingTestId", "questionId");

-- AddForeignKey
ALTER TABLE "CodingTest" ADD CONSTRAINT "CodingTest_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodingQuestionTestCase" ADD CONSTRAINT "CodingQuestionTestCase_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "CodingQuestionBank"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodingTestQuestion" ADD CONSTRAINT "CodingTestQuestion_codingTestId_fkey" FOREIGN KEY ("codingTestId") REFERENCES "CodingTest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodingTestQuestion" ADD CONSTRAINT "CodingTestQuestion_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "CodingQuestionBank"("id") ON DELETE CASCADE ON UPDATE CASCADE;
