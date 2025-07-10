-- Fix Function Search Path Mutable warnings by setting search_path for all functions
-- This prevents potential security issues from search_path manipulation

-- Update update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Update increment_times_used function
CREATE OR REPLACE FUNCTION public.increment_times_used(url_param text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  UPDATE public.tertiary_sources 
  SET times_used = times_used + 1, 
      last_seen_at = now(),
      updated_at = now()
  WHERE url = url_param;
END;
$function$;

-- Update log_tertiary_source_if_new function
CREATE OR REPLACE FUNCTION public.log_tertiary_source_if_new(url_param text, domain_param text, source_type_param text DEFAULT 'unknown'::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
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
$function$;

-- Update get_cached_price_estimate function
CREATE OR REPLACE FUNCTION public.get_cached_price_estimate(manufacturer_param text, item_name_param text, qualifier_param text, year_start_param integer)
 RETURNS TABLE(low_price numeric, average_price numeric, high_price numeric, sample_count integer, is_fresh boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
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
$function$;