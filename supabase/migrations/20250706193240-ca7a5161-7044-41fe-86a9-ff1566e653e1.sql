
-- Create search_configs table
CREATE TABLE public.search_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT gen_random_uuid(),
  item_name TEXT NOT NULL,
  manufacturer TEXT NOT NULL,
  year_start INTEGER NOT NULL,
  year_end INTEGER NOT NULL,
  qualifier TEXT,
  sub_qualifier TEXT,
  price_threshold NUMERIC NOT NULL,
  slider_percent NUMERIC NOT NULL DEFAULT 50,
  max_price_allowed NUMERIC NOT NULL,
  email_address TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Create listings table
CREATE TABLE public.listings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  search_id UUID NOT NULL REFERENCES public.search_configs(id) ON DELETE CASCADE,
  source_name TEXT NOT NULL,
  source_url TEXT NOT NULL,
  source_listing_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  price_threshold NUMERIC NOT NULL,
  max_price_allowed NUMERIC NOT NULL,
  location TEXT,
  listing_age TEXT,
  contact_info TEXT,
  date_scraped TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_within_threshold BOOLEAN NOT NULL DEFAULT false,
  is_within_slider_range BOOLEAN NOT NULL DEFAULT false,
  is_above_slider BOOLEAN NOT NULL DEFAULT false,
  is_price_changed BOOLEAN NOT NULL DEFAULT false,
  is_description_changed BOOLEAN NOT NULL DEFAULT false,
  is_ignored BOOLEAN NOT NULL DEFAULT false,
  ignored_at TIMESTAMP WITH TIME ZONE,
  ignore_reason TEXT
);

-- Create unique constraint to prevent duplicate listings per search
ALTER TABLE public.listings 
ADD CONSTRAINT unique_search_source_listing 
UNIQUE (search_id, source_listing_id);

-- Create indexes for performance
CREATE INDEX idx_listings_search_id ON public.listings(search_id);
CREATE INDEX idx_listings_source_listing_id ON public.listings(source_listing_id);
CREATE INDEX idx_listings_is_ignored ON public.listings(is_ignored);
CREATE INDEX idx_listings_is_within_threshold ON public.listings(is_within_threshold);
CREATE INDEX idx_listings_date_scraped ON public.listings(date_scraped);

-- Enable Row Level Security (RLS) - for future multi-user support
ALTER TABLE public.search_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

-- Create policies for single user access (you can modify these later for multi-user)
CREATE POLICY "Allow all operations on search_configs" ON public.search_configs
FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on listings" ON public.listings
FOR ALL USING (true) WITH CHECK (true);
