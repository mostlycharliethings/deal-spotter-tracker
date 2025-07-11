
export interface SearchConfig {
  id: string;
  user_id: string;
  item_name: string;
  manufacturer: string;
  year_start: number;
  year_end: number;
  qualifier?: string;
  sub_qualifier?: string;
  price_threshold: number;
  slider_percent: number;
  max_price_allowed: number;
  email_address: string;
  created_at: string;
  is_active: boolean;
  user_latitude?: number;
  user_longitude?: number;
  geocoded_location?: string;
}

export interface Listing {
  id: string;
  search_id: string;
  source_name: string;
  source_url: string;
  source_listing_id: string;
  title: string;
  description: string;
  price: number;
  price_threshold: number;
  max_price_allowed: number;
  location?: string;
  listing_age?: string;
  contact_info?: string;
  date_scraped: string;
  last_seen_at: string;
  is_within_threshold: boolean;
  is_within_slider_range: boolean;
  is_above_slider: boolean;
  is_price_changed: boolean;
  is_description_changed: boolean;
  is_ignored: boolean;
  ignored_at?: string;
  ignore_reason?: string;
  tier?: string;
  distance_miles?: number;
  proximity_bucket?: string;
}

export interface ScrapingSource {
  name: string;
  tier: 1 | 2;
  baseUrl: string;
  scrapeFrequency: number; // times per day
  isActive: boolean;
}
