/*
  Warnings:

  - Added the required column `last_read` to the `members` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "members" ADD COLUMN     "last_read" TIMESTAMPTZ NOT NULL;
