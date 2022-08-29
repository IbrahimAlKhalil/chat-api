/*
  Warnings:

  - The primary key for the `mime_types` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `mime` on the `mime_types` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[mime_type]` on the table `mime_types` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `mime_type_id` on the `attachments` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `mime_type` to the `mime_types` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "attachments" DROP CONSTRAINT "attachments_mime_type_id_fkey";

-- AlterTable
ALTER TABLE "attachments" DROP COLUMN "mime_type_id",
ADD COLUMN     "mime_type_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "mime_types" DROP CONSTRAINT "mime_types_pkey",
DROP COLUMN "mime",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD COLUMN     "mime_type" TEXT NOT NULL,
ADD CONSTRAINT "mime_types_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE INDEX "attachments_mime_type_id_idx" ON "attachments"("mime_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "mime_types_mime_type_key" ON "mime_types"("mime_type");

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_mime_type_id_fkey" FOREIGN KEY ("mime_type_id") REFERENCES "mime_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
