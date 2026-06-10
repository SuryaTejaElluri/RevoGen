-- AlterTable
ALTER TABLE "ProctoringReport" ADD COLUMN     "faceMissingEvents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "focusLossEvents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "multipleFaceEvents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "noiseWarnings" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "possibleMultiMonitor" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "suspicionLevel" TEXT NOT NULL DEFAULT 'LOW';
