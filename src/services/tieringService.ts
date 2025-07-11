import { GeoUtils } from './geoUtils';

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
        const locationInfo = await GeoUtils.enrichListingWithLocation(
          { location: listing.location, title: listing.title },
          { latitude: userLatitude, longitude: userLongitude }
        );
        
        if (locationInfo.distanceInfo) {
          distanceMiles = locationInfo.distanceInfo.distanceMiles;
          proximityBucket = this.calculateProximityBucket(distanceMiles);
        }
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

  static sortListingsByTierAndProximity(listings: any[]): any[] {
    const tierOrder = { tier1: 1, tier2: 2, tier3: 3 };
    const proximityOrder = { '<100mi': 1, '100–500mi': 2, '>500mi': 3 };
    
    return listings.sort((a, b) => {
      // First sort by tier
      const tierComparison = (tierOrder[a.tier as keyof typeof tierOrder] || 999) - 
                            (tierOrder[b.tier as keyof typeof tierOrder] || 999);
      if (tierComparison !== 0) return tierComparison;
      
      // Then by proximity bucket
      const proximityComparison = (proximityOrder[a.proximity_bucket as keyof typeof proximityOrder] || 999) - 
                                 (proximityOrder[b.proximity_bucket as keyof typeof proximityOrder] || 999);
      if (proximityComparison !== 0) return proximityComparison;
      
      // Finally by price ascending
      return (a.price || 0) - (b.price || 0);
    });
  }
}