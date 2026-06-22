-- CreateTable
CREATE TABLE "CodingAttempt" (
    "id" TEXT NOT NULL,
    "codingTestId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "candidateEmail" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "totalQuestions" INTEGER NOT NULL DEFAULT 0,
    "completedQuestions" INTEGER NOT NULL DEFAULT 0,
    "totalScore" INTEGER NOT NULL DEFAULT 0,
    "percentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CodingAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CodingSubmission" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "passedCases" INTEGER NOT NULL DEFAULT 0,
    "totalCases" INTEGER NOT NULL DEFAULT 0,
    "score" INTEGER NOT NULL DEFAULT 0,
    "submissionNumber" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CodingSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CodingSecurityEvent" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CodingSecurityEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CodingAttempt_codingTestId_userId_key" ON "CodingAttempt"("codingTestId", "userId");

-- AddForeignKey
ALTER TABLE "CodingAttempt" ADD CONSTRAINT "CodingAttempt_codingTestId_fkey" FOREIGN KEY ("codingTestId") REFERENCES "CodingTest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodingAttempt" ADD CONSTRAINT "CodingAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodingSubmission" ADD CONSTRAINT "CodingSubmission_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "CodingAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodingSubmission" ADD CONSTRAINT "CodingSubmission_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "CodingQuestionBank"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodingSecurityEvent" ADD CONSTRAINT "CodingSecurityEvent_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "CodingAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
