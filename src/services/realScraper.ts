
import { Listing, SearchConfig } from '@/types/database';
import { EnhancedScraper } from './enhancedScraper';

export const scrapingSources = [
  { name: 'Craigslist', tier: 1 as const, baseUrl: 'https://craigslist.org', scrapeFrequency: 5, isActive: true },
  { name: 'eBay', tier: 1 as const, baseUrl: 'https://ebay.com', scrapeFrequency: 5, isActive: true },
  { name: 'Facebook Marketplace', tier: 1 as const, baseUrl: 'https://facebook.com/marketplace', scrapeFrequency: 5, isActive: true },
  { name: 'OfferUp', tier: 2 as const, baseUrl: 'https://offerup.com', scrapeFrequency: 3, isActive: true },
  { name: 'Mercari', tier: 2 as const, baseUrl: 'https://mercari.com', scrapeFrequency: 3, isActive: true },
];

export class RealScraper {
  static async scrapeSearch(searchConfig: SearchConfig): Promise<Listing[]> {
    console.log('Starting enhanced real scrape for search config:', searchConfig);
    
    try {
      // Use the enhanced scraper
      const listings = await EnhancedScraper.scrapeSearchConfig(searchConfig);
      
      console.log(`Enhanced scraper found ${listings.length} listings`);
      
      return listings;
    } catch (error) {
      console.error('Enhanced scraping failed, falling back to basic scraper:', error);
      
      // Fallback to the original scraper if enhanced fails
      return this.fallbackScrape(searchConfig);
    }
  }

  private static async fallbackScrape(searchConfig: SearchConfig): Promise<Listing[]> {
    console.log('Using fallback scraper');
    
    const allListings: Listing[] = [];
    
    // Basic Craigslist scraping as fallback
    try {
      const searchQuery = this.buildSearchQuery(searchConfig);
      const cities = ['denver', 'sfbay', 'losangeles'];
      
      for (const city of cities) {
        try {
          const encodedQuery = encodeURIComponent(searchQuery);
          const searchUrl = `https://${city}.craigslist.org/search/sss?query=${encodedQuery}&sort=date`;
          
          const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(searchUrl)}`;
          const response = await fetch(proxyUrl);
          
          if (response.ok) {
            const data = await response.json();
            if (data.contents) {
              const listings = this.parseCraigslistFallback(data.contents, searchConfig, city);
              allListings.push(...listings);
            }
          }
        } catch (error) {
          console.error(`Fallback scraping error for ${city}:`, error);
        }
      }
    } catch (error) {
      console.error('Fallback scraping error:', error);
    }
    
    return allListings;
  }

  private static buildSearchQuery(searchConfig: SearchConfig): string {
    const terms = [searchConfig.manufacturer, searchConfig.item_name];
    
    if (searchConfig.qualifier) {
      terms.push(searchConfig.qualifier);
    }
    
    return terms.filter(Boolean).join(' ');
  }

  private static parseCraigslistFallback(html: string, searchConfig: SearchConfig, city: string): Listing[] {
    const listings: Listing[] = [];
    
    try {
      const resultRowRegex = /<li class="result-row"[^>]*>([\s\S]*?)<\/li>/g;
      const titleLinkRegex = /<a href="([^"]*)" data-id="([^"]*)" class="result-title[^"]*">([^<]*)<\/a>/;
      const priceRegex = /<span class="result-price"[^>]*>\$([0-9,]+)<\/span>/;
      
      let rowMatch;
      let foundCount = 0;
      
      while ((rowMatch = resultRowRegex.exec(html)) !== null && foundCount < 5) {
        const rowHtml = rowMatch[1];
        
        const titleMatch = titleLinkRegex.exec(rowHtml);
        const priceMatch = priceRegex.exec(rowHtml);
        
        if (titleMatch && priceMatch) {
          const [, relativeUrl, dataId, title] = titleMatch;
          const price = parseInt(priceMatch[1].replace(/,/g, ''));
          
          const fullUrl = relativeUrl.startsWith('http') ? 
            relativeUrl : 
            `https://${city}.craigslist.org${relativeUrl}`;
          
          const listing: Listing = {
            id: crypto.randomUUID(),
            search_id: searchConfig.id,
            source_listing_id: dataId || `cl-fallback-${city}-${Date.now()}-${foundCount}`,
            source_name: 'Craigslist',
            source_url: fullUrl,
            title: title.trim(),
            description: `${searchConfig.manufacturer} ${searchConfig.item_name} found on Craigslist ${city}`,
            price: price,
            price_threshold: searchConfig.price_threshold,
            max_price_allowed: searchConfig.max_price_allowed,
            location: `${city} area`,
            listing_age: 'Recently posted',
            contact_info: 'Contact via Craigslist',
            date_scraped: new Date().toISOString(),
            last_seen_at: new Date().toISOString(),
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
      console.error(`Error in fallback parsing for ${city}:`, error);
    }
    
    return listings;
  }

  // Static method to trigger automated scraping via Edge Function
  static async triggerAutomatedScraping(): Promise<{ success: boolean; message: string }> {
    try {
      console.log('Triggering automated scraping via Edge Function');
      
      const response = await fetch('https://brlvephljobxfivqlope.supabase.co/functions/v1/automated-scraping', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`HTTP ${response.status}: ${response.statusText}`, errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Automated scraping result:', result);

      if (result.success) {
        return {
          success: true,
          message: `Automated scraping completed. Found ${result.totalNewListings || 0} new listings across ${result.totalSearchConfigs || 0} searches.`
        };
      } else {
        throw new Error(result.error || 'Unknown error occurred');
      }

    } catch (error) {
      console.error('Error triggering automated scraping:', error);
      return {
        success: false,
        message: `Failed to trigger automated scraping: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}
