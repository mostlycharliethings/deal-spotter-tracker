import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🧪 Testing scraper functionality...');
    
    // Test 1: Check if SCRAPER_API_KEY is configured
    const scraperApiKey = Deno.env.get("SCRAPER_API_KEY");
    console.log(`🔑 SCRAPER_API_KEY configured: ${scraperApiKey ? 'YES' : 'NO'}`);
    if (scraperApiKey) {
      console.log(`🔑 API Key length: ${scraperApiKey.length} characters`);
    }
    
    // Test 2: Check if OPENAI_API_KEY is configured
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    console.log(`🤖 OPENAI_API_KEY configured: ${openaiApiKey ? 'YES' : 'NO'}`);
    
    // Test 3: Test a simple ScraperAPI call
    if (scraperApiKey) {
      console.log('🌐 Testing ScraperAPI with a simple request...');
      
      const testUrl = 'https://httpbin.org/html';
      const scraperUrl = `http://api.scraperapi.com?api_key=${scraperApiKey}&url=${encodeURIComponent(testUrl)}&render=false`;
      
      const response = await fetch(scraperUrl, {
        method: 'GET',
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });
      
      console.log(`📊 ScraperAPI test response: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const html = await response.text();
        console.log(`✅ ScraperAPI working! Received ${html.length} characters`);
      } else {
        const errorText = await response.text();
        console.log(`❌ ScraperAPI error: ${errorText}`);
      }
    }
    
    // Test 4: Check Supabase connection
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? '',
      Deno.env.get("SUPABASE_ANON_KEY") ?? ''
    );
    
    const { data: searchConfigs, error } = await supabase
      .from('search_configs')
      .select('*')
      .eq('is_active', true)
      .limit(1);
    
    if (error) {
      console.log(`❌ Supabase error: ${error.message}`);
    } else {
      console.log(`✅ Supabase connection working! Found ${searchConfigs?.length || 0} active search configs`);
    }
    
    return new Response(JSON.stringify({
      success: true,
      message: "Scraper diagnostics complete - check function logs",
      scraperApiKeyConfigured: !!scraperApiKey,
      openaiApiKeyConfigured: !!openaiApiKey,
      supabaseConnected: !error
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
    
  } catch (error) {
    console.error('❌ Test error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});