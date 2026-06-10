-- AlterTable
ALTER TABLE "coding_test_cases" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "coding_tests" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "duration" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coding_tests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coding_test_questions" (
    "id" TEXT NOT NULL,
    "codingTestId" TEXT NOT NULL,
    "codingQuestionId" TEXT NOT NULL,
    "marks" INTEGER NOT NULL DEFAULT 100,
    "orderNo" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "coding_test_questions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "coding_test_questions_codingTestId_codingQuestionId_key" ON "coding_test_questions"("codingTestId", "codingQuestionId");

-- AddForeignKey
ALTER TABLE "coding_test_questions" ADD CONSTRAINT "coding_test_questions_codingTestId_fkey" FOREIGN KEY ("codingTestId") REFERENCES "coding_tests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coding_test_questions" ADD CONSTRAINT "coding_test_questions_codingQuestionId_fkey" FOREIGN KEY ("codingQuestionId") REFERENCES "coding_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
