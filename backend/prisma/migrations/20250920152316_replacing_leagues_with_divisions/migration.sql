/*
  Warnings:

  - The `status` column on the `Invite` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `leagueId` on the `Match` table. All the data in the column will be lost.
  - The `result` column on the `Match` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `MatchReport` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `leagueId` on the `Team` table. All the data in the column will be lost.
  - The `role` column on the `TeamMembership` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `leagueId` on the `Tournament` table. All the data in the column will be lost.
  - The `status` column on the `Tournament` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `TournamentRegistration` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `role` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `League` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[userId,teamId]` on the table `TeamMembership` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tournamentId,teamId]` on the table `TournamentRegistration` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `divisionId` to the `Tournament` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `format` on the `Tournament` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `type` on the `Tournament` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('player', 'admin');

-- CreateEnum
CREATE TYPE "public"."MembershipRole" AS ENUM ('player', 'captain');

-- CreateEnum
CREATE TYPE "public"."InviteStatus" AS ENUM ('pending', 'accepted', 'declined');

-- CreateEnum
CREATE TYPE "public"."MatchResult" AS ENUM ('teamA', 'teamB', 'draw');

-- CreateEnum
CREATE TYPE "public"."ReportStatus" AS ENUM ('pending', 'confirmed', 'rejected', 'finalized');

-- CreateEnum
CREATE TYPE "public"."TournamentType" AS ENUM ('fastcup', 'seasonal', 'playoff', 'showmatch');

-- CreateEnum
CREATE TYPE "public"."TournamentFormat" AS ENUM ('bo1', 'bo2', 'bo3', 'bo5');

-- CreateEnum
CREATE TYPE "public"."TournamentStatus" AS ENUM ('upcoming', 'ongoing', 'finished', 'cancelled');

-- CreateEnum
CREATE TYPE "public"."RegistrationStatus" AS ENUM ('registered', 'waitlisted', 'withdrawn', 'rejected');

-- DropForeignKey
ALTER TABLE "public"."Complaint" DROP CONSTRAINT "Complaint_matchId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Complaint" DROP CONSTRAINT "Complaint_tournamentId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Complaint" DROP CONSTRAINT "Complaint_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."DiscussionComment" DROP CONSTRAINT "DiscussionComment_postId_fkey";

-- DropForeignKey
ALTER TABLE "public"."DiscussionComment" DROP CONSTRAINT "DiscussionComment_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."DiscussionPost" DROP CONSTRAINT "DiscussionPost_tournamentId_fkey";

-- DropForeignKey
ALTER TABLE "public"."DiscussionPost" DROP CONSTRAINT "DiscussionPost_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Invite" DROP CONSTRAINT "Invite_teamId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Invite" DROP CONSTRAINT "Invite_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Match" DROP CONSTRAINT "Match_leagueId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Match" DROP CONSTRAINT "Match_tournamentId_fkey";

-- DropForeignKey
ALTER TABLE "public"."MatchReport" DROP CONSTRAINT "MatchReport_matchId_fkey";

-- DropForeignKey
ALTER TABLE "public"."MatchReport" DROP CONSTRAINT "MatchReport_reporterId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Team" DROP CONSTRAINT "Team_leagueId_fkey";

-- DropForeignKey
ALTER TABLE "public"."TeamMembership" DROP CONSTRAINT "TeamMembership_teamId_fkey";

-- DropForeignKey
ALTER TABLE "public"."TeamMembership" DROP CONSTRAINT "TeamMembership_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."TeamStats" DROP CONSTRAINT "TeamStats_teamId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Tournament" DROP CONSTRAINT "Tournament_leagueId_fkey";

-- DropForeignKey
ALTER TABLE "public"."TournamentRegistration" DROP CONSTRAINT "TournamentRegistration_teamId_fkey";

-- DropForeignKey
ALTER TABLE "public"."TournamentRegistration" DROP CONSTRAINT "TournamentRegistration_tournamentId_fkey";

-- AlterTable
ALTER TABLE "public"."Invite" DROP COLUMN "status",
ADD COLUMN     "status" "public"."InviteStatus" NOT NULL DEFAULT 'pending';

-- AlterTable
ALTER TABLE "public"."Match" DROP COLUMN "leagueId",
ADD COLUMN     "divisionId" INTEGER,
DROP COLUMN "result",
ADD COLUMN     "result" "public"."MatchResult";

-- AlterTable
ALTER TABLE "public"."MatchReport" DROP COLUMN "status",
ADD COLUMN     "status" "public"."ReportStatus" NOT NULL DEFAULT 'pending';

-- AlterTable
ALTER TABLE "public"."Team" DROP COLUMN "leagueId",
ADD COLUMN     "divisionId" INTEGER;

-- AlterTable
ALTER TABLE "public"."TeamMembership" DROP COLUMN "role",
ADD COLUMN     "role" "public"."MembershipRole" NOT NULL DEFAULT 'player';

-- AlterTable
ALTER TABLE "public"."Tournament" DROP COLUMN "leagueId",
ADD COLUMN     "divisionId" INTEGER NOT NULL,
ADD COLUMN     "prize" INTEGER,
DROP COLUMN "format",
ADD COLUMN     "format" "public"."TournamentFormat" NOT NULL,
DROP COLUMN "type",
ADD COLUMN     "type" "public"."TournamentType" NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "public"."TournamentStatus" NOT NULL DEFAULT 'upcoming';

-- AlterTable
ALTER TABLE "public"."TournamentRegistration" DROP COLUMN "status",
ADD COLUMN     "status" "public"."RegistrationStatus" NOT NULL DEFAULT 'registered';

-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "role",
ADD COLUMN     "role" "public"."Role" NOT NULL DEFAULT 'player';

-- DropTable
DROP TABLE "public"."League";

-- CreateTable
CREATE TABLE "public"."Division" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "maxTeams" INTEGER,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Division_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Division_name_key" ON "public"."Division"("name");

-- CreateIndex
CREATE UNIQUE INDEX "TeamMembership_userId_teamId_key" ON "public"."TeamMembership"("userId", "teamId");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentRegistration_tournamentId_teamId_key" ON "public"."TournamentRegistration"("tournamentId", "teamId");

-- AddForeignKey
ALTER TABLE "public"."Team" ADD CONSTRAINT "Team_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "public"."Division"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TeamMembership" ADD CONSTRAINT "TeamMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TeamMembership" ADD CONSTRAINT "TeamMembership_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "public"."Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Invite" ADD CONSTRAINT "Invite_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "public"."Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Invite" ADD CONSTRAINT "Invite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Match" ADD CONSTRAINT "Match_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "public"."Division"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Match" ADD CONSTRAINT "Match_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "public"."Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MatchReport" ADD CONSTRAINT "MatchReport_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "public"."Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MatchReport" ADD CONSTRAINT "MatchReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TeamStats" ADD CONSTRAINT "TeamStats_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "public"."Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Tournament" ADD CONSTRAINT "Tournament_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "public"."Division"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TournamentRegistration" ADD CONSTRAINT "TournamentRegistration_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "public"."Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TournamentRegistration" ADD CONSTRAINT "TournamentRegistration_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "public"."Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Complaint" ADD CONSTRAINT "Complaint_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "public"."Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Complaint" ADD CONSTRAINT "Complaint_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "public"."Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Complaint" ADD CONSTRAINT "Complaint_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DiscussionPost" ADD CONSTRAINT "DiscussionPost_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "public"."Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DiscussionPost" ADD CONSTRAINT "DiscussionPost_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DiscussionComment" ADD CONSTRAINT "DiscussionComment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."DiscussionPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DiscussionComment" ADD CONSTRAINT "DiscussionComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
