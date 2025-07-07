import { Listing, SearchConfig } from '@/types/database';

// Mock data for demonstration - covers various item types
const mockListings: Partial<Listing>[] = [
  {
    source_name: 'Facebook Marketplace',
    title: 'Vintage Gibson Les Paul Guitar - Excellent Condition',
    description: 'Beautiful 1995 Gibson Les Paul with original case. Well maintained, sounds amazing.',
    price: 2800,
    location: 'Los Angeles, CA',
    listing_age: '2 hours ago',
    contact_info: 'Message through Facebook',
    source_url: 'https://facebook.com/marketplace/item/vintage-gibson'
  },
  {
    source_name: 'Craigslist',
    title: 'MacBook Pro 16" M1 Max - Like New',
    description: 'Barely used MacBook Pro with all original packaging. Perfect for creative work.',
    price: 3200,
    location: 'San Francisco, CA',
    listing_age: '1 day ago',
    contact_info: '(555) 123-4567',
    source_url: 'https://craigslist.org/ele/macbook-pro.html'
  },
  {
    source_name: 'eBay',
    title: 'Rolex Submariner Date - Authentic with Papers',
    description: 'Genuine Rolex with certificate of authenticity. Serviced recently.',
    price: 12500,
    location: 'Miami, FL',
    listing_age: '3 days ago',
    contact_info: 'eBay messaging',
    source_url: 'https://ebay.com/itm/rolex-submariner'
  },
  {
    source_name: 'OfferUp',
    title: 'Herman Miller Aeron Chair - Size B',
    description: 'Ergonomic office chair in excellent condition. All adjustments work perfectly.',
    price: 450,
    location: 'Austin, TX',
    listing_age: '5 hours ago',
    contact_info: 'OfferUp messaging',
    source_url: 'https://offerup.com/item/herman-miller-aeron'
  },
  {
    source_name: 'Mercari',
    title: 'Vintage Omega Speedmaster Professional',
    description: 'Classic moonwatch in original condition. Collector maintained with service history.',
    price: 4200,
    location: 'Seattle, WA',
    listing_age: '12 hours ago',
    contact_info: 'Mercari messaging',
    source_url: 'https://mercari.com/item/omega-speedmaster'
  },
  {
    source_name: 'Gumtree',
    title: 'Vintage Fender Stratocaster - 1970s',
    description: 'Classic Fender in great playing condition. Some wear but plays beautifully.',
    price: 1800,
    location: 'London, UK',
    listing_age: '6 hours ago',
    contact_info: 'Gumtree messaging',
    source_url: 'https://gumtree.com/guitar/fender-strat'
  },
  {
    source_name: 'Reddit r/ForSale',
    title: '[WTS] Sony A7R IV Camera Body',
    description: 'Excellent condition mirrorless camera. Low shutter count, includes all accessories.',
    price: 2400,
    location: 'Portland, OR',
    listing_age: '8 hours ago',
    contact_info: 'Reddit PM',
    source_url: 'https://reddit.com/r/forsale/sony-a7r4'
  },
  {
    source_name: 'Discord Communities',
    title: 'Rare Pokemon Card Collection',
    description: 'Base set holos in mint condition. Authenticated and graded.',
    price: 850,
    location: 'Online',
    listing_age: '4 hours ago',
    contact_info: 'Discord DM',
    source_url: 'https://discord.com/pokemon-cards'
  },
  {
    source_name: 'Specialized Forums',
    title: 'High-End Audio DAC - Chord Hugo 2',
    description: 'Pristine condition portable DAC/headphone amp. Original packaging included.',
    price: 1600,
    location: 'Chicago, IL',
    listing_age: '10 hours ago',
    contact_info: 'Forum PM',
    source_url: 'https://audiophile-forum.com/chord-hugo2'
  },
  {
    source_name: 'Local Classifieds',
    title: 'Antique Mechanical Watch Collection',
    description: 'Various vintage timepieces from estate sale. Working condition.',
    price: 1200,
    location: 'Boston, MA',
    listing_age: '1 day ago',
    contact_info: 'Local newspaper',
    source_url: 'https://local-classifieds.com/watches'
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
      // Simple matching logic - check if any search term matches the title
      const titleLower = mockListing.title?.toLowerCase() || '';
      const matchesSearch = searchTerms.some(term => 
        titleLower.includes(term.toLowerCase()) ||
        titleLower.includes(searchConfig.manufacturer.toLowerCase()) ||
        titleLower.includes(searchConfig.item_name.toLowerCase())
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
    
    // Handle year-based searches (like vehicles, vintage items)
    if (searchConfig.year_start && searchConfig.year_end) {
      for (let year = searchConfig.year_start; year <= searchConfig.year_end; year++) {
        combinations.push(`${year} ${searchConfig.manufacturer} ${searchConfig.item_name}`);
        
        if (searchConfig.qualifier) {
          combinations.push(`${year} ${searchConfig.manufacturer} ${searchConfig.item_name} ${searchConfig.qualifier}`);
          
          if (searchConfig.sub_qualifier) {
            combinations.push(`${year} ${searchConfig.manufacturer} ${searchConfig.item_name} ${searchConfig.qualifier} ${searchConfig.sub_qualifier}`);
          }
        }
      }
    } else {
      // Handle non-year-based searches (general items)
      combinations.push(`${searchConfig.manufacturer} ${searchConfig.item_name}`);
      
      if (searchConfig.qualifier) {
        combinations.push(`${searchConfig.manufacturer} ${searchConfig.item_name} ${searchConfig.qualifier}`);
        
        if (searchConfig.sub_qualifier) {
          combinations.push(`${searchConfig.manufacturer} ${searchConfig.item_name} ${searchConfig.qualifier} ${searchConfig.sub_qualifier}`);
        }
      }
    }
    
    return combinations;
  }
}

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
