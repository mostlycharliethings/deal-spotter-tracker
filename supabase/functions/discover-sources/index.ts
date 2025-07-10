
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

    const prompt = `Find 5-8 specialized online sources where people buy, sell, or discuss "${searchContext}". Focus on active, legitimate platforms only.

Return ONLY a valid JSON object in this exact format:
{
  "sources": [
    {
      "name": "Platform Name",
      "url": "https://example.com/marketplace",
      "type": "marketplace",
      "reliability": "high",
      "notes": "Brief description"
    }
  ]
}

Requirements:
- Use real, active websites only
- Include direct links to marketplace/for-sale sections
- Types: marketplace, forum, social, classified
- Reliability: high, medium, low
- Focus on brand-specific forums, specialized marketplaces, active Reddit communities, Discord servers, Facebook groups
- Avoid fake domains like example.com, test.com, placeholder.com
- Return valid JSON only, no additional text`;

    console.log('Requesting source discovery for:', searchContext);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          {
            role: 'system',
            content: 'You are a research assistant that finds online marketplaces. Always respond with valid JSON only. Never include explanatory text outside the JSON structure.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 1000,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('OpenAI API error:', data);
      throw new Error(`OpenAI API error: ${data.error?.message || 'Unknown error'}`);
    }

    const content = data.choices[0].message.content.trim();
    console.log('Raw OpenAI response:', content);
    
    let parsedSources;
    
    try {
      // First attempt: direct JSON parsing
      parsedSources = JSON.parse(content);
    } catch (parseError) {
      console.log('Direct JSON parse failed, trying extraction methods...');
      
      try {
        // Second attempt: extract JSON from markdown code blocks
        const codeBlockMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
        if (codeBlockMatch) {
          console.log('Found JSON in code block');
          parsedSources = JSON.parse(codeBlockMatch[1]);
        } else {
          // Third attempt: find JSON object in text
          const jsonMatch = content.match(/\{[\s\S]*"sources"[\s\S]*\]/);
          if (jsonMatch) {
            console.log('Found JSON pattern in text');
            // Find the complete JSON object
            let braceCount = 0;
            let startIndex = content.indexOf('{');
            let endIndex = startIndex;
            
            for (let i = startIndex; i < content.length; i++) {
              if (content[i] === '{') braceCount++;
              if (content[i] === '}') braceCount--;
              if (braceCount === 0) {
                endIndex = i;
                break;
              }
            }
            
            const jsonStr = content.substring(startIndex, endIndex + 1);
            parsedSources = JSON.parse(jsonStr);
          } else {
            throw new Error('No valid JSON structure found in response');
          }
        }
      } catch (extractionError) {
        console.error('All JSON extraction methods failed:', extractionError);
        // Return empty sources instead of throwing error
        parsedSources = { sources: [] };
      }
    }

    // Validate the response structure
    if (!parsedSources || !Array.isArray(parsedSources.sources)) {
      console.warn('Invalid response structure, returning empty sources');
      parsedSources = { sources: [] };
    }

    console.log('Successfully parsed sources:', parsedSources);

    return new Response(JSON.stringify(parsedSources), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in discover-sources function:', error);
    
    // Return a valid response with empty sources instead of throwing
    return new Response(JSON.stringify({ 
      sources: [],
      error: `Source discovery temporarily unavailable: ${error.message}`
    }), {
      status: 200, // Changed from 500 to 200 to avoid breaking the UI
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
