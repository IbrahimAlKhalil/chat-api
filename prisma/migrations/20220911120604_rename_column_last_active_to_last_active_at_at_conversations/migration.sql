/*
  Warnings:

  - You are about to drop the column `last_active` on the `conversations` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "conversations" DROP COLUMN "last_active",
ADD COLUMN     "last_active_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;
