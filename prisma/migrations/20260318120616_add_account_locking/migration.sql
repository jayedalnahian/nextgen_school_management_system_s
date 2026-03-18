-- AlterTable
ALTER TABLE "user" ADD COLUMN     "lockUntil" TIMESTAMP(3),
ADD COLUMN     "loginAttempts" INTEGER NOT NULL DEFAULT 0;
