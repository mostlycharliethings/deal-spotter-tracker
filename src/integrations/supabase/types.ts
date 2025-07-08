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
      listings: {
        Row: {
          contact_info: string | null
          date_scraped: string
          description: string | null
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
          search_id: string
          source_listing_id: string
          source_name: string
          source_url: string
          title: string
        }
        Insert: {
          contact_info?: string | null
          date_scraped?: string
          description?: string | null
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
          search_id: string
          source_listing_id: string
          source_name: string
          source_url: string
          title: string
        }
        Update: {
          contact_info?: string | null
          date_scraped?: string
          description?: string | null
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
          search_id?: string
          source_listing_id?: string
          source_name?: string
          source_url?: string
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
      search_configs: {
        Row: {
          created_at: string
          email_address: string
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
          year_end: number
          year_start: number
        }
        Insert: {
          created_at?: string
          email_address: string
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
          year_end: number
          year_start: number
        }
        Update: {
          created_at?: string
          email_address?: string
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
          year_end?: number
          year_start?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
