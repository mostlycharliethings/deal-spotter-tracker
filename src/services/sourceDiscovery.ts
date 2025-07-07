
export interface DiscoveredSource {
  name: string;
  url: string;
  type: 'forum' | 'marketplace' | 'social' | 'classified';
  reliability: 'high' | 'medium' | 'low';
  notes: string;
}

export interface SourceDiscoveryResponse {
  sources: DiscoveredSource[];
  error?: string;
}

export class SourceDiscoveryService {
  static async discoverSources(
    manufacturer: string,
    itemName: string,
    qualifier?: string,
    subQualifier?: string
  ): Promise<DiscoveredSource[]> {
    try {
      console.log('Discovering sources for:', { manufacturer, itemName, qualifier, subQualifier });

      const response = await fetch('/functions/v1/discover-sources', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          manufacturer,
          itemName,
          qualifier,
          subQualifier,
        }),
      });

      if (!response.ok) {
        console.error('Source discovery request failed:', response.status, response.statusText);
        return [];
      }

      const data: SourceDiscoveryResponse = await response.json();

      if (data.error) {
        console.warn('Source discovery returned error:', data.error);
        // Don't throw error, just return empty array
        return [];
      }

      const validSources = (data.sources || []).filter(source => 
        this.validateDiscoveredSource(source)
      );

      console.log(`Discovered ${validSources.length} valid sources:`, validSources);
      return validSources;

    } catch (error) {
      console.error('Failed to discover sources:', error);
      return [];
    }
  }

  private static validateDiscoveredSource(source: DiscoveredSource): boolean {
    // Basic validation
    if (!source || typeof source !== 'object') {
      console.warn('Invalid source: not an object:', source);
      return false;
    }

    if (!source.name || !source.url || !source.type) {
      console.warn('Invalid source missing required fields:', source);
      return false;
    }

    // URL validation
    try {
      const url = new URL(source.url);
      
      // Block obviously fake domains
      const blockedDomains = [
        'example.com', 'test.com', 'placeholder.com', 'demo.com',
        'fake.com', 'sample.com', 'localclassifieds.com', 'mydomain.com',
        'yoursite.com', 'website.com', 'site.com'
      ];
      
      if (blockedDomains.some(domain => url.hostname.includes(domain))) {
        console.warn('Blocked fake domain:', url.hostname);
        return false;
      }

      return true;
    } catch {
      console.warn('Invalid URL format:', source.url);
      return false;
    }
  }

  static buildSearchUrl(source: DiscoveredSource, searchQuery: string): string {
    const encodedQuery = encodeURIComponent(searchQuery);
    
    // Try to build appropriate search URLs based on source type and URL pattern
    if (source.url.includes('reddit.com')) {
      return `${source.url}/search?q=${encodedQuery}&sort=new`;
    } else if (source.url.includes('facebook.com')) {
      return `${source.url}/search?query=${encodedQuery}`;
    } else if (source.url.includes('forum') || source.type === 'forum') {
      return `${source.url}/search?keywords=${encodedQuery}`;
    } else {
      // Generic approach - append search if URL doesn't already contain it
      if (source.url.includes('/search')) {
        return `${source.url}?q=${encodedQuery}`;
      } else {
        return `${source.url}/?search=${encodedQuery}`;
      }
    }
  }
}
