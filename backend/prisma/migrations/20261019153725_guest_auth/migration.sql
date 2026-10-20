-- CreateEnum
CREATE TYPE "guest_status" AS ENUM ('ACTIVE', 'DISABLED');

-- CreateEnum
CREATE TYPE "identity_provider" AS ENUM ('GOOGLE');

-- CreateTable
CREATE TABLE "guests" (
    "id" UUID NOT NULL,
    "full_name" VARCHAR(120) NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "mobile" VARCHAR(16),
    "status" "guest_status" NOT NULL DEFAULT 'ACTIVE',
    "email_verified_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "guests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_credentials" (
    "guest_id" UUID NOT NULL,
    "hash" TEXT NOT NULL,
    "changed_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "password_credentials_pkey" PRIMARY KEY ("guest_id")
);

-- CreateTable
CREATE TABLE "external_identities" (
    "id" UUID NOT NULL,
    "guest_id" UUID NOT NULL,
    "provider" "identity_provider" NOT NULL,
    "subject" VARCHAR(255) NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "external_identities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "guests_email_key" ON "guests"("email");

-- CreateIndex
CREATE INDEX "external_identities_guest_id_idx" ON "external_identities"("guest_id");

-- CreateIndex
CREATE UNIQUE INDEX "external_identities_provider_subject_key" ON "external_identities"("provider", "subject");

-- AddForeignKey
ALTER TABLE "password_credentials" ADD CONSTRAINT "password_credentials_guest_id_fkey" FOREIGN KEY ("guest_id") REFERENCES "guests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_identities" ADD CONSTRAINT "external_identities_guest_id_fkey" FOREIGN KEY ("guest_id") REFERENCES "guests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Integrity the Prisma schema can't express. The app normalises first; the
-- database refuses anything that slips through.
ALTER TABLE "guests"
  ADD CONSTRAINT "guests_email_normalised_check" CHECK ("email" = lower(btrim("email")) AND "email" LIKE '%_@_%'),
  ADD CONSTRAINT "guests_full_name_check" CHECK (char_length(btrim("full_name")) BETWEEN 1 AND 120),
  ADD CONSTRAINT "guests_mobile_e164_check" CHECK ("mobile" ~ '^\+[1-9][0-9]{7,14}$');

ALTER TABLE "external_identities"
  ADD CONSTRAINT "external_identities_subject_check" CHECK (char_length("subject") > 0);
