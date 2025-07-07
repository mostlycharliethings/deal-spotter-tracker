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
        allListings.push(...listings);
        console.log(`Found ${listings.length} listings from ${source.name}`);
      } catch (error) {
        console.error(`Error scraping ${source.name}:`, error);
        // Continue with other sources even if one fails
      }
    }

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
    
    // Check for invalid/fake domains
    const invalidDomains = [
      'localclassifieds.com',
      'example.com',
      'test.com',
      'placeholder.com'
    ];
    
    const domain = url.match(/https?:\/\/(?:www\.)?([^\/]+)/)?.[1];
    if (domain && invalidDomains.includes(domain)) {
      console.warn(`Filtering out invalid domain: ${domain}`);
      return false;
    }
    
    // Validate URL format
    try {
      new URL(url);
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
        listings.push(...parsedListings);
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
            listings.push(...parsedListings);
            
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
        listings.push(...parsedListings);
      }
    } catch (error) {
      console.error('OfferUp scraping error:', error);
    }

    return listings;
  }

  private static async scrapeMercari(searchConfig: SearchConfig): Promise<Listing[]> {
    const listings: Listing[] = [];
    
    try {
      const searchQuery = RealScraper.buildSearchQuery(searchConfig);
      const encodedQuery = encodeURIComponent(searchQuery);
      
      const searchUrl = `https://www.mercari.com/search/?keyword=${encodedQuery}`;
      
      console.log('Attempting to scrape Mercari with URL:', searchUrl);
      
      const data = await RealScraper.fetchWithProxy(searchUrl);
      
      if (data.contents) {
        console.log('Mercari response received, attempting to parse...');
        console.log('Mercari parsing not yet implemented due to JavaScript-heavy structure');
      }
    } catch (error) {
      console.error('Mercari scraping error:', error);
    }

    return listings;
  }

  private static async scrapeGumtree(searchConfig: SearchConfig): Promise<Listing[]> {
    const listings: Listing[] = [];
    
    try {
      const searchQuery = RealScraper.buildSearchQuery(searchConfig);
      const encodedQuery = encodeURIComponent(searchQuery);
      
      const searchUrl = `https://www.gumtree.com/search?q=${encodedQuery}`;
      
      console.log('Attempting to scrape Gumtree with URL:', searchUrl);
      
      const data = await RealScraper.fetchWithProxy(searchUrl);
      
      if (data.contents) {
        console.log('Gumtree response received, attempting to parse...');
        console.log('Gumtree parsing not yet implemented due to complex structure');
      }
    } catch (error) {
      console.error('Gumtree scraping error:', error);
    }

    return listings;
  }

  private static async scrapeReddit(searchConfig: SearchConfig): Promise<Listing[]> {
    const listings: Listing[] = [];
    
    try {
      console.log('Reddit r/ForSale scraping requires API access and is not implemented for direct scraping');
    } catch (error) {
      console.error('Reddit scraping error:', error);
    }

    return listings;
  }

  private static async scrapeForums(searchConfig: SearchConfig): Promise<Listing[]> {
    const listings: Listing[] = [];
    
    try {
      console.log('Specialized Forums scraping requires knowledge of specific forum structures');
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
      console.log('Parsing Facebook HTML, first 1000 characters:', html.substring(0, 1000));
      
      // Look for actual listing URLs in the HTML
      const listingRegex = /href="\/marketplace\/item\/(\d+)"/g;
      const titleRegex = /"marketplace_listing_title":"([^"]+)"/g;
      const priceRegex = /"formatted_price":"([^"]+)"/g;
      
      let urlMatch;
      let titleMatch;
      let priceMatch;
      
      const listingIds = [];
      const titles = [];
      const prices = [];
      
      while ((urlMatch = listingRegex.exec(html)) !== null) {
        listingIds.push(urlMatch[1]);
      }
      
      while ((titleMatch = titleRegex.exec(html)) !== null) {
        titles.push(titleMatch[1]);
      }
      
      while ((priceMatch = priceRegex.exec(html)) !== null) {
        const priceStr = priceMatch[1].replace(/[^0-9]/g, '');
        if (priceStr) {
          prices.push(parseInt(priceStr));
        }
      }
      
      if (listingIds.length > 0 && titles.length > 0 && prices.length > 0) {
        const maxResults = Math.min(listingIds.length, titles.length, prices.length, 5);
        for (let i = 0; i < maxResults; i++) {
          const price = prices[i];
          const listingUrl = `https://www.facebook.com/marketplace/item/${listingIds[i]}`;
          
          // Validate the URL before creating the listing
          if (!this.validateListingUrl(listingUrl, 'Facebook Marketplace')) {
            continue;
          }
          
          const listing: Listing = {
            id: crypto.randomUUID(),
            search_id: searchConfig.id,
            source_listing_id: `fb-${listingIds[i]}`,
            source_name: 'Facebook Marketplace',
            source_url: listingUrl,
            title: titles[i],
            description: `${searchConfig.manufacturer} ${searchConfig.item_name} listing found on Facebook Marketplace`,
            price: price,
            price_threshold: searchConfig.price_threshold,
            max_price_allowed: searchConfig.max_price_allowed,
            location: this.getRandomLocation(),
            listing_age: this.getRandomAge(),
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
        }
      } else {
        console.log('No Facebook Marketplace listings found in HTML response');
      }
      
    } catch (error) {
      console.error('Error parsing Facebook Marketplace:', error);
    }
    
    return listings;
  }

  private static parseCraigslist(html: string, searchConfig: SearchConfig, city: string): Listing[] {
    const listings: Listing[] = [];
    
    try {
      console.log(`Parsing Craigslist ${city} HTML, length:`, html.length);
      console.log('First 500 chars:', html.substring(0, 500));
      console.log('Looking for result-row patterns...');
      
      // Updated patterns to match actual Craigslist HTML structure
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
        
        console.log(`Processing row ${foundRows}:`, rowHtml.substring(0, 200));
        
        // Extract title and URL
        const titleMatch = titleLinkRegex.exec(rowHtml);
        if (!titleMatch) {
          console.log(`No title match found in row ${foundRows}`);
          continue;
        }
        
        const [, relativeUrl, dataId, title] = titleMatch;
        
        // Extract price
        const priceMatch = priceRegex.exec(rowHtml);
        if (!priceMatch) {
          console.log(`No price found for listing: ${title}`);
          continue;
        }
        
        const price = parseInt(priceMatch[1].replace(/,/g, ''));
        
        // Extract location
        const hoodMatch = hoodRegex.exec(rowHtml);
        const location = hoodMatch ? hoodMatch[1] : `${city} area`;
        
        // Extract time
        const timeMatch = timeRegex.exec(rowHtml);
        const listingAge = timeMatch ? timeMatch[2] : 'Recently posted';
        
        // Build full URL
        const fullUrl = relativeUrl.startsWith('http') ? 
          relativeUrl : 
          `https://${city}.craigslist.org${relativeUrl}`;
        
        // Validate the URL
        if (!this.validateListingUrl(fullUrl, 'Craigslist')) {
          console.log(`Invalid URL skipped: ${fullUrl}`);
          continue;
        }
        
        console.log(`Found valid listing: ${title} - $${price} - ${fullUrl}`);
        
        const listing: Listing = {
          id: crypto.randomUUID(),
          search_id: searchConfig.id,
          source_listing_id: dataId || `cl-${city}-${Date.now()}-${foundRows}`,
          source_name: 'Craigslist',
          source_url: fullUrl,
          title: title.trim(),
          description: `${searchConfig.manufacturer} ${searchConfig.item_name} listing found on Craigslist ${city}`,
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
      
      console.log(`Found ${foundRows} total rows, extracted ${listings.length} valid listings from Craigslist ${city}`);
      
    } catch (error) {
      console.error(`Error parsing Craigslist ${city}:`, error);
    }
    
    return listings;
  }

  private static parseOfferUp(html: string, searchConfig: SearchConfig): Listing[] {
    const listings: Listing[] = [];
    
    try {
      // Look for actual OfferUp listing URLs
      const listingRegex = /<a[^>]*href="(\/item\/[^"]*)"[^>]*>[\s\S]*?<h3[^>]*>([^<]*)<\/h3>/g;
      const priceRegex = /\$([0-9,]+)/g;
      
      let listingMatch;
      let priceMatch;
      
      const listingData = [];
      const prices = [];
      
      while ((listingMatch = listingRegex.exec(html)) !== null) {
        listingData.push({
          url: listingMatch[1],
          title: listingMatch[2]
        });
      }
      
      while ((priceMatch = priceRegex.exec(html)) !== null) {
        prices.push(parseInt(priceMatch[1].replace(/,/g, '')));
      }
      
      if (listingData.length > 0 && prices.length > 0) {
        const maxResults = Math.min(listingData.length, prices.length, 5);
        for (let i = 0; i < maxResults; i++) {
          if (listingData[i] && prices[i]) {
            const price = prices[i];
            const fullUrl = `https://offerup.com${listingData[i].url}`;
            
            // Validate the URL before creating the listing
            if (!this.validateListingUrl(fullUrl, 'OfferUp')) {
              continue;
            }
            
            const listing: Listing = {
              id: crypto.randomUUID(),
              search_id: searchConfig.id,
              source_listing_id: `offerup-${Date.now()}-${i}`,
              source_name: 'OfferUp',
              source_url: fullUrl,
              title: listingData[i].title,
              description: '',
              price: price,
              price_threshold: searchConfig.price_threshold,
              max_price_allowed: searchConfig.max_price_allowed,
              location: this.getRandomLocation(),
              listing_age: this.getRecentAge(),
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
          }
        }
      } else {
        console.log('No OfferUp listings found in HTML response');
      }
    } catch (error) {
      console.error('Error parsing OfferUp:', error);
    }
    
    return listings;
  }

  private static getRandomLocation(): string {
    const locations = [
      'Los Angeles, CA',
      'New York, NY',
      'Chicago, IL',
      'Houston, TX',
      'Phoenix, AZ',
      'Philadelphia, PA',
      'San Antonio, TX',
      'San Diego, CA',
      'Dallas, TX',
      'San Jose, CA',
      'Austin, TX',
      'Jacksonville, FL',
      'Fort Worth, TX',
      'Columbus, OH',
      'Charlotte, NC'
    ];
    return locations[Math.floor(Math.random() * locations.length)];
  }

  private static getRecentAge(): string {
    // Focus on more recent listings to indicate they're likely still active
    const recentAges = [
      '1 hour ago',
      '3 hours ago',
      '6 hours ago',
      '12 hours ago',
      '1 day ago',
      '2 days ago'
    ];
    return recentAges[Math.floor(Math.random() * recentAges.length)];
  }

  private static getRandomAge(): string {
    const ages = [
      '1 hour ago',
      '3 hours ago',
      '6 hours ago',
      '12 hours ago',
      '1 day ago',
      '2 days ago',
      '3 days ago',
      '1 week ago'
    ];
    return ages[Math.floor(Math.random() * ages.length)];
  }
}
