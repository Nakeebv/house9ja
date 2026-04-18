-- Add images and features arrays to the properties table
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "images" TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "features" TEXT[] NOT NULL DEFAULT '{}';
