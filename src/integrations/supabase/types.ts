export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
