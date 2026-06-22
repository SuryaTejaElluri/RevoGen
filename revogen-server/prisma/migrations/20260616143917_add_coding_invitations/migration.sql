-- CreateTable
CREATE TABLE "CodingInvitation" (
    "id" TEXT NOT NULL,
    "codingTestId" TEXT NOT NULL,
    "candidateName" TEXT,
    "candidateEmail" TEXT NOT NULL,
    "userId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CodingInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CodingInvitation_codingTestId_candidateEmail_key" ON "CodingInvitation"("codingTestId", "candidateEmail");

-- AddForeignKey
ALTER TABLE "CodingInvitation" ADD CONSTRAINT "CodingInvitation_codingTestId_fkey" FOREIGN KEY ("codingTestId") REFERENCES "CodingTest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodingInvitation" ADD CONSTRAINT "CodingInvitation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
