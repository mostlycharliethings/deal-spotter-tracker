
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';
import { Resend } from "npm:resend@4.0.0";
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import React from 'npm:react@18.3.1';
import { DailyDigestEmail } from './_templates/daily-digest-email.tsx';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  email?: string; // Optional - for testing specific email
  date?: string;  // Optional - for testing specific date
}

const handler = async (req: Request): Promise<Response> => {
  console.log('Daily digest function called');

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check if RESEND_API_KEY is available
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error('RESEND_API_KEY environment variable is not set');
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const resend = new Resend(resendApiKey);
    console.log('Resend client initialized successfully');

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase environment variables not set');
      return new Response(
        JSON.stringify({ error: 'Database service not configured' }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log('Supabase client initialized successfully');

    const body: RequestBody = req.method === 'POST' ? await req.json() : {};
    const targetDate = body.date || new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    console.log('Processing daily digest for date:', targetDate);

    // Get all search configs with email addresses (or filter by specific email for testing)
    const searchQuery = supabase
      .from('search_configs')
      .select('*')
      .eq('is_active', true);
    
    if (body.email) {
      searchQuery.eq('email_address', body.email);
    }

    const { data: searchConfigs, error: searchError } = await searchQuery;

    if (searchError) {
      console.error('Error fetching search configs:', searchError);
      throw searchError;
    }

    if (!searchConfigs || searchConfigs.length === 0) {
      console.log('No active search configurations found');
      return new Response(JSON.stringify({ message: 'No active searches found' }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log(`Found ${searchConfigs.length} active search configs`);

    // Group configs by email address
    const configsByEmail = searchConfigs.reduce((acc, config) => {
      if (!acc[config.email_address]) {
        acc[config.email_address] = [];
      }
      acc[config.email_address].push(config);
      return acc;
    }, {} as Record<string, typeof searchConfigs>);

    const emailsSent = [];

    // Process each unique email address
    for (const [email, userConfigs] of Object.entries(configsByEmail)) {
      console.log(`Processing digest for ${email} with ${userConfigs.length} search configs`);

      // Get listings for yesterday for all user's search configs
      const searchIds = userConfigs.map(config => config.id);
      
      const { data: listings, error: listingsError } = await supabase
        .from('listings')
        .select('*')
        .in('search_id', searchIds)
        .gte('date_scraped', yesterday.toISOString())
        .eq('is_ignored', false)
        .order('date_scraped', { ascending: false });

      if (listingsError) {
        console.error('Error fetching listings:', listingsError);
        continue;
      }

      console.log(`Found ${listings?.length || 0} listings for ${email}`);

      // Group listings by search config
      const searchConfigsWithListings = userConfigs.map(config => ({
        ...config,
        listings: listings?.filter(listing => listing.search_id === config.id) || []
      })).filter(config => config.listings.length > 0); // Only include configs with listings

      const totalListings = listings?.length || 0;
      const goodDeals = listings?.filter(listing => listing.is_within_threshold).length || 0;

      // Skip sending email if no new listings (unless it's a test)
      if (totalListings === 0 && !body.email) {
        console.log(`No new listings for ${email}, skipping email`);
        continue;
      }

      console.log('Rendering email template...');
      
      // Render the email template
      const emailHtml = await renderAsync(
        React.createElement(DailyDigestEmail, {
          user_email: email,
          date: new Date(targetDate).toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          }),
          searchConfigs: searchConfigsWithListings,
          totalListings,
          goodDeals,
        })
      );

      console.log('Email template rendered successfully');

      // Send the email using a verified sender address
      console.log(`Sending email to ${email}...`);
      const emailResult = await resend.emails.send({
        from: 'Feed Me Haystacks <onboarding@resend.dev>',
        to: [email],
        subject: totalListings > 0 
          ? `🎯 Daily Digest: ${totalListings} new listings found${goodDeals > 0 ? ` (${goodDeals} good deals!)` : ''}`
          : '🔍 Daily Digest: Still monitoring your searches',
        html: emailHtml,
      });

      if (emailResult.error) {
        console.error(`Error sending email to ${email}:`, emailResult.error);
        throw new Error(`Failed to send email: ${emailResult.error.message}`);
      } else {
        console.log(`Successfully sent digest email to ${email}`);
        emailsSent.push(email);
      }
    }

    return new Response(JSON.stringify({ 
      message: `Daily digest processed successfully`,
      emailsSent: emailsSent.length,
      recipients: emailsSent
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error in send-daily-digest function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
