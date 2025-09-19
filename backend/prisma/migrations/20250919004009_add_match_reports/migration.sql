-- CreateTable
CREATE TABLE "public"."MatchReport" (
    "id" SERIAL NOT NULL,
    "matchId" INTEGER NOT NULL,
    "reporterId" INTEGER NOT NULL,
    "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scoreA" INTEGER NOT NULL,
    "scoreB" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "confirmedBy" INTEGER,
    "finalizedBy" INTEGER,

    CONSTRAINT "MatchReport_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."MatchReport" ADD CONSTRAINT "MatchReport_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "public"."Match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MatchReport" ADD CONSTRAINT "MatchReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
