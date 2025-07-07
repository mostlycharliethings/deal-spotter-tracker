
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { manufacturer, itemName, qualifier, subQualifier } = await req.json();

    const searchContext = [
      manufacturer,
      itemName,
      qualifier,
      subQualifier
    ].filter(Boolean).join(' ');

    const prompt = `Research and identify 5-8 specialized online sources where people buy, sell, or discuss "${searchContext}". Focus on:

1. Brand-specific forums and communities
2. Specialized marketplaces for this product category
3. Reddit communities (active subreddits only)
4. Discord servers with marketplace channels
5. Facebook groups dedicated to this brand/category
6. Specialized classified sites
7. Industry-specific forums

For each source, provide:
- Name: Clear name of the platform/community
- URL: Direct URL to the marketplace/for-sale section
- Type: forum, marketplace, social, or classified
- Reliability: high, medium, or low
- Notes: Brief description of what makes this source valuable

Avoid banned subreddits like r/forsale. Focus on currently active, legitimate sources where real transactions occur.

Respond in JSON format:
{
  "sources": [
    {
      "name": "source name",
      "url": "https://example.com/marketplace",
      "type": "marketplace",
      "reliability": "high",
      "notes": "description"
    }
  ]
}`;

    console.log('Requesting source discovery for:', searchContext);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a research assistant specialized in finding online marketplaces and communities for specific products. Always respond with valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1500,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${data.error?.message || 'Unknown error'}`);
    }

    const content = data.choices[0].message.content;
    console.log('Raw OpenAI response:', content);
    
    let parsedSources;
    try {
      parsedSources = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', parseError);
      // Fallback: try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedSources = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Could not extract valid JSON from OpenAI response');
      }
    }

    console.log('Discovered sources:', parsedSources);

    return new Response(JSON.stringify(parsedSources), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in discover-sources function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      sources: [] 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
