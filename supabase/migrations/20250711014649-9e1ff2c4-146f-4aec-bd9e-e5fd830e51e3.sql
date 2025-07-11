-- Enable required extensions for cron jobs and HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create audit log table for scraping pipeline
CREATE TABLE IF NOT EXISTS public.scrape_activity_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    search_config_id UUID REFERENCES public.search_configs(id),
    stage TEXT NOT NULL, -- 'config_queued', 'variants_generated', 'source_scraped', 'listings_parsed', 'db_insert_attempted', 'completed', 'failed'
    message TEXT,
    data JSONB,
    error_details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.scrape_activity_log ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (can be restricted later)
CREATE POLICY "Allow all operations on scrape_activity_log" 
ON public.scrape_activity_log 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create the actual cron job for automated scraping (5 times daily)
SELECT cron.schedule(
    'automated-scraping-5x-daily',
    '0 2,10,14,18,22 * * *', -- 5 times daily: 2 AM, 10 AM, 2 PM, 6 PM, 10 PM UTC
    $$
    SELECT net.http_post(
        url := 'https://brlvephljobxfivqlope.supabase.co/functions/v1/automated-scraping',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJybHZlcGhsam9ieGZpdnFsb3BlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4Mjc4MTYsImV4cCI6MjA2NzQwMzgxNn0.w9o1ohRzYr75s3VRmwoQFPzf0NejH8Gvqg_4SvsAhYY"}'::jsonb,
        body := '{"trigger": "cron", "timestamp": "' || now() || '"}'::jsonb
    );
    $$
);