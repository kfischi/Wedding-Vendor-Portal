-- Add social media columns to vendors table (whatsapp, tiktok, youtube already in schema)
ALTER TABLE "vendors" ADD COLUMN IF NOT EXISTS "whatsapp" text;
ALTER TABLE "vendors" ADD COLUMN IF NOT EXISTS "tiktok" text;
ALTER TABLE "vendors" ADD COLUMN IF NOT EXISTS "youtube" text;

-- Create automation_channel enum
DO $$ BEGIN
  CREATE TYPE "public"."automation_channel" AS ENUM('n8n', 'waha', 'email', 'ai', 'cron');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Create automation_status enum
DO $$ BEGIN
  CREATE TYPE "public"."automation_status" AS ENUM('sent', 'failed', 'skipped', 'pending');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Create automation_logs table
CREATE TABLE IF NOT EXISTS "automation_logs" (
  "id" text PRIMARY KEY NOT NULL,
  "event" text NOT NULL,
  "channel" "automation_channel" NOT NULL,
  "status" "automation_status" DEFAULT 'sent' NOT NULL,
  "payload" jsonb,
  "response_code" integer,
  "duration_ms" integer,
  "error" text,
  "vendor_id" text REFERENCES "vendors"("id") ON DELETE SET NULL,
  "lead_id" text REFERENCES "leads"("id") ON DELETE SET NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "automation_logs_event_idx" ON "automation_logs" ("event");
CREATE INDEX IF NOT EXISTS "automation_logs_channel_idx" ON "automation_logs" ("channel");
CREATE INDEX IF NOT EXISTS "automation_logs_status_idx" ON "automation_logs" ("status");
CREATE INDEX IF NOT EXISTS "automation_logs_created_at_idx" ON "automation_logs" ("created_at");

-- Create blog_post_status enum
DO $$ BEGIN
  CREATE TYPE "public"."blog_post_status" AS ENUM('draft', 'published', 'archived');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Create blog_posts table
CREATE TABLE IF NOT EXISTS "blog_posts" (
  "id" text PRIMARY KEY NOT NULL,
  "slug" text NOT NULL UNIQUE,
  "title" text NOT NULL,
  "excerpt" text NOT NULL,
  "content" text NOT NULL,
  "cover_image" text,
  "author" text DEFAULT 'צוות WeddingPro' NOT NULL,
  "category" text DEFAULT 'general' NOT NULL,
  "tags" jsonb DEFAULT '[]' NOT NULL,
  "seo_title" text,
  "seo_description" text,
  "status" "blog_post_status" DEFAULT 'draft' NOT NULL,
  "is_ai_generated" boolean DEFAULT false NOT NULL,
  "published_at" timestamp,
  "view_count" integer DEFAULT 0 NOT NULL,
  "reading_time_minutes" integer,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "blog_posts_slug_idx" ON "blog_posts" ("slug");
CREATE INDEX IF NOT EXISTS "blog_posts_status_idx" ON "blog_posts" ("status");
CREATE INDEX IF NOT EXISTS "blog_posts_category_idx" ON "blog_posts" ("category");
CREATE INDEX IF NOT EXISTS "blog_posts_published_at_idx" ON "blog_posts" ("published_at");
