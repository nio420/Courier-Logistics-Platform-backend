-- CreateEnum
CREATE TYPE "CourierApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "courierApprovalStatus" "CourierApprovalStatus" NOT NULL DEFAULT 'PENDING';
