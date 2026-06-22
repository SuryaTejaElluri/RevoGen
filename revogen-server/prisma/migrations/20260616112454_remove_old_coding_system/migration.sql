/*
  Warnings:

  - You are about to drop the `assessment_attempts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `assessment_question_results` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `coding_assignments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `coding_questions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `coding_submissions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `coding_test_cases` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `coding_test_questions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `coding_tests` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `security_events` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "assessment_attempts" DROP CONSTRAINT "assessment_attempts_codingTestId_fkey";

-- DropForeignKey
ALTER TABLE "coding_assignments" DROP CONSTRAINT "coding_assignments_codingTestId_fkey";

-- DropForeignKey
ALTER TABLE "coding_submissions" DROP CONSTRAINT "coding_submissions_codingQuestionId_fkey";

-- DropForeignKey
ALTER TABLE "coding_submissions" DROP CONSTRAINT "coding_submissions_userId_fkey";

-- DropForeignKey
ALTER TABLE "coding_test_cases" DROP CONSTRAINT "coding_test_cases_questionId_fkey";

-- DropForeignKey
ALTER TABLE "coding_test_questions" DROP CONSTRAINT "coding_test_questions_codingQuestionId_fkey";

-- DropForeignKey
ALTER TABLE "coding_test_questions" DROP CONSTRAINT "coding_test_questions_codingTestId_fkey";

-- DropForeignKey
ALTER TABLE "coding_tests" DROP CONSTRAINT "coding_tests_createdById_fkey";

-- DropTable
DROP TABLE "assessment_attempts";

-- DropTable
DROP TABLE "assessment_question_results";

-- DropTable
DROP TABLE "coding_assignments";

-- DropTable
DROP TABLE "coding_questions";

-- DropTable
DROP TABLE "coding_submissions";

-- DropTable
DROP TABLE "coding_test_cases";

-- DropTable
DROP TABLE "coding_test_questions";

-- DropTable
DROP TABLE "coding_tests";

-- DropTable
DROP TABLE "security_events";
