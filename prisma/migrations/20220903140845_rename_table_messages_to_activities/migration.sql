/*
  Warnings:

  - You are about to drop the column `message_id` on the `attachments` table. All the data in the column will be lost.
  - You are about to drop the `message_types` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `messages` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `activity_id` to the `attachments` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "activity_type" AS ENUM ('file', 'text', 'media', 'call', 'join', 'leave', 'other');

-- DropForeignKey
ALTER TABLE "attachments" DROP CONSTRAINT "attachments_message_id_fkey";

-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_conversation_id_fkey";

-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_message_type_id_fkey";

-- DropIndex
DROP INDEX "attachments_message_id_idx";

-- AlterTable
ALTER TABLE "attachments" DROP COLUMN "message_id",
ADD COLUMN     "activity_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "members" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true;

-- DropTable
DROP TABLE "message_types";

-- DropTable
DROP TABLE "messages";

-- CreateTable
CREATE TABLE "activities" (
    "id" SERIAL NOT NULL,
    "conversation_id" INTEGER NOT NULL,
    "member_id" INTEGER NOT NULL,
    "activity_type" "activity_type" NOT NULL,
    "metadata" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "activities_conversation_id_member_id_idx" ON "activities"("conversation_id", "member_id");

-- CreateIndex
CREATE INDEX "attachments_activity_id_idx" ON "attachments"("activity_id");

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
