
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    console.log('Setting up automated scraping cron jobs');

    // Enable pg_cron extension
    const { error: cronError } = await supabase.rpc('exec_sql', {
      sql: 'CREATE EXTENSION IF NOT EXISTS pg_cron;'
    });

    if (cronError) {
      console.error('Error enabling pg_cron:', cronError);
    }

    // Enable pg_net extension  
    const { error: netError } = await supabase.rpc('exec_sql', {
      sql: 'CREATE EXTENSION IF NOT EXISTS pg_net;'
    });

    if (netError) {
      console.error('Error enabling pg_net:', netError);
    }

    // Remove any existing scraping cron jobs
    const { error: removeError } = await supabase.rpc('exec_sql', {
      sql: `SELECT cron.unschedule('automated-scraping-5x-daily');`
    });

    if (removeError) {
      console.log('No existing cron job to remove (this is normal)');
    }

    // Schedule automated scraping 5 times per day
    // Times: 6 AM, 10 AM, 2 PM, 6 PM, 10 PM Eastern (UTC: 10, 14, 18, 22, 2)
    const { error: scheduleError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT cron.schedule(
          'automated-scraping-5x-daily',
          '0 2,10,14,18,22 * * *',
          $$
          SELECT
            net.http_post(
              url:='${Deno.env.get("SUPABASE_URL")}/functions/v1/automated-scraping',
              headers:='{"Content-Type": "application/json", "Authorization": "Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}"}'::jsonb,
              body:='{"triggered_by": "cron", "timestamp": "' || now() || '"}'::jsonb
            ) as request_id;
          $$
        );
      `
    });

    if (scheduleError) {
      console.error('Error scheduling automated scraping cron job:', scheduleError);
      throw scheduleError;
    }

    console.log('Automated scraping cron job scheduled successfully');

    return new Response(
      JSON.stringify({ 
        message: "Automated scraping scheduled successfully",
        schedule: "5 times daily at 2 AM, 10 AM, 2 PM, 6 PM, and 10 PM UTC",
        timezone_note: "Times are in UTC. Add/subtract hours for your local timezone.",
        next_runs: [
          "2:00 AM UTC (10 PM ET previous day)",
          "10:00 AM UTC (6 AM ET)",
          "2:00 PM UTC (10 AM ET)", 
          "6:00 PM UTC (2 PM ET)",
          "10:00 PM UTC (6 PM ET)"
        ]
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error setting up automated scraping cron:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
