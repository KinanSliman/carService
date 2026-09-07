CREATE TYPE "public"."booking_status" AS ENUM('requested', 'confirmed', 'in_progress', 'completed', 'canceled');--> statement-breakpoint
CREATE TYPE "public"."delivery_mode" AS ENUM('at_center', 'mobile', 'pickup');--> statement-breakpoint
CREATE TYPE "public"."price_mode" AS ENUM('fixed', 'from', 'quote');--> statement-breakpoint
CREATE TABLE "maintenance_rules" (
	"id" serial PRIMARY KEY NOT NULL,
	"service_id" integer NOT NULL,
	"interval_km" integer,
	"interval_months" integer,
	"note_ar" text,
	"note_en" text
);
--> statement-breakpoint
CREATE TABLE "service_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"parent_id" integer,
	"slug" varchar(80) NOT NULL,
	"name_ar" text NOT NULL,
	"name_en" text NOT NULL,
	"blurb_ar" text,
	"blurb_en" text,
	"icon_key" varchar(40) NOT NULL,
	"hotspot_key" varchar(40),
	"sort" smallint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" serial PRIMARY KEY NOT NULL,
	"category_id" integer NOT NULL,
	"slug" varchar(80) NOT NULL,
	"name_ar" text NOT NULL,
	"name_en" text NOT NULL,
	"summary_ar" text NOT NULL,
	"summary_en" text NOT NULL,
	"price_mode" "price_mode" NOT NULL,
	"base_price" numeric(10, 2),
	"duration_min" integer NOT NULL,
	"delivery_modes" "delivery_mode"[] NOT NULL,
	"is_popular" boolean DEFAULT false NOT NULL,
	"sort" smallint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "symptom_options" (
	"id" serial PRIMARY KEY NOT NULL,
	"symptom_id" integer NOT NULL,
	"option_key" varchar(40) NOT NULL,
	"label_ar" text NOT NULL,
	"label_en" text NOT NULL,
	"verdict_ar" text NOT NULL,
	"verdict_en" text NOT NULL,
	"sort" smallint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "symptom_services" (
	"symptom_id" integer NOT NULL,
	"service_id" integer NOT NULL,
	"option_key" varchar(40),
	"rank" smallint DEFAULT 1 NOT NULL,
	CONSTRAINT "symptom_services_symptom_id_service_id_pk" PRIMARY KEY("symptom_id","service_id")
);
--> statement-breakpoint
CREATE TABLE "symptoms" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(80) NOT NULL,
	"label_ar" text NOT NULL,
	"label_en" text NOT NULL,
	"question_ar" text NOT NULL,
	"question_en" text NOT NULL,
	"icon_key" varchar(40) NOT NULL,
	"urgency" smallint DEFAULT 1 NOT NULL,
	"sort" smallint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vehicle_makes" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(60) NOT NULL,
	"name_ar" text NOT NULL,
	"name_en" text NOT NULL,
	"sort" smallint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vehicle_models" (
	"id" serial PRIMARY KEY NOT NULL,
	"make_id" integer NOT NULL,
	"slug" varchar(60) NOT NULL,
	"name_ar" text NOT NULL,
	"name_en" text NOT NULL,
	"year_from" smallint NOT NULL,
	"year_to" smallint
);
--> statement-breakpoint
CREATE TABLE "provider_hour_overrides" (
	"id" serial PRIMARY KEY NOT NULL,
	"provider_id" integer NOT NULL,
	"day" date NOT NULL,
	"opens_at" time,
	"closes_at" time,
	"is_closed" boolean DEFAULT false NOT NULL,
	"reason_ar" text,
	"reason_en" text
);
--> statement-breakpoint
CREATE TABLE "provider_hours" (
	"id" serial PRIMARY KEY NOT NULL,
	"provider_id" integer NOT NULL,
	"weekday" smallint NOT NULL,
	"opens_at" time,
	"closes_at" time,
	"break_start" time,
	"break_end" time,
	"is_closed" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "provider_services" (
	"provider_id" integer NOT NULL,
	"service_id" integer NOT NULL,
	"price" numeric(10, 2),
	"duration_min" integer NOT NULL,
	CONSTRAINT "provider_services_provider_id_service_id_pk" PRIMARY KEY("provider_id","service_id")
);
--> statement-breakpoint
CREATE TABLE "providers" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(80) NOT NULL,
	"name_ar" text NOT NULL,
	"name_en" text NOT NULL,
	"about_ar" text NOT NULL,
	"about_en" text NOT NULL,
	"logo_key" varchar(40) NOT NULL,
	"cover_hue" smallint DEFAULT 190 NOT NULL,
	"zone_ar" text NOT NULL,
	"zone_en" text NOT NULL,
	"zone_number" smallint,
	"street_ar" text,
	"street_en" text,
	"lat" numeric(9, 6) NOT NULL,
	"lng" numeric(9, 6) NOT NULL,
	"phone" varchar(20) NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"delivery_modes" "delivery_mode"[] NOT NULL,
	"rating_avg" numeric(3, 2) DEFAULT '0' NOT NULL,
	"rating_count" integer DEFAULT 0 NOT NULL,
	"bay_count" smallint DEFAULT 2 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"provider_id" integer NOT NULL,
	"rating" smallint NOT NULL,
	"author_name" text NOT NULL,
	"body_ar" text NOT NULL,
	"body_en" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "booking_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"booking_id" integer NOT NULL,
	"service_id" integer NOT NULL,
	"name_ar_snapshot" text NOT NULL,
	"name_en_snapshot" text NOT NULL,
	"price_snapshot" numeric(10, 2),
	"duration_min_snapshot" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(12) NOT NULL,
	"contact_name" text NOT NULL,
	"contact_phone" varchar(20) NOT NULL,
	"phone_last4" varchar(4) NOT NULL,
	"vehicle_label" text NOT NULL,
	"provider_id" integer NOT NULL,
	"mode" "delivery_mode" NOT NULL,
	"scheduled_at" timestamp with time zone NOT NULL,
	"duration_min" integer NOT NULL,
	"status" "booking_status" DEFAULT 'requested' NOT NULL,
	"subtotal" numeric(10, 2) NOT NULL,
	"callout_fee" numeric(10, 2) DEFAULT '0' NOT NULL,
	"total" numeric(10, 2) NOT NULL,
	"has_quote_items" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "banners" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(60) NOT NULL,
	"title_ar" text NOT NULL,
	"title_en" text NOT NULL,
	"subtitle_ar" text NOT NULL,
	"subtitle_en" text NOT NULL,
	"cta_ar" text NOT NULL,
	"cta_en" text NOT NULL,
	"href" text NOT NULL,
	"art_key" varchar(40) NOT NULL,
	"hue" smallint DEFAULT 190 NOT NULL,
	"sort" smallint DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
ALTER TABLE "maintenance_rules" ADD CONSTRAINT "maintenance_rules_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_category_id_service_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."service_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "symptom_options" ADD CONSTRAINT "symptom_options_symptom_id_symptoms_id_fk" FOREIGN KEY ("symptom_id") REFERENCES "public"."symptoms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "symptom_services" ADD CONSTRAINT "symptom_services_symptom_id_symptoms_id_fk" FOREIGN KEY ("symptom_id") REFERENCES "public"."symptoms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "symptom_services" ADD CONSTRAINT "symptom_services_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_models" ADD CONSTRAINT "vehicle_models_make_id_vehicle_makes_id_fk" FOREIGN KEY ("make_id") REFERENCES "public"."vehicle_makes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_hour_overrides" ADD CONSTRAINT "provider_hour_overrides_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_hours" ADD CONSTRAINT "provider_hours_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_services" ADD CONSTRAINT "provider_services_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_services" ADD CONSTRAINT "provider_services_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_items" ADD CONSTRAINT "booking_items_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_items" ADD CONSTRAINT "booking_items_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "maintenance_rules_service_idx" ON "maintenance_rules" USING btree ("service_id");--> statement-breakpoint
CREATE UNIQUE INDEX "service_categories_slug_idx" ON "service_categories" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "service_categories_parent_idx" ON "service_categories" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "service_categories_hotspot_idx" ON "service_categories" USING btree ("hotspot_key");--> statement-breakpoint
CREATE UNIQUE INDEX "services_slug_idx" ON "services" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "services_category_idx" ON "services" USING btree ("category_id");--> statement-breakpoint
CREATE UNIQUE INDEX "symptom_options_key_idx" ON "symptom_options" USING btree ("symptom_id","option_key");--> statement-breakpoint
CREATE INDEX "symptom_options_symptom_idx" ON "symptom_options" USING btree ("symptom_id");--> statement-breakpoint
CREATE INDEX "symptom_services_service_idx" ON "symptom_services" USING btree ("service_id");--> statement-breakpoint
CREATE UNIQUE INDEX "symptoms_slug_idx" ON "symptoms" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "vehicle_makes_slug_idx" ON "vehicle_makes" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "vehicle_models_slug_idx" ON "vehicle_models" USING btree ("make_id","slug");--> statement-breakpoint
CREATE INDEX "vehicle_models_make_idx" ON "vehicle_models" USING btree ("make_id");--> statement-breakpoint
CREATE UNIQUE INDEX "provider_hour_overrides_day_idx" ON "provider_hour_overrides" USING btree ("provider_id","day");--> statement-breakpoint
CREATE UNIQUE INDEX "provider_hours_day_idx" ON "provider_hours" USING btree ("provider_id","weekday");--> statement-breakpoint
CREATE INDEX "provider_services_service_idx" ON "provider_services" USING btree ("service_id");--> statement-breakpoint
CREATE UNIQUE INDEX "providers_slug_idx" ON "providers" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "providers_rating_idx" ON "providers" USING btree ("rating_avg");--> statement-breakpoint
CREATE INDEX "providers_zone_idx" ON "providers" USING btree ("zone_number");--> statement-breakpoint
CREATE INDEX "reviews_provider_idx" ON "reviews" USING btree ("provider_id","created_at");--> statement-breakpoint
CREATE INDEX "booking_items_booking_idx" ON "booking_items" USING btree ("booking_id");--> statement-breakpoint
CREATE UNIQUE INDEX "bookings_code_idx" ON "bookings" USING btree ("code");--> statement-breakpoint
CREATE INDEX "bookings_lookup_idx" ON "bookings" USING btree ("code","phone_last4");--> statement-breakpoint
CREATE INDEX "bookings_slot_idx" ON "bookings" USING btree ("provider_id","scheduled_at");--> statement-breakpoint
CREATE INDEX "bookings_created_idx" ON "bookings" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "banners_active_idx" ON "banners" USING btree ("is_active","sort");