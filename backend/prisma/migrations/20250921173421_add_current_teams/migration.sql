/*
  Warnings:

  - The values [bo1,bo2,bo3,bo5] on the enum `TournamentFormat` will be removed. If these variants are still used in the database, this will fail.
  - The `status` column on the `Complaint` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Made the column `maxTeams` on table `Division` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "public"."ComplaintStatus" AS ENUM ('open', 'resolved', 'dismissed');

-- AlterEnum
BEGIN;
CREATE TYPE "public"."TournamentFormat_new" AS ENUM ('single_elim', 'double_elim', 'swiss');
ALTER TABLE "public"."Tournament" ALTER COLUMN "format" TYPE "public"."TournamentFormat_new" USING ("format"::text::"public"."TournamentFormat_new");
ALTER TYPE "public"."TournamentFormat" RENAME TO "TournamentFormat_old";
ALTER TYPE "public"."TournamentFormat_new" RENAME TO "TournamentFormat";
DROP TYPE "public"."TournamentFormat_old";
COMMIT;

-- AlterTable
ALTER TABLE "public"."Complaint" DROP COLUMN "status",
ADD COLUMN     "status" "public"."ComplaintStatus" NOT NULL DEFAULT 'open';

-- AlterTable
ALTER TABLE "public"."Division" ALTER COLUMN "maxTeams" SET NOT NULL,
ALTER COLUMN "maxTeams" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."Match" ADD COLUMN     "scoreA" INTEGER,
ADD COLUMN     "scoreB" INTEGER;

-- AlterTable
ALTER TABLE "public"."Tournament" ADD COLUMN     "currentTeams" INTEGER NOT NULL DEFAULT 0;
