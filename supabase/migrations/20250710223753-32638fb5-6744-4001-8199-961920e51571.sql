-- Create tier2_sources table to store discovered sources
CREATE TABLE public.tier2_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('marketplace', 'forum', 'social', 'classified')),
  reliability TEXT NOT NULL CHECK (reliability IN ('high', 'medium', 'low')),
  category TEXT,
  notes TEXT,
  success_rate NUMERIC DEFAULT 0,
  total_searches INTEGER DEFAULT 0,
  total_listings_found INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create search_tier2_map table to track which sources were used for each search
CREATE TABLE public.search_tier2_map (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  search_id UUID NOT NULL REFERENCES public.search_configs(id) ON DELETE CASCADE,
  tier2_source_id UUID NOT NULL REFERENCES public.tier2_sources(id) ON DELETE CASCADE,
  was_successful BOOLEAN DEFAULT false,
  listings_found INTEGER DEFAULT 0,
  last_scraped_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(search_id, tier2_source_id)
);

-- Enable Row Level Security
ALTER TABLE public.tier2_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_tier2_map ENABLE ROW LEVEL SECURITY;

-- Create policies for tier2_sources (allow all operations for now)
CREATE POLICY "Allow all operations on tier2_sources" 
ON public.tier2_sources 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create policies for search_tier2_map (allow all operations for now)
CREATE POLICY "Allow all operations on search_tier2_map" 
ON public.search_tier2_map 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates on tier2_sources
CREATE TRIGGER update_tier2_sources_updated_at
  BEFORE UPDATE ON public.tier2_sources
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_tier2_sources_category ON public.tier2_sources(category);
CREATE INDEX idx_tier2_sources_type ON public.tier2_sources(type);
CREATE INDEX idx_tier2_sources_reliability ON public.tier2_sources(reliability);
CREATE INDEX idx_search_tier2_map_search_id ON public.search_tier2_map(search_id);
CREATE INDEX idx_search_tier2_map_tier2_source_id ON public.search_tier2_map(tier2_source_id);