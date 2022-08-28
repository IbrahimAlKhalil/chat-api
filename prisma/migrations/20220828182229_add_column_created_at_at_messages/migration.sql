/*
  Warnings:

  - Added the required column `created_at` to the `messages` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "created_at" TIMESTAMPTZ NOT NULL;
