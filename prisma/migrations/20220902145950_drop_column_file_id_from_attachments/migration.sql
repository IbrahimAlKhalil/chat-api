/*
  Warnings:

  - The primary key for the `attachments` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `file_id` on the `attachments` table. All the data in the column will be lost.
  - Changed the type of `id` on the `attachments` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropIndex
DROP INDEX "attachments_file_id_idx";

-- AlterTable
ALTER TABLE "attachments" DROP CONSTRAINT "attachments_pkey",
DROP COLUMN "file_id",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "attachments_pkey" PRIMARY KEY ("id");
