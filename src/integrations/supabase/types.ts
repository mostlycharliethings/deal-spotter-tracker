export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      craigslist_areas: {
        Row: {
          area_code: string
          city_name: string
          country_code: string | null
          created_at: string
          id: string
          is_active: boolean
          latitude: number | null
          longitude: number | null
          state_code: string | null
          timezone: string | null
          updated_at: string
        }
        Insert: {
          area_code: string
          city_name: string
          country_code?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          latitude?: number | null
          longitude?: number | null
          state_code?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          area_code?: string
          city_name?: string
          country_code?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          latitude?: number | null
          longitude?: number | null
          state_code?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      listings: {
        Row: {
          contact_info: string | null
          date_scraped: string
          description: string | null
          distance_miles: number | null
          id: string
          ignore_reason: string | null
          ignored_at: string | null
          is_above_slider: boolean
          is_description_changed: boolean
          is_ignored: boolean
          is_price_changed: boolean
          is_within_slider_range: boolean
          is_within_threshold: boolean
          last_seen_at: string
          listing_age: string | null
          location: string | null
          max_price_allowed: number
          price: number
          price_threshold: number
          proximity_bucket: string | null
          search_id: string
          source_listing_id: string
          source_name: string
          source_url: string
          tier: string | null
          title: string
        }
        Insert: {
          contact_info?: string | null
          date_scraped?: string
          description?: string | null
          distance_miles?: number | null
          id?: string
          ignore_reason?: string | null
          ignored_at?: string | null
          is_above_slider?: boolean
          is_description_changed?: boolean
          is_ignored?: boolean
          is_price_changed?: boolean
          is_within_slider_range?: boolean
          is_within_threshold?: boolean
          last_seen_at?: string
          listing_age?: string | null
          location?: string | null
          max_price_allowed: number
          price: number
          price_threshold: number
          proximity_bucket?: string | null
          search_id: string
          source_listing_id: string
          source_name: string
          source_url: string
          tier?: string | null
          title: string
        }
        Update: {
          contact_info?: string | null
          date_scraped?: string
          description?: string | null
          distance_miles?: number | null
          id?: string
          ignore_reason?: string | null
          ignored_at?: string | null
          is_above_slider?: boolean
          is_description_changed?: boolean
          is_ignored?: boolean
          is_price_changed?: boolean
          is_within_slider_range?: boolean
          is_within_threshold?: boolean
          last_seen_at?: string
          listing_age?: string | null
          location?: string | null
          max_price_allowed?: number
          price?: number
          price_threshold?: number
          proximity_bucket?: string | null
          search_id?: string
          source_listing_id?: string
          source_name?: string
          source_url?: string
          tier?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "listings_search_id_fkey"
            columns: ["search_id"]
            isOneToOne: false
            referencedRelation: "search_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      price_reference: {
        Row: {
          average_price: number | null
          created_at: string
          expires_at: string
          high_price: number | null
          id: string
          item_name: string
          low_price: number | null
          manufacturer: string
          qualifier: string | null
          sample_count: number | null
          scraped_at: string
          source: string | null
          year_end: number | null
          year_start: number | null
        }
        Insert: {
          average_price?: number | null
          created_at?: string
          expires_at?: string
          high_price?: number | null
          id?: string
          item_name: string
          low_price?: number | null
          manufacturer: string
          qualifier?: string | null
          sample_count?: number | null
          scraped_at?: string
          source?: string | null
          year_end?: number | null
          year_start?: number | null
        }
        Update: {
          average_price?: number | null
          created_at?: string
          expires_at?: string
          high_price?: number | null
          id?: string
          item_name?: string
          low_price?: number | null
          manufacturer?: string
          qualifier?: string | null
          sample_count?: number | null
          scraped_at?: string
          source?: string | null
          year_end?: number | null
          year_start?: number | null
        }
        Relationships: []
      }
      scrape_activity_log: {
        Row: {
          created_at: string | null
          data: Json | null
          error_details: string | null
          id: string
          message: string | null
          search_config_id: string | null
          stage: string
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          error_details?: string | null
          id?: string
          message?: string | null
          search_config_id?: string | null
          stage: string
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          error_details?: string | null
          id?: string
          message?: string | null
          search_config_id?: string | null
          stage?: string
        }
        Relationships: [
          {
            foreignKeyName: "scrape_activity_log_search_config_id_fkey"
            columns: ["search_config_id"]
            isOneToOne: false
            referencedRelation: "search_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      search_configs: {
        Row: {
          created_at: string
          email_address: string
          geocoded_location: string | null
          id: string
          is_active: boolean
          item_name: string
          manufacturer: string
          max_price_allowed: number
          price_threshold: number
          qualifier: string | null
          slider_percent: number
          sub_qualifier: string | null
          user_id: string
          user_latitude: number | null
          user_longitude: number | null
          year_end: number
          year_start: number
        }
        Insert: {
          created_at?: string
          email_address: string
          geocoded_location?: string | null
          id?: string
          is_active?: boolean
          item_name: string
          manufacturer: string
          max_price_allowed: number
          price_threshold: number
          qualifier?: string | null
          slider_percent?: number
          sub_qualifier?: string | null
          user_id?: string
          user_latitude?: number | null
          user_longitude?: number | null
          year_end: number
          year_start: number
        }
        Update: {
          created_at?: string
          email_address?: string
          geocoded_location?: string | null
          id?: string
          is_active?: boolean
          item_name?: string
          manufacturer?: string
          max_price_allowed?: number
          price_threshold?: number
          qualifier?: string | null
          slider_percent?: number
          sub_qualifier?: string | null
          user_id?: string
          user_latitude?: number | null
          user_longitude?: number | null
          year_end?: number
          year_start?: number
        }
        Relationships: []
      }
      search_tier2_map: {
        Row: {
          created_at: string
          id: string
          last_scraped_at: string | null
          listings_found: number | null
          search_id: string
          tier2_source_id: string
          was_successful: boolean | null
        }
        Insert: {
          created_at?: string
          id?: string
          last_scraped_at?: string | null
          listings_found?: number | null
          search_id: string
          tier2_source_id: string
          was_successful?: boolean | null
        }
        Update: {
          created_at?: string
          id?: string
          last_scraped_at?: string | null
          listings_found?: number | null
          search_id?: string
          tier2_source_id?: string
          was_successful?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "search_tier2_map_search_id_fkey"
            columns: ["search_id"]
            isOneToOne: false
            referencedRelation: "search_configs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "search_tier2_map_tier2_source_id_fkey"
            columns: ["tier2_source_id"]
            isOneToOne: false
            referencedRelation: "tier2_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      tertiary_sources: {
        Row: {
          created_at: string
          domain: string
          first_seen_at: string
          id: string
          last_seen_at: string
          notes: string | null
          source_type: string | null
          times_used: number | null
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          domain: string
          first_seen_at?: string
          id?: string
          last_seen_at?: string
          notes?: string | null
          source_type?: string | null
          times_used?: number | null
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          domain?: string
          first_seen_at?: string
          id?: string
          last_seen_at?: string
          notes?: string | null
          source_type?: string | null
          times_used?: number | null
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      tier2_sources: {
        Row: {
          category: string | null
          created_at: string
          id: string
          last_used_at: string | null
          name: string
          notes: string | null
          reliability: string
          success_rate: number | null
          total_listings_found: number | null
          total_searches: number | null
          type: string
          updated_at: string
          url: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          last_used_at?: string | null
          name: string
          notes?: string | null
          reliability: string
          success_rate?: number | null
          total_listings_found?: number | null
          total_searches?: number | null
          type: string
          updated_at?: string
          url: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          last_used_at?: string | null
          name?: string
          notes?: string | null
          reliability?: string
          success_rate?: number | null
          total_listings_found?: number | null
          total_searches?: number | null
          type?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_cached_price_estimate: {
        Args: {
          manufacturer_param: string
          item_name_param: string
          qualifier_param: string
          year_start_param: number
        }
        Returns: {
          low_price: number
          average_price: number
          high_price: number
          sample_count: number
          is_fresh: boolean
        }[]
      }
      increment_times_used: {
        Args: { url_param: string }
        Returns: undefined
      }
      log_tertiary_source_if_new: {
        Args: {
          url_param: string
          domain_param: string
          source_type_param?: string
        }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
