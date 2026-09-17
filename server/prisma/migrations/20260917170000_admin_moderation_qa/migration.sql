-- AlterTable
ALTER TABLE "ProductQuestion" ADD COLUMN "isApproved" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "ProductAnswer" ADD COLUMN "isApproved" BOOLEAN NOT NULL DEFAULT true;
