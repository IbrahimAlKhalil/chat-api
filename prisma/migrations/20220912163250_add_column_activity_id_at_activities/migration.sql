-- AlterTable
ALTER TABLE "activities" ADD COLUMN     "activity_id" INTEGER;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
