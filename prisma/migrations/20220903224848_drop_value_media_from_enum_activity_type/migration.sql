/*
  Warnings:

  - The values [media] on the enum `activity_type` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "activity_type_new" AS ENUM ('file', 'text', 'call', 'other');
ALTER TABLE "activities" ALTER COLUMN "activity_type" TYPE "activity_type_new" USING ("activity_type"::text::"activity_type_new");
ALTER TYPE "activity_type" RENAME TO "activity_type_old";
ALTER TYPE "activity_type_new" RENAME TO "activity_type";
DROP TYPE "activity_type_old";
COMMIT;
