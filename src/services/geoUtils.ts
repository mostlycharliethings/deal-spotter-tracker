
export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface LocationInfo {
  coordinates: Coordinates | null;
  address: string;
  city?: string;
  state?: string;
  country?: string;
}

export interface DistanceInfo {
  distanceKm: number;
  distanceMiles: number;
  bucket: 'nearby' | 'regional' | 'distant';
}

export class GeoUtils {
  private static readonly OPENCAGE_API_KEY = 'b971e23bef7f47c3b9d2acca5fe8b2d0';
  private static readonly OPENCAGE_URL = 'https://api.opencagedata.com/geocode/v1/json';

  static async geocodeLocation(address: string): Promise<LocationInfo> {
    try {
      const encodedAddress = encodeURIComponent(address);
      const url = `${this.OPENCAGE_URL}?q=${encodedAddress}&key=${this.OPENCAGE_API_KEY}&limit=1&no_annotations=1`;
      
      console.log(`Geocoding address: ${address}`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`OpenCage API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        const components = result.components;
        
        return {
          coordinates: {
            latitude: result.geometry.lat,
            longitude: result.geometry.lng
          },
          address: result.formatted,
          city: components.city || components.town || components.village,
          state: components.state || components.province,
          country: components.country
        };
      } else {
        console.warn(`No geocoding results for address: ${address}`);
        return {
          coordinates: null,
          address: address
        };
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      return {
        coordinates: null,
        address: address
      };
    }
  }

  static calculateDistance(coord1: Coordinates, coord2: Coordinates): DistanceInfo {
    const distanceKm = this.haversineDistance(coord1, coord2);
    const distanceMiles = distanceKm * 0.621371;
    
    let bucket: 'nearby' | 'regional' | 'distant';
    if (distanceMiles < 100) {
      bucket = 'nearby';
    } else if (distanceMiles <= 500) {
      bucket = 'regional';
    } else {
      bucket = 'distant';
    }
    
    return {
      distanceKm,
      distanceMiles,
      bucket
    };
  }

  private static haversineDistance(coord1: Coordinates, coord2: Coordinates): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.degToRad(coord2.latitude - coord1.latitude);
    const dLon = this.degToRad(coord2.longitude - coord1.longitude);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.degToRad(coord1.latitude)) * Math.cos(this.degToRad(coord2.latitude)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c;
  }

  private static degToRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  static parseLocationFromListing(location: string): string {
    // Clean up common location patterns from scraping
    const cleaned = location
      .replace(/^\s*\(|\)\s*$/g, '') // Remove parentheses
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
    
    // Extract city/state if possible
    const patterns = [
      /^([^,]+),\s*([A-Z]{2})$/i, // "City, ST"
      /^([^,]+),\s*([A-Za-z\s]+)$/i, // "City, State"
      /^([A-Za-z\s]+)\s+area$/i, // "City area"
    ];
    
    for (const pattern of patterns) {
      const match = cleaned.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }
    
    return cleaned;
  }

  static async enrichListingWithLocation(
    listing: { location: string | null; title: string }, 
    userLocation?: Coordinates
  ): Promise<{
    locationInfo: LocationInfo;
    distanceInfo: DistanceInfo | null;
  }> {
    let locationToGeocode = listing.location;
    
    // If no location provided, try to extract from title
    if (!locationToGeocode || locationToGeocode === 'Location not parsed') {
      locationToGeocode = this.extractLocationFromTitle(listing.title);
    }
    
    if (!locationToGeocode) {
      return {
        locationInfo: {
          coordinates: null,
          address: 'Location unknown'
        },
        distanceInfo: null
      };
    }
    
    const cleanLocation = this.parseLocationFromListing(locationToGeocode);
    const locationInfo = await this.geocodeLocation(cleanLocation);
    
    let distanceInfo: DistanceInfo | null = null;
    if (locationInfo.coordinates && userLocation) {
      distanceInfo = this.calculateDistance(userLocation, locationInfo.coordinates);
    }
    
    return {
      locationInfo,
      distanceInfo
    };
  }

  private static extractLocationFromTitle(title: string): string | null {
    // Try to extract location patterns from title
    const locationPatterns = [
      /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),?\s*([A-Z]{2})\b/g, // "City, ST" or "City ST"
      /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+area\b/gi, // "City area"
    ];
    
    for (const pattern of locationPatterns) {
      const match = pattern.exec(title);
      if (match) {
        return match[0];
      }
    }
    
    return null;
  }

  static formatDistance(distanceInfo: DistanceInfo): string {
    const miles = Math.round(distanceInfo.distanceMiles);
    
    if (miles < 1) {
      return 'Very close';
    } else if (miles < 100) {
      return `${miles} miles away`;
    } else {
      return `${miles} miles away`;
    }
  }

  static formatDistanceBucket(bucket: 'nearby' | 'regional' | 'distant'): string {
    switch (bucket) {
      case 'nearby':
        return 'Within 100 miles';
      case 'regional':
        return '100-500 miles';
      case 'distant':
        return 'Over 500 miles';
      default:
        return 'Distance unknown';
    }
  }
}
