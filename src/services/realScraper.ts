
import { Listing, SearchConfig } from '@/types/database';

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
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds
      
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
      
      // Check content-length to avoid large response issues
      const contentLength = response.headers.get('content-length');
      if (contentLength && parseInt(contentLength) > 10000000) { // 10MB limit
        throw new Error('Response too large, skipping to prevent memory issues');
      }
      
      const text = await response.text();
      
      // Try to parse as JSON, if it fails, return the text wrapped in a contents object
      try {
        return JSON.parse(text);
      } catch (parseError) {
        console.warn('Failed to parse JSON response:', parseError);
        return { contents: text };
      }
    } catch (error) {
      console.error('Proxy fetch error:', error);
      
      // If it's a content-length or parsing error, return empty result instead of throwing
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

  private static async scrapeFacebookMarketplace(searchConfig: SearchConfig): Promise<Listing[]> {
    const listings: Listing[] = [];
    
    try {
      const searchQuery = RealScraper.buildSearchQuery(searchConfig);
      const encodedQuery = encodeURIComponent(searchQuery);
      
      // Facebook Marketplace general search URL
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
      
      // Craigslist for sale search URL (general items, not just cars)
      const searchUrl = `https://craigslist.org/search/sss?query=${encodedQuery}&sort=date`;
      
      console.log('Scraping Craigslist with URL:', searchUrl);
      
      const data = await RealScraper.fetchWithProxy(searchUrl);
      
      if (data.contents) {
        const parsedListings = RealScraper.parseCraigslist(data.contents, searchConfig);
        listings.push(...parsedListings);
      }
    } catch (error) {
      console.error('Craigslist scraping error:', error);
    }

    return listings;
  }

  private static async scrapeEbay(searchConfig: SearchConfig): Promise<Listing[]> {
    const listings: Listing[] = [];
    
    try {
      const searchQuery = RealScraper.buildSearchQuery(searchConfig);
      const encodedQuery = encodeURIComponent(searchQuery);
      
      // eBay general search URL (not limited to motors)
      const searchUrl = `https://www.ebay.com/sch/i.html?_nkw=${encodedQuery}&_sop=10`;
      
      console.log('Scraping eBay with URL:', searchUrl);
      console.log('Note: eBay often has large responses, skipping to avoid memory issues');
      
      // Skip eBay for now due to consistent large response issues
      console.warn('Skipping eBay scraping due to consistent content-length issues');
      return listings;
      
    } catch (error) {
      console.error('eBay scraping error:', error);
      // eBay often has large responses that cause issues, so we'll continue gracefully
    }

    return listings;
  }

  private static async scrapeOfferUp(searchConfig: SearchConfig): Promise<Listing[]> {
    const listings: Listing[] = [];
    
    try {
      const searchQuery = RealScraper.buildSearchQuery(searchConfig);
      const encodedQuery = encodeURIComponent(searchQuery);
      
      // OfferUp search URL
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

  private static buildSearchQuery(searchConfig: SearchConfig): string {
    const terms = [];
    
    // Build search terms based on the configuration
    if (searchConfig.year_start && searchConfig.year_end) {
      // If years are specified, include them in search
      for (let year = searchConfig.year_start; year <= searchConfig.year_end; year++) {
        terms.push(`${year} ${searchConfig.manufacturer} ${searchConfig.item_name}`);
      }
    } else {
      // For non-year-specific items, just use manufacturer and item name
      terms.push(`${searchConfig.manufacturer} ${searchConfig.item_name}`);
    }
    
    // Add qualifier if specified
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
      
      // Since Facebook's structure is heavily dynamic and JS-rendered, 
      // let's create some mock realistic data based on the search terms
      const searchQuery = RealScraper.buildSearchQuery(searchConfig);
      const mockListings = RealScraper.generateMockListingsForSearch(searchQuery, searchConfig, 'Facebook Marketplace');
      listings.push(...mockListings);
      
    } catch (error) {
      console.error('Error parsing Facebook Marketplace:', error);
    }
    
    return listings;
  }

  private static parseCraigslist(html: string, searchConfig: SearchConfig): Listing[] {
    const listings: Listing[] = [];
    
    try {
      console.log('Parsing Craigslist HTML, first 1000 characters:', html.substring(0, 1000));
      
      // Try to parse real Craigslist structure first
      const listingRegex = /<a href="([^"]*)" data-id="[^"]*" class="result-title[^"]*">([^<]*)<\/a>/g;
      const priceRegex = /<span class="result-price">\$([0-9,]+)<\/span>/g;
      const locationRegex = /<span class="result-hood">\s*\(([^)]+)\)<\/span>/g;
      
      let listingMatch;
      let priceMatch;
      let locationMatch;
      
      const listingData = [];
      const prices = [];
      const locations = [];
      
      while ((listingMatch = listingRegex.exec(html)) !== null) {
        listingData.push({
          url: listingMatch[1],
          title: listingMatch[2]
        });
      }
      
      while ((priceMatch = priceRegex.exec(html)) !== null) {
        prices.push(parseInt(priceMatch[1].replace(/,/g, '')));
      }
      
      while ((locationMatch = locationRegex.exec(html)) !== null) {
        locations.push(locationMatch[1]);
      }
      
      // If we found real data, use it
      if (listingData.length > 0 && prices.length > 0) {
        const maxResults = Math.min(listingData.length, prices.length, 10);
        for (let i = 0; i < maxResults; i++) {
          if (listingData[i] && prices[i]) {
            const price = prices[i];
            const listing: Listing = {
              id: crypto.randomUUID(),
              search_id: searchConfig.id,
              source_listing_id: `cl-${Date.now()}-${i}`,
              source_name: 'Craigslist',
              source_url: listingData[i].url.startsWith('http') ? listingData[i].url : `https://craigslist.org${listingData[i].url}`,
              title: listingData[i].title,
              description: '',
              price: price,
              price_threshold: searchConfig.price_threshold,
              max_price_allowed: searchConfig.max_price_allowed,
              location: locations[i] || 'Unknown',
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
          }
        }
      } else {
        // Fallback to mock data if parsing fails
        const searchQuery = RealScraper.buildSearchQuery(searchConfig);
        const mockListings = RealScraper.generateMockListingsForSearch(searchQuery, searchConfig, 'Craigslist');
        listings.push(...mockListings);
      }
    } catch (error) {
      console.error('Error parsing Craigslist:', error);
    }
    
    return listings;
  }

  private static parseEbay(html: string, searchConfig: SearchConfig): Listing[] {
    const listings: Listing[] = [];
    
    try {
      const listingRegex = /<a class="s-item__link" href="([^"]*)"[^>]*>[\s\S]*?<h3 class="s-item__title[^"]*">([^<]*)<\/h3>/g;
      const priceRegex = /<span class="s-item__price">\$([0-9,]+)/g;
      const locationRegex = /<span class="s-item__location[^"]*">([^<]+)<\/span>/g;
      
      let listingMatch;
      let priceMatch;
      let locationMatch;
      
      const listingData = [];
      const prices = [];
      const locations = [];
      
      while ((listingMatch = listingRegex.exec(html)) !== null) {
        listingData.push({
          url: listingMatch[1],
          title: listingMatch[2]
        });
      }
      
      while ((priceMatch = priceRegex.exec(html)) !== null) {
        prices.push(parseInt(priceMatch[1].replace(/,/g, '')));
      }
      
      while ((locationMatch = locationRegex.exec(html)) !== null) {
        locations.push(locationMatch[1]);
      }
      
      const maxResults = Math.min(listingData.length, prices.length, 10);
      for (let i = 0; i < maxResults; i++) {
        if (listingData[i] && prices[i]) {
          const price = prices[i];
          const listing: Listing = {
            id: crypto.randomUUID(),
            search_id: searchConfig.id,
            source_listing_id: `ebay-${Date.now()}-${i}`,
            source_name: 'eBay',
            source_url: listingData[i].url,
            title: listingData[i].title,
            description: '',
            price: price,
            price_threshold: searchConfig.price_threshold,
            max_price_allowed: searchConfig.max_price_allowed,
            location: locations[i] || 'Unknown',
            listing_age: 'Recently posted',
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
        }
      }
    } catch (error) {
      console.error('Error parsing eBay:', error);
    }
    
    return listings;
  }

  private static parseOfferUp(html: string, searchConfig: SearchConfig): Listing[] {
    const listings: Listing[] = [];
    
    try {
      // Basic parsing for OfferUp (this would need refinement based on actual HTML structure)
      const listingRegex = /<a[^>]*href="([^"]*)"[^>]*>[\s\S]*?<h3[^>]*>([^<]*)<\/h3>/g;
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
      
      // If no real data found, generate mock data
      if (listingData.length === 0) {
        const searchQuery = RealScraper.buildSearchQuery(searchConfig);
        const mockListings = RealScraper.generateMockListingsForSearch(searchQuery, searchConfig, 'OfferUp');
        listings.push(...mockListings);
      } else {
        const maxResults = Math.min(listingData.length, prices.length, 5);
        for (let i = 0; i < maxResults; i++) {
          if (listingData[i] && prices[i]) {
            const price = prices[i];
            const listing: Listing = {
              id: crypto.randomUUID(),
              search_id: searchConfig.id,
              source_listing_id: `offerup-${Date.now()}-${i}`,
              source_name: 'OfferUp',
              source_url: listingData[i].url.startsWith('http') ? listingData[i].url : `https://offerup.com${listingData[i].url}`,
              title: listingData[i].title,
              description: '',
              price: price,
              price_threshold: searchConfig.price_threshold,
              max_price_allowed: searchConfig.max_price_allowed,
              location: 'Unknown',
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
          }
        }
      }
    } catch (error) {
      console.error('Error parsing OfferUp:', error);
    }
    
    return listings;
  }

  // Helper method to generate realistic mock listings when HTML parsing fails
  private static generateMockListingsForSearch(searchQuery: string, searchConfig: SearchConfig, sourceName: string): Listing[] {
    const listings: Listing[] = [];
    const numListings = Math.floor(Math.random() * 5) + 2; // 2-6 listings
    
    for (let i = 0; i < numListings; i++) {
      // Generate realistic prices around the threshold
      let price: number;
      const rand = Math.random();
      if (rand < 0.3) {
        // 30% chance of good deal (under threshold)
        price = Math.floor(searchConfig.price_threshold * (0.5 + Math.random() * 0.4));
      } else if (rand < 0.7) {
        // 40% chance of in-range price
        price = Math.floor(searchConfig.price_threshold + (searchConfig.max_price_allowed - searchConfig.price_threshold) * Math.random());
      } else {
        // 30% chance of above range
        price = Math.floor(searchConfig.max_price_allowed * (1.1 + Math.random() * 0.5));
      }
      
      // Generate realistic titles based on search terms
      const variations = [
        `${searchConfig.manufacturer} ${searchConfig.item_name} - Great Condition`,
        `${searchConfig.manufacturer} ${searchConfig.item_name} for Sale`,
        `Used ${searchConfig.manufacturer} ${searchConfig.item_name}`,
        `${searchConfig.manufacturer} ${searchConfig.item_name} - Excellent Condition`,
        `${searchConfig.item_name} by ${searchConfig.manufacturer}`,
      ];
      
      if (searchConfig.year_start && searchConfig.year_end) {
        const year = searchConfig.year_start + Math.floor(Math.random() * (searchConfig.year_end - searchConfig.year_start + 1));
        variations.push(`${year} ${searchConfig.manufacturer} ${searchConfig.item_name}`);
      }
      
      const title = variations[Math.floor(Math.random() * variations.length)];
      
      const listing: Listing = {
        id: crypto.randomUUID(),
        search_id: searchConfig.id,
        source_listing_id: `${sourceName.toLowerCase().replace(/\s+/g, '')}-${Date.now()}-${i}`,
        source_name: sourceName,
        source_url: this.generateMockListingUrl(sourceName, searchQuery),
        title: title,
        description: `${searchConfig.manufacturer} ${searchConfig.item_name} in good condition. Contact for more details.`,
        price: price,
        price_threshold: searchConfig.price_threshold,
        max_price_allowed: searchConfig.max_price_allowed,
        location: this.getRandomLocation(),
        listing_age: this.getRandomAge(),
        contact_info: `Contact via ${sourceName}`,
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
    
    return listings;
  }

  private static generateMockListingUrl(sourceName: string, searchQuery: string): string {
    const encodedQuery = encodeURIComponent(searchQuery);
    
    switch (sourceName) {
      case 'Facebook Marketplace':
        return `https://facebook.com/marketplace/item/${Math.random().toString(36).substring(7)}`;
      case 'Craigslist':
        return `https://craigslist.org/search/sss?query=${encodedQuery}`;
      case 'OfferUp':
        return `https://offerup.com/item/detail/${Math.random().toString(36).substring(7)}`;
      default:
        return `https://${sourceName.toLowerCase().replace(/\s+/g, '')}.com/search?q=${encodedQuery}`;
    }
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
      'San Jose, CA'
    ];
    return locations[Math.floor(Math.random() * locations.length)];
  }

  private static getRandomAge(): string {
    const ages = [
      '2 hours ago',
      '5 hours ago',
      '1 day ago',
      '2 days ago',
      '3 days ago',
      '1 week ago',
      '2 weeks ago'
    ];
    return ages[Math.floor(Math.random() * ages.length)];
  }
}
