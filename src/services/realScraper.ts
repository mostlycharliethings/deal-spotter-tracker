
import { Listing, SearchConfig } from '@/types/database';

export const scrapingSources = [
  { name: 'Facebook Marketplace', tier: 1 as const, baseUrl: 'https://facebook.com/marketplace', scrapeFrequency: 5, isActive: true },
  { name: 'Craigslist', tier: 1 as const, baseUrl: 'https://craigslist.org', scrapeFrequency: 5, isActive: true },
  { name: 'eBay', tier: 1 as const, baseUrl: 'https://ebay.com', scrapeFrequency: 5, isActive: true },
  { name: 'OfferUp', tier: 1 as const, baseUrl: 'https://offerup.com', scrapeFrequency: 5, isActive: true },
  { name: 'Mercari', tier: 2 as const, baseUrl: 'https://mercari.com', scrapeFrequency: 3, isActive: true },
  { name: 'Gumtree', tier: 2 as const, baseUrl: 'https://gumtree.com', scrapeFrequency: 3, isActive: true },
  { name: 'Reddit r/ForSale', tier: 2 as const, baseUrl: 'https://reddit.com/r/forsale', scrapeFrequency: 2, isActive: true },
  { name: 'Discord Communities', tier: 2 as const, baseUrl: 'https://discord.com', scrapeFrequency: 2, isActive: false }, // Disabled - requires authentication
  { name: 'Specialized Forums', tier: 2 as const, baseUrl: 'Various', scrapeFrequency: 2, isActive: true },
];

export class RealScraper {
  private static readonly CORS_PROXY = 'https://api.allorigins.win/get?url=';
  
  static async scrapeSearch(searchConfig: SearchConfig): Promise<Listing[]> {
    console.log('Starting real scrape for search config:', searchConfig);
    
    const allListings: Listing[] = [];
    const sources = [
      { name: 'Facebook Marketplace', scraper: this.scrapeFacebookMarketplace },
      { name: 'Craigslist', scraper: this.scrapeCraigslist },
      { name: 'eBay', scraper: this.scrapeEbay },
      { name: 'OfferUp', scraper: this.scrapeOfferUp },
      { name: 'Mercari', scraper: this.scrapeMercari },
      { name: 'Gumtree', scraper: this.scrapeGumtree },
      { name: 'Reddit r/ForSale', scraper: this.scrapeReddit },
      { name: 'Specialized Forums', scraper: this.scrapeForums },
    ];

    for (const source of sources) {
      try {
        console.log(`Scraping ${source.name}...`);
        const listings = await source.scraper(searchConfig);
        if (listings.length > 0) {
          allListings.push(...listings);
          console.log(`Found ${listings.length} real listings from ${source.name}`);
        } else {
          console.log(`No real listings found from ${source.name}`);
        }
      } catch (error) {
        console.error(`Error scraping ${source.name}:`, error);
        // Continue with other sources even if one fails
      }
    }

    console.log(`Total real listings found: ${allListings.length}`);
    return allListings;
  }

  private static async fetchWithProxy(url: string): Promise<any> {
    try {
      const proxyUrl = `${RealScraper.CORS_PROXY}${encodeURIComponent(url)}`;
      console.log('Fetching with proxy:', proxyUrl);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const contentLength = response.headers.get('content-length');
      if (contentLength && parseInt(contentLength) > 10000000) {
        throw new Error('Response too large, skipping to prevent memory issues');
      }
      
      const text = await response.text();
      
      try {
        return JSON.parse(text);
      } catch (parseError) {
        console.warn('Failed to parse JSON response:', parseError);
        return { contents: text };
      }
    } catch (error) {
      console.error('Proxy fetch error:', error);
      
      if (error instanceof Error && 
          (error.message.includes('Content-Length') || 
           error.message.includes('Response too large') ||
           error.name === 'AbortError')) {
        console.warn('Skipping source due to response size/parsing issue');
        return { contents: '' };
      }
      
      throw error;
    }
  }

  private static validateListingUrl(url: string, sourceName: string): boolean {
    if (!url || typeof url !== 'string') return false;
    
    // Check for invalid/fake domains - expanded list
    const invalidDomains = [
      'localclassifieds.com',
      'example.com',
      'test.com',
      'placeholder.com',
      'forum.example.com',
      'sample.com',
      'demo.com',
      'fake.com'
    ];
    
    const domain = url.match(/https?:\/\/(?:www\.)?([^\/]+)/)?.[1];
    if (domain && invalidDomains.some(invalid => domain.includes(invalid))) {
      console.warn(`Filtering out invalid domain: ${domain} from ${sourceName}`);
      return false;
    }
    
    // Validate URL format
    try {
      const urlObj = new URL(url);
      // Ensure it's a real domain with proper TLD
      if (!urlObj.hostname.includes('.') || urlObj.hostname.endsWith('.local')) {
        console.warn(`Invalid hostname: ${urlObj.hostname}`);
        return false;
      }
      return true;
    } catch {
      console.warn(`Invalid URL format: ${url}`);
      return false;
    }
  }

  private static async scrapeFacebookMarketplace(searchConfig: SearchConfig): Promise<Listing[]> {
    const listings: Listing[] = [];
    
    try {
      const searchQuery = RealScraper.buildSearchQuery(searchConfig);
      const encodedQuery = encodeURIComponent(searchQuery);
      
      const searchUrl = `https://www.facebook.com/marketplace/search/?query=${encodedQuery}`;
      
      console.log('Scraping Facebook Marketplace with URL:', searchUrl);
      
      const data = await RealScraper.fetchWithProxy(searchUrl);
      
      if (data.contents) {
        const parsedListings = RealScraper.parseFacebookMarketplace(data.contents, searchConfig);
        // Only return listings that pass validation
        const validListings = parsedListings.filter(listing => 
          this.validateListingUrl(listing.source_url, 'Facebook Marketplace')
        );
        listings.push(...validListings);
        
        if (parsedListings.length > validListings.length) {
          console.warn(`Filtered out ${parsedListings.length - validListings.length} invalid Facebook listings`);
        }
      }
    } catch (error) {
      console.error('Facebook Marketplace scraping error:', error);
    }

    return listings;
  }

  private static async scrapeCraigslist(searchConfig: SearchConfig): Promise<Listing[]> {
    const listings: Listing[] = [];
    
    try {
      const searchQuery = RealScraper.buildSearchQuery(searchConfig);
      const encodedQuery = encodeURIComponent(searchQuery);
      
      // Use multiple major city craigslist sites for better coverage
      const cities = ['denver', 'sfbay', 'losangeles', 'newyork', 'chicago'];
      
      for (const city of cities) {
        try {
          const searchUrl = `https://${city}.craigslist.org/search/sss?query=${encodedQuery}&sort=date`;
          
          console.log(`Scraping Craigslist ${city} with URL:`, searchUrl);
          
          const data = await RealScraper.fetchWithProxy(searchUrl);
          
          if (data.contents) {
            const parsedListings = RealScraper.parseCraigslist(data.contents, searchConfig, city);
            // Only return listings that pass validation
            const validListings = parsedListings.filter(listing => 
              this.validateListingUrl(listing.source_url, 'Craigslist')
            );
            listings.push(...validListings);
            
            if (validListings.length > 0) {
              console.log(`Found ${validListings.length} valid Craigslist listings from ${city}`);
            }
            
            // Limit to prevent too many requests
            if (listings.length >= 10) break;
          }
        } catch (error) {
          console.error(`Error scraping Craigslist ${city}:`, error);
          continue;
        }
      }
    } catch (error) {
      console.error('Craigslist scraping error:', error);
    }

    return listings;
  }

  private static async scrapeEbay(searchConfig: SearchConfig): Promise<Listing[]> {
    const listings: Listing[] = [];
    
    try {
      console.log('eBay scraping skipped due to consistent large response issues that cause memory problems');
      console.log('Consider implementing eBay API integration for reliable data');
      return listings;
      
    } catch (error) {
      console.error('eBay scraping error:', error);
    }

    return listings;
  }

  private static async scrapeOfferUp(searchConfig: SearchConfig): Promise<Listing[]> {
    const listings: Listing[] = [];
    
    try {
      const searchQuery = RealScraper.buildSearchQuery(searchConfig);
      const encodedQuery = encodeURIComponent(searchQuery);
      
      const searchUrl = `https://offerup.com/search/?q=${encodedQuery}`;
      
      console.log('Scraping OfferUp with URL:', searchUrl);
      
      const data = await RealScraper.fetchWithProxy(searchUrl);
      
      if (data.contents) {
        const parsedListings = RealScraper.parseOfferUp(data.contents, searchConfig);
        // Only return listings that pass validation
        const validListings = parsedListings.filter(listing => 
          this.validateListingUrl(listing.source_url, 'OfferUp')
        );
        listings.push(...validListings);
      }
    } catch (error) {
      console.error('OfferUp scraping error:', error);
    }

    return listings;
  }

  private static async scrapeMercari(searchConfig: SearchConfig): Promise<Listing[]> {
    const listings: Listing[] = [];
    
    try {
      console.log('Mercari scraping not implemented - requires JavaScript rendering for dynamic content');
      console.log('Consider using Puppeteer or similar for JavaScript-heavy sites');
    } catch (error) {
      console.error('Mercari scraping error:', error);
    }

    return listings;
  }

  private static async scrapeGumtree(searchConfig: SearchConfig): Promise<Listing[]> {
    const listings: Listing[] = [];
    
    try {
      console.log('Gumtree scraping not implemented - requires complex parsing logic');
      console.log('Consider implementing specific Gumtree parsing patterns');
    } catch (error) {
      console.error('Gumtree scraping error:', error);
    }

    return listings;
  }

  private static async scrapeReddit(searchConfig: SearchConfig): Promise<Listing[]> {
    const listings: Listing[] = [];
    
    try {
      console.log('Reddit r/ForSale scraping requires Reddit API access for reliable data');
      console.log('Direct scraping of Reddit is challenging due to their anti-bot measures');
    } catch (error) {
      console.error('Reddit scraping error:', error);
    }

    return listings;
  }

  private static async scrapeForums(searchConfig: SearchConfig): Promise<Listing[]> {
    const listings: Listing[] = [];
    
    try {
      console.log('Specialized Forums scraping requires knowledge of specific forum structures');
      console.log('Consider implementing specific forum parsers based on popular platforms');
    } catch (error) {
      console.error('Forums scraping error:', error);
    }

    return listings;
  }

  private static buildSearchQuery(searchConfig: SearchConfig): string {
    const terms = [];
    
    if (searchConfig.year_start && searchConfig.year_end) {
      for (let year = searchConfig.year_start; year <= searchConfig.year_end; year++) {
        terms.push(`${year} ${searchConfig.manufacturer} ${searchConfig.item_name}`);
      }
    } else {
      terms.push(`${searchConfig.manufacturer} ${searchConfig.item_name}`);
    }
    
    if (searchConfig.qualifier) {
      const baseSearch = `${searchConfig.manufacturer} ${searchConfig.item_name}`;
      terms.push(`${baseSearch} ${searchConfig.qualifier}`);
      
      if (searchConfig.sub_qualifier) {
        terms.push(`${baseSearch} ${searchConfig.qualifier} ${searchConfig.sub_qualifier}`);
      }
    }
    
    return terms[0] || `${searchConfig.manufacturer} ${searchConfig.item_name}`;
  }

  private static parseFacebookMarketplace(html: string, searchConfig: SearchConfig): Listing[] {
    const listings: Listing[] = [];
    
    try {
      console.log('Parsing Facebook HTML, length:', html.length);
      
      // Facebook Marketplace uses heavy JavaScript - static HTML parsing often fails
      if (html.includes('You must log in to continue') || html.includes('Log into Facebook')) {
        console.warn('Facebook requires login - scraping blocked');
        return listings;
      }
      
      if (html.includes('blocked') || html.includes('security') || html.length < 1000) {
        console.warn('Facebook appears to have blocked the request');
        return listings;
      }
      
      // Look for actual listing data in the HTML - Facebook uses complex JSON structures
      const jsonRegex = /"marketplace_listing_title":"([^"]+)"[\s\S]*?"formatted_price":"([^"]+)"[\s\S]*?"listing_id":"([^"]+)"/g;
      let match;
      let foundCount = 0;
      
      while ((match = jsonRegex.exec(html)) !== null && foundCount < 5) {
        const [, title, priceStr, listingId] = match;
        const price = parseInt(priceStr.replace(/[^0-9]/g, ''));
        
        if (price && listingId && title) {
          const listingUrl = `https://www.facebook.com/marketplace/item/${listingId}`;
          
          const listing: Listing = {
            id: crypto.randomUUID(),
            search_id: searchConfig.id,
            source_listing_id: `fb-${listingId}`,
            source_name: 'Facebook Marketplace',
            source_url: listingUrl,
            title: title,
            description: `${searchConfig.manufacturer} ${searchConfig.item_name} found on Facebook Marketplace`,
            price: price,
            price_threshold: searchConfig.price_threshold,
            max_price_allowed: searchConfig.max_price_allowed,
            location: 'Location not parsed',
            listing_age: 'Age not parsed',
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
      
      console.log(`Facebook parsing found ${foundCount} potential listings`);
      
    } catch (error) {
      console.error('Error parsing Facebook Marketplace:', error);
    }
    
    return listings;
  }

  private static parseCraigslist(html: string, searchConfig: SearchConfig, city: string): Listing[] {
    const listings: Listing[] = [];
    
    try {
      console.log(`Parsing Craigslist ${city} HTML, length:`, html.length);
      
      // Check if Craigslist blocked the request
      if (html.includes('blocked') || html.includes('security check') || html.length < 1000) {
        console.warn(`Craigslist ${city} appears to have blocked the request`);
        return listings;
      }
      
      // Look for the .result-row class which contains each listing
      const resultRowRegex = /<li class="result-row"[^>]*>([\s\S]*?)<\/li>/g;
      const titleLinkRegex = /<a href="([^"]*)" data-id="([^"]*)" class="result-title[^"]*">([^<]*)<\/a>/;
      const priceRegex = /<span class="result-price"[^>]*>\$([0-9,]+)<\/span>/;
      const hoodRegex = /<span class="result-hood"[^>]*>\s*\(([^)]+)\)<\/span>/;
      const timeRegex = /<time[^>]*datetime="([^"]*)"[^>]*title="([^"]*)"[^>]*>/;
      
      let rowMatch;
      let foundRows = 0;
      
      while ((rowMatch = resultRowRegex.exec(html)) !== null && foundRows < 15) {
        const rowHtml = rowMatch[1];
        foundRows++;
        
        // Extract title and URL
        const titleMatch = titleLinkRegex.exec(rowHtml);
        if (!titleMatch) {
          continue;
        }
        
        const [, relativeUrl, dataId, title] = titleMatch;
        
        // Extract price
        const priceMatch = priceRegex.exec(rowHtml);
        if (!priceMatch) {
          continue;
        }
        
        const price = parseInt(priceMatch[1].replace(/,/g, ''));
        
        // Extract location
        const hoodMatch = hoodRegex.exec(rowHtml);
        const location = hoodMatch ? hoodMatch[1] : `${city} area`;
        
        // Extract time - use actual parsed time or indicate unknown
        const timeMatch = timeRegex.exec(rowHtml);
        const listingAge = timeMatch ? timeMatch[2] : 'Age not available';
        
        // Build full URL
        const fullUrl = relativeUrl.startsWith('http') ? 
          relativeUrl : 
          `https://${city}.craigslist.org${relativeUrl}`;
        
        const listing: Listing = {
          id: crypto.randomUUID(),
          search_id: searchConfig.id,
          source_listing_id: dataId || `cl-${city}-${Date.now()}-${foundRows}`,
          source_name: 'Craigslist',
          source_url: fullUrl,
          title: title.trim(),
          description: `${searchConfig.manufacturer} ${searchConfig.item_name} found on Craigslist ${city}`,
          price: price,
          price_threshold: searchConfig.price_threshold,
          max_price_allowed: searchConfig.max_price_allowed,
          location: location,
          listing_age: listingAge,
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
      }
      
      console.log(`Craigslist ${city}: Found ${foundRows} rows, extracted ${listings.length} listings`);
      
    } catch (error) {
      console.error(`Error parsing Craigslist ${city}:`, error);
    }
    
    return listings;
  }

  private static parseOfferUp(html: string, searchConfig: SearchConfig): Listing[] {
    const listings: Listing[] = [];
    
    try {
      console.log('Parsing OfferUp HTML, length:', html.length);
      
      // OfferUp uses heavy JavaScript - static HTML parsing often fails
      if (html.includes('Please enable JavaScript') || html.length < 1000) {
        console.warn('OfferUp requires JavaScript - static parsing limited');
        return listings;
      }
      
      // OfferUp likely requires more sophisticated parsing
      console.log('OfferUp parsing not fully implemented - requires JavaScript rendering');
      
    } catch (error) {
      console.error('Error parsing OfferUp:', error);
    }
    
    return listings;
  }
}
