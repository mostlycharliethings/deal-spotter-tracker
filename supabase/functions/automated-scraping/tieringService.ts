export interface TierMapping {
  tier1: string[];
  tier2: string[];
  tier3: string[];
}

export const TIER_MAPPING: TierMapping = {
  tier1: [
    'craigslist',
    'ebay', 
    'facebook',
    'offerup',
    'mercari',
    'reverb',
    'guitar center',
    'amazon'
  ],
  tier2: [
    'mpb',
    'bring a trailer',
    'bringatrailer',
    'pinkbike',
    'bikexchange',
    'trekbikes',
    'specialized',
    'cannondale'
  ],
  tier3: [] // Will be populated from tertiary_sources table
};

export class TieringService {
  static assignTier(sourceName: string, tertiaryDomains: string[] = []): string {
    const normalizedSource = sourceName.toLowerCase();
    
    // Check tier 1 sources
    if (TIER_MAPPING.tier1.some(source => normalizedSource.includes(source))) {
      return 'tier1';
    }
    
    // Check tier 2 sources
    if (TIER_MAPPING.tier2.some(source => normalizedSource.includes(source))) {
      return 'tier2';
    }
    
    // Check if it's a tertiary source (user-discovered)
    if (tertiaryDomains.some(domain => normalizedSource.includes(domain))) {
      return 'tier3';
    }
    
    // Default to tier1 for unknown sources
    return 'tier1';
  }

  static calculateProximityBucket(distanceMiles: number): string {
    if (distanceMiles <= 100) {
      return '<100mi';
    } else if (distanceMiles <= 500) {
      return '100–500mi';
    } else {
      return '>500mi';
    }
  }

  static haversineDistance(
    lat1: number, lon1: number, 
    lat2: number, lon2: number
  ): number {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  static async enrichListingWithTierAndProximity(
    listing: any,
    userLatitude?: number,
    userLongitude?: number,
    tertiaryDomains: string[] = []
  ) {
    // Assign tier
    const tier = this.assignTier(listing.source_name, tertiaryDomains);
    
    // Calculate distance if user coordinates are available
    let distanceMiles: number | null = null;
    let proximityBucket: string | null = null;
    
    if (userLatitude && userLongitude && listing.location) {
      try {
        // Simple geocoding for basic location parsing
        // In production, you'd want to use a proper geocoding service
        distanceMiles = 100; // Default fallback
        proximityBucket = this.calculateProximityBucket(distanceMiles);
      } catch (error) {
        console.warn('Failed to calculate distance for listing:', error);
      }
    }
    
    return {
      ...listing,
      tier,
      distance_miles: distanceMiles,
      proximity_bucket: proximityBucket
    };
  }
}