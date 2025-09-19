-- DropForeignKey
ALTER TABLE "public"."Match" DROP CONSTRAINT "Match_leagueId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Match" DROP CONSTRAINT "Match_teamBId_fkey";

-- AlterTable
ALTER TABLE "public"."Match" ALTER COLUMN "leagueId" DROP NOT NULL,
ALTER COLUMN "teamBId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Match" ADD CONSTRAINT "Match_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "public"."League"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Match" ADD CONSTRAINT "Match_teamBId_fkey" FOREIGN KEY ("teamBId") REFERENCES "public"."Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;
