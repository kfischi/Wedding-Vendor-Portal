-- Add enum values that were added to schema but never migrated to production DB
ALTER TYPE "public"."vendor_category" ADD VALUE IF NOT EXISTS 'wedding-dress-designers';
ALTER TYPE "public"."vendor_category" ADD VALUE IF NOT EXISTS 'bridal-preparation';
