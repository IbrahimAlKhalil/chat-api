/*
  Warnings:

  - Added the required column `created_at` to the `conversations` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "conversations" ADD COLUMN     "created_at" TIMESTAMPTZ NOT NULL;
