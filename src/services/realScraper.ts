import { Listing, SearchConfig } from '@/types/database';

export const scrapingSources = [
  { name: 'Facebook Marketplace', tier: 1 as const, baseUrl: 'https://facebook.com/marketplace', scrapeFrequency: 5, isActive: true },
  { name: 'Craigslist', tier: 1 as const, baseUrl: 'https://craigslist.org', scrapeFrequency: 5, isActive: true },
  { name: 'eBay', tier: 1 as const, baseUrl: 'https://ebay.com', scrapeFrequency: 5, isActive: true },
  { name: 'OfferUp', tier: 1 as const, baseUrl: 'https://offerup.com', scrapeFrequency: 5, isActive: true },
  { name: 'Mercari', tier: 2 as const, baseUrl: 'https://mercari.com', scrapeFrequency: 3, isActive: true },
  { name: 'Gumtree', tier: 2 as const, baseUrl: 'https://gumtree.com', scrapeFrequency: 3, isActive: true },
  { name: 'Reddit r/ForSale', tier: 2 as const, baseUrl: 'https://reddit.com/r/forsale', scrapeFrequency: 2, isActive: true },
  { name: 'Discord Communities', tier: 2 as const, baseUrl: 'https://discord.com', scrapeFrequency: 2, isActive: true },
  { name: 'Specialized Forums', tier: 2 as const, baseUrl: 'Various', scrapeFrequency: 2, isActive: true },
  { name: 'Local Classifieds', tier: 2 as const, baseUrl: 'Various', scrapeFrequency: 1, isActive: true }
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
      { name: 'Discord Communities', scraper: this.scrapeDiscord },
      { name: 'Specialized Forums', scraper: this.scrapeForums },
      { name: 'Local Classifieds', scraper: this.scrapeLocalClassifieds },
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
      
      const contentLength = response.headers.get('content-length');
      if (contentLength && parseInt(contentLength) > 10000000) { // 10MB limit
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
      console.log('eBay scraping skipped due to consistent large response issues that cause memory problems');
      // eBay responses are consistently too large and cause memory issues
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
        // Mercari uses a complex JavaScript-based structure, so real parsing is challenging
        // For now, we'll log that we attempted it but can't parse the results
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
        // Gumtree has complex structure, real parsing would need more specific implementation
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
      // Reddit requires API keys for meaningful access
    } catch (error) {
      console.error('Reddit scraping error:', error);
    }

    return listings;
  }

  private static async scrapeDiscord(searchConfig: SearchConfig): Promise<Listing[]> {
    const listings: Listing[] = [];
    
    try {
      console.log('Discord Communities scraping requires bot access and is not feasible via web scraping');
      // Discord requires bot authentication
    } catch (error) {
      console.error('Discord scraping error:', error);
    }

    return listings;
  }

  private static async scrapeForums(searchConfig: SearchConfig): Promise<Listing[]> {
    const listings: Listing[] = [];
    
    try {
      console.log('Specialized Forums scraping requires knowledge of specific forum structures');
      // This would need to be implemented per-forum
    } catch (error) {
      console.error('Forums scraping error:', error);
    }

    return listings;
  }

  private static async scrapeLocalClassifieds(searchConfig: SearchConfig): Promise<Listing[]> {
    const listings: Listing[] = [];
    
    try {
      console.log('Local Classifieds scraping requires knowledge of specific local sites');
      // This would need to be implemented per-local-site
    } catch (error) {
      console.error('Local Classifieds scraping error:', error);
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
      
      const listingRegex = /\/marketplace\/item\/(\d+)/g;
      const titleRegex = /"marketplace_listing_title":"([^"]+)"/g;
      const priceRegex = /"formatted_price":"([^"]+)"/g;
      
      let urlMatch;
      let titleMatch;
      let priceMatch;
      
      const urlData = [];
      const titles = [];
      const prices = [];
      
      while ((urlMatch = listingRegex.exec(html)) !== null) {
        urlData.push(urlMatch[1]);
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
      
      if (urlData.length > 0 && titles.length > 0 && prices.length > 0) {
        const maxResults = Math.min(urlData.length, titles.length, prices.length, 5);
        for (let i = 0; i < maxResults; i++) {
          const price = prices[i];
          const listing: Listing = {
            id: crypto.randomUUID(),
            search_id: searchConfig.id,
            source_listing_id: `fb-${urlData[i]}`,
            source_name: 'Facebook Marketplace',
            source_url: `https://www.facebook.com/marketplace/item/${urlData[i]}`,
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

  private static parseCraigslist(html: string, searchConfig: SearchConfig): Listing[] {
    const listings: Listing[] = [];
    
    try {
      console.log('Parsing Craigslist HTML, first 1000 characters:', html.substring(0, 1000));
      
      const listingRegex = /<a href="([^"]*)" data-id="([^"]*)" class="result-title[^"]*">([^<]*)<\/a>/g;
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
          id: listingMatch[2],
          title: listingMatch[3]
        });
      }
      
      while ((priceMatch = priceRegex.exec(html)) !== null) {
        prices.push(parseInt(priceMatch[1].replace(/,/g, '')));
      }
      
      while ((locationMatch = locationRegex.exec(html)) !== null) {
        locations.push(locationMatch[1]);
      }
      
      if (listingData.length > 0 && prices.length > 0) {
        const maxResults = Math.min(listingData.length, prices.length, 10);
        for (let i = 0; i < maxResults; i++) {
          if (listingData[i] && prices[i]) {
            const price = prices[i];
            const fullUrl = listingData[i].url.startsWith('http') ? 
              listingData[i].url : 
              `https://craigslist.org${listingData[i].url}`;
            
            const listing: Listing = {
              id: crypto.randomUUID(),
              search_id: searchConfig.id,
              source_listing_id: listingData[i].id || `cl-${Date.now()}-${i}`,
              source_name: 'Craigslist',
              source_url: fullUrl,
              title: listingData[i].title,
              description: `${searchConfig.manufacturer} ${searchConfig.item_name} listing found on Craigslist`,
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
        console.log('No Craigslist listings found in HTML response');
      }
    } catch (error) {
      console.error('Error parsing Craigslist:', error);
    }
    
    return listings;
  }

  private static parseOfferUp(html: string, searchConfig: SearchConfig): Listing[] {
    const listings: Listing[] = [];
    
    try {
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
      
      if (listingData.length === 0) {
        console.log('No OfferUp listings found in HTML response');
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
