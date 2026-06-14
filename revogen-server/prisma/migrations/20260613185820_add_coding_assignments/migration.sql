-- CreateTable
CREATE TABLE "coding_assignments" (
    "id" TEXT NOT NULL,
    "codingTestId" TEXT NOT NULL,
    "candidateName" TEXT NOT NULL,
    "candidateEmail" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attemptId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coding_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "coding_assignments_accessToken_key" ON "coding_assignments"("accessToken");

-- AddForeignKey
ALTER TABLE "coding_assignments" ADD CONSTRAINT "coding_assignments_codingTestId_fkey" FOREIGN KEY ("codingTestId") REFERENCES "coding_tests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
