
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";
import { TieringService } from './tieringService.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Enhanced scraper implementation for Edge Function
class EdgeScraper {
  private static readonly SCRAPER_API_KEY = Deno.env.get("SCRAPER_API_KEY") ?? '';
  private static readonly SCRAPER_API_URL = 'http://api.scraperapi.com';

  static async scrapeSearchConfig(searchConfig: any, supabase: any): Promise<any[]> {
    console.log('Starting automated scrape for search config:', searchConfig.id);
    
    // Log config queued stage
    await this.logActivity(supabase, searchConfig.id, 'config_queued', 
      `Processing search: ${searchConfig.manufacturer} ${searchConfig.item_name}`, { searchConfig });
    
    const allListings: any[] = [];
    const searchVariants = this.generateSearchVariants(searchConfig);
    
    // Log variants generated stage
    await this.logActivity(supabase, searchConfig.id, 'variants_generated', 
      `Generated ${searchVariants.length} search variants`, { variants: searchVariants });
    
    // Scrape multiple sources with better error handling
    for (const variant of searchVariants.slice(0, 2)) { // Limit variants to avoid timeouts
      console.log(`Processing search variant: "${variant}"`);
      
      try {
        // Log source scraping attempt
        await this.logActivity(supabase, searchConfig.id, 'source_scraped', 
          `Attempting to scrape variant: ${variant}`, { variant });
        
        // Scrape Craigslist
        const craigslistListings = await this.scrapeCraigslist(variant, searchConfig, supabase);
        allListings.push(...craigslistListings);
        
        // Log parsing results
        await this.logActivity(supabase, searchConfig.id, 'listings_parsed', 
          `Parsed ${craigslistListings.length} listings for variant: ${variant}`, 
          { variant, listingsCount: craigslistListings.length });
        
        // Add delay between requests
        await this.delay(1000);
        
      } catch (error) {
        console.error(`Error scraping variant "${variant}":`, error);
        await this.logActivity(supabase, searchConfig.id, 'failed', 
          `Error scraping variant: ${variant}`, { variant }, error instanceof Error ? error.message : 'Unknown error');
        // Continue with other variants even if one fails
      }
    }

    // Remove duplicates and filter existing listings
    const uniqueListings = await this.removeDuplicatesAndFilter(allListings, supabase, searchConfig.id);
        console.log(`Found ${uniqueListings.length} new unique listings after deduplication`);
        console.log(`Raw listings before deduplication: ${allListings.length}`);
    
    return uniqueListings;
  }

  private static generateSearchVariants(searchConfig: any): string[] {
    const variants: string[] = [];
    const baseTerms = [searchConfig.manufacturer, searchConfig.item_name].filter(Boolean);
    
    variants.push(baseTerms.join(' '));
    
    if (searchConfig.qualifier) {
      variants.push([...baseTerms, searchConfig.qualifier].join(' '));
    }
    
    return [...new Set(variants)];
  }

  private static async scrapeCraigslist(searchQuery: string, searchConfig: any, supabase: any): Promise<any[]> {
    const listings: any[] = [];
    const cities = await this.getCraigslistCities(supabase);
    
    for (const city of cities.slice(0, 8)) { // Increased coverage to 8 cities
      try {
        const encodedQuery = encodeURIComponent(searchQuery);
        const searchUrl = `https://${city}.craigslist.org/search/sss?query=${encodedQuery}&sort=date`;
        
        const data = await this.fetchWithScraperAPI(searchUrl);
        
        if (data) {
          const parsedListings = this.parseCraigslistResults(data, searchConfig, city, searchQuery);
          listings.push(...parsedListings);
        }
        
        if (listings.length >= 5) break;
      } catch (error) {
        console.error(`Error scraping Craigslist ${city}:`, error);
      }
    }
    
    return listings;
  }

  private static async fetchWithScraperAPI(url: string): Promise<string | null> {
    try {
      const scraperUrl = `${this.SCRAPER_API_URL}?api_key=${this.SCRAPER_API_KEY}&url=${encodeURIComponent(url)}&render=false`;
      
      const response = await fetch(scraperUrl, {
        method: 'GET',
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });
      
      if (!response.ok) {
        console.error(`ScraperAPI HTTP ${response.status}: ${response.statusText}`);
        return null;
      }
      
      return await response.text();
    } catch (error) {
      console.error('ScraperAPI fetch error:', error);
      return null;
    }
  }

  private static parseCraigslistResults(html: string, searchConfig: any, city: string, searchQuery: string): any[] {
    const listings: any[] = [];
    
    console.log(`Parsing HTML for ${city}, length: ${html.length} chars`);
    
    // Log a sample of the HTML to understand the structure
    if (html.length > 1000) {
      console.log(`Sample HTML chunk: ${html.substring(1000, 1500)}`);
    }
    
    try {
      // Multiple patterns to try for different Craigslist layouts
      const patterns = [
        // Modern Craigslist structure
        {
          resultRow: /<div[^>]*class="[^"]*result-info[^"]*"[^>]*>([\s\S]*?)<\/div>/g,
          titleLink: /<a[^>]*href="([^"]*)"[^>]*class="[^"]*result-title[^"]*"[^>]*>([^<]+)<\/a>/,
          price: /<span[^>]*class="[^"]*result-price[^"]*"[^>]*>\$([0-9,]+)<\/span>/
        },
        // Alternative structure
        {
          resultRow: /<li[^>]*class="[^"]*result-row[^"]*"[^>]*>([\s\S]*?)<\/li>/g,
          titleLink: /<a[^>]*href="([^"]*)"[^>]*>([^<]+)<\/a>/,
          price: /<span[^>]*>\$([0-9,]+)<\/span>/
        },
        // Gallery view structure
        {
          resultRow: /<div[^>]*class="[^"]*result-image[^"]*"[^>]*>[\s\S]*?<a[^>]*href="([^"]*)"[^>]*>[\s\S]*?<span[^>]*>\$([0-9,]+)<\/span>[\s\S]*?title="([^"]*)"[^>]*>/g,
          titleLink: null, // Special handling for gallery
          price: null
        }
      ];
      
      let foundCount = 0;
      let patternUsed = -1;
      
      for (let i = 0; i < patterns.length && foundCount === 0; i++) {
        const pattern = patterns[i];
        console.log(`Trying pattern ${i + 1}...`);
        
        if (i === 2) {
          // Special handling for gallery view
          let galleryMatch;
          while ((galleryMatch = pattern.resultRow.exec(html)) !== null && foundCount < 5) {
            const [, url, priceStr, title] = galleryMatch;
            const price = parseInt(priceStr.replace(/,/g, ''));
            
            if (title && price) {
              const fullUrl = url.startsWith('http') ? url : `https://${city}.craigslist.org${url}`;
              
              const listing = {
                search_id: searchConfig.id,
                source_listing_id: `cl-${city}-${Date.now()}-${foundCount}`,
                source_name: 'Craigslist',
                source_url: fullUrl,
                title: title.trim(),
                description: `${searchQuery} found on Craigslist ${city}`,
                price: price,
                price_threshold: searchConfig.price_threshold,
                max_price_allowed: searchConfig.max_price_allowed,
                location: `${city} area`,
                listing_age: 'Recently posted',
                contact_info: 'Contact via Craigslist',
                is_within_threshold: price <= searchConfig.price_threshold,
                is_within_slider_range: price > searchConfig.price_threshold && price <= searchConfig.max_price_allowed,
                is_above_slider: price > searchConfig.max_price_allowed,
                is_price_changed: false,
                is_description_changed: false,
                is_ignored: false
              };
              
              listings.push(listing);
              foundCount++;
              patternUsed = i;
            }
          }
        } else {
          // Regular patterns
          let rowMatch;
          while ((rowMatch = pattern.resultRow.exec(html)) !== null && foundCount < 5) {
            const rowHtml = rowMatch[1];
            console.log(`Checking row HTML: ${rowHtml.substring(0, 200)}...`);
            
            const titleMatch = pattern.titleLink.exec(rowHtml);
            const priceMatch = pattern.price.exec(rowHtml);
            
            console.log(`Title match: ${titleMatch ? 'YES' : 'NO'}, Price match: ${priceMatch ? 'YES' : 'NO'}`);
            
            if (titleMatch && priceMatch) {
              const [, relativeUrl, title] = titleMatch;
              const price = parseInt(priceMatch[1].replace(/,/g, ''));
              
              console.log(`Found listing: ${title} - $${price}`);
              
              const fullUrl = relativeUrl.startsWith('http') ? 
                relativeUrl : 
                `https://${city}.craigslist.org${relativeUrl}`;
              
              const listing = {
                search_id: searchConfig.id,
                source_listing_id: `cl-${city}-${Date.now()}-${foundCount}`,
                source_name: 'Craigslist',
                source_url: fullUrl,
                title: title.trim(),
                description: `${searchQuery} found on Craigslist ${city}`,
                price: price,
                price_threshold: searchConfig.price_threshold,
                max_price_allowed: searchConfig.max_price_allowed,
                location: `${city} area`,
                listing_age: 'Recently posted',
                contact_info: 'Contact via Craigslist',
                is_within_threshold: price <= searchConfig.price_threshold,
                is_within_slider_range: price > searchConfig.price_threshold && price <= searchConfig.max_price_allowed,
                is_above_slider: price > searchConfig.max_price_allowed,
                is_price_changed: false,
                is_description_changed: false,
                is_ignored: false
              };
              
              listings.push(listing);
              foundCount++;
              patternUsed = i;
            }
          }
        }
      }
      
      console.log(`Found ${foundCount} listings using pattern ${patternUsed + 1} for ${city}`);
      
    } catch (error) {
      console.error(`Error parsing Craigslist ${city}:`, error);
    }
    
    return listings;
  }

  private static async removeDuplicatesAndFilter(listings: any[], supabase: any, searchId: string): Promise<any[]> {
    if (listings.length === 0) return [];
    
    try {
      // Get existing listings for this search
      const { data: existingListings, error } = await supabase
        .from('listings')
        .select('source_url, title, price')
        .eq('search_id', searchId);
      
      if (error) {
        console.error('Error fetching existing listings:', error);
        return listings; // Return all if we can't check for duplicates
      }
      
      const existingKeys = new Set(
        (existingListings || []).map((l: any) => `${l.source_url}-${l.title.toLowerCase()}-${l.price}`)
      );
      
      // Filter out duplicates
      const newListings = listings.filter(listing => {
        const key = `${listing.source_url}-${listing.title.toLowerCase()}-${listing.price}`;
        return !existingKeys.has(key);
      });
      
      console.log(`Filtered ${listings.length - newListings.length} duplicate listings`);
      return newListings;
      
    } catch (error) {
      console.error('Error filtering duplicates:', error);
      return listings;
    }
  }

  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private static async logActivity(
    supabase: any, 
    searchConfigId: string, 
    stage: string, 
    message: string, 
    data?: any, 
    errorDetails?: string
  ): Promise<void> {
    try {
      await supabase
        .from('scrape_activity_log')
        .insert({
          search_config_id: searchConfigId,
          stage,
          message,
          data,
          error_details: errorDetails
        });
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  }

  static async getCraigslistCities(supabase: any): Promise<string[]> {
    try {
      const { data: areas, error } = await supabase
        .from('craigslist_areas')
        .select('area_code')
        .eq('is_active', true)
        .order('city_name');
      
      if (error) {
        console.error('Error fetching Craigslist areas:', error);
        // Fallback to hardcoded list if database fetch fails
        return ['denver', 'sfbay', 'losangeles', 'newyork', 'chicago', 'seattle', 'austin'];
      }
      
      return areas?.map((area: any) => area.area_code) || ['denver', 'sfbay', 'losangeles'];
    } catch (error) {
      console.error('Failed to fetch cities from database:', error);
      return ['denver', 'sfbay', 'losangeles', 'newyork', 'chicago', 'seattle', 'austin'];
    }
  }
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting automated scraping job');

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get all active search configurations
    const { data: searchConfigs, error: searchError } = await supabase
      .from('search_configs')
      .select('*')
      .eq('is_active', true);

    if (searchError) {
      console.error('Failed to fetch search configs:', searchError);
      throw new Error(`Failed to fetch search configs: ${searchError.message}`);
    }

    if (!searchConfigs || searchConfigs.length === 0) {
      console.log('No active search configurations found');
      return new Response(JSON.stringify({ 
        success: true,
        message: "No active search configurations found",
        processed: 0,
        totalNewListings: 0
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log(`Processing ${searchConfigs.length} active search configurations`);

    let totalNewListings = 0;
    const results = [];

    // Process each search configuration
    for (const searchConfig of searchConfigs) {
      try {
        console.log(`Processing search config: ${searchConfig.id} (${searchConfig.manufacturer} ${searchConfig.item_name})`);

        const newListings = await EdgeScraper.scrapeSearchConfig(searchConfig, supabase);

        if (newListings.length > 0) {
          // Enrich listings with tier and proximity data
          const enrichedListings = await Promise.all(
            newListings.map(listing => 
              TieringService.enrichListingWithTierAndProximity(
                listing,
                searchConfig.user_latitude,
                searchConfig.user_longitude,
                [] // TODO: Get tertiary domains from database
              )
            )
          );

          // Log database insert attempt
          await EdgeScraper.logActivity(supabase, searchConfig.id, 'db_insert_attempted', 
            `Attempting to insert ${enrichedListings.length} new listings`, { listingsCount: enrichedListings.length });
          
          // Insert new listings into database
          const { data: insertedListings, error: insertError } = await supabase
            .from('listings')
            .insert(enrichedListings)
            .select();

          if (insertError) {
            console.error(`Error inserting listings for search ${searchConfig.id}:`, insertError);
            await EdgeScraper.logActivity(supabase, searchConfig.id, 'failed', 
              `Failed to insert listings`, { listingsCount: newListings.length }, insertError.message);
          } else {
            console.log(`Inserted ${newListings.length} new listings for search ${searchConfig.id}`);
            totalNewListings += newListings.length;
            await EdgeScraper.logActivity(supabase, searchConfig.id, 'completed', 
              `Successfully inserted ${newListings.length} new listings`, { insertedCount: newListings.length });

            // Send email notification if new listings found
            if (insertedListings && insertedListings.length > 0) {
              try {
                const notificationResponse = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-listing-notification`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`
                  },
                  body: JSON.stringify({
                    to: searchConfig.email_address,
                    subject: `🎯 ${newListings.length} New ${searchConfig.manufacturer} ${searchConfig.item_name} Deal${newListings.length > 1 ? 's' : ''} Found!`,
                    html: `
                      <h2>New listings found for your search!</h2>
                      <p><strong>Search:</strong> ${searchConfig.manufacturer} ${searchConfig.item_name}</p>
                      <p><strong>New listings:</strong> ${newListings.length}</p>
                      <p>Check your dashboard for details!</p>
                    `,
                    searchConfig: {
                      id: searchConfig.id,
                      manufacturer: searchConfig.manufacturer,
                      itemName: searchConfig.item_name,
                      qualifier: searchConfig.qualifier,
                      subQualifier: searchConfig.sub_qualifier
                    },
                    listingsCount: newListings.length
                  })
                });

                if (!notificationResponse.ok) {
                  console.error(`Failed to send notification for search ${searchConfig.id}`);
                }
              } catch (notificationError) {
                console.error(`Error sending notification for search ${searchConfig.id}:`, notificationError);
              }
            }
          }
        }

        results.push({
          searchId: searchConfig.id,
          searchDescription: `${searchConfig.manufacturer} ${searchConfig.item_name}`,
          newListingsFound: newListings.length
        });

      } catch (error) {
        console.error(`Error processing search config ${searchConfig.id}:`, error);
        results.push({
          searchId: searchConfig.id,
          searchDescription: `${searchConfig.manufacturer} ${searchConfig.item_name}`,
          error: error instanceof Error ? error.message : 'Unknown error',
          newListingsFound: 0
        });
      }
    }

    console.log(`Automated scraping completed. Total new listings: ${totalNewListings}`);

    return new Response(JSON.stringify({
      success: true,
      message: "Automated scraping completed successfully",
      totalSearchConfigs: searchConfigs.length,
      totalNewListings: totalNewListings,
      results: results,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error in automated scraping:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
