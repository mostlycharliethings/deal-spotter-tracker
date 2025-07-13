
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";
import { TieringService } from './tieringService.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Enhanced multi-tier scraper implementation for Edge Function
class EdgeScraper {
  private static readonly SCRAPER_API_KEY = Deno.env.get("SCRAPER_API_KEY") ?? '';
  private static readonly SCRAPER_API_URL = 'http://api.scraperapi.com';
  private static readonly OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") ?? '';

  static async scrapeSearchConfig(searchConfig: any, supabase: any): Promise<any[]> {
    console.log('Starting multi-tier automated scrape for search config:', searchConfig.id);
    
    await this.logActivity(supabase, searchConfig.id, 'config_queued', 
      `Processing multi-tier search: ${searchConfig.manufacturer} ${searchConfig.item_name}`, { searchConfig });
    
    const allListings: any[] = [];
    const searchVariants = this.generateSearchVariants(searchConfig);
    
    await this.logActivity(supabase, searchConfig.id, 'variants_generated', 
      `Generated ${searchVariants.length} search variants`, { variants: searchVariants });
    
    // TIER 1 SCRAPING: Craigslist, eBay, Facebook Marketplace with geographic radius
    console.log('=== TIER 1 SCRAPING START ===');
    await this.logActivity(supabase, searchConfig.id, 'tier1_start', 'Starting Tier 1 source scraping (Craigslist, eBay, Facebook Marketplace)');
    
    for (const variant of searchVariants.slice(0, 2)) {
      try {
        // Scrape Craigslist with geographic radius
        const craigslistListings = await this.scrapeCraigslistWithRadius(variant, searchConfig, supabase);
        allListings.push(...craigslistListings);
        await this.logActivity(supabase, searchConfig.id, 'tier1_craigslist', 
          `Craigslist: ${craigslistListings.length} listings`, { variant, count: craigslistListings.length });
        
        await this.delay(2000);
        
        // Scrape eBay with geographic radius
        const ebayListings = await this.scrapeEbayWithRadius(variant, searchConfig, supabase);
        allListings.push(...ebayListings);
        await this.logActivity(supabase, searchConfig.id, 'tier1_ebay', 
          `eBay: ${ebayListings.length} listings`, { variant, count: ebayListings.length });
        
        await this.delay(2000);
        
        // Scrape Facebook Marketplace with geographic radius
        const facebookListings = await this.scrapeFacebookWithRadius(variant, searchConfig, supabase);
        allListings.push(...facebookListings);
        await this.logActivity(supabase, searchConfig.id, 'tier1_facebook', 
          `Facebook: ${facebookListings.length} listings`, { variant, count: facebookListings.length });
        
        await this.delay(2000);
        
      } catch (error) {
        console.error(`Error in Tier 1 scraping for variant "${variant}":`, error);
        await this.logActivity(supabase, searchConfig.id, 'tier1_failed', 
          `Tier 1 error for variant: ${variant}`, { variant }, error instanceof Error ? error.message : 'Unknown error');
      }
    }
    
    // TIER 2 SCRAPING: Discover and scrape specialized sources
    console.log('=== TIER 2 SCRAPING START ===');
    await this.logActivity(supabase, searchConfig.id, 'tier2_start', 'Starting Tier 2 source discovery and scraping');
    
    try {
      const tier2Listings = await this.scrapeTier2Sources(searchConfig, supabase);
      allListings.push(...tier2Listings);
      await this.logActivity(supabase, searchConfig.id, 'tier2_complete', 
        `Tier 2: ${tier2Listings.length} listings from specialized sources`, { count: tier2Listings.length });
    } catch (error) {
      console.error('Error in Tier 2 scraping:', error);
      await this.logActivity(supabase, searchConfig.id, 'tier2_failed', 
        'Tier 2 scraping failed', {}, error instanceof Error ? error.message : 'Unknown error');
    }
    
    // TIER 3 SCRAPING: Scrape tertiary sources
    console.log('=== TIER 3 SCRAPING START ===');
    await this.logActivity(supabase, searchConfig.id, 'tier3_start', 'Starting Tier 3 tertiary source scraping');
    
    try {
      const tier3Listings = await this.scrapeTier3Sources(searchConfig, supabase);
      allListings.push(...tier3Listings);
      await this.logActivity(supabase, searchConfig.id, 'tier3_complete', 
        `Tier 3: ${tier3Listings.length} listings from tertiary sources`, { count: tier3Listings.length });
    } catch (error) {
      console.error('Error in Tier 3 scraping:', error);
      await this.logActivity(supabase, searchConfig.id, 'tier3_failed', 
        'Tier 3 scraping failed', {}, error instanceof Error ? error.message : 'Unknown error');
    }

    // Remove duplicates and filter existing listings
    const uniqueListings = await this.removeDuplicatesAndFilter(allListings, supabase, searchConfig.id);
    console.log(`=== SCRAPING SUMMARY ===`);
    console.log(`Total raw listings found: ${allListings.length}`);
    console.log(`New unique listings after deduplication: ${uniqueListings.length}`);
    
    await this.logActivity(supabase, searchConfig.id, 'scraping_complete', 
      `Scraping complete: ${uniqueListings.length} new listings from ${allListings.length} total found`, 
      { totalFound: allListings.length, newUnique: uniqueListings.length });
    
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

  // TIER 1 METHODS: Craigslist, eBay, Facebook with geographic radius
  private static async scrapeCraigslistWithRadius(searchQuery: string, searchConfig: any, supabase: any): Promise<any[]> {
    const listings: any[] = [];
    const cities = await this.getCraigslistCitiesWithRadius(supabase, searchConfig);
    
    console.log(`Scraping Craigslist with ${cities.length} cities within radius`);
    
    for (const cityData of cities.slice(0, 12)) {
      try {
        const encodedQuery = encodeURIComponent(searchQuery);
        const searchUrl = `https://${cityData.area_code}.craigslist.org/search/sss?query=${encodedQuery}&sort=date`;
        
        const data = await this.fetchWithScraperAPI(searchUrl);
        
        if (data) {
          const parsedListings = this.parseCraigslistResults(data, searchConfig, cityData.area_code, searchQuery, cityData.distance_miles, cityData.proximity_bucket);
          listings.push(...parsedListings);
          console.log(`Craigslist ${cityData.area_code} (${cityData.distance_miles}mi): ${parsedListings.length} listings`);
        }
        
        if (listings.length >= 8) break;
        await this.delay(500);
      } catch (error) {
        console.error(`Error scraping Craigslist ${cityData.area_code}:`, error);
      }
    }
    
    return listings;
  }

  private static async scrapeEbayWithRadius(searchQuery: string, searchConfig: any, supabase: any): Promise<any[]> {
    const listings: any[] = [];
    
    try {
      // eBay search with radius parameters
      const radiusParams = this.getEbayRadiusParams(searchConfig);
      const encodedQuery = encodeURIComponent(searchQuery);
      
      for (const radius of radiusParams) {
        const searchUrl = `https://www.ebay.com/sch/i.html?_nkw=${encodedQuery}&_sop=10&LH_BIN=1${radius.params}`;
        console.log(`eBay search URL (${radius.label}): ${searchUrl}`);
        
        const data = await this.fetchWithScraperAPI(searchUrl);
        
        if (data) {
          const parsedListings = this.parseEbayResults(data, searchConfig, searchQuery, radius.label);
          listings.push(...parsedListings);
          console.log(`eBay ${radius.label}: ${parsedListings.length} listings`);
        }
        
        if (listings.length >= 6) break;
        await this.delay(1000);
      }
    } catch (error) {
      console.error('Error scraping eBay:', error);
    }
    
    return listings;
  }

  private static async scrapeFacebookWithRadius(searchQuery: string, searchConfig: any, supabase: any): Promise<any[]> {
    const listings: any[] = [];
    
    try {
      // Facebook Marketplace with location-based search
      const radiusParams = this.getFacebookRadiusParams(searchConfig);
      const encodedQuery = encodeURIComponent(searchQuery);
      
      for (const radius of radiusParams) {
        const searchUrl = `https://www.facebook.com/marketplace/search/?query=${encodedQuery}${radius.params}`;
        console.log(`Facebook search URL (${radius.label}): ${searchUrl}`);
        
        const data = await this.fetchWithScraperAPI(searchUrl);
        
        if (data) {
          const parsedListings = this.parseFacebookResults(data, searchConfig, searchQuery, radius.label);
          listings.push(...parsedListings);
          console.log(`Facebook ${radius.label}: ${parsedListings.length} listings`);
        }
        
        if (listings.length >= 4) break;
        await this.delay(1500);
      }
    } catch (error) {
      console.error('Error scraping Facebook Marketplace:', error);
    }
    
    return listings;
  }

  // TIER 2 METHODS: AI-discovered specialized sources
  private static async scrapeTier2Sources(searchConfig: any, supabase: any): Promise<any[]> {
    const listings: any[] = [];
    
    try {
      // Check if we already have Tier 2 sources for this search
      let tier2Sources = await this.getTier2SourcesForSearch(searchConfig.id, supabase);
      
      if (tier2Sources.length === 0) {
        // Discover new Tier 2 sources using ChatGPT
        console.log('Discovering new Tier 2 sources...');
        const discoveredSources = await this.discoverTier2Sources(searchConfig);
        
        if (discoveredSources.length > 0) {
          // Store discovered sources in database
          tier2Sources = await this.storeTier2Sources(searchConfig.id, discoveredSources, supabase);
          console.log(`Stored ${tier2Sources.length} new Tier 2 sources for search ${searchConfig.id}`);
        }
      } else {
        console.log(`Using ${tier2Sources.length} existing Tier 2 sources for search ${searchConfig.id}`);
      }
      
      // Scrape each Tier 2 source
      for (const source of tier2Sources.slice(0, 5)) {
        try {
          const sourceListings = await this.scrapeTier2Source(source, searchConfig, supabase);
          listings.push(...sourceListings);
          
          // Update source usage statistics
          await this.updateTier2SourceStats(source.tier2_source_id, sourceListings.length, true, supabase);
          
          await this.delay(2000);
        } catch (error) {
          console.error(`Error scraping Tier 2 source ${source.name}:`, error);
          await this.updateTier2SourceStats(source.tier2_source_id, 0, false, supabase);
        }
      }
      
    } catch (error) {
      console.error('Error in Tier 2 source processing:', error);
    }
    
    return listings;
  }

  // TIER 3 METHODS: Tertiary source aggregation
  private static async scrapeTier3Sources(searchConfig: any, supabase: any): Promise<any[]> {
    const listings: any[] = [];
    
    try {
      // Get all tertiary sources from database
      const { data: tertiaryDomains, error } = await supabase
        .from('tertiary_sources')
        .select('*')
        .order('times_used', { ascending: false })
        .limit(10);
      
      if (error) {
        console.error('Error fetching tertiary sources:', error);
        return listings;
      }
      
      console.log(`Found ${tertiaryDomains?.length || 0} tertiary sources to scrape`);
      
      if (tertiaryDomains && tertiaryDomains.length > 0) {
        const searchVariants = this.generateSearchVariants(searchConfig);
        
        for (const domain of tertiaryDomains.slice(0, 6)) {
          try {
            const domainListings = await this.scrapeTertiarySource(domain, searchVariants[0], searchConfig, supabase);
            listings.push(...domainListings);
            
            // Update tertiary source usage
            await supabase.rpc('increment_times_used', { url_param: domain.url });
            
            console.log(`Tertiary source ${domain.domain}: ${domainListings.length} listings`);
            await this.delay(3000);
          } catch (error) {
            console.error(`Error scraping tertiary source ${domain.domain}:`, error);
          }
        }
      }
      
    } catch (error) {
      console.error('Error in Tier 3 source processing:', error);
    }
    
    return listings;
  }

  private static async fetchWithScraperAPI(url: string): Promise<string | null> {
    try {
      // Check if API key is configured
      if (!this.SCRAPER_API_KEY || this.SCRAPER_API_KEY.trim() === '') {
        console.error('❌ SCRAPER_API_KEY is not configured! This is why scraping is failing.');
        console.log('🔧 Please add SCRAPER_API_KEY to your Supabase Edge Function secrets');
        return null;
      }
      
      const scraperUrl = `${this.SCRAPER_API_URL}?api_key=${this.SCRAPER_API_KEY}&url=${encodeURIComponent(url)}&render=false`;
      
      console.log(`🔍 Fetching: ${url}`);
      console.log(`🌐 ScraperAPI URL: ${scraperUrl.replace(this.SCRAPER_API_KEY, '[HIDDEN]')}`);
      
      const response = await fetch(scraperUrl, {
        method: 'GET',
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });
      
      console.log(`📊 Response status: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ ScraperAPI HTTP ${response.status}: ${response.statusText}`);
        console.error(`❌ Error response: ${errorText}`);
        return null;
      }
      
      const html = await response.text();
      console.log(`✅ Received ${html.length} characters of HTML`);
      
      // Log first 500 chars to see what we're getting
      if (html.length > 0) {
        console.log(`📄 HTML sample: ${html.substring(0, 500)}...`);
      }
      
      return html;
    } catch (error) {
      console.error('❌ ScraperAPI fetch error:', error);
      return null;
    }
  }

  private static parseCraigslistResults(html: string, searchConfig: any, city: string, searchQuery: string, distanceMiles?: number, proximityBucket?: string): any[] {
    const listings: any[] = [];
    
    console.log(`🏙️ Parsing Craigslist HTML for ${city}, length: ${html.length} chars`);
    
    // Check if we got blocked or error page
    if (html.includes('blocked') || html.includes('captcha') || html.includes('verify') || html.length < 100) {
      console.log(`❌ Craigslist ${city}: Appears to be blocked or error page`);
      return listings;
    }
    
    // Log a sample of the HTML to understand the structure
    if (html.length > 1000) {
      console.log(`📋 Sample HTML chunk: ${html.substring(1000, 1500)}`);
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
                distance_miles: distanceMiles || null,
                proximity_bucket: proximityBucket || null,
                tier: 'tier1',
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
                distance_miles: distanceMiles || null,
                proximity_bucket: proximityBucket || null,
                tier: 'tier1',
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

  // GEOGRAPHIC RADIUS METHODS
  private static async getCraigslistCitiesWithRadius(supabase: any, searchConfig: any): Promise<any[]> {
    try {
      if (!searchConfig.user_latitude || !searchConfig.user_longitude) {
        // No user location, use default cities
        const { data: areas, error } = await supabase
          .from('craigslist_areas')
          .select('area_code, city_name, latitude, longitude')
          .eq('is_active', true)
          .order('city_name')
          .limit(10);
        
        return areas?.map((area: any) => ({
          ...area,
          distance_miles: null,
          proximity_bucket: null
        })) || [];
      }
      
      // Get all active areas with coordinates
      const { data: areas, error } = await supabase
        .from('craigslist_areas')
        .select('area_code, city_name, latitude, longitude')
        .eq('is_active', true)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);
      
      if (error || !areas) {
        console.error('Error fetching Craigslist areas:', error);
        return [];
      }
      
      // Calculate distances and assign proximity buckets
      const citiesWithDistance = areas.map((area: any) => {
        const distance = TieringService.haversineDistance(
          searchConfig.user_latitude,
          searchConfig.user_longitude,
          area.latitude,
          area.longitude
        );
        
        return {
          ...area,
          distance_miles: Math.round(distance),
          proximity_bucket: TieringService.calculateProximityBucket(distance)
        };
      });
      
      // Sort by distance and return all within 500 miles
      return citiesWithDistance
        .filter(city => city.distance_miles <= 500)
        .sort((a, b) => a.distance_miles - b.distance_miles);
      
    } catch (error) {
      console.error('Failed to calculate city distances:', error);
      return [];
    }
  }

  private static getEbayRadiusParams(searchConfig: any): any[] {
    if (!searchConfig.user_latitude || !searchConfig.user_longitude) {
      return [{ label: 'Nationwide', params: '' }];
    }
    
    return [
      { label: '<100mi', params: `&_sadis=100&_stpos=${searchConfig.user_latitude},${searchConfig.user_longitude}` },
      { label: '100-500mi', params: `&_sadis=500&_stpos=${searchConfig.user_latitude},${searchConfig.user_longitude}` },
      { label: '>500mi', params: '' } // Nationwide for >500mi
    ];
  }

  private static getFacebookRadiusParams(searchConfig: any): any[] {
    if (!searchConfig.user_latitude || !searchConfig.user_longitude) {
      return [{ label: 'Local Area', params: '' }];
    }
    
    return [
      { label: '<100mi', params: `&radius=160&latitude=${searchConfig.user_latitude}&longitude=${searchConfig.user_longitude}` },
      { label: '100-500mi', params: `&radius=800&latitude=${searchConfig.user_latitude}&longitude=${searchConfig.user_longitude}` },
      { label: '>500mi', params: '' } // No radius limit
    ];
  }

  // NEW PARSING METHODS FOR EBAY AND FACEBOOK
  private static parseEbayResults(html: string, searchConfig: any, searchQuery: string, radiusLabel: string): any[] {
    const listings: any[] = [];
    
    try {
      // eBay listing pattern
      const listingPattern = /<div[^>]*class="[^"]*s-item[^"]*"[^>]*>([\s\S]*?)<\/div>/g;
      let match;
      let count = 0;
      
      while ((match = listingPattern.exec(html)) !== null && count < 5) {
        const listingHtml = match[1];
        
        // Extract title and URL
        const titleMatch = /<h3[^>]*class="[^"]*s-item__title[^"]*"[^>]*><a[^>]*href="([^"]*)"[^>]*>([^<]+)<\/a>/g.exec(listingHtml);
        // Extract price
        const priceMatch = /<span[^>]*class="[^"]*s-item__price[^"]*"[^>]*>\$([0-9,.]+)<\/span>/g.exec(listingHtml);
        
        if (titleMatch && priceMatch) {
          const [, url, title] = titleMatch;
          const price = parseFloat(priceMatch[1].replace(/,/g, ''));
          
          if (title && price > 0) {
            const listing = {
              search_id: searchConfig.id,
              source_listing_id: `ebay-${Date.now()}-${count}`,
              source_name: 'eBay',
              source_url: url,
              title: title.trim(),
              description: `${searchQuery} found on eBay (${radiusLabel})`,
              price: price,
              price_threshold: searchConfig.price_threshold,
              max_price_allowed: searchConfig.max_price_allowed,
              location: `eBay ${radiusLabel}`,
              listing_age: 'Recently posted',
              contact_info: 'Contact via eBay',
              distance_miles: null,
              proximity_bucket: radiusLabel,
              tier: 'tier1',
              is_within_threshold: price <= searchConfig.price_threshold,
              is_within_slider_range: price > searchConfig.price_threshold && price <= searchConfig.max_price_allowed,
              is_above_slider: price > searchConfig.max_price_allowed,
              is_price_changed: false,
              is_description_changed: false,
              is_ignored: false
            };
            
            listings.push(listing);
            count++;
          }
        }
      }
      
    } catch (error) {
      console.error('Error parsing eBay results:', error);
    }
    
    return listings;
  }

  private static parseFacebookResults(html: string, searchConfig: any, searchQuery: string, radiusLabel: string): any[] {
    const listings: any[] = [];
    
    try {
      // Facebook Marketplace patterns (simplified due to heavy JS protection)
      const titlePattern = /<span[^>]*>([^<]*(?:${searchQuery.split(' ')[0]}|${searchQuery.split(' ')[1]})[^<]*)<\/span>/gi;
      const pricePattern = /\$([0-9,.]+)/g;
      
      let titleMatch;
      let priceMatch;
      let count = 0;
      
      while ((titleMatch = titlePattern.exec(html)) !== null && 
             (priceMatch = pricePattern.exec(html)) !== null && 
             count < 3) {
        
        const title = titleMatch[1];
        const price = parseFloat(priceMatch[1].replace(/,/g, ''));
        
        if (title && price > 0) {
          const listing = {
            search_id: searchConfig.id,
            source_listing_id: `facebook-${Date.now()}-${count}`,
            source_name: 'Facebook Marketplace',
            source_url: 'https://www.facebook.com/marketplace',
            title: title.trim(),
            description: `${searchQuery} found on Facebook Marketplace (${radiusLabel})`,
            price: price,
            price_threshold: searchConfig.price_threshold,
            max_price_allowed: searchConfig.max_price_allowed,
            location: `Facebook ${radiusLabel}`,
            listing_age: 'Recently posted',
            contact_info: 'Contact via Facebook',
            distance_miles: null,
            proximity_bucket: radiusLabel,
            tier: 'tier1',
            is_within_threshold: price <= searchConfig.price_threshold,
            is_within_slider_range: price > searchConfig.price_threshold && price <= searchConfig.max_price_allowed,
            is_above_slider: price > searchConfig.max_price_allowed,
            is_price_changed: false,
            is_description_changed: false,
            is_ignored: false
          };
          
          listings.push(listing);
          count++;
        }
      }
      
    } catch (error) {
      console.error('Error parsing Facebook results:', error);
    }
    
    return listings;
  }

  // TIER 2 SOURCE MANAGEMENT METHODS
  private static async getTier2SourcesForSearch(searchId: string, supabase: any): Promise<any[]> {
    try {
      const { data: mappings, error } = await supabase
        .from('search_tier2_map')
        .select(`
          *,
          tier2_sources (*)
        `)
        .eq('search_id', searchId);
      
      if (error) {
        console.error('Error fetching Tier 2 mappings:', error);
        return [];
      }
      
      return mappings?.map((mapping: any) => ({
        ...mapping.tier2_sources,
        mapping_id: mapping.id,
        tier2_source_id: mapping.tier2_source_id
      })) || [];
      
    } catch (error) {
      console.error('Error in getTier2SourcesForSearch:', error);
      return [];
    }
  }

  private static async discoverTier2Sources(searchConfig: any): Promise<any[]> {
    try {
      if (!this.OPENAI_API_KEY) {
        console.warn('OpenAI API key not available for Tier 2 source discovery');
        return [];
      }
      
      const searchContext = [
        searchConfig.manufacturer,
        searchConfig.item_name,
        searchConfig.qualifier,
        searchConfig.sub_qualifier
      ].filter(Boolean).join(' ');

      const prompt = `Find 5-7 specialized online sources where people buy, sell, or discuss "${searchContext}". Focus on active, legitimate platforms only.

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
- Focus on brand-specific forums, specialized marketplaces, active Reddit communities
- Return valid JSON only, no additional text`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4.1-2025-04-14',
          messages: [
            { role: 'system', content: 'You are a research assistant that finds online marketplaces. Always respond with valid JSON only.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.1,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        console.error('OpenAI API error:', response.status);
        return [];
      }

      const data = await response.json();
      const content = data.choices[0].message.content.trim();
      
      try {
        const parsed = JSON.parse(content);
        return parsed.sources || [];
      } catch (parseError) {
        console.error('Failed to parse OpenAI response:', parseError);
        return [];
      }
      
    } catch (error) {
      console.error('Error discovering Tier 2 sources:', error);
      return [];
    }
  }

  private static async storeTier2Sources(searchId: string, discoveredSources: any[], supabase: any): Promise<any[]> {
    const storedSources: any[] = [];
    
    try {
      for (const source of discoveredSources) {
        // Insert into tier2_sources table
        const { data: tier2Source, error: sourceError } = await supabase
          .from('tier2_sources')
          .insert({
            name: source.name,
            url: source.url,
            type: source.type,
            reliability: source.reliability,
            notes: source.notes
          })
          .select()
          .single();
        
        if (sourceError) {
          console.error('Error storing Tier 2 source:', sourceError);
          continue;
        }
        
        // Create mapping to search
        const { data: mapping, error: mappingError } = await supabase
          .from('search_tier2_map')
          .insert({
            search_id: searchId,
            tier2_source_id: tier2Source.id
          })
          .select()
          .single();
        
        if (mappingError) {
          console.error('Error creating Tier 2 mapping:', mappingError);
          continue;
        }
        
        storedSources.push({
          ...tier2Source,
          mapping_id: mapping.id,
          tier2_source_id: tier2Source.id
        });
      }
      
    } catch (error) {
      console.error('Error in storeTier2Sources:', error);
    }
    
    return storedSources;
  }

  private static async scrapeTier2Source(source: any, searchConfig: any, supabase: any): Promise<any[]> {
    const listings: any[] = [];
    
    try {
      const searchQuery = this.generateSearchVariants(searchConfig)[0];
      const searchUrl = this.buildTier2SearchUrl(source, searchQuery);
      
      console.log(`Scraping Tier 2 source: ${source.name} - ${searchUrl}`);
      
      const data = await this.fetchWithScraperAPI(searchUrl);
      
      if (data) {
        // Generic parsing for Tier 2 sources
        const parsedListings = this.parseTier2Results(data, source, searchConfig, searchQuery);
        listings.push(...parsedListings);
      }
      
    } catch (error) {
      console.error(`Error scraping Tier 2 source ${source.name}:`, error);
    }
    
    return listings;
  }

  private static buildTier2SearchUrl(source: any, searchQuery: string): string {
    const encodedQuery = encodeURIComponent(searchQuery);
    
    if (source.url.includes('reddit.com')) {
      return `${source.url}/search?q=${encodedQuery}&sort=new`;
    } else if (source.url.includes('facebook.com')) {
      return `${source.url}/search?query=${encodedQuery}`;
    } else if (source.url.includes('forum') || source.type === 'forum') {
      return `${source.url}/search?keywords=${encodedQuery}`;
    } else {
      return `${source.url}/?search=${encodedQuery}`;
    }
  }

  private static parseTier2Results(html: string, source: any, searchConfig: any, searchQuery: string): any[] {
    const listings: any[] = [];
    
    try {
      // Generic patterns for Tier 2 sources
      const titlePricePattern = /<[^>]*>([^<]*(?:${searchQuery.split(' ')[0]}|sale|for sale)[^<]*)<[^>]*>[\s\S]*?\$([0-9,.]+)/gi;
      
      let match;
      let count = 0;
      
      while ((match = titlePricePattern.exec(html)) !== null && count < 3) {
        const title = match[1];
        const price = parseFloat(match[2].replace(/,/g, ''));
        
        if (title && price > 0) {
          const listing = {
            search_id: searchConfig.id,
            source_listing_id: `tier2-${source.id}-${Date.now()}-${count}`,
            source_name: source.name,
            source_url: source.url,
            title: title.trim(),
            description: `${searchQuery} found on ${source.name}`,
            price: price,
            price_threshold: searchConfig.price_threshold,
            max_price_allowed: searchConfig.max_price_allowed,
            location: `${source.name} marketplace`,
            listing_age: 'Recently posted',
            contact_info: `Contact via ${source.name}`,
            distance_miles: null,
            proximity_bucket: null,
            tier: 'tier2',
            is_within_threshold: price <= searchConfig.price_threshold,
            is_within_slider_range: price > searchConfig.price_threshold && price <= searchConfig.max_price_allowed,
            is_above_slider: price > searchConfig.max_price_allowed,
            is_price_changed: false,
            is_description_changed: false,
            is_ignored: false
          };
          
          listings.push(listing);
          count++;
        }
      }
      
    } catch (error) {
      console.error(`Error parsing Tier 2 results for ${source.name}:`, error);
    }
    
    return listings;
  }

  private static async updateTier2SourceStats(sourceId: string, listingsFound: number, wasSuccessful: boolean, supabase: any): Promise<void> {
    try {
      await supabase
        .from('search_tier2_map')
        .update({
          last_scraped_at: new Date().toISOString(),
          listings_found: listingsFound,
          was_successful: wasSuccessful
        })
        .eq('tier2_source_id', sourceId);
      
      // Update tier2_sources statistics
      await supabase
        .from('tier2_sources')
        .update({
          last_used_at: new Date().toISOString(),
          total_searches: supabase.sql`total_searches + 1`,
          total_listings_found: supabase.sql`total_listings_found + ${listingsFound}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', sourceId);
        
    } catch (error) {
      console.error('Error updating Tier 2 source stats:', error);
    }
  }

  // TIER 3 (TERTIARY) SOURCE METHODS
  private static async scrapeTertiarySource(domain: any, searchQuery: string, searchConfig: any, supabase: any): Promise<any[]> {
    const listings: any[] = [];
    
    try {
      const searchUrl = this.buildTertiarySearchUrl(domain, searchQuery);
      console.log(`Scraping tertiary source: ${domain.domain} - ${searchUrl}`);
      
      const data = await this.fetchWithScraperAPI(searchUrl);
      
      if (data) {
        const parsedListings = this.parseTertiaryResults(data, domain, searchConfig, searchQuery);
        listings.push(...parsedListings);
      }
      
    } catch (error) {
      console.error(`Error scraping tertiary source ${domain.domain}:`, error);
    }
    
    return listings;
  }

  private static buildTertiarySearchUrl(domain: any, searchQuery: string): string {
    const encodedQuery = encodeURIComponent(searchQuery);
    
    // Try to build appropriate search URL based on domain patterns
    if (domain.url.includes('/search')) {
      return `${domain.url}?q=${encodedQuery}`;
    } else {
      return `${domain.url}/?search=${encodedQuery}`;
    }
  }

  private static parseTertiaryResults(html: string, domain: any, searchConfig: any, searchQuery: string): any[] {
    const listings: any[] = [];
    
    try {
      // Basic pattern for tertiary sources
      const pattern = /<[^>]*>([^<]*(?:sale|sell|price)[^<]*\$[0-9,.]+[^<]*)<[^>]*>/gi;
      
      let match;
      let count = 0;
      
      while ((match = pattern.exec(html)) !== null && count < 2) {
        const text = match[1];
        const priceMatch = /\$([0-9,.]+)/.exec(text);
        
        if (priceMatch) {
          const price = parseFloat(priceMatch[1].replace(/,/g, ''));
          
          if (price > 0) {
            const listing = {
              search_id: searchConfig.id,
              source_listing_id: `tier3-${domain.id}-${Date.now()}-${count}`,
              source_name: domain.domain,
              source_url: domain.url,
              title: text.substring(0, 100).trim(),
              description: `${searchQuery} found on ${domain.domain}`,
              price: price,
              price_threshold: searchConfig.price_threshold,
              max_price_allowed: searchConfig.max_price_allowed,
              location: `${domain.domain} listing`,
              listing_age: 'Recently posted',
              contact_info: `Contact via ${domain.domain}`,
              distance_miles: null,
              proximity_bucket: null,
              tier: 'tier3',
              is_within_threshold: price <= searchConfig.price_threshold,
              is_within_slider_range: price > searchConfig.price_threshold && price <= searchConfig.max_price_allowed,
              is_above_slider: price > searchConfig.max_price_allowed,
              is_price_changed: false,
              is_description_changed: false,
              is_ignored: false
            };
            
            listings.push(listing);
            count++;
          }
        }
      }
      
    } catch (error) {
      console.error(`Error parsing tertiary results for ${domain.domain}:`, error);
    }
    
    return listings;
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
                const { data: notificationData, error: notificationError } = await supabase.functions.invoke('send-listing-notification', {
                  body: {
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
                  }
                });

                if (notificationError) {
                  console.error(`Failed to send notification for search ${searchConfig.id}:`, notificationError);
                } else {
                  console.log(`✅ Email notification sent for search ${searchConfig.id}`);
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
