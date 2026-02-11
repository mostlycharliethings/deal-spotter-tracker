import { supabase } from '@/integrations/supabase/client';

export interface TertiarySource {
  id: string;
  url: string;
  domain: string;
  first_seen_at: string;
  last_seen_at: string;
  times_used: number;
  source_type: string | null;
  notes: string | null;
}

export class TertiarySourceLogger {
  private static readonly TIER_1_DOMAINS = [
    'craigslist.org',
    'ebay.com',
    'facebook.com',
    'marketplace.facebook.com',
    'offerup.com',
    'mercari.com',
    'poshmark.com',
    'vinted.com',
    'depop.com'
  ];

  /**
   * Check if a URL belongs to Tier 1 (major marketplaces) or Tier 2 (known specialized sources)
   */
  static async isTertiarySource(url: string): Promise<boolean> {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname.toLowerCase().replace('www.', '');

      // Check against Tier 1 domains
      if (this.TIER_1_DOMAINS.some(tier1Domain => domain.includes(tier1Domain))) {
        return false;
      }

      // Check against Tier 2 sources in database
      const { data: tier2Sources } = await (supabase as any)
        .from('tier2_sources')
        .select('url')
        .ilike('url', `%${domain}%`);

      if (tier2Sources && tier2Sources.length > 0) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking if tertiary source:', error);
      return false;
    }
  }

  /**
   * Log a tertiary source if it's new, or increment usage if it exists
   */
  static async logTertiarySourceIfNew(
    url: string,
    sourceType: string = 'unknown'
  ): Promise<string | null> {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname.toLowerCase().replace('www.', '');

      // Check if this is actually a tertiary source
      const isTertiary = await this.isTertiarySource(url);
      if (!isTertiary) {
        console.log(`Source ${domain} is not tertiary, skipping log`);
        return null;
      }

      console.log(`Logging tertiary source: ${domain}`);

      // Use the database function to log or increment
      const { data, error } = await (supabase as any)
        .rpc('log_tertiary_source_if_new', {
          url_param: url,
          domain_param: domain,
          source_type_param: sourceType
        });

      if (error) {
        console.error('Error logging tertiary source:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in logTertiarySourceIfNew:', error);
      return null;
    }
  }

  /**
   * Get all tertiary sources, optionally filtered by usage threshold
   */
  static async getTertiarySources(minUsage: number = 1): Promise<TertiarySource[]> {
    try {
      const { data, error } = await (supabase as any)
        .from('tertiary_sources')
        .select('*')
        .gte('times_used', minUsage)
        .order('times_used', { ascending: false });

      if (error) {
        console.error('Error fetching tertiary sources:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getTertiarySources:', error);
      return [];
    }
  }

  /**
   * Get tertiary source statistics
   */
  static async getTertiarySourceStats(): Promise<{
    total_sources: number;
    total_usage: number;
    top_domains: Array<{ domain: string; times_used: number }>;
  }> {
    try {
      const { data, error } = await (supabase as any)
        .from('tertiary_sources')
        .select('domain, times_used');

      if (error || !data) {
        return { total_sources: 0, total_usage: 0, top_domains: [] };
      }

      const total_sources = data.length;
      const total_usage = data.reduce((sum: number, source: any) => sum + source.times_used, 0);
      
      // Group by domain and sum usage
      const domainStats = data.reduce((acc: Record<string, number>, source: any) => {
        acc[source.domain] = (acc[source.domain] || 0) + source.times_used;
        return acc;
      }, {} as Record<string, number>);

      const top_domains = Object.entries(domainStats)
        .map(([domain, times_used]) => ({ domain, times_used: times_used as number }))
        .sort((a, b) => (b.times_used as number) - (a.times_used as number))
        .slice(0, 10);

      return {
        total_sources,
        total_usage,
        top_domains
      };
    } catch (error) {
      console.error('Error getting tertiary source stats:', error);
      return { total_sources: 0, total_usage: 0, top_domains: [] };
    }
  }

  /**
   * Extract domain from URL for categorization
   */
  static extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.toLowerCase().replace('www.', '');
    } catch {
      return 'unknown';
    }
  }

  /**
   * Categorize source type based on URL patterns
   */
  static categorizeSourceType(url: string): string {
    const domain = this.extractDomain(url);
    
    if (domain.includes('forum') || domain.includes('board') || domain.includes('community')) {
      return 'forum';
    }
    if (domain.includes('reddit') || domain.includes('discord')) {
      return 'social';
    }
    if (domain.includes('classified') || domain.includes('ads')) {
      return 'classified';
    }
    if (domain.includes('market') || domain.includes('shop') || domain.includes('store')) {
      return 'marketplace';
    }
    
    return 'unknown';
  }
}