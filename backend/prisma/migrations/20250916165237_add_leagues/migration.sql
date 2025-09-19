-- AlterTable
ALTER TABLE "public"."Team" ADD COLUMN     "leagueId" INTEGER;

-- CreateTable
CREATE TABLE "public"."League" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "prize" INTEGER NOT NULL,

    CONSTRAINT "League_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."Team" ADD CONSTRAINT "Team_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "public"."League"("id") ON DELETE SET NULL ON UPDATE CASCADE;
