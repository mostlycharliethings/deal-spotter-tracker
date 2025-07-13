import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Edge Function started successfully');
    console.log('📋 Request method:', req.method);
    console.log('🔍 Request URL:', req.url);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    console.log('🔧 Supabase URL:', supabaseUrl);
    console.log('🔑 Supabase Key configured:', !!supabaseKey);
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body
    let requestBody = {};
    try {
      const text = await req.text();
      if (text) {
        requestBody = JSON.parse(text);
      }
    } catch (e) {
      console.log('📝 No JSON body or empty request');
    }

    console.log('📦 Request body:', requestBody);

    // Check database connectivity
    console.log('🗄️ Testing database connection...');
    const { data: testData, error: testError } = await supabase
      .from('search_configs')
      .select('id, manufacturer, item_name, is_active')
      .eq('is_active', true)
      .limit(5);

    if (testError) {
      console.error('❌ Database connection failed:', testError);
      return new Response(
        JSON.stringify({ 
          error: 'Database connection failed', 
          details: testError,
          timestamp: new Date().toISOString()
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Database connected successfully');
    console.log(`📊 Found ${testData?.length || 0} active search configs`);

    // Mock scraping result for testing
    const mockResult = {
      success: true,
      message: 'Edge Function is working correctly',
      database_connected: true,
      active_search_configs: testData?.length || 0,
      search_configs: testData,
      test_mode: true,
      timestamp: new Date().toISOString(),
      total_listings: 0,
      function_status: 'deployed_and_functional'
    };

    console.log('🎉 Function completed successfully');
    console.log('📤 Returning result:', mockResult);

    return new Response(
      JSON.stringify(mockResult),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('💥 Edge Function error:', error);
    console.error('📍 Error stack:', error.stack);
    
    return new Response(
      JSON.stringify({ 
        error: 'Edge Function internal error',
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});