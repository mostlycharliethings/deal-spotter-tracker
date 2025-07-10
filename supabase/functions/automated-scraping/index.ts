
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Enhanced scraper implementation for Edge Function
class EdgeScraper {
  private static readonly SCRAPER_API_KEY = 'dd7d33c454f2bbca7b228f9d9eb23aec';
  private static readonly SCRAPER_API_URL = 'http://api.scraperapi.com';
  private static readonly OPENCAGE_API_KEY = 'b971e23bef7f47c3b9d2acca5fe8b2d0';

  static async scrapeSearchConfig(searchConfig: any, supabase: any): Promise<any[]> {
    console.log('Starting automated scrape for search config:', searchConfig.id);
    
    const allListings: any[] = [];
    const searchVariants = this.generateSearchVariants(searchConfig);
    
    // Scrape multiple sources
    for (const variant of searchVariants.slice(0, 3)) { // Limit variants to avoid timeouts
      console.log(`Processing search variant: "${variant}"`);
      
      try {
        // Scrape Craigslist
        const craigslistListings = await this.scrapeCraigslist(variant, searchConfig);
        allListings.push(...craigslistListings);
        
        // Add delay between requests
        await this.delay(2000);
        
        // Scrape eBay if time permits
        const ebayListings = await this.scrapeEbay(variant, searchConfig);
        allListings.push(...ebayListings);
        
        await this.delay(2000);
        
      } catch (error) {
        console.error(`Error scraping variant "${variant}":`, error);
      }
    }

    // Remove duplicates and filter existing listings
    const uniqueListings = await this.removeDuplicatesAndFilter(allListings, supabase, searchConfig.id);
    console.log(`Found ${uniqueListings.length} new unique listings`);
    
    return uniqueListings;
  }

  private static generateSearchVariants(searchConfig: any): string[] {
    const variants: string[] = [];
    const baseTerms = [searchConfig.manufacturer, searchConfig.item_name].filter(Boolean);
    
    variants.push(baseTerms.join(' '));
    
    if (searchConfig.qualifier) {
      variants.push([...baseTerms, searchConfig.qualifier].join(' '));
    }
    
    // Add year variants for recent years
    if (searchConfig.year_start && searchConfig.year_end && searchConfig.year_start !== 1900) {
      const currentYear = new Date().getFullYear();
      const endYear = Math.min(searchConfig.year_end, currentYear);
      
      // Focus on recent years for better results
      for (let year = Math.max(searchConfig.year_start, currentYear - 5); year <= endYear; year++) {
        variants.push([year.toString(), ...baseTerms].join(' '));
      }
    }
    
    return [...new Set(variants)];
  }

  private static async scrapeCraigslist(searchQuery: string, searchConfig: any): Promise<any[]> {
    const listings: any[] = [];
    const cities = ['denver', 'sfbay', 'seattle'];
    
    for (const city of cities) {
      try {
        const encodedQuery = encodeURIComponent(searchQuery);
        const searchUrl = `https://${city}.craigslist.org/search/sss?query=${encodedQuery}&sort=date`;
        
        const data = await this.fetchWithScraperAPI(searchUrl);
        
        if (data) {
          const parsedListings = this.parseCraigslistResults(data, searchConfig, city, searchQuery);
          listings.push(...parsedListings);
        }
        
        if (listings.length >= 10) break;
      } catch (error) {
        console.error(`Error scraping Craigslist ${city}:`, error);
      }
    }
    
    return listings;
  }

  private static async scrapeEbay(searchQuery: string, searchConfig: any): Promise<any[]> {
    const listings: any[] = [];
    
    try {
      const encodedQuery = encodeURIComponent(searchQuery);
      const searchUrl = `https://www.ebay.com/sch/i.html?_nkw=${encodedQuery}&_sop=10`;
      
      const data = await this.fetchWithScraperAPI(searchUrl);
      
      if (data) {
        const parsedListings = this.parseEbayResults(data, searchConfig, searchQuery);
        listings.push(...parsedListings);
      }
    } catch (error) {
      console.error('Error scraping eBay:', error);
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
    
    try {
      const resultRowRegex = /<li class="[^"]*cl-search-result[^"]*"[^>]*>([\s\S]*?)<\/li>/g;
      const titleLinkRegex = /<a[^>]*href="([^"]*)"[^>]*class="[^"]*cl-app-anchor[^"]*"[^>]*[^>]*>([^<]*)<\/a>/;
      const priceRegex = /<span class="[^"]*result-price[^"]*"[^>]*>\$([0-9,]+)<\/span>/;
      const locationRegex = /<span class="[^"]*result-locality[^"]*"[^>]*>([^<]+)<\/span>/;
      
      let rowMatch;
      let foundCount = 0;
      
      while ((rowMatch = resultRowRegex.exec(html)) !== null && foundCount < 5) {
        const rowHtml = rowMatch[1];
        
        const titleMatch = titleLinkRegex.exec(rowHtml);
        const priceMatch = priceRegex.exec(rowHtml);
        
        if (titleMatch && priceMatch) {
          const [, relativeUrl, title] = titleMatch;
          const price = parseInt(priceMatch[1].replace(/,/g, ''));
          
          const locationMatch = locationRegex.exec(rowHtml);
          const location = locationMatch ? locationMatch[1].trim() : `${city} area`;
          
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
            location: location,
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
        }
      }
    } catch (error) {
      console.error(`Error parsing Craigslist ${city}:`, error);
    }
    
    return listings;
  }

  private static parseEbayResults(html: string, searchConfig: any, searchQuery: string): any[] {
    const listings: any[] = [];
    
    try {
      const itemRegex = /<div class="s-item__wrapper[^"]*"[^>]*>([\s\S]*?)<\/div>/g;
      const titleRegex = /<h3[^>]*class="[^"]*s-item__title[^"]*"[^>]*>([^<]+)<\/h3>/;
      const priceRegex = /<span class="[^"]*s-item__price[^"]*"[^>]*>\$([0-9,]+(?:\.[0-9]{2})?)<\/span>/;
      const linkRegex = /<a[^>]*href="([^"]*)"[^>]*class="[^"]*s-item__link[^"]*"/;
      
      let itemMatch;
      let foundCount = 0;
      
      while ((itemMatch = itemRegex.exec(html)) !== null && foundCount < 3) {
        const itemHtml = itemMatch[1];
        
        const titleMatch = titleRegex.exec(itemHtml);
        const priceMatch = priceRegex.exec(itemHtml);
        const linkMatch = linkRegex.exec(itemHtml);
        
        if (titleMatch && priceMatch && linkMatch) {
          const title = titleMatch[1].trim();
          const price = parseFloat(priceMatch[1].replace(/,/g, ''));
          const url = linkMatch[1];
          
          if (price > 0 && url) {
            const listing = {
              search_id: searchConfig.id,
              source_listing_id: `ebay-${Date.now()}-${foundCount}`,
              source_name: 'eBay',
              source_url: url,
              title: title,
              description: `${searchQuery} found on eBay`,
              price: price,
              price_threshold: searchConfig.price_threshold,
              max_price_allowed: searchConfig.max_price_allowed,
              location: 'Various locations',
              listing_age: 'Recently listed',
              contact_info: 'Contact via eBay',
              is_within_threshold: price <= searchConfig.price_threshold,
              is_within_slider_range: price > searchConfig.price_threshold && price <= searchConfig.max_price_allowed,
              is_above_slider: price > searchConfig.max_price_allowed,
              is_price_changed: false,
              is_description_changed: false,
              is_ignored: false
            };
            
            listings.push(listing);
            foundCount++;
          }
        }
      }
    } catch (error) {
      console.error('Error parsing eBay results:', error);
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
        existingListings.map((l: any) => `${l.source_url}-${l.title.toLowerCase()}-${l.price}`)
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

    console.log('Starting automated scraping job');

    // Get all active search configurations
    const { data: searchConfigs, error: searchError } = await supabase
      .from('search_configs')
      .select('*')
      .eq('is_active', true);

    if (searchError) {
      throw new Error(`Failed to fetch search configs: ${searchError.message}`);
    }

    if (!searchConfigs || searchConfigs.length === 0) {
      console.log('No active search configurations found');
      return new Response(JSON.stringify({ 
        message: "No active search configurations found",
        processed: 0 
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
          // Insert new listings into database
          const { data: insertedListings, error: insertError } = await supabase
            .from('listings')
            .insert(newListings)
            .select();

          if (insertError) {
            console.error(`Error inserting listings for search ${searchConfig.id}:`, insertError);
          } else {
            console.log(`Inserted ${newListings.length} new listings for search ${searchConfig.id}`);
            totalNewListings += newListings.length;

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
          error: error.message,
          newListingsFound: 0
        });
      }
    }

    console.log(`Automated scraping completed. Total new listings: ${totalNewListings}`);

    return new Response(JSON.stringify({
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
        error: error.message,
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
