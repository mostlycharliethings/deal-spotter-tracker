import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const scraperApiKey = Deno.env.get('SCRAPER_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PriceEstimate {
  low: number;
  average: number;
  high: number;
  samples: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { manufacturer, item_name, qualifier, year_start } = await req.json();

    if (!manufacturer || !item_name) {
      return new Response(
        JSON.stringify({ error: 'manufacturer and item_name are required' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    // Check cache first
    console.log('Checking cache for price estimate...');
    const { data: cachedData } = await supabase
      .rpc('get_cached_price_estimate', {
        manufacturer_param: manufacturer,
        item_name_param: item_name,
        qualifier_param: qualifier || null,
        year_start_param: year_start
      });

    if (cachedData && cachedData.length > 0 && cachedData[0].is_fresh) {
      console.log('Found fresh cached price estimate');
      return new Response(JSON.stringify({
        low: cachedData[0].low_price,
        average: cachedData[0].average_price,
        high: cachedData[0].high_price,
        samples: cachedData[0].sample_count,
        cached: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build search query
    const searchQuery = [
      manufacturer,
      item_name,
      qualifier,
      year_start ? `${year_start}` : ''
    ].filter(Boolean).join(' ');

    console.log('Scraping eBay for price data:', searchQuery);

    // Scrape eBay sold listings using ScraperAPI
    const ebayUrl = `https://www.ebay.com/sch/i.html?_from=R40&_nkw=${encodeURIComponent(searchQuery)}&_sacat=0&LH_Sold=1&LH_Complete=1&rt=nc&_ipg=200`;
    
    const scraperResponse = await fetch(`http://api.scraperapi.com?api_key=${scraperApiKey}&url=${encodeURIComponent(ebayUrl)}&render=true`);
    
    if (!scraperResponse.ok) {
      throw new Error(`ScraperAPI error: ${scraperResponse.status}`);
    }

    const html = await scraperResponse.text();
    
    // Extract prices from eBay HTML
    const prices = extractPricesFromEbayHtml(html);
    
    if (prices.length === 0) {
      console.log('No prices found for search query');
      return new Response(JSON.stringify({
        error: 'No price data found',
        samples: 0
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Calculate price statistics
    const sortedPrices = prices.sort((a, b) => a - b);
    const low = sortedPrices[0];
    const high = sortedPrices[sortedPrices.length - 1];
    const average = Math.round(sortedPrices.reduce((sum, price) => sum + price, 0) / sortedPrices.length);

    const estimate: PriceEstimate = {
      low: Math.round(low),
      average,
      high: Math.round(high),
      samples: prices.length
    };

    // Cache the result
    console.log('Caching price estimate:', estimate);
    await supabase
      .from('price_reference')
      .upsert({
        manufacturer,
        item_name,
        qualifier: qualifier || null,
        year_start,
        year_end: year_start, // For now, treat as single year
        low_price: estimate.low,
        average_price: estimate.average,
        high_price: estimate.high,
        sample_count: estimate.samples,
        source: 'ebay',
        scraped_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      });

    return new Response(JSON.stringify({
      ...estimate,
      cached: false
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in get-price-estimate function:', error);
    return new Response(JSON.stringify({ 
      error: `Price estimation failed: ${error.message}`,
      samples: 0
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function extractPricesFromEbayHtml(html: string): number[] {
  const prices: number[] = [];
  
  // Look for sold price patterns in eBay HTML
  const priceRegexes = [
    /\$[\d,]+\.?\d*/g, // Basic dollar amounts
    /"price":\s*"?\$?([\d,]+\.?\d*)"?/g, // JSON price fields
    /sold for \$?([\d,]+\.?\d*)/gi, // "sold for $X" text
    /class="[^"]*price[^"]*"[^>]*>\$?([\d,]+\.?\d*)</gi // Price in class attributes
  ];

  for (const regex of priceRegexes) {
    let match;
    while ((match = regex.exec(html)) !== null) {
      const priceStr = match[1] || match[0];
      const cleanPrice = priceStr.replace(/[\$,]/g, '');
      const price = parseFloat(cleanPrice);
      
      // Filter reasonable prices (between $1 and $50,000)
      if (!isNaN(price) && price >= 1 && price <= 50000) {
        prices.push(price);
      }
    }
  }

  // Remove duplicates and outliers
  const uniquePrices = [...new Set(prices)];
  
  if (uniquePrices.length < 3) {
    return uniquePrices;
  }

  // Remove extreme outliers (beyond 2 standard deviations)
  const mean = uniquePrices.reduce((sum, price) => sum + price, 0) / uniquePrices.length;
  const variance = uniquePrices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / uniquePrices.length;
  const stdDev = Math.sqrt(variance);
  
  return uniquePrices.filter(price => Math.abs(price - mean) <= 2 * stdDev);
}