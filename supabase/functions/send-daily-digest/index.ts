
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendDigestRequest {
  email: string;
  isTest?: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    let emailAddresses: string[] = [];
    let isTestEmail = false;

    if (req.method === "POST") {
      // Manual test email
      const { email }: SendDigestRequest = await req.json();
      emailAddresses = [email];
      isTestEmail = true;
      console.log("Sending test email to:", email);
    } else {
      // Automated daily digest - get all unique email addresses from active searches
      const { data: searches, error } = await supabase
        .from('search_configs')
        .select('email_address')
        .eq('is_active', true);

      if (error) {
        throw new Error(`Failed to fetch search configs: ${error.message}`);
      }

      emailAddresses = [...new Set(searches?.map(s => s.email_address) || [])];
      console.log("Sending daily digest to:", emailAddresses.length, "recipients");
    }

    if (emailAddresses.length === 0) {
      return new Response(
        JSON.stringify({ message: "No email addresses to send to" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Fetch digest data
    const { data: searches } = await supabase
      .from('search_configs')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    const { data: listings } = await supabase
      .from('listings')
      .select('*')
      .eq('is_ignored', false)
      .order('date_scraped', { ascending: false })
      .limit(50);

    const activeSearches = searches || [];
    const recentListings = (listings || []).slice(0, 10);
    const goodDeals = (listings || []).filter(l => l.is_within_threshold);

    const formatPrice = (price: number) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(price);
    };

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    };

    // Generate HTML email content
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Feed Me Haystacks Daily Digest</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden;">
            <!-- Header -->
            <div style="background: linear-gradient(to right, #2563eb, #1d4ed8); color: white; padding: 24px;">
              <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: bold;">Feed Me Haystacks</h1>
              <p style="margin: 0; color: #bfdbfe;">Your Daily Digest - ${formatDate(new Date().toISOString())}</p>
            </div>

            <!-- Summary Stats -->
            <div style="padding: 24px; background-color: #f9fafb;">
              <h2 style="margin: 0 0 16px 0; font-size: 18px; color: #374151;">Daily Summary</h2>
              <div style="display: flex; justify-content: space-around; text-align: center;">
                <div>
                  <div style="font-size: 24px; font-weight: bold; color: #2563eb;">${activeSearches.length}</div>
                  <div style="font-size: 12px; color: #6b7280;">Active Searches</div>
                </div>
                <div>
                  <div style="font-size: 24px; font-weight: bold; color: #16a34a;">${goodDeals.length}</div>
                  <div style="font-size: 12px; color: #6b7280;">Good Deals</div>
                </div>
                <div>
                  <div style="font-size: 24px; font-weight: bold; color: #374151;">${recentListings.length}</div>
                  <div style="font-size: 12px; color: #6b7280;">New Listings</div>
                </div>
              </div>
            </div>

            ${goodDeals.length > 0 ? `
            <!-- Good Deals Section -->
            <div style="padding: 24px;">
              <h2 style="margin: 0 0 16px 0; font-size: 18px; color: #374151; display: flex; align-items: center;">
                🎉 Great Deals Found!
              </h2>
              ${goodDeals.slice(0, 3).map(listing => `
                <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                    <h3 style="margin: 0; font-size: 16px; color: #111827; line-height: 1.4;">${listing.title}</h3>
                    <span style="background-color: #dcfce7; color: #166534; padding: 4px 8px; border-radius: 4px; font-size: 14px; font-weight: 500; margin-left: 8px;">
                      ${formatPrice(listing.price)}
                    </span>
                  </div>
                  <div style="display: flex; gap: 16px; font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                    <span>${listing.source_name}</span>
                    ${listing.location ? `<span>${listing.location}</span>` : ''}
                    <span>${formatDate(listing.date_scraped)}</span>
                  </div>
                  <div style="font-size: 14px;">
                    <span style="color: #16a34a; font-weight: 500;">
                      ${formatPrice(listing.price_threshold - listing.price)} under your threshold!
                    </span>
                  </div>
                </div>
              `).join('')}
            </div>
            ` : ''}

            ${recentListings.length > 0 ? `
            <!-- Recent Listings -->
            <div style="padding: 24px; border-top: 1px solid #e5e7eb; background-color: #f9fafb;">
              <h2 style="margin: 0 0 16px 0; font-size: 18px; color: #374151;">Recent Listings</h2>
              ${recentListings.slice(0, 5).map(listing => `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background-color: white; border-radius: 8px; border: 1px solid #e5e7eb; margin-bottom: 12px;">
                  <div style="flex: 1;">
                    <h4 style="margin: 0 0 4px 0; font-size: 14px; color: #111827; font-weight: 500;">${listing.title}</h4>
                    <div style="display: flex; gap: 8px; font-size: 12px; color: #6b7280;">
                      <span>${listing.source_name}</span>
                      <span>•</span>
                      <span>${formatDate(listing.date_scraped)}</span>
                    </div>
                  </div>
                  <div style="text-align: right;">
                    <div style="font-weight: 600; color: #111827;">${formatPrice(listing.price)}</div>
                    ${listing.is_within_threshold ? '<div style="font-size: 12px; color: #16a34a;">Good Deal!</div>' : ''}
                  </div>
                </div>
              `).join('')}
            </div>
            ` : ''}

            ${activeSearches.length > 0 ? `
            <!-- Active Searches -->
            <div style="padding: 24px; border-top: 1px solid #e5e7eb;">
              <h2 style="margin: 0 0 16px 0; font-size: 18px; color: #374151;">Your Active Searches</h2>
              ${activeSearches.map(search => `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background-color: #f9fafb; border-radius: 8px; margin-bottom: 12px;">
                  <div>
                    <h4 style="margin: 0; font-size: 14px; color: #111827; font-weight: 500;">
                      ${search.year_start === search.year_end 
                        ? search.year_start 
                        : `${search.year_start}-${search.year_end}`} ${search.manufacturer} ${search.item_name}
                    </h4>
                    ${search.qualifier ? `<p style="margin: 4px 0 0 0; font-size: 12px; color: #6b7280;">${search.qualifier}</p>` : ''}
                  </div>
                  <div style="text-align: right; font-size: 12px;">
                    <div style="font-weight: 500; color: #111827;">≤ ${formatPrice(search.price_threshold)}</div>
                    <div style="color: #6b7280;">threshold</div>
                  </div>
                </div>
              `).join('')}
            </div>
            ` : ''}

            <!-- Footer -->
            <div style="padding: 24px; background-color: #f3f4f6; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #6b7280;">
                This digest was generated automatically by Feed Me Haystacks
              </p>
              <p style="margin: 0; font-size: 10px; color: #9ca3af;">
                Visit your dashboard to manage your searches and view all listings
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send emails
    const emailPromises = emailAddresses.map(async (email) => {
      return await resend.emails.send({
        from: "Feed Me Haystacks <onboarding@resend.dev>",
        to: [email],
        subject: isTestEmail 
          ? "Feed Me Haystacks - Daily Digest Preview" 
          : "Feed Me Haystacks - Your Daily Digest",
        html: emailHtml,
      });
    });

    const results = await Promise.allSettled(emailPromises);
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`Email sending complete: ${successful} successful, ${failed} failed`);

    return new Response(
      JSON.stringify({ 
        message: `Sent digest to ${successful} recipients${failed > 0 ? `, ${failed} failed` : ''}`,
        successful,
        failed
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error in send-daily-digest function:", error);
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
