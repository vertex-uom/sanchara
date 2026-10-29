-- CreateEnum
CREATE TYPE "website_assistance_status" AS ENUM ('REQUESTED', 'IN_PROGRESS', 'REVIEW', 'PUBLISHED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "website_assistance_style" AS ENUM ('COASTAL', 'MODERN', 'LUXURY', 'COZY');

-- CreateEnum
CREATE TYPE "website_assistance_timing" AS ENUM ('ONE_WEEK', 'TWO_WEEKS', 'ONE_MONTH', 'NO_RUSH');

-- CreateEnum
CREATE TYPE "website_assistance_contact" AS ENUM ('WHATSAPP', 'PHONE', 'EMAIL');

-- CreateTable
CREATE TABLE "website_assistance_requests" (
    "id" UUID NOT NULL,
    "reference" VARCHAR(12) NOT NULL,
    "company_id" UUID NOT NULL,
    "property_id" UUID,
    "requested_by_id" UUID,
    "status" "website_assistance_status" NOT NULL DEFAULT 'REQUESTED',
    "contact_name" VARCHAR(80) NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "contact_method" "website_assistance_contact" NOT NULL,
    "goals" VARCHAR(40)[] DEFAULT ARRAY[]::VARCHAR(40)[],
    "style" "website_assistance_style" NOT NULL,
    "timing" "website_assistance_timing" NOT NULL,
    "notes" VARCHAR(600) NOT NULL DEFAULT '',
    "due_at" TIMESTAMPTZ(3),
    "assignee_id" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "closed_at" TIMESTAMPTZ(3),

    CONSTRAINT "website_assistance_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "website_assistance_notes" (
    "id" UUID NOT NULL,
    "request_id" UUID NOT NULL,
    "author_id" UUID,
    "text" VARCHAR(1000) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "website_assistance_notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "website_assistance_requests_reference_key" ON "website_assistance_requests"("reference");

-- CreateIndex
CREATE INDEX "website_assistance_requests_company_id_idx" ON "website_assistance_requests"("company_id");

-- CreateIndex
CREATE INDEX "website_assistance_requests_status_due_at_idx" ON "website_assistance_requests"("status", "due_at");

-- CreateIndex
CREATE INDEX "website_assistance_requests_assignee_id_idx" ON "website_assistance_requests"("assignee_id");

-- CreateIndex
CREATE INDEX "website_assistance_notes_request_id_created_at_idx" ON "website_assistance_notes"("request_id", "created_at");

-- AddForeignKey
ALTER TABLE "website_assistance_requests" ADD CONSTRAINT "website_assistance_requests_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "website_assistance_requests" ADD CONSTRAINT "website_assistance_requests_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "website_assistance_requests" ADD CONSTRAINT "website_assistance_requests_requested_by_id_fkey" FOREIGN KEY ("requested_by_id") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "website_assistance_requests" ADD CONSTRAINT "website_assistance_requests_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "platform_admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "website_assistance_notes" ADD CONSTRAINT "website_assistance_notes_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "website_assistance_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "website_assistance_notes" ADD CONSTRAINT "website_assistance_notes_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "platform_admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- One open request per company; a published or cancelled one frees the slot.
CREATE UNIQUE INDEX "website_assistance_requests_one_open_per_company"
  ON "website_assistance_requests" ("company_id")
  WHERE "status" IN ('REQUESTED', 'IN_PROGRESS', 'REVIEW');

-- The API validates the same rules; these keep the data sane whatever writes it.
ALTER TABLE "website_assistance_requests"
  ADD CONSTRAINT "website_assistance_requests_reference_check" CHECK ("reference" ~ '^WMX-[0-9]{5}$'),
  ADD CONSTRAINT "website_assistance_requests_contact_name_check" CHECK (char_length(btrim("contact_name")) BETWEEN 1 AND 80),
  ADD CONSTRAINT "website_assistance_requests_goals_not_null_check" CHECK ("goals" IS NOT NULL),
  ADD CONSTRAINT "website_assistance_requests_closed_check" CHECK (("status" IN ('PUBLISHED', 'CANCELLED')) = ("closed_at" IS NOT NULL));

ALTER TABLE "website_assistance_notes"
  ADD CONSTRAINT "website_assistance_notes_text_check" CHECK (char_length(btrim("text")) BETWEEN 1 AND 1000);
