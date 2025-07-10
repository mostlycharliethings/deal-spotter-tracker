-- Create tertiary_sources table for Tier 3 source logging
CREATE TABLE public.tertiary_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL UNIQUE,
  domain TEXT NOT NULL,
  first_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  times_used INTEGER DEFAULT 1,
  source_type TEXT, -- 'marketplace', 'forum', 'social', 'classified', 'unknown'
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create price_reference table for price estimation caching
CREATE TABLE public.price_reference (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  manufacturer TEXT NOT NULL,
  item_name TEXT NOT NULL,
  qualifier TEXT,
  year_start INTEGER,
  year_end INTEGER,
  low_price NUMERIC,
  average_price NUMERIC,
  high_price NUMERIC,
  sample_count INTEGER DEFAULT 0,
  source TEXT DEFAULT 'ebay',
  scraped_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(manufacturer, item_name, qualifier, year_start, year_end, source)
);

-- Enable Row Level Security
ALTER TABLE public.tertiary_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_reference ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all operations for now)
CREATE POLICY "Allow all operations on tertiary_sources" 
ON public.tertiary_sources 
FOR ALL 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow all operations on price_reference" 
ON public.price_reference 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create function to increment times_used for tertiary sources
CREATE OR REPLACE FUNCTION public.increment_times_used(url_param TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.tertiary_sources 
  SET times_used = times_used + 1, 
      last_seen_at = now(),
      updated_at = now()
  WHERE url = url_param;
END;
$$ LANGUAGE plpgsql;

-- Create function to log tertiary source if new
CREATE OR REPLACE FUNCTION public.log_tertiary_source_if_new(
  url_param TEXT,
  domain_param TEXT,
  source_type_param TEXT DEFAULT 'unknown'
)
RETURNS UUID AS $$
DECLARE
  source_id UUID;
BEGIN
  -- Try to insert new source, on conflict just update last_seen_at and increment times_used
  INSERT INTO public.tertiary_sources (url, domain, source_type, times_used)
  VALUES (url_param, domain_param, source_type_param, 1)
  ON CONFLICT (url) 
  DO UPDATE SET 
    last_seen_at = now(),
    times_used = tertiary_sources.times_used + 1,
    updated_at = now()
  RETURNING id INTO source_id;
  
  RETURN source_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to get or create price estimate
CREATE OR REPLACE FUNCTION public.get_cached_price_estimate(
  manufacturer_param TEXT,
  item_name_param TEXT,
  qualifier_param TEXT,
  year_start_param INTEGER
)
RETURNS TABLE(
  low_price NUMERIC,
  average_price NUMERIC,
  high_price NUMERIC,
  sample_count INTEGER,
  is_fresh BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pr.low_price,
    pr.average_price,
    pr.high_price,
    pr.sample_count,
    (pr.expires_at > now()) as is_fresh
  FROM public.price_reference pr
  WHERE pr.manufacturer = manufacturer_param
    AND pr.item_name = item_name_param
    AND (pr.qualifier = qualifier_param OR (pr.qualifier IS NULL AND qualifier_param IS NULL))
    AND pr.year_start = year_start_param
  ORDER BY pr.scraped_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_tertiary_sources_updated_at
  BEFORE UPDATE ON public.tertiary_sources
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_tertiary_sources_domain ON public.tertiary_sources(domain);
CREATE INDEX idx_tertiary_sources_url ON public.tertiary_sources(url);
CREATE INDEX idx_tertiary_sources_times_used ON public.tertiary_sources(times_used DESC);
CREATE INDEX idx_price_reference_lookup ON public.price_reference(manufacturer, item_name, qualifier, year_start);
CREATE INDEX idx_price_reference_expires_at ON public.price_reference(expires_at);