/*
  Warnings:

  - A unique constraint covering the columns `[trackKey,initialBalance]` on the table `plans` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `trackKey` to the `plans` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "PlanType" ADD VALUE 'BLITZ';

-- AlterTable
ALTER TABLE "plans" ADD COLUMN     "trackKey" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "plans_trackKey_initialBalance_key" ON "plans"("trackKey", "initialBalance");
