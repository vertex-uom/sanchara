-- CreateEnum
CREATE TYPE "contact_subject" AS ENUM ('GENERAL_INQUIRY', 'SUPPORT', 'SALES', 'FEEDBACK', 'OTHER');

-- CreateTable
CREATE TABLE "contact_messages" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "subject" "contact_subject" NOT NULL,
    "message" VARCHAR(2000) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "handled_at" TIMESTAMPTZ(3),
    "handled_by_id" UUID,

    CONSTRAINT "contact_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "contact_messages_created_at_idx" ON "contact_messages"("created_at");

-- AddForeignKey
ALTER TABLE "contact_messages" ADD CONSTRAINT "contact_messages_handled_by_id_fkey" FOREIGN KEY ("handled_by_id") REFERENCES "platform_admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Messages still waiting for the team, newest first.
CREATE INDEX "contact_messages_open_idx" ON "contact_messages" ("created_at" DESC) WHERE "handled_at" IS NULL;

ALTER TABLE "contact_messages"
  ADD CONSTRAINT "contact_messages_email_normalised_check" CHECK ("email" = lower(btrim("email")) AND "email" LIKE '%_@_%'),
  ADD CONSTRAINT "contact_messages_name_check" CHECK (char_length(btrim("name")) BETWEEN 1 AND 120),
  ADD CONSTRAINT "contact_messages_message_check" CHECK (char_length(btrim("message")) BETWEEN 10 AND 2000),
  ADD CONSTRAINT "contact_messages_handled_check" CHECK ("handled_by_id" IS NULL OR "handled_at" IS NOT NULL);
