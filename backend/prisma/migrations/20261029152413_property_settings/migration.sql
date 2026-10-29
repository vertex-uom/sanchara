-- CreateEnum
CREATE TYPE "PropertyStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "PropertyCategory" AS ENUM ('BEACHFRONT', 'CITY', 'HILL_COUNTRY', 'WILDLIFE', 'LAKESIDE', 'HERITAGE', 'RURAL');

-- CreateEnum
CREATE TYPE "CancellationPolicy" AS ENUM ('FLEXIBLE', 'MODERATE', 'STRICT', 'NON_REFUNDABLE');

-- CreateEnum
CREATE TYPE "SmokingPolicy" AS ENUM ('NOT_ALLOWED', 'DESIGNATED_AREAS', 'ALLOWED');

-- AlterTable
ALTER TABLE "properties" ADD COLUMN     "airbnb_ical_url" VARCHAR(500),
ADD COLUMN     "amenities" VARCHAR(40)[] DEFAULT ARRAY[]::VARCHAR(40)[],
ADD COLUMN     "booking_com_ical_url" VARCHAR(500),
ADD COLUMN     "booking_window_days" SMALLINT NOT NULL DEFAULT 365,
ADD COLUMN     "cancellation_policy" "CancellationPolicy" NOT NULL DEFAULT 'MODERATE',
ADD COLUMN     "category" "PropertyCategory",
ADD COLUMN     "check_in_from" CHAR(5) NOT NULL DEFAULT '14:00',
ADD COLUMN     "check_in_until" CHAR(5),
ADD COLUMN     "check_out_by" CHAR(5) NOT NULL DEFAULT '11:00',
ADD COLUMN     "children_allowed" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "description" VARCHAR(250) NOT NULL DEFAULT '',
ADD COLUMN     "email" VARCHAR(254),
ADD COLUMN     "established_year" SMALLINT,
ADD COLUMN     "google_analytics_id" VARCHAR(20),
ADD COLUMN     "google_business_url" VARCHAR(500),
ADD COLUMN     "house_rules" VARCHAR(1000) NOT NULL DEFAULT '',
ADD COLUMN     "invoice_prefix" VARCHAR(6) NOT NULL DEFAULT 'INV',
ADD COLUMN     "map_url" VARCHAR(500),
ADD COLUMN     "meta_pixel_id" VARCHAR(20),
ADD COLUMN     "min_notice_hours" SMALLINT NOT NULL DEFAULT 0,
ADD COLUMN     "pets_allowed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "phone" VARCHAR(20),
ADD COLUMN     "settings_version" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "sltda_number" VARCHAR(30),
ADD COLUMN     "smoking_policy" "SmokingPolicy" NOT NULL DEFAULT 'NOT_ALLOWED',
ADD COLUMN     "star_rating" SMALLINT,
ADD COLUMN     "status" "PropertyStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "trip_advisor_url" VARCHAR(500),
ADD COLUMN     "vat_number" VARCHAR(14),
ADD COLUMN     "website_url" VARCHAR(500),
ADD COLUMN     "whatsapp" VARCHAR(20);

-- The API validates the same rules; these keep the data sane whatever writes it.
ALTER TABLE "properties"
  ADD CONSTRAINT "properties_amenities_not_null_check" CHECK ("amenities" IS NOT NULL),
  ADD CONSTRAINT "properties_star_rating_check" CHECK ("star_rating" BETWEEN 1 AND 5),
  ADD CONSTRAINT "properties_established_year_check" CHECK ("established_year" >= 1800),
  ADD CONSTRAINT "properties_times_check" CHECK (
    "check_in_from" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
    AND "check_out_by" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
    AND ("check_in_until" IS NULL OR "check_in_until" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$')
  ),
  ADD CONSTRAINT "properties_invoice_prefix_check" CHECK ("invoice_prefix" ~ '^[A-Z0-9]{2,6}$'),
  ADD CONSTRAINT "properties_booking_window_days_check" CHECK ("booking_window_days" BETWEEN 30 AND 730),
  ADD CONSTRAINT "properties_min_notice_hours_check" CHECK ("min_notice_hours" BETWEEN 0 AND 72),
  ADD CONSTRAINT "properties_settings_version_check" CHECK ("settings_version" >= 1);
