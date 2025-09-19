-- DropIndex
DROP INDEX "public"."TeamMembership_userId_teamId_key";

-- AlterTable
ALTER TABLE "public"."TeamMembership" ADD COLUMN     "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "leftAt" TIMESTAMP(3);
