-- AlterTable
ALTER TABLE "plans" ADD COLUMN     "staff_limit" SMALLINT;

-- PLACEHOLDER limits (the Back Office showed the same): Starter 3, Standard 5, Pro unlimited.
UPDATE "plans" SET "staff_limit" = 3 WHERE "code" = 'STARTER';
UPDATE "plans" SET "staff_limit" = 5 WHERE "code" = 'STANDARD';

ALTER TABLE "plans" ADD CONSTRAINT "plans_staff_limit_check" CHECK ("staff_limit" IS NULL OR "staff_limit" >= 1);
