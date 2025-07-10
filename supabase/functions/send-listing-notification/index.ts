
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  to: string;
  subject: string;
  html: string;
  searchConfig: {
    id: string;
    manufacturer: string;
    itemName: string;
    qualifier?: string;
    subQualifier?: string;
  };
  listingsCount: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData: NotificationRequest = await req.json();
    console.log(`Sending listing notification to ${requestData.to} for ${requestData.listingsCount} new listings`);

    const emailResponse = await resend.emails.send({
      from: "FeedMe Haystacks <notifications@feedmehaystacks.com>",
      to: [requestData.to],
      subject: requestData.subject,
      html: requestData.html,
    });

    console.log("Email notification sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      emailId: emailResponse.data?.id,
      message: `Notification sent for ${requestData.listingsCount} new listings`
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("Error sending listing notification:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);
