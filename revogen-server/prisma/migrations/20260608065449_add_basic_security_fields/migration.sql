-- AlterTable
ALTER TABLE "Attempt" ADD COLUMN     "copyAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "rightClickAttempts" INTEGER NOT NULL DEFAULT 0;
