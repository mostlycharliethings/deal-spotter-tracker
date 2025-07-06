
import { Listing, SearchConfig } from '@/types/database';

interface ScrapingResult {
  listings: Listing[];
  errors: string[];
}

export class RealScraper {
  private static readonly CORS_PROXY = 'https://api.allorigins.win/get?url=';
  
  static async scrapeSearch(searchConfig: SearchConfig): Promise<Listing[]> {
    console.log('Starting real scrape for search config:', searchConfig);
    
    const allListings: Listing[] = [];
    const sources = [
      { name: 'Facebook Marketplace', scraper: this.scrapeFacebookMarketplace },
      { name: 'Craigslist', scraper: this.scrapeCraigslist },
      { name: 'eBay Motors', scraper: this.scrapeEbayMotors },
    ];

    for (const source of sources) {
      try {
        console.log(`Scraping ${source.name}...`);
        const listings = await source.scraper(searchConfig);
        allListings.push(...listings);
        console.log(`Found ${listings.length} listings from ${source.name}`);
      } catch (error) {
        console.error(`Error scraping ${source.name}:`, error);
      }
    }

    return allListings;
  }

  private static async scrapeFacebookMarketplace(searchConfig: SearchConfig): Promise<Listing[]> {
    const listings: Listing[] = [];
    
    try {
      const searchQuery = this.buildSearchQuery(searchConfig);
      const encodedQuery = encodeURIComponent(searchQuery);
      
      // Facebook Marketplace search URL
      const searchUrl = `https://www.facebook.com/marketplace/search/?query=${encodedQuery}`;
      
      console.log('Scraping Facebook Marketplace with URL:', searchUrl);
      
      // Use CORS proxy to fetch the page
      const proxyUrl = `${this.CORS_PROXY}${encodeURIComponent(searchUrl)}`;
      const response = await fetch(proxyUrl);
      const data = await response.json();
      
      if (data.contents) {
        // Parse Facebook Marketplace results
        const parsedListings = this.parseFacebookMarketplace(data.contents, searchConfig);
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
      const searchQuery = this.buildSearchQuery(searchConfig);
      const encodedQuery = encodeURIComponent(searchQuery);
      
      // Craigslist search URL (using national search)
      const searchUrl = `https://craigslist.org/search/cta?query=${encodedQuery}&sort=date`;
      
      console.log('Scraping Craigslist with URL:', searchUrl);
      
      const proxyUrl = `${this.CORS_PROXY}${encodeURIComponent(searchUrl)}`;
      const response = await fetch(proxyUrl);
      const data = await response.json();
      
      if (data.contents) {
        const parsedListings = this.parseCraigslist(data.contents, searchConfig);
        listings.push(...parsedListings);
      }
    } catch (error) {
      console.error('Craigslist scraping error:', error);
    }

    return listings;
  }

  private static async scrapeEbayMotors(searchConfig: SearchConfig): Promise<Listing[]> {
    const listings: Listing[] = [];
    
    try {
      const searchQuery = this.buildSearchQuery(searchConfig);
      const encodedQuery = encodeURIComponent(searchQuery);
      
      // eBay Motors search URL
      const searchUrl = `https://www.ebay.com/sch/Cars-Trucks/6001/i.html?_nkw=${encodedQuery}&_sop=10`;
      
      console.log('Scraping eBay Motors with URL:', searchUrl);
      
      const proxyUrl = `${this.CORS_PROXY}${encodeURIComponent(searchUrl)}`;
      const response = await fetch(proxyUrl);
      const data = await response.json();
      
      if (data.contents) {
        const parsedListings = this.parseEbayMotors(data.contents, searchConfig);
        listings.push(...parsedListings);
      }
    } catch (error) {
      console.error('eBay Motors scraping error:', error);
    }

    return listings;
  }

  private static buildSearchQuery(searchConfig: SearchConfig): string {
    const terms = [];
    
    // Add year range
    for (let year = searchConfig.year_start; year <= searchConfig.year_end; year++) {
      terms.push(`${year} ${searchConfig.manufacturer} ${searchConfig.item_name}`);
    }
    
    if (searchConfig.qualifier) {
      terms.push(`${searchConfig.manufacturer} ${searchConfig.item_name} ${searchConfig.qualifier}`);
    }
    
    return terms[0] || `${searchConfig.manufacturer} ${searchConfig.item_name}`;
  }

  private static parseFacebookMarketplace(html: string, searchConfig: SearchConfig): Listing[] {
    const listings: Listing[] = [];
    
    try {
      // Simple regex parsing for Facebook Marketplace
      const priceRegex = /\$([0-9,]+)/g;
      const titleRegex = /<span[^>]*>([^<]*(?:car|auto|vehicle)[^<]*)<\/span>/gi;
      const locationRegex = />([A-Za-z\s,]+)<.*?miles?/g;
      
      let priceMatch;
      let titleMatch;
      let locationMatch;
      
      const prices = [];
      const titles = [];
      const locations = [];
      
      while ((priceMatch = priceRegex.exec(html)) !== null) {
        prices.push(parseInt(priceMatch[1].replace(/,/g, '')));
      }
      
      while ((titleMatch = titleRegex.exec(html)) !== null) {
        titles.push(titleMatch[1]);
      }
      
      while ((locationMatch = locationRegex.exec(html)) !== null) {
        locations.push(locationMatch[1]);
      }
      
      // Match up the results
      const maxResults = Math.min(prices.length, titles.length, 10);
      for (let i = 0; i < maxResults; i++) {
        if (prices[i] && titles[i]) {
          const price = prices[i];
          const listing: Listing = {
            id: crypto.randomUUID(),
            search_id: searchConfig.id,
            source_listing_id: `fb-${Date.now()}-${i}`,
            source_name: 'Facebook Marketplace',
            source_url: 'https://facebook.com/marketplace',
            title: titles[i],
            description: '',
            price: price,
            price_threshold: searchConfig.price_threshold,
            max_price_allowed: searchConfig.max_price_allowed,
            location: locations[i] || 'Unknown',
            listing_age: 'Recently posted',
            contact_info: 'Contact via Facebook',
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
      console.error('Error parsing Facebook Marketplace:', error);
    }
    
    return listings;
  }

  private static parseCraigslist(html: string, searchConfig: SearchConfig): Listing[] {
    const listings: Listing[] = [];
    
    try {
      // Simple regex parsing for Craigslist
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
      
      // Match up the results
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
    } catch (error) {
      console.error('Error parsing Craigslist:', error);
    }
    
    return listings;
  }

  private static parseEbayMotors(html: string, searchConfig: SearchConfig): Listing[] {
    const listings: Listing[] = [];
    
    try {
      // Simple regex parsing for eBay Motors
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
      
      // Match up the results
      const maxResults = Math.min(listingData.length, prices.length, 10);
      for (let i = 0; i < maxResults; i++) {
        if (listingData[i] && prices[i]) {
          const price = prices[i];
          const listing: Listing = {
            id: crypto.randomUUID(),
            search_id: searchConfig.id,
            source_listing_id: `ebay-${Date.now()}-${i}`,
            source_name: 'eBay Motors',
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
      console.error('Error parsing eBay Motors:', error);
    }
    
    return listings;
  }
}
