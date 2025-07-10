
import { Listing, SearchConfig } from '@/types/database';

export interface ScrapingResult {
  listings: Listing[];
  source: string;
  searchQuery: string;
  totalFound: number;
}

export class EnhancedScraper {
  private static readonly SCRAPER_API_KEY = 'dd7d33c454f2bbca7b228f9d9eb23aec';
  private static readonly SCRAPER_API_URL = 'http://api.scraperapi.com';
  private static readonly CORS_PROXY = 'https://api.allorigins.win/get?url=';

  static async scrapeSearchConfig(searchConfig: SearchConfig): Promise<Listing[]> {
    console.log('Starting enhanced scrape for search config:', searchConfig.id);
    
    const allListings: Listing[] = [];
    const searchVariants = this.generateSearchVariants(searchConfig);
    
    // Define scraping sources with priority
    const scrapingSources = [
      { name: 'Craigslist', scraper: this.scrapeCraigslistEnhanced, priority: 1 },
      { name: 'Facebook Marketplace', scraper: this.scrapeFacebookEnhanced, priority: 1 },
      { name: 'eBay', scraper: this.scrapeEbayEnhanced, priority: 2 },
      { name: 'OfferUp', scraper: this.scrapeOfferUpEnhanced, priority: 2 },
    ];

    // Process each search variant across all sources
    for (const variant of searchVariants) {
      console.log(`Processing search variant: "${variant}"`);
      
      for (const source of scrapingSources) {
        try {
          const listings = await source.scraper(variant, searchConfig);
          if (listings.length > 0) {
            allListings.push(...listings);
            console.log(`Found ${listings.length} listings from ${source.name} for variant: ${variant}`);
          }
          
          // Add delay between requests to be respectful
          await this.delay(1000);
        } catch (error) {
          console.error(`Error scraping ${source.name} for variant "${variant}":`, error);
        }
      }
    }

    // Remove duplicates based on source_url
    const uniqueListings = this.removeDuplicates(allListings);
    console.log(`Total unique listings found: ${uniqueListings.length}`);
    
    return uniqueListings;
  }

  private static generateSearchVariants(searchConfig: SearchConfig): string[] {
    const variants: string[] = [];
    const baseTerms = [searchConfig.manufacturer, searchConfig.item_name].filter(Boolean);
    
    // Base search without years
    variants.push(baseTerms.join(' '));
    
    // Add qualifier variants
    if (searchConfig.qualifier) {
      variants.push([...baseTerms, searchConfig.qualifier].join(' '));
      
      if (searchConfig.sub_qualifier) {
        variants.push([...baseTerms, searchConfig.qualifier, searchConfig.sub_qualifier].join(' '));
      }
    }
    
    // Add year variants if specified
    if (searchConfig.year_start && searchConfig.year_end && searchConfig.year_start !== 1900) {
      const yearRange = searchConfig.year_end - searchConfig.year_start;
      
      if (yearRange <= 5) {
        // For small ranges, try each year
        for (let year = searchConfig.year_start; year <= searchConfig.year_end; year++) {
          variants.push([year.toString(), ...baseTerms].join(' '));
          
          if (searchConfig.qualifier) {
            variants.push([year.toString(), ...baseTerms, searchConfig.qualifier].join(' '));
          }
        }
      } else {
        // For large ranges, try start and end years
        variants.push([searchConfig.year_start.toString(), ...baseTerms].join(' '));
        variants.push([searchConfig.year_end.toString(), ...baseTerms].join(' '));
      }
    }
    
    return [...new Set(variants)]; // Remove duplicates
  }

  private static async scrapeCraigslistEnhanced(searchQuery: string, searchConfig: SearchConfig): Promise<Listing[]> {
    const listings: Listing[] = [];
    const cities = ['denver', 'sfbay', 'losangeles', 'newyork', 'chicago', 'seattle', 'austin'];
    
    for (const city of cities.slice(0, 3)) { // Limit to 3 cities to avoid rate limits
      try {
        const encodedQuery = encodeURIComponent(searchQuery);
        const searchUrl = `https://${city}.craigslist.org/search/sss?query=${encodedQuery}&sort=date`;
        
        console.log(`Scraping Craigslist ${city}: ${searchUrl}`);
        
        const data = await this.fetchWithScraperAPI(searchUrl);
        
        if (data.contents || data.body) {
          const html = data.contents || data.body;
          const parsedListings = this.parseCraigslistResults(html, searchConfig, city, searchQuery);
          listings.push(...parsedListings);
        }
        
        if (listings.length >= 10) break; // Limit total results
      } catch (error) {
        console.error(`Error scraping Craigslist ${city}:`, error);
      }
    }
    
    return listings;
  }

  private static async scrapeFacebookEnhanced(searchQuery: string, searchConfig: SearchConfig): Promise<Listing[]> {
    const listings: Listing[] = [];
    
    try {
      const encodedQuery = encodeURIComponent(searchQuery);
      const searchUrl = `https://www.facebook.com/marketplace/search/?query=${encodedQuery}`;
      
      console.log(`Scraping Facebook Marketplace: ${searchUrl}`);
      
      // Facebook is heavily protected, use fallback approach
      const data = await this.fetchWithFallback(searchUrl);
      
      if (data.contents) {
        const parsedListings = this.parseFacebookResults(data.contents, searchConfig, searchQuery);
        listings.push(...parsedListings);
      }
    } catch (error) {
      console.error('Error scraping Facebook Marketplace:', error);
    }
    
    return listings;
  }

  private static async scrapeEbayEnhanced(searchQuery: string, searchConfig: SearchConfig): Promise<Listing[]> {
    const listings: Listing[] = [];
    
    try {
      const encodedQuery = encodeURIComponent(searchQuery);
      const searchUrl = `https://www.ebay.com/sch/i.html?_nkw=${encodedQuery}&_sop=10`;
      
      console.log(`Scraping eBay: ${searchUrl}`);
      
      const data = await this.fetchWithScraperAPI(searchUrl);
      
      if (data.contents || data.body) {
        const html = data.contents || data.body;
        const parsedListings = this.parseEbayResults(html, searchConfig, searchQuery);
        listings.push(...parsedListings);
      }
    } catch (error) {
      console.error('Error scraping eBay:', error);
    }
    
    return listings;
  }

  private static async scrapeOfferUpEnhanced(searchQuery: string, searchConfig: SearchConfig): Promise<Listing[]> {
    const listings: Listing[] = [];
    
    try {
      const encodedQuery = encodeURIComponent(searchQuery);
      const searchUrl = `https://offerup.com/search/?q=${encodedQuery}`;
      
      console.log(`Scraping OfferUp: ${searchUrl}`);
      
      const data = await this.fetchWithScraperAPI(searchUrl);
      
      if (data.contents || data.body) {
        const html = data.contents || data.body;
        const parsedListings = this.parseOfferUpResults(html, searchConfig, searchQuery);
        listings.push(...parsedListings);
      }
    } catch (error) {
      console.error('Error scraping OfferUp:', error);
    }
    
    return listings;
  }

  private static async fetchWithScraperAPI(url: string): Promise<any> {
    const scraperUrl = `${this.SCRAPER_API_URL}?api_key=${this.SCRAPER_API_KEY}&url=${encodeURIComponent(url)}&render=false`;
    
    const response = await fetch(scraperUrl, {
      method: 'GET',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });
    
    if (!response.ok) {
      throw new Error(`ScraperAPI HTTP ${response.status}: ${response.statusText}`);
    }
    
    const html = await response.text();
    return { contents: html, body: html };
  }

  private static async fetchWithFallback(url: string): Promise<any> {
    try {
      // Try ScraperAPI first
      return await this.fetchWithScraperAPI(url);
    } catch (error) {
      console.warn('ScraperAPI failed, trying CORS proxy:', error);
      
      // Fallback to CORS proxy
      const proxyUrl = `${this.CORS_PROXY}${encodeURIComponent(url)}`;
      const response = await fetch(proxyUrl);
      
      if (!response.ok) {
        throw new Error(`CORS Proxy HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    }
  }

  private static parseCraigslistResults(html: string, searchConfig: SearchConfig, city: string, searchQuery: string): Listing[] {
    const listings: Listing[] = [];
    
    try {
      // Updated parsing patterns for current Craigslist structure
      const resultRowRegex = /<li class="[^"]*cl-search-result[^"]*"[^>]*>([\s\S]*?)<\/li>/g;
      const titleLinkRegex = /<a[^>]*href="([^"]*)"[^>]*class="[^"]*cl-app-anchor[^"]*"[^>]*[^>]*>([^<]*)<\/a>/;
      const priceRegex = /<span class="[^"]*result-price[^"]*"[^>]*>\$([0-9,]+)<\/span>/;
      const locationRegex = /<span class="[^"]*result-locality[^"]*"[^>]*>([^<]+)<\/span>/;
      
      let rowMatch;
      let foundCount = 0;
      
      while ((rowMatch = resultRowRegex.exec(html)) !== null && foundCount < 10) {
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
          
          const listing: Listing = {
            id: crypto.randomUUID(),
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
      
      console.log(`Craigslist ${city}: Parsed ${foundCount} listings`);
    } catch (error) {
      console.error(`Error parsing Craigslist ${city}:`, error);
    }
    
    return listings;
  }

  private static parseFacebookResults(html: string, searchConfig: SearchConfig, searchQuery: string): Listing[] {
    const listings: Listing[] = [];
    
    try {
      // Facebook has very dynamic structure, try multiple patterns
      const patterns = [
        /"marketplace_listing_title":"([^"]+)"[\s\S]*?"formatted_price":"([^"]+)"[\s\S]*?"listing_id":"([^"]+)"/g,
        /"title":{"text":"([^"]+)"}[\s\S]*?"primary_text":"([^"]+)"[\s\S]*?"id":"([^"]+)"/g
      ];
      
      let foundCount = 0;
      
      for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(html)) !== null && foundCount < 5) {
          const [, title, priceStr, listingId] = match;
          const price = parseInt(priceStr.replace(/[^0-9]/g, ''));
          
          if (price && listingId && title && price > 0) {
            const listing: Listing = {
              id: crypto.randomUUID(),
              search_id: searchConfig.id,
              source_listing_id: `fb-${listingId}`,
              source_name: 'Facebook Marketplace',
              source_url: `https://www.facebook.com/marketplace/item/${listingId}`,
              title: title,
              description: `${searchQuery} found on Facebook Marketplace`,
              price: price,
              price_threshold: searchConfig.price_threshold,
              max_price_allowed: searchConfig.max_price_allowed,
              location: 'Location not parsed',
              listing_age: 'Recently posted',
              contact_info: 'Contact via Facebook Marketplace',
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
      }
      
      console.log(`Facebook: Parsed ${foundCount} listings`);
    } catch (error) {
      console.error('Error parsing Facebook results:', error);
    }
    
    return listings;
  }

  private static parseEbayResults(html: string, searchConfig: SearchConfig, searchQuery: string): Listing[] {
    const listings: Listing[] = [];
    
    try {
      const itemRegex = /<div class="s-item__wrapper[^"]*"[^>]*>([\s\S]*?)<\/div>/g;
      const titleRegex = /<h3[^>]*class="[^"]*s-item__title[^"]*"[^>]*>([^<]+)<\/h3>/;
      const priceRegex = /<span class="[^"]*s-item__price[^"]*"[^>]*>\$([0-9,]+(?:\.[0-9]{2})?)<\/span>/;
      const linkRegex = /<a[^>]*href="([^"]*)"[^>]*class="[^"]*s-item__link[^"]*"/;
      
      let itemMatch;
      let foundCount = 0;
      
      while ((itemMatch = itemRegex.exec(html)) !== null && foundCount < 8) {
        const itemHtml = itemMatch[1];
        
        const titleMatch = titleRegex.exec(itemHtml);
        const priceMatch = priceRegex.exec(itemHtml);
        const linkMatch = linkRegex.exec(itemHtml);
        
        if (titleMatch && priceMatch && linkMatch) {
          const title = titleMatch[1].trim();
          const price = parseFloat(priceMatch[1].replace(/,/g, ''));
          const url = linkMatch[1];
          
          if (price > 0 && url) {
            const listing: Listing = {
              id: crypto.randomUUID(),
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
      }
      
      console.log(`eBay: Parsed ${foundCount} listings`);
    } catch (error) {
      console.error('Error parsing eBay results:', error);
    }
    
    return listings;
  }

  private static parseOfferUpResults(html: string, searchConfig: SearchConfig, searchQuery: string): Listing[] {
    const listings: Listing[] = [];
    
    try {
      // OfferUp often requires JavaScript, so results may be limited
      const itemRegex = /<div[^>]*data-testid="[^"]*search-result[^"]*"[^>]*>([\s\S]*?)<\/div>/g;
      const titleRegex = /<span[^>]*data-testid="[^"]*item-title[^"]*"[^>]*>([^<]+)<\/span>/;
      const priceRegex = /<span[^>]*>\$([0-9,]+)<\/span>/;
      
      let itemMatch;
      let foundCount = 0;
      
      while ((itemMatch = itemRegex.exec(html)) !== null && foundCount < 5) {
        const itemHtml = itemMatch[1];
        
        const titleMatch = titleRegex.exec(itemHtml);
        const priceMatch = priceRegex.exec(itemHtml);
        
        if (titleMatch && priceMatch) {
          const title = titleMatch[1].trim();
          const price = parseInt(priceMatch[1].replace(/,/g, ''));
          
          if (price > 0) {
            const listing: Listing = {
              id: crypto.randomUUID(),
              search_id: searchConfig.id,
              source_listing_id: `offerup-${Date.now()}-${foundCount}`,
              source_name: 'OfferUp',
              source_url: `https://offerup.com/search/?q=${encodeURIComponent(searchQuery)}`,
              title: title,
              description: `${searchQuery} found on OfferUp`,
              price: price,
              price_threshold: searchConfig.price_threshold,
              max_price_allowed: searchConfig.max_price_allowed,
              location: 'Local area',
              listing_age: 'Recently posted',
              contact_info: 'Contact via OfferUp',
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
      }
      
      console.log(`OfferUp: Parsed ${foundCount} listings`);
    } catch (error) {
      console.error('Error parsing OfferUp results:', error);
    }
    
    return listings;
  }

  private static removeDuplicates(listings: Listing[]): Listing[] {
    const seen = new Set<string>();
    return listings.filter(listing => {
      const key = `${listing.source_name}-${listing.title.toLowerCase()}-${listing.price}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
