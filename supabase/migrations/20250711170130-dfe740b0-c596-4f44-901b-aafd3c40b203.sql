-- Add tier, distance, and proximity bucket columns to listings table
ALTER TABLE public.listings ADD COLUMN tier TEXT;
ALTER TABLE public.listings ADD COLUMN distance_miles NUMERIC;
ALTER TABLE public.listings ADD COLUMN proximity_bucket TEXT;

-- Add geocoded location columns to search_configs for proximity calculations
ALTER TABLE public.search_configs ADD COLUMN user_latitude NUMERIC;
ALTER TABLE public.search_configs ADD COLUMN user_longitude NUMERIC;
ALTER TABLE public.search_configs ADD COLUMN geocoded_location TEXT;