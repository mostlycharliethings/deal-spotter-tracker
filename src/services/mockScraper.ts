
import { Listing, SearchConfig } from '@/types/database';

// Mock data for demonstration - replace with actual scraping logic
const mockListings: Partial<Listing>[] = [
  {
    source_name: 'Facebook Marketplace',
    title: '1995 Porsche 911 Carrera - Clean Title',
    description: 'Well maintained 911 with service records. Minor cosmetic issues but runs great.',
    price: 42000,
    location: 'Los Angeles, CA',
    listing_age: '2 hours ago',
    contact_info: 'Message through Facebook',
    source_url: 'https://facebook.com/marketplace/item/123456'
  },
  {
    source_name: 'Craigslist',
    title: '1993 Porsche 911 Turbo - Project Car',
    description: 'Needs some work but great bones. Engine runs strong.',
    price: 65000,
    location: 'San Francisco, CA',
    listing_age: '1 day ago',
    contact_info: '(555) 123-4567',
    source_url: 'https://craigslist.org/cto/123456.html'
  },
  {
    source_name: 'eBay Motors',
    title: '1994 Porsche 911 Speedster - Rare Find',
    description: 'Original owner, garage kept, all service records available.',
    price: 85000,
    location: 'Miami, FL',
    listing_age: '3 days ago',
    contact_info: 'eBay messaging',
    source_url: 'https://ebay.com/itm/123456'
  },
  {
    source_name: 'Rennlist Forums',
    title: 'FS: 1996 911 Targa - Track Ready',
    description: 'Roll cage, racing seats, upgraded suspension. Street legal.',
    price: 38000,
    location: 'Austin, TX',
    listing_age: '5 hours ago',
    contact_info: 'PM on Rennlist',
    source_url: 'https://rennlist.com/forums/marketplace/123456'
  },
  {
    source_name: 'Cars & Coffee Discord',
    title: '1992 911 Turbo - Numbers Matching',
    description: 'Completely stock, original paint, documented history.',
    price: 95000,
    location: 'Seattle, WA',
    listing_age: '12 hours ago',
    contact_info: 'Discord: PorscheGuy#1234',
    source_url: 'https://discord.com/channels/123456/789012'
  }
];

export class MockScraper {
  static async scrapeSearch(searchConfig: SearchConfig): Promise<Listing[]> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    const results: Listing[] = [];
    
    // Generate search combinations
    const searchTerms = this.generateSearchMatrix(searchConfig);
    
    // Mock finding listings that match search terms
    mockListings.forEach((mockListing, index) => {
      // Simple matching logic - in reality this would be much more sophisticated
      const titleLower = mockListing.title?.toLowerCase() || '';
      const matchesSearch = searchTerms.some(term => 
        titleLower.includes(term.toLowerCase()) ||
        titleLower.includes(searchConfig.manufacturer.toLowerCase())
      );
      
      if (matchesSearch) {
        const price = mockListing.price || 0;
        const listing: Listing = {
          id: crypto.randomUUID(),
          search_id: searchConfig.id,
          source_listing_id: `mock-${index}-${Date.now()}`,
          source_name: mockListing.source_name || 'Unknown',
          source_url: mockListing.source_url || '',
          title: mockListing.title || '',
          description: mockListing.description || '',
          price: price,
          price_threshold: searchConfig.price_threshold,
          max_price_allowed: searchConfig.max_price_allowed,
          location: mockListing.location,
          listing_age: mockListing.listing_age,
          contact_info: mockListing.contact_info,
          date_scraped: new Date().toISOString(),
          last_seen_at: new Date().toISOString(),
          is_within_threshold: price <= searchConfig.price_threshold,
          is_within_slider_range: price > searchConfig.price_threshold && price <= searchConfig.max_price_allowed,
          is_above_slider: price > searchConfig.max_price_allowed,
          is_price_changed: false,
          is_description_changed: false,
          is_ignored: false
        };
        
        results.push(listing);
      }
    });
    
    return results;
  }
  
  private static generateSearchMatrix(searchConfig: SearchConfig): string[] {
    const combinations = [];
    
    for (let year = searchConfig.year_start; year <= searchConfig.year_end; year++) {
      combinations.push(`${year} ${searchConfig.manufacturer}`);
      
      if (searchConfig.qualifier) {
        combinations.push(`${year} ${searchConfig.manufacturer} ${searchConfig.qualifier}`);
        
        if (searchConfig.sub_qualifier) {
          combinations.push(`${year} ${searchConfig.manufacturer} ${searchConfig.qualifier} ${searchConfig.sub_qualifier}`);
        }
      }
    }
    
    return combinations;
  }
}

export const scrapingSources = [
  { name: 'Facebook Marketplace', tier: 1 as const, baseUrl: 'https://facebook.com/marketplace', scrapeFrequency: 5, isActive: true },
  { name: 'Craigslist', tier: 1 as const, baseUrl: 'https://craigslist.org', scrapeFrequency: 5, isActive: true },
  { name: 'eBay Motors', tier: 1 as const, baseUrl: 'https://ebay.com/motors', scrapeFrequency: 5, isActive: true },
  { name: 'OfferUp', tier: 1 as const, baseUrl: 'https://offerup.com', scrapeFrequency: 5, isActive: true },
  { name: 'Kijiji', tier: 1 as const, baseUrl: 'https://kijiji.ca', scrapeFrequency: 5, isActive: false },
  { name: 'Gumtree', tier: 1 as const, baseUrl: 'https://gumtree.com', scrapeFrequency: 5, isActive: false },
  { name: 'Rennlist Forums', tier: 2 as const, baseUrl: 'https://rennlist.com', scrapeFrequency: 2, isActive: true },
  { name: 'Cars & Coffee Discord', tier: 2 as const, baseUrl: 'https://discord.com', scrapeFrequency: 2, isActive: true },
  { name: 'Reddit r/Porsche', tier: 2 as const, baseUrl: 'https://reddit.com/r/porsche', scrapeFrequency: 2, isActive: true },
  { name: 'PCA Forums', tier: 2 as const, baseUrl: 'https://forums.pelicanparts.com', scrapeFrequency: 2, isActive: true }
];
