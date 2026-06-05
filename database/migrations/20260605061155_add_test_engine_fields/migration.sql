/*
  Warnings:

  - You are about to alter the column `total_score` on the `attempts` table. The data in that column could be lost. The data in that column will be cast from `Decimal(6,2)` to `DoublePrecision`.
  - You are about to alter the column `physics_score` on the `attempts` table. The data in that column could be lost. The data in that column will be cast from `Decimal(5,2)` to `DoublePrecision`.
  - You are about to alter the column `chemistry_score` on the `attempts` table. The data in that column could be lost. The data in that column will be cast from `Decimal(5,2)` to `DoublePrecision`.
  - You are about to alter the column `maths_score` on the `attempts` table. The data in that column could be lost. The data in that column will be cast from `Decimal(5,2)` to `DoublePrecision`.
  - You are about to alter the column `percentile` on the `attempts` table. The data in that column could be lost. The data in that column will be cast from `Decimal(5,2)` to `DoublePrecision`.

*/
-- AlterTable
ALTER TABLE "attempts" ADD COLUMN     "time_remaining" INTEGER,
ALTER COLUMN "total_score" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "physics_score" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "chemistry_score" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "maths_score" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "percentile" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "tests" ADD COLUMN     "deleted_at" TIMESTAMP(3);
