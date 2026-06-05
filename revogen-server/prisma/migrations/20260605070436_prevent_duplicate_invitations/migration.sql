/*
  Warnings:

  - A unique constraint covering the columns `[email,testId]` on the table `TestInvitation` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "TestInvitation_email_testId_key" ON "TestInvitation"("email", "testId");
