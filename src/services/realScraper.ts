
import { Listing, SearchConfig } from '@/types/database';

export class RealScraper {
  private static readonly CORS_PROXY = 'https://api.allorigins.win/get?url=';
  
  static async scrapeSearch(searchConfig: SearchConfig): Promise<Listing[]> {
    console.log('Starting real-only scrape for search config:', searchConfig);
    
    const allListings: Listing[] = [];
    const sources = [
      { name: 'Facebook Marketplace', scraper: this.scrapeFacebookMarketplace },
      { name: 'Craigslist', scraper: this.scrapeCraigslist },
      { name: 'eBay', scraper: this.scrapeEbay },
      { name: 'OfferUp', scraper: this.scrapeOfferUp },
      { name: 'Mercari', scraper: this.scrapeMercari },
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
        // Continue with other sources but don't generate fake data
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
          'User-Agent': 'Mozilla/5.0 (compatible; WebScraper/1.0)',
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const contentLength = response.headers.get('content-length');
      if (contentLength && parseInt(contentLength) > 5000000) {
        throw new Error('Response too large, skipping to prevent memory issues');
      }
      
      const text = await response.text();
      
      try {
        return JSON.parse(text);
      } catch (parseError) {
        return { contents: text };
      }
    } catch (error) {
      console.error('Proxy fetch error:', error);
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
      
      // Use major city Craigslist sites for better results
      const cities = ['sfbay', 'newyork', 'losangeles', 'chicago', 'seattle'];
      
      for (const city of cities) {
        try {
          const searchUrl = `https://${city}.craigslist.org/search/sss?query=${encodedQuery}&sort=date&bundleDuplicates=1`;
          console.log(`Scraping Craigslist ${city} with URL:`, searchUrl);
          
          const data = await RealScraper.fetchWithProxy(searchUrl);
          
          if (data.contents) {
            const parsedListings = RealScraper.parseCraigslist(data.contents, searchConfig, city);
            listings.push(...parsedListings);
          }
          
          // Add delay between requests to be respectful
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (cityError) {
          console.error(`Error scraping Craigslist ${city}:`, cityError);
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
      const searchQuery = RealScraper.buildSearchQuery(searchConfig);
      const encodedQuery = encodeURIComponent(searchQuery);
      const searchUrl = `https://www.ebay.com/sch/i.html?_nkw=${encodedQuery}&_sop=10&LH_BIN=1`;
      
      console.log('Scraping eBay with URL:', searchUrl);
      
      const data = await RealScraper.fetchWithProxy(searchUrl);
      
      if (data.contents) {
        const parsedListings = RealScraper.parseEbay(data.contents, searchConfig);
        listings.push(...parsedListings);
      }
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
      
      console.log('Scraping Mercari with URL:', searchUrl);
      
      const data = await RealScraper.fetchWithProxy(searchUrl);
      
      if (data.contents) {
        const parsedListings = RealScraper.parseMercari(data.contents, searchConfig);
        listings.push(...parsedListings);
      }
    } catch (error) {
      console.error('Mercari scraping error:', error);
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
      
      // Look for Facebook Marketplace listing patterns
      const listingPatterns = [
        /\/marketplace\/item\/(\d+)/g,
        /"marketplace_listing_title":"([^"]+)"/g,
        /"formatted_price":"([^"]+)"/g,
        /"primary_listing_photo":[^}]*"uri":"([^"]+)"/g,
      ];
      
      const itemIds = [];
      const titles = [];
      const prices = [];
      const images = [];
      
      let match;
      
      // Extract item IDs
      while ((match = listingPatterns[0].exec(html)) !== null) {
        itemIds.push(match[1]);
      }
      
      // Extract titles
      listingPatterns[0].lastIndex = 0;
      while ((match = listingPatterns[1].exec(html)) !== null) {
        titles.push(match[1].replace(/\\u[\da-f]{4}/gi, ''));
      }
      
      // Extract prices
      listingPatterns[1].lastIndex = 0;
      while ((match = listingPatterns[2].exec(html)) !== null) {
        const priceStr = match[1].replace(/[^\d]/g, '');
        if (priceStr) {
          prices.push(parseInt(priceStr));
        }
      }
      
      console.log(`Found ${itemIds.length} item IDs, ${titles.length} titles, ${prices.length} prices`);
      
      // Only create listings if we have real data
      if (itemIds.length > 0 && titles.length > 0 && prices.length > 0) {
        const maxResults = Math.min(itemIds.length, titles.length, prices.length, 10);
        
        for (let i = 0; i < maxResults; i++) {
          if (itemIds[i] && titles[i] && prices[i]) {
            const price = prices[i];
            const listing: Listing = {
              id: crypto.randomUUID(),
              search_id: searchConfig.id,
              source_listing_id: `fb-${itemIds[i]}`,
              source_name: 'Facebook Marketplace',
              source_url: `https://www.facebook.com/marketplace/item/${itemIds[i]}`,
              title: titles[i],
              description: `Real listing found on Facebook Marketplace`,
              price: price,
              price_threshold: searchConfig.price_threshold,
              max_price_allowed: searchConfig.max_price_allowed,
              location: 'Facebook Marketplace',
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
          }
        }
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
      
      // Look for Craigslist result patterns
      const listingRegex = /<a href="([^"]*)" data-id="([^"]*)" class="result-title[^"]*">([^<]*)<\/a>/g;
      const priceRegex = /<span class="result-price">\$([0-9,]+)<\/span>/g;
      const locationRegex = /<span class="result-hood">\s*\(([^)]+)\)<\/span>/g;
      
      const listingData = [];
      const prices = [];
      const locations = [];
      
      let match;
      
      // Extract listing data
      while ((match = listingRegex.exec(html)) !== null) {
        listingData.push({
          url: match[1],
          id: match[2],
          title: match[3].trim()
        });
      }
      
      // Extract prices
      while ((match = priceRegex.exec(html)) !== null) {
        prices.push(parseInt(match[1].replace(/,/g, '')));
      }
      
      // Extract locations
      while ((match = locationRegex.exec(html)) !== null) {
        locations.push(match[1].trim());
      }
      
      console.log(`Found ${listingData.length} listings, ${prices.length} prices, ${locations.length} locations`);
      
      // Only create listings if we have real data
      if (listingData.length > 0 && prices.length > 0) {
        const maxResults = Math.min(listingData.length, prices.length, 10);
        
        for (let i = 0; i < maxResults; i++) {
          if (listingData[i] && prices[i]) {
            const price = prices[i];
            const fullUrl = listingData[i].url.startsWith('http') ? 
              listingData[i].url : 
              `https://${city}.craigslist.org${listingData[i].url}`;
            
            const listing: Listing = {
              id: crypto.randomUUID(),
              search_id: searchConfig.id,
              source_listing_id: listingData[i].id || `cl-${Date.now()}-${i}`,
              source_name: 'Craigslist',
              source_url: fullUrl,
              title: listingData[i].title,
              description: `Real listing found on Craigslist ${city}`,
              price: price,
              price_threshold: searchConfig.price_threshold,
              max_price_allowed: searchConfig.max_price_allowed,
              location: locations[i] || `${city} area`,
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
      }
    } catch (error) {
      console.error('Error parsing Craigslist:', error);
    }
    
    return listings;
  }

  private static parseEbay(html: string, searchConfig: SearchConfig): Listing[] {
    const listings: Listing[] = [];
    
    try {
      console.log('Parsing eBay HTML, length:', html.length);
      
      // Look for eBay listing patterns
      const listingRegex = /<a class="s-item__link" href="([^"]*)"[^>]*>[\s\S]*?<h3 class="s-item__title[^"]*">([^<]*)<\/h3>/g;
      const priceRegex = /<span class="s-item__price">\$([0-9,]+\.?\d*)/g;
      const locationRegex = /<span class="s-item__location[^"]*">([^<]+)<\/span>/g;
      
      const listingData = [];
      const prices = [];
      const locations = [];
      
      let match;
      
      // Extract listing data
      while ((match = listingRegex.exec(html)) !== null) {
        listingData.push({
          url: match[1],
          title: match[2].trim()
        });
      }
      
      // Extract prices
      while ((match = priceRegex.exec(html)) !== null) {
        prices.push(parseFloat(match[1].replace(/,/g, '')));
      }
      
      // Extract locations
      while ((match = locationRegex.exec(html)) !== null) {
        locations.push(match[1].trim());
      }
      
      console.log(`Found ${listingData.length} listings, ${prices.length} prices, ${locations.length} locations`);
      
      // Only create listings if we have real data
      if (listingData.length > 0 && prices.length > 0) {
        const maxResults = Math.min(listingData.length, prices.length, 10);
        
        for (let i = 0; i < maxResults; i++) {
          if (listingData[i] && prices[i]) {
            const price = Math.round(prices[i]);
            
            const listing: Listing = {
              id: crypto.randomUUID(),
              search_id: searchConfig.id,
              source_listing_id: `ebay-${Date.now()}-${i}`,
              source_name: 'eBay',
              source_url: listingData[i].url,
              title: listingData[i].title,
              description: 'Real listing found on eBay',
              price: price,
              price_threshold: searchConfig.price_threshold,
              max_price_allowed: searchConfig.max_price_allowed,
              location: locations[i] || 'eBay',
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
      }
    } catch (error) {
      console.error('Error parsing eBay:', error);
    }
    
    return listings;
  }

  private static parseOfferUp(html: string, searchConfig: SearchConfig): Listing[] {
    const listings: Listing[] = [];
    
    try {
      console.log('Parsing OfferUp HTML, length:', html.length);
      
      // Look for OfferUp listing patterns (these may need adjustment based on actual HTML structure)
      const listingRegex = /<a[^>]*href="([^"]*\/item\/[^"]*)"[^>]*>[\s\S]*?<h3[^>]*>([^<]*)<\/h3>/g;
      const priceRegex = /\$([0-9,]+)/g;
      
      const listingData = [];
      const prices = [];
      
      let match;
      
      // Extract listing data
      while ((match = listingRegex.exec(html)) !== null) {
        listingData.push({
          url: match[1],
          title: match[2].trim()
        });
      }
      
      // Extract prices
      while ((match = priceRegex.exec(html)) !== null) {
        prices.push(parseInt(match[1].replace(/,/g, '')));
      }
      
      console.log(`Found ${listingData.length} listings, ${prices.length} prices`);
      
      // Only create listings if we have real data
      if (listingData.length > 0 && prices.length > 0) {
        const maxResults = Math.min(listingData.length, prices.length, 5);
        
        for (let i = 0; i < maxResults; i++) {
          if (listingData[i] && prices[i]) {
            const price = prices[i];
            const fullUrl = listingData[i].url.startsWith('http') ? 
              listingData[i].url : 
              `https://offerup.com${listingData[i].url}`;
            
            const listing: Listing = {
              id: crypto.randomUUID(),
              search_id: searchConfig.id,
              source_listing_id: `offerup-${Date.now()}-${i}`,
              source_name: 'OfferUp',
              source_url: fullUrl,
              title: listingData[i].title,
              description: 'Real listing found on OfferUp',
              price: price,
              price_threshold: searchConfig.price_threshold,
              max_price_allowed: searchConfig.max_price_allowed,
              location: 'OfferUp',
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

  private static parseMercari(html: string, searchConfig: SearchConfig): Listing[] {
    const listings: Listing[] = [];
    
    try {
      console.log('Parsing Mercari HTML, length:', html.length);
      
      // Look for Mercari listing patterns
      const listingRegex = /<a[^>]*href="([^"]*\/item\/[^"]*)"[^>]*>[\s\S]*?<p[^>]*>([^<]*)<\/p>/g;
      const priceRegex = /\$([0-9,]+)/g;
      
      const listingData = [];
      const prices = [];
      
      let match;
      
      // Extract listing data
      while ((match = listingRegex.exec(html)) !== null) {
        listingData.push({
          url: match[1],
          title: match[2].trim()
        });
      }
      
      // Extract prices
      while ((match = priceRegex.exec(html)) !== null) {
        prices.push(parseInt(match[1].replace(/,/g, '')));
      }
      
      console.log(`Found ${listingData.length} listings, ${prices.length} prices`);
      
      // Only create listings if we have real data
      if (listingData.length > 0 && prices.length > 0) {
        const maxResults = Math.min(listingData.length, prices.length, 5);
        
        for (let i = 0; i < maxResults; i++) {
          if (listingData[i] && prices[i]) {
            const price = prices[i];
            const fullUrl = listingData[i].url.startsWith('http') ? 
              listingData[i].url : 
              `https://www.mercari.com${listingData[i].url}`;
            
            const listing: Listing = {
              id: crypto.randomUUID(),
              search_id: searchConfig.id,
              source_listing_id: `mercari-${Date.now()}-${i}`,
              source_name: 'Mercari',
              source_url: fullUrl,
              title: listingData[i].title,
              description: 'Real listing found on Mercari',
              price: price,
              price_threshold: searchConfig.price_threshold,
              max_price_allowed: searchConfig.max_price_allowed,
              location: 'Mercari',
              listing_age: 'Recently posted',
              contact_info: 'Contact via Mercari',
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
      console.error('Error parsing Mercari:', error);
    }
    
    return listings;
  }
}

export const scrapingSources = [
  { name: 'Facebook Marketplace', tier: 1 as const, baseUrl: 'https://facebook.com/marketplace', scrapeFrequency: 5, isActive: true },
  { name: 'Craigslist', tier: 1 as const, baseUrl: 'https://craigslist.org', scrapeFrequency: 5, isActive: true },
  { name: 'eBay', tier: 1 as const, baseUrl: 'https://ebay.com', scrapeFrequency: 5, isActive: true },
  { name: 'OfferUp', tier: 1 as const, baseUrl: 'https://offerup.com', scrapeFrequency: 5, isActive: true },
  { name: 'Mercari', tier: 2 as const, baseUrl: 'https://mercari.com', scrapeFrequency: 3, isActive: true },
];
