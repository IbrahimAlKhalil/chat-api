/*
  Warnings:

  - You are about to drop the column `text` on the `messages` table. All the data in the column will be lost.
  - Added the required column `message_type_id` to the `messages` table without a default value. This is not possible if the table is not empty.
  - Added the required column `metadata` to the `messages` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "messages_text_idx";

-- AlterTable
ALTER TABLE "messages" DROP COLUMN "text",
ADD COLUMN     "message_type_id" INTEGER NOT NULL,
ADD COLUMN     "metadata" JSONB NOT NULL;

-- CreateTable
CREATE TABLE "message_types" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "message_types_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_message_type_id_fkey" FOREIGN KEY ("message_type_id") REFERENCES "message_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;
