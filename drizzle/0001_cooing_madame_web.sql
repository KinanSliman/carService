CREATE TYPE "public"."booking_source" AS ENUM('seed', 'public');--> statement-breakpoint
DROP INDEX "bookings_created_idx";--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "source" "booking_source" DEFAULT 'public' NOT NULL;--> statement-breakpoint
CREATE INDEX "bookings_cleanup_idx" ON "bookings" USING btree ("source","created_at");