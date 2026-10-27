-- Central directory: listing flags and a rating summary on properties, property
-- images, and guest reviews. The summary is kept by a trigger on reviews.

-- CreateEnum
CREATE TYPE "review_status" AS ENUM ('PUBLISHED', 'HIDDEN');

-- AlterTable
ALTER TABLE "properties" ADD COLUMN     "featured_rank" SMALLINT,
ADD COLUMN     "is_featured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_listed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "rating_avg" DECIMAL(3,2),
ADD COLUMN     "review_count" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "property_images" (
    "id" UUID NOT NULL,
    "property_id" UUID NOT NULL,
    "url" VARCHAR(500) NOT NULL,
    "alt_text" VARCHAR(200),
    "sort_order" SMALLINT NOT NULL,
    "is_cover" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "property_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" UUID NOT NULL,
    "property_id" UUID NOT NULL,
    "guest_id" UUID NOT NULL,
    "rating" SMALLINT NOT NULL,
    "comment" TEXT,
    "status" "review_status" NOT NULL DEFAULT 'PUBLISHED',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "property_images_property_id_sort_order_key" ON "property_images"("property_id", "sort_order");

-- CreateIndex
CREATE INDEX "reviews_property_id_created_at_idx" ON "reviews"("property_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "reviews_guest_id_idx" ON "reviews"("guest_id");

-- AddForeignKey
ALTER TABLE "property_images" ADD CONSTRAINT "property_images_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_guest_id_fkey" FOREIGN KEY ("guest_id") REFERENCES "guests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- Integrity the Prisma schema can't express.

ALTER TABLE "properties"
  ADD CONSTRAINT "properties_featured_rank_check" CHECK ("is_featured" = ("featured_rank" IS NOT NULL) AND ("featured_rank" IS NULL OR "featured_rank" > 0)),
  ADD CONSTRAINT "properties_rating_avg_check" CHECK ("rating_avg" BETWEEN 1 AND 5),
  ADD CONSTRAINT "properties_review_count_check" CHECK ("review_count" >= 0),
  ADD CONSTRAINT "properties_rating_summary_check" CHECK (("review_count" = 0) = ("rating_avg" IS NULL));

ALTER TABLE "property_images"
  ADD CONSTRAINT "property_images_url_check" CHECK ("url" ~ '^(/[^/]|https://)'),
  ADD CONSTRAINT "property_images_alt_text_check" CHECK (char_length(btrim("alt_text")) > 0),
  ADD CONSTRAINT "property_images_sort_order_check" CHECK ("sort_order" >= 0);

-- One cover photo per property.
CREATE UNIQUE INDEX "property_images_one_cover_per_property_key" ON "property_images"("property_id") WHERE "is_cover";

ALTER TABLE "reviews"
  ADD CONSTRAINT "reviews_rating_check" CHECK ("rating" BETWEEN 1 AND 5),
  ADD CONSTRAINT "reviews_comment_check" CHECK (char_length(btrim("comment")) BETWEEN 1 AND 5000);

-- Directory sorts, over listed properties only. Each ends in id so pages are stable.
CREATE INDEX "properties_directory_recommended_idx" ON "properties"("is_featured" DESC, "featured_rank", "rating_avg" DESC NULLS LAST, "review_count" DESC, "id") WHERE "is_listed";
CREATE INDEX "properties_directory_rating_idx" ON "properties"("rating_avg" DESC NULLS LAST, "review_count" DESC, "id") WHERE "is_listed";
CREATE INDEX "properties_directory_reviews_idx" ON "properties"("review_count" DESC, "rating_avg" DESC NULLS LAST, "id") WHERE "is_listed";

-- ---------------------------------------------------------------------------
-- Rating summary: properties.rating_avg and review_count are recomputed from
-- PUBLISHED reviews whenever reviews change, whoever writes them.

CREATE FUNCTION "refresh_property_ratings"(property_ids UUID[]) RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  -- Lock first, in id order (no deadlocks between parallel writers). In READ
  -- COMMITTED the next statement then takes a fresh snapshot, so it sees reviews
  -- committed by a writer we waited for and no update is lost.
  PERFORM 1 FROM "properties" WHERE "id" = ANY(property_ids) ORDER BY "id" FOR UPDATE;

  UPDATE "properties" p
  SET "rating_avg" = s.rating_avg, "review_count" = s.review_count
  FROM (
    SELECT ids.id, round(avg(r."rating"), 2) AS rating_avg, count(r."id")::int AS review_count
    FROM unnest(property_ids) AS ids(id)
    LEFT JOIN "reviews" r ON r."property_id" = ids.id AND r."status" = 'PUBLISHED'
    GROUP BY ids.id
  ) s
  WHERE p."id" = s.id;
END;
$$;

-- Statement-level, so a bulk insert refreshes each property once.
CREATE FUNCTION "reviews_refresh_property_ratings"() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM "refresh_property_ratings"(ARRAY(SELECT DISTINCT "property_id" FROM new_rows));
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM "refresh_property_ratings"(ARRAY(SELECT "property_id" FROM new_rows UNION SELECT "property_id" FROM old_rows));
  ELSE
    PERFORM "refresh_property_ratings"(ARRAY(SELECT DISTINCT "property_id" FROM old_rows));
  END IF;
  RETURN NULL;
END;
$$;

-- Transition tables allow one event per trigger, hence three.
CREATE TRIGGER "reviews_after_insert" AFTER INSERT ON "reviews"
  REFERENCING NEW TABLE AS new_rows
  FOR EACH STATEMENT EXECUTE FUNCTION "reviews_refresh_property_ratings"();

CREATE TRIGGER "reviews_after_update" AFTER UPDATE ON "reviews"
  REFERENCING OLD TABLE AS old_rows NEW TABLE AS new_rows
  FOR EACH STATEMENT EXECUTE FUNCTION "reviews_refresh_property_ratings"();

CREATE TRIGGER "reviews_after_delete" AFTER DELETE ON "reviews"
  REFERENCING OLD TABLE AS old_rows
  FOR EACH STATEMENT EXECUTE FUNCTION "reviews_refresh_property_ratings"();
