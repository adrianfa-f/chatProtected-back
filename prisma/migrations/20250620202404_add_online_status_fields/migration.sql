-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lastSeen" TIMESTAMP(3),
ADD COLUMN     "online" BOOLEAN NOT NULL DEFAULT false;
