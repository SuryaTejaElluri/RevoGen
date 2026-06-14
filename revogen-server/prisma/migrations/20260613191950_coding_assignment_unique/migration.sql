/*
  Warnings:

  - A unique constraint covering the columns `[candidateEmail,codingTestId]` on the table `coding_assignments` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "coding_assignments_candidateEmail_codingTestId_key" ON "coding_assignments"("candidateEmail", "codingTestId");
