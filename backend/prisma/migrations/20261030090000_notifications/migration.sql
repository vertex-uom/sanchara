-- Notifications: system (in-app) notifications for company staff. One row per
-- notification with a recipient rule; per-staff read/dismiss state in receipts.

-- CreateEnum
CREATE TYPE "notification_severity" AS ENUM ('INFO', 'SUCCESS', 'WARNING', 'CRITICAL');

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "source_type" VARCHAR(40) NOT NULL,
    "source_id" UUID NOT NULL,
    "category" VARCHAR(20) NOT NULL,
    "severity" "notification_severity" NOT NULL,
    "title" VARCHAR(80) NOT NULL,
    "message" VARCHAR(400) NOT NULL,
    "action_label" VARCHAR(40),
    "action_href" VARCHAR(300),
    "roles" "staff_role"[],
    "company_statuses" "company_status"[],
    "company_id" UUID,
    "dismissible" BOOLEAN NOT NULL,
    "starts_at" TIMESTAMPTZ(3) NOT NULL,
    "ends_at" TIMESTAMPTZ(3),
    "withdrawn_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_receipts" (
    "notification_id" UUID NOT NULL,
    "staff_id" UUID NOT NULL,
    "read_at" TIMESTAMPTZ(3),
    "dismissed_at" TIMESTAMPTZ(3),

    CONSTRAINT "notification_receipts_pkey" PRIMARY KEY ("notification_id","staff_id")
);

-- CreateIndex
CREATE INDEX "notifications_company_id_idx" ON "notifications"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "notifications_source_type_source_id_key" ON "notifications"("source_type", "source_id");

-- CreateIndex
CREATE INDEX "notification_receipts_staff_id_idx" ON "notification_receipts"("staff_id");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_receipts" ADD CONSTRAINT "notification_receipts_notification_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "notifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_receipts" ADD CONSTRAINT "notification_receipts_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Rules the Prisma schema can't express.
ALTER TABLE "notifications"
  ADD CONSTRAINT "notifications_title_check" CHECK (char_length(btrim("title")) BETWEEN 1 AND 80),
  ADD CONSTRAINT "notifications_message_check" CHECK (char_length(btrim("message")) BETWEEN 1 AND 400),
  -- Someone must be able to receive it.
  ADD CONSTRAINT "notifications_roles_check" CHECK ("roles" IS NOT NULL AND cardinality("roles") > 0),
  ADD CONSTRAINT "notifications_company_statuses_check" CHECK ("company_statuses" IS NOT NULL AND cardinality("company_statuses") > 0),
  ADD CONSTRAINT "notifications_window_check" CHECK ("ends_at" IS NULL OR "ends_at" > "starts_at"),
  -- A link needs both its text and its target.
  ADD CONSTRAINT "notifications_action_check" CHECK (("action_label" IS NULL) = ("action_href" IS NULL));

-- A receipt exists only once something was recorded.
ALTER TABLE "notification_receipts"
  ADD CONSTRAINT "notification_receipts_state_check" CHECK ("read_at" IS NOT NULL OR "dismissed_at" IS NOT NULL);

-- The staff feed: live notifications, newest first.
CREATE INDEX "notifications_live_idx" ON "notifications"("starts_at" DESC) WHERE "withdrawn_at" IS NULL;
