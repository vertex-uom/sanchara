-- CreateTable
CREATE TABLE "admin_external_identities" (
    "id" UUID NOT NULL,
    "admin_id" UUID NOT NULL,
    "provider" "identity_provider" NOT NULL,
    "subject" VARCHAR(255) NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_external_identities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "admin_external_identities_admin_id_idx" ON "admin_external_identities"("admin_id");

-- CreateIndex
CREATE UNIQUE INDEX "admin_external_identities_provider_subject_key" ON "admin_external_identities"("provider", "subject");

-- AddForeignKey
ALTER TABLE "admin_external_identities" ADD CONSTRAINT "admin_external_identities_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "platform_admins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Integrity the Prisma schema can't express (same as the staff and guest tables).
ALTER TABLE "admin_external_identities"
  ADD CONSTRAINT "admin_external_identities_subject_check" CHECK (char_length("subject") > 0);
