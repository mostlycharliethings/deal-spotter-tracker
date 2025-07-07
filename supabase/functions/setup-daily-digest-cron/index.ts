
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

    // Schedule daily digest at 8 AM Eastern (12 PM UTC)
    const { error: scheduleError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT cron.schedule(
          'daily-digest-8am-eastern',
          '0 12 * * *',
          $$
          SELECT
            net.http_get(
              url:='${Deno.env.get("SUPABASE_URL")}/functions/v1/send-daily-digest',
              headers:='{"Authorization": "Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}"}'::jsonb
            ) as request_id;
          $$
        );
      `
    });

    if (scheduleError) {
      console.error('Error scheduling cron job:', scheduleError);
      throw scheduleError;
    }

    return new Response(
      JSON.stringify({ message: "Daily digest cron job scheduled successfully for 8 AM Eastern" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error setting up daily digest cron:", error);
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
