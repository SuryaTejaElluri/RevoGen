-- AlterTable
ALTER TABLE "ResumeAnalysis" ADD COLUMN     "atsScore" INTEGER DEFAULT 0,
ADD COLUMN     "missingSkills" JSONB;
