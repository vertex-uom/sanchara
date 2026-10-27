-- CreateEnum
CREATE TYPE "admin_status" AS ENUM ('ACTIVE', 'DISABLED');

-- CreateEnum
CREATE TYPE "subscription_status" AS ENUM ('PENDING', 'ACTIVE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "audit_actor_type" AS ENUM ('PLATFORM_ADMIN', 'STAFF', 'GUEST', 'SYSTEM');

-- AlterEnum
ALTER TYPE "company_status" ADD VALUE 'PENDING_SETUP';

-- AlterTable
ALTER TABLE "companies" ADD COLUMN     "created_by_id" UUID,
ADD COLUMN     "legal_name" VARCHAR(160),
ADD COLUMN     "registration_no" VARCHAR(40),
ADD COLUMN     "town" VARCHAR(80);

-- AlterTable
ALTER TABLE "staff" ADD COLUMN     "phone" VARCHAR(16);

-- CreateTable
CREATE TABLE "company_status_changes" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "from_status" "company_status",
    "to_status" "company_status" NOT NULL,
    "reason" VARCHAR(500),
    "changed_by_id" UUID,
    "changed_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_status_changes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provinces" (
    "id" SMALLINT NOT NULL,
    "name" VARCHAR(40) NOT NULL,

    CONSTRAINT "provinces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "districts" (
    "id" SMALLINT NOT NULL,
    "province_id" SMALLINT NOT NULL,
    "name" VARCHAR(40) NOT NULL,

    CONSTRAINT "districts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_types" (
    "id" SMALLINT NOT NULL,
    "code" VARCHAR(32) NOT NULL,
    "name" VARCHAR(60) NOT NULL,
    "sort_order" SMALLINT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "property_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plans" (
    "id" SMALLINT NOT NULL,
    "code" VARCHAR(32) NOT NULL,
    "name" VARCHAR(60) NOT NULL,
    "monthly_price_minor" INTEGER NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "sort_order" SMALLINT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_admins" (
    "id" UUID NOT NULL,
    "full_name" VARCHAR(120) NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "status" "admin_status" NOT NULL DEFAULT 'ACTIVE',
    "last_sign_in_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "platform_admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_password_credentials" (
    "admin_id" UUID NOT NULL,
    "hash" TEXT NOT NULL,
    "changed_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "admin_password_credentials_pkey" PRIMARY KEY ("admin_id")
);

-- CreateTable
CREATE TABLE "properties" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "property_type_id" SMALLINT NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "slug" VARCHAR(80) NOT NULL,
    "address_line1" VARCHAR(160) NOT NULL,
    "address_line2" VARCHAR(160),
    "city" VARCHAR(80) NOT NULL,
    "district_id" SMALLINT NOT NULL,
    "postal_code" CHAR(5),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "plan_id" SMALLINT NOT NULL,
    "status" "subscription_status" NOT NULL DEFAULT 'PENDING',
    "started_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_entries" (
    "id" UUID NOT NULL,
    "occurred_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actor_type" "audit_actor_type" NOT NULL,
    "actor_id" UUID,
    "company_id" UUID,
    "action" VARCHAR(64) NOT NULL,
    "entity_type" VARCHAR(40) NOT NULL,
    "entity_id" UUID NOT NULL,
    "details" JSONB,

    CONSTRAINT "audit_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "company_status_changes_company_id_changed_at_idx" ON "company_status_changes"("company_id", "changed_at");

-- CreateIndex
CREATE INDEX "company_status_changes_changed_by_id_idx" ON "company_status_changes"("changed_by_id");

-- CreateIndex
CREATE UNIQUE INDEX "provinces_name_key" ON "provinces"("name");

-- CreateIndex
CREATE UNIQUE INDEX "districts_name_key" ON "districts"("name");

-- CreateIndex
CREATE INDEX "districts_province_id_idx" ON "districts"("province_id");

-- CreateIndex
CREATE UNIQUE INDEX "property_types_code_key" ON "property_types"("code");

-- CreateIndex
CREATE UNIQUE INDEX "property_types_name_key" ON "property_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX "plans_code_key" ON "plans"("code");

-- CreateIndex
CREATE UNIQUE INDEX "plans_name_key" ON "plans"("name");

-- CreateIndex
CREATE UNIQUE INDEX "platform_admins_email_key" ON "platform_admins"("email");

-- CreateIndex
CREATE UNIQUE INDEX "properties_slug_key" ON "properties"("slug");

-- CreateIndex
CREATE INDEX "properties_company_id_idx" ON "properties"("company_id");

-- CreateIndex
CREATE INDEX "properties_property_type_id_idx" ON "properties"("property_type_id");

-- CreateIndex
CREATE INDEX "properties_district_id_idx" ON "properties"("district_id");

-- CreateIndex
CREATE INDEX "subscriptions_company_id_idx" ON "subscriptions"("company_id");

-- CreateIndex
CREATE INDEX "subscriptions_plan_id_idx" ON "subscriptions"("plan_id");

-- CreateIndex
CREATE INDEX "audit_entries_company_id_occurred_at_idx" ON "audit_entries"("company_id", "occurred_at");

-- CreateIndex
CREATE INDEX "audit_entries_entity_type_entity_id_idx" ON "audit_entries"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_entries_actor_type_actor_id_idx" ON "audit_entries"("actor_type", "actor_id");

-- CreateIndex
CREATE INDEX "companies_status_idx" ON "companies"("status");

-- CreateIndex
CREATE INDEX "companies_created_by_id_idx" ON "companies"("created_by_id");

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "platform_admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_status_changes" ADD CONSTRAINT "company_status_changes_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_status_changes" ADD CONSTRAINT "company_status_changes_changed_by_id_fkey" FOREIGN KEY ("changed_by_id") REFERENCES "platform_admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "districts" ADD CONSTRAINT "districts_province_id_fkey" FOREIGN KEY ("province_id") REFERENCES "provinces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_password_credentials" ADD CONSTRAINT "admin_password_credentials_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "platform_admins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_property_type_id_fkey" FOREIGN KEY ("property_type_id") REFERENCES "property_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_district_id_fkey" FOREIGN KEY ("district_id") REFERENCES "districts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- Integrity the Prisma schema can't express. The app normalises first; the
-- database refuses anything that slips through. PENDING_SETUP (added above)
-- is not used in this migration: a new enum value can't be used in the
-- transaction that adds it.

ALTER TABLE "companies"
  ADD CONSTRAINT "companies_legal_name_check" CHECK (char_length(btrim("legal_name")) BETWEEN 1 AND 160),
  ADD CONSTRAINT "companies_registration_no_check" CHECK (char_length(btrim("registration_no")) BETWEEN 1 AND 40),
  ADD CONSTRAINT "companies_town_check" CHECK (char_length(btrim("town")) BETWEEN 1 AND 80),
  -- Hosts the platform uses itself (see DomainsService).
  ADD CONSTRAINT "companies_subdomain_reserved_check" CHECK ("subdomain" NOT IN ('admin', 'backoffice', 'api', 'www'));

ALTER TABLE "company_status_changes"
  ADD CONSTRAINT "company_status_changes_transition_check" CHECK ("from_status" IS DISTINCT FROM "to_status"),
  ADD CONSTRAINT "company_status_changes_reason_check" CHECK (char_length(btrim("reason")) > 0);

ALTER TABLE "staff"
  ADD CONSTRAINT "staff_phone_e164_check" CHECK ("phone" ~ '^\+[1-9][0-9]{7,14}$');

-- Exactly one Owner per company.
CREATE UNIQUE INDEX "staff_one_owner_per_company_key" ON "staff"("company_id") WHERE "role" = 'OWNER';

ALTER TABLE "provinces"
  ADD CONSTRAINT "provinces_name_check" CHECK (char_length(btrim("name")) > 0);

ALTER TABLE "districts"
  ADD CONSTRAINT "districts_name_check" CHECK (char_length(btrim("name")) > 0);

ALTER TABLE "property_types"
  ADD CONSTRAINT "property_types_code_check" CHECK ("code" ~ '^[A-Z][A-Z0-9_]*$'),
  ADD CONSTRAINT "property_types_name_check" CHECK (char_length(btrim("name")) > 0);

ALTER TABLE "plans"
  ADD CONSTRAINT "plans_code_check" CHECK ("code" ~ '^[A-Z][A-Z0-9_]*$'),
  ADD CONSTRAINT "plans_name_check" CHECK (char_length(btrim("name")) > 0),
  ADD CONSTRAINT "plans_price_check" CHECK ("monthly_price_minor" >= 0),
  ADD CONSTRAINT "plans_currency_check" CHECK ("currency" ~ '^[A-Z]{3}$');

ALTER TABLE "platform_admins"
  ADD CONSTRAINT "platform_admins_email_normalised_check" CHECK ("email" = lower(btrim("email")) AND "email" LIKE '%_@_%'),
  ADD CONSTRAINT "platform_admins_full_name_check" CHECK (char_length(btrim("full_name")) BETWEEN 1 AND 120);

ALTER TABLE "properties"
  ADD CONSTRAINT "properties_name_check" CHECK (char_length(btrim("name")) BETWEEN 1 AND 120),
  ADD CONSTRAINT "properties_slug_check" CHECK ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  ADD CONSTRAINT "properties_address_line1_check" CHECK (char_length(btrim("address_line1")) BETWEEN 1 AND 160),
  ADD CONSTRAINT "properties_address_line2_check" CHECK (char_length(btrim("address_line2")) BETWEEN 1 AND 160),
  ADD CONSTRAINT "properties_city_check" CHECK (char_length(btrim("city")) BETWEEN 1 AND 80),
  ADD CONSTRAINT "properties_postal_code_check" CHECK ("postal_code" ~ '^[0-9]{5}$');

ALTER TABLE "subscriptions"
  ADD CONSTRAINT "subscriptions_period_check" CHECK ("ended_at" IS NULL OR "ended_at" >= "started_at");

-- At most one current (not ended) subscription per company.
CREATE UNIQUE INDEX "subscriptions_one_current_per_company_key" ON "subscriptions"("company_id") WHERE "ended_at" IS NULL;

ALTER TABLE "audit_entries"
  ADD CONSTRAINT "audit_entries_action_check" CHECK ("action" ~ '^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$'),
  ADD CONSTRAINT "audit_entries_entity_type_check" CHECK ("entity_type" ~ '^[a-z][a-z0-9_]*$'),
  ADD CONSTRAINT "audit_entries_actor_check" CHECK (("actor_type" = 'SYSTEM') = ("actor_id" IS NULL));

-- ---------------------------------------------------------------------------
-- Reference data.

INSERT INTO "provinces" ("id", "name") VALUES
  (1, 'Western'),
  (2, 'Central'),
  (3, 'Southern'),
  (4, 'Northern'),
  (5, 'Eastern'),
  (6, 'North Western'),
  (7, 'North Central'),
  (8, 'Uva'),
  (9, 'Sabaragamuwa');

INSERT INTO "districts" ("id", "province_id", "name") VALUES
  (1, 1, 'Colombo'),
  (2, 1, 'Gampaha'),
  (3, 1, 'Kalutara'),
  (4, 2, 'Kandy'),
  (5, 2, 'Matale'),
  (6, 2, 'Nuwara Eliya'),
  (7, 3, 'Galle'),
  (8, 3, 'Matara'),
  (9, 3, 'Hambantota'),
  (10, 4, 'Jaffna'),
  (11, 4, 'Kilinochchi'),
  (12, 4, 'Mannar'),
  (13, 4, 'Vavuniya'),
  (14, 4, 'Mullaitivu'),
  (15, 5, 'Batticaloa'),
  (16, 5, 'Ampara'),
  (17, 5, 'Trincomalee'),
  (18, 6, 'Kurunegala'),
  (19, 6, 'Puttalam'),
  (20, 7, 'Anuradhapura'),
  (21, 7, 'Polonnaruwa'),
  (22, 8, 'Badulla'),
  (23, 8, 'Monaragala'),
  (24, 9, 'Ratnapura'),
  (25, 9, 'Kegalle');

-- The types the platform-admin wizard offers today.
INSERT INTO "property_types" ("id", "code", "name", "sort_order") VALUES
  (1, 'GUEST_HOUSE', 'Guest House', 1),
  (2, 'VILLA', 'Villa', 2),
  (3, 'HOMESTAY', 'Homestay', 3),
  (4, 'BOUTIQUE_HOTEL', 'Boutique Hotel', 4),
  (5, 'RESORT', 'Resort', 5),
  (6, 'COTTAGE', 'Cottage', 6),
  (7, 'HOSTEL', 'Hostel', 7),
  (8, 'APARTMENT', 'Apartment', 8);

-- PLACEHOLDER prices (LKR, minor units) from the admin design: plan prices and
-- limits are an open decision. Change them in a later migration.
INSERT INTO "plans" ("id", "code", "name", "monthly_price_minor", "currency", "sort_order") VALUES
  (1, 'STARTER', 'Starter', 390000, 'LKR', 1),
  (2, 'STANDARD', 'Standard', 690000, 'LKR', 2),
  (3, 'PRO', 'Pro', 1090000, 'LKR', 3);
