-- AlterTable
ALTER TABLE "public"."Team" ADD COLUMN     "banned" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "banned" BOOLEAN NOT NULL DEFAULT false;
