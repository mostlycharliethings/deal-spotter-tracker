
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SearchConfirmationRequest {
  email: string;
  manufacturer: string;
  itemName: string;
  yearStart: number;
  yearEnd: number;
  qualifier?: string;
  subQualifier?: string;
  priceThreshold: number;
  maxPrice: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      email,
      manufacturer,
      itemName,
      yearStart,
      yearEnd,
      qualifier,
      subQualifier,
      priceThreshold,
      maxPrice
    }: SearchConfirmationRequest = await req.json();

    const formatPrice = (price: number) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(price);
    };

    const sources = [
      "Facebook Marketplace",
      "Craigslist",
      "OfferUp", 
      "Mercari",
      "eBay",
      "Amazon",
      "Reverb (for music gear)",
      "B&H Photo (for cameras)",
      "Adorama (for cameras)"
    ];

    const searchDescription = `${yearStart === yearEnd ? yearStart : `${yearStart}-${yearEnd}`} ${manufacturer} ${itemName}${qualifier ? ` ${qualifier}` : ''}${subQualifier ? ` ${subQualifier}` : ''}`;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Search Confirmation - Feed Me Haystacks</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden;">
            <!-- Header -->
            <div style="background: linear-gradient(to right, #2563eb, #1d4ed8); color: white; padding: 24px; text-align: center;">
              <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: bold;">Feed Me Haystacks</h1>
              <p style="margin: 0; color: #bfdbfe;">Search Confirmation</p>
            </div>

            <!-- Main Content -->
            <div style="padding: 32px 24px;">
              <h2 style="margin: 0 0 16px 0; font-size: 20px; color: #111827;">Your Search is Now Active! 🎉</h2>
              
              <p style="margin: 0 0 24px 0; color: #374151; font-size: 16px;">
                We've successfully set up your price tracking search and will start monitoring multiple marketplaces immediately.
              </p>

              <!-- Search Details -->
              <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                <h3 style="margin: 0 0 16px 0; font-size: 16px; color: #111827; font-weight: 600;">Search Details</h3>
                <div style="space-y: 8px;">
                  <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="color: #6b7280; font-weight: 500;">Item:</span>
                    <span style="color: #111827; font-weight: 600;">${searchDescription}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="color: #6b7280; font-weight: 500;">Price Alert:</span>
                    <span style="color: #16a34a; font-weight: 600;">≤ ${formatPrice(priceThreshold)}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="color: #6b7280; font-weight: 500;">Max Price:</span>
                    <span style="color: #111827; font-weight: 600;">${formatPrice(maxPrice)}</span>
                  </div>
                </div>
              </div>

              <!-- How It Works -->
              <div style="margin-bottom: 24px;">
                <h3 style="margin: 0 0 16px 0; font-size: 16px; color: #111827; font-weight: 600;">How It Works</h3>
                <ul style="margin: 0; padding-left: 20px; color: #374151;">
                  <li style="margin-bottom: 8px;">We search across multiple marketplaces every few hours</li>
                  <li style="margin-bottom: 8px;">You'll get email alerts when we find items under your price threshold</li>
                  <li style="margin-bottom: 8px;">Visit your dashboard anytime to see all current listings</li>
                  <li style="margin-bottom: 8px;">You can pause or modify your search at any time</li>
                </ul>
              </div>

              <!-- Sources -->
              <div style="margin-bottom: 24px;">
                <h3 style="margin: 0 0 16px 0; font-size: 16px; color: #111827; font-weight: 600;">Sources We Monitor</h3>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;">
                  ${sources.map(source => `
                    <div style="background-color: #f3f4f6; padding: 8px 12px; border-radius: 6px; font-size: 14px; color: #374151;">
                      ${source}
                    </div>
                  `).join('')}
                </div>
              </div>

              <!-- Next Steps -->
              <div style="background-color: #dbeafe; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #1e40af; font-weight: 600;">What's Next?</h3>
                <p style="margin: 0; color: #1e40af;">
                  Check your dashboard in a few hours to see initial results. We'll email you immediately when we find great deals under ${formatPrice(priceThreshold)}!
                </p>
              </div>
            </div>

            <!-- Footer -->
            <div style="padding: 24px; background-color: #f3f4f6; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #6b7280;">
                This confirmation was sent from Feed Me Haystacks
              </p>
              <p style="margin: 0; font-size: 10px; color: #9ca3af;">
                Visit your dashboard to manage your searches or unsubscribe
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailResult = await resend.emails.send({
      from: "Feed Me Haystacks <cscheidebi@gmail.com>",
      to: [email],
      subject: `Search Confirmed: ${searchDescription}`,
      html: emailHtml,
    });

    console.log("Confirmation email sent successfully:", emailResult);

    return new Response(
      JSON.stringify({ 
        message: "Confirmation email sent successfully",
        emailId: emailResult.id
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error sending confirmation email:", error);
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
