-- DropForeignKey
ALTER TABLE "public"."Match" DROP CONSTRAINT "Match_leagueId_fkey";

-- AddForeignKey
ALTER TABLE "public"."Match" ADD CONSTRAINT "Match_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "public"."League"("id") ON DELETE CASCADE ON UPDATE CASCADE;
