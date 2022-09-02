/*
  Warnings:

  - You are about to drop the column `extenstion` on the `mime_types` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[extension]` on the table `mime_types` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `extension` to the `mime_types` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "mime_types_extenstion_key";

-- AlterTable
ALTER TABLE "mime_types" DROP COLUMN "extenstion",
ADD COLUMN     "extension" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "mime_types_extension_key" ON "mime_types"("extension");
