import { supabase } from '@/integrations/supabase/client';

export interface PriceEstimate {
  low: number;
  average: number;
  high: number;
  samples: number;
  cached?: boolean;
}

export interface PriceEstimateRequest {
  manufacturer: string;
  item_name: string;
  qualifier?: string;
  year_start?: number;
}

export class PriceEstimationService {
  /**
   * Get price estimate for an item
   */
  static async getPriceEstimate(request: PriceEstimateRequest): Promise<PriceEstimate | null> {
    try {
      console.log('Requesting price estimate for:', request);

      const response = await supabase.functions.invoke('get-price-estimate', {
        body: {
          manufacturer: request.manufacturer,
          item_name: request.item_name,
          qualifier: request.qualifier,
          year_start: request.year_start
        }
      });

      if (response.error) {
        console.error('Price estimation error:', response.error);
        return null;
      }

      return response.data as PriceEstimate;
    } catch (error) {
      console.error('Error getting price estimate:', error);
      return null;
    }
  }

  /**
   * Get cached price estimate if available and fresh
   */
  static async getCachedPriceEstimate(request: PriceEstimateRequest): Promise<PriceEstimate | null> {
    try {
      const { data, error } = await supabase
        .rpc('get_cached_price_estimate', {
          manufacturer_param: request.manufacturer,
          item_name_param: request.item_name,
          qualifier_param: request.qualifier || null,
          year_start_param: request.year_start
        });

      if (error || !data || data.length === 0) {
        return null;
      }

      const cached = data[0];
      if (!cached.is_fresh) {
        return null;
      }

      return {
        low: cached.low_price,
        average: cached.average_price,
        high: cached.high_price,
        samples: cached.sample_count,
        cached: true
      };
    } catch (error) {
      console.error('Error getting cached price estimate:', error);
      return null;
    }
  }

  /**
   * Format price for display
   */
  static formatPrice(price: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  }

  /**
   * Get price estimate summary text
   */
  static getPriceEstimateSummary(estimate: PriceEstimate): string {
    const { low, average, high, samples } = estimate;
    
    if (samples === 0) {
      return 'No price data available';
    }

    const lowStr = this.formatPrice(low);
    const avgStr = this.formatPrice(average);
    const highStr = this.formatPrice(high);

    if (samples === 1) {
      return `Based on 1 sale: ${avgStr}`;
    }

    if (low === high) {
      return `Based on ${samples} sales: ~${avgStr}`;
    }

    return `Based on ${samples} sales: ${lowStr} - ${highStr} (avg: ${avgStr})`;
  }

  /**
   * Get price confidence level based on sample size
   */
  static getPriceConfidence(samples: number): 'low' | 'medium' | 'high' {
    if (samples >= 20) return 'high';
    if (samples >= 5) return 'medium';
    return 'low';
  }

  /**
   * Get price recommendation based on estimate
   */
  static getPriceRecommendation(estimate: PriceEstimate): {
    budget_friendly: number;
    fair_value: number;
    premium: number;
  } {
    const { low, average, high } = estimate;
    
    return {
      budget_friendly: Math.round(low + (average - low) * 0.3),
      fair_value: average,
      premium: Math.round(average + (high - average) * 0.7)
    };
  }

  /**
   * Build search query string for price estimation
   */
  static buildSearchQuery(request: PriceEstimateRequest): string {
    return [
      request.manufacturer,
      request.item_name,
      request.qualifier,
      request.year_start ? `${request.year_start}` : ''
    ].filter(Boolean).join(' ');
  }

  /**
   * Get price history for an item (if multiple cached entries exist)
   */
  static async getPriceHistory(request: PriceEstimateRequest): Promise<Array<{
    date: string;
    low: number;
    average: number;
    high: number;
    samples: number;
  }>> {
    try {
      const { data, error } = await supabase
        .from('price_reference')
        .select('scraped_at, low_price, average_price, high_price, sample_count')
        .eq('manufacturer', request.manufacturer)
        .eq('item_name', request.item_name)
        .eq('qualifier', request.qualifier || null)
        .eq('year_start', request.year_start)
        .order('scraped_at', { ascending: false })
        .limit(10);

      if (error || !data) {
        return [];
      }

      return data.map(entry => ({
        date: entry.scraped_at,
        low: entry.low_price,
        average: entry.average_price,
        high: entry.high_price,
        samples: entry.sample_count
      }));
    } catch (error) {
      console.error('Error getting price history:', error);
      return [];
    }
  }
}