-- AlterTable
ALTER TABLE "plans" ADD COLUMN     "newsTradingAllowed" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "profitSplitLabel" TEXT NOT NULL DEFAULT 'Up to 90%',
ADD COLUMN     "profitTargetPhase2" DOUBLE PRECISION,
ADD COLUMN     "targetNote" TEXT;
