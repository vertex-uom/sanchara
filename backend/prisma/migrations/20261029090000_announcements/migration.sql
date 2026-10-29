-- Announcements: platform-wide notices from the platform team to company
-- staff, delivered as system notifications by the notifications module.

-- CreateEnum
CREATE TYPE "announcement_type" AS ENUM ('FEATURE', 'MAINTENANCE', 'POLICY', 'REMINDER', 'URGENT');

-- CreateEnum
CREATE TYPE "announcement_audience" AS ENUM ('ALL_STAFF', 'OWNERS', 'MANAGERS', 'FRONT_DESK');

-- CreateTable
CREATE TABLE "announcements" (
    "id" UUID NOT NULL,
    "title" VARCHAR(80) NOT NULL,
    "message" VARCHAR(400) NOT NULL,
    "type" "announcement_type" NOT NULL,
    "audience" "announcement_audience" NOT NULL,
    "dismissible" BOOLEAN NOT NULL DEFAULT true,
    "starts_at" TIMESTAMPTZ(3) NOT NULL,
    "ends_at" TIMESTAMPTZ(3),
    "created_by_id" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "archived_at" TIMESTAMPTZ(3),
    "archived_by_id" UUID,
    "published_at" TIMESTAMPTZ(3),
    "withdrawn_at" TIMESTAMPTZ(3),

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "announcements_starts_at_idx" ON "announcements"("starts_at");

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "platform_admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_archived_by_id_fkey" FOREIGN KEY ("archived_by_id") REFERENCES "platform_admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Rules the Prisma schema can't express.
ALTER TABLE "announcements"
  ADD CONSTRAINT "announcements_title_check" CHECK (char_length(btrim("title")) BETWEEN 1 AND 80),
  ADD CONSTRAINT "announcements_message_check" CHECK (char_length(btrim("message")) BETWEEN 1 AND 400),
  ADD CONSTRAINT "announcements_window_check" CHECK ("ends_at" IS NULL OR "ends_at" > "starts_at"),
  -- Withdrawn only after it was published.
  ADD CONSTRAINT "announcements_withdrawn_check" CHECK ("withdrawn_at" IS NULL OR "published_at" IS NOT NULL);

-- The publisher's two queues: due to publish, and live (to withdraw when they
-- end or are archived). Both stay small, so these partial indexes stay tiny.
CREATE INDEX "announcements_to_publish_idx" ON "announcements"("starts_at") WHERE "published_at" IS NULL AND "archived_at" IS NULL;
CREATE INDEX "announcements_live_idx" ON "announcements"("ends_at") WHERE "published_at" IS NOT NULL AND "withdrawn_at" IS NULL;
