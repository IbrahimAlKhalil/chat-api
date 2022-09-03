/*
  Warnings:

  - You are about to drop the column `member_id` on the `activities` table. All the data in the column will be lost.
  - You are about to drop the column `last_read` on the `members` table. All the data in the column will be lost.
  - Added the required column `user_id` to the `activities` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "activities_conversation_id_member_id_idx";

-- AlterTable
ALTER TABLE "activities" DROP COLUMN "member_id",
ADD COLUMN     "user_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "members" DROP COLUMN "last_read",
ADD COLUMN     "last_activity_seen_id" INTEGER;

-- CreateIndex
CREATE INDEX "activities_conversation_id_user_id_idx" ON "activities"("conversation_id", "user_id");

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_last_activity_seen_id_fkey" FOREIGN KEY ("last_activity_seen_id") REFERENCES "activities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_user_id_conversation_id_fkey" FOREIGN KEY ("user_id", "conversation_id") REFERENCES "members"("user_id", "conversation_id") ON DELETE CASCADE ON UPDATE CASCADE;
