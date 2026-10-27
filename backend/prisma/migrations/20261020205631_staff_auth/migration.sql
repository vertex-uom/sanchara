-- CreateEnum
CREATE TYPE "company_status" AS ENUM ('ACTIVE', 'SUSPENDED_NON_PAYMENT', 'SUSPENDED_BY_ADMIN');

-- CreateEnum
CREATE TYPE "staff_role" AS ENUM ('OWNER', 'MANAGER', 'FRONT_DESK');

-- CreateEnum
CREATE TYPE "staff_status" AS ENUM ('INVITED', 'ACTIVE', 'INACTIVE');

-- CreateTable
CREATE TABLE "companies" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "subdomain" VARCHAR(63) NOT NULL,
    "status" "company_status" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "full_name" VARCHAR(120) NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "role" "staff_role" NOT NULL,
    "status" "staff_status" NOT NULL DEFAULT 'INVITED',
    "activated_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_password_credentials" (
    "staff_id" UUID NOT NULL,
    "hash" TEXT NOT NULL,
    "changed_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "staff_password_credentials_pkey" PRIMARY KEY ("staff_id")
);

-- CreateTable
CREATE TABLE "staff_external_identities" (
    "id" UUID NOT NULL,
    "staff_id" UUID NOT NULL,
    "provider" "identity_provider" NOT NULL,
    "subject" VARCHAR(255) NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staff_external_identities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "companies_subdomain_key" ON "companies"("subdomain");

-- CreateIndex
CREATE UNIQUE INDEX "staff_email_key" ON "staff"("email");

-- CreateIndex
CREATE INDEX "staff_company_id_idx" ON "staff"("company_id");

-- CreateIndex
CREATE INDEX "staff_external_identities_staff_id_idx" ON "staff_external_identities"("staff_id");

-- CreateIndex
CREATE UNIQUE INDEX "staff_external_identities_provider_subject_key" ON "staff_external_identities"("provider", "subject");

-- AddForeignKey
ALTER TABLE "staff" ADD CONSTRAINT "staff_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_password_credentials" ADD CONSTRAINT "staff_password_credentials_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_external_identities" ADD CONSTRAINT "staff_external_identities_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Integrity the Prisma schema can't express. The app normalises first; the
-- database refuses anything that slips through.
ALTER TABLE "companies"
  ADD CONSTRAINT "companies_name_check" CHECK (char_length(btrim("name")) BETWEEN 1 AND 120),
  ADD CONSTRAINT "companies_subdomain_check" CHECK ("subdomain" ~ '^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$');

ALTER TABLE "staff"
  ADD CONSTRAINT "staff_email_normalised_check" CHECK ("email" = lower(btrim("email")) AND "email" LIKE '%_@_%'),
  ADD CONSTRAINT "staff_full_name_check" CHECK (char_length(btrim("full_name")) BETWEEN 1 AND 120),
  -- An active account has accepted its invite.
  ADD CONSTRAINT "staff_activated_check" CHECK ("status" <> 'ACTIVE' OR "activated_at" IS NOT NULL);

ALTER TABLE "staff_external_identities"
  ADD CONSTRAINT "staff_external_identities_subject_check" CHECK (char_length("subject") > 0);
