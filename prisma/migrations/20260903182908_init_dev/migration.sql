-- AlterTable
ALTER TABLE "users" ALTER COLUMN "courierApprovalStatus" DROP NOT NULL,
ALTER COLUMN "courierApprovalStatus" DROP DEFAULT;
