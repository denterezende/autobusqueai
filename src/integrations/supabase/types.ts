export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      favorites: {
        Row: {
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["favorite_kind"]
          target_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: Database["public"]["Enums"]["favorite_kind"]
          target_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["favorite_kind"]
          target_id?: string
          user_id?: string
        }
        Relationships: []
      }
      parts: {
        Row: {
          ai_confidence: number | null
          ai_raw: Json | null
          alt_codes: string[] | null
          avg_time: string | null
          compatible_vehicles: Json | null
          created_at: string
          description: string | null
          difficulty: string | null
          id: string
          image_path: string | null
          material: string | null
          measurements: Json | null
          name: string
          oem_code: string | null
          position: string | null
          side: string | null
          tools: string[] | null
          torque: string | null
          user_id: string
          vehicle_context: Json | null
          weight: string | null
        }
        Insert: {
          ai_confidence?: number | null
          ai_raw?: Json | null
          alt_codes?: string[] | null
          avg_time?: string | null
          compatible_vehicles?: Json | null
          created_at?: string
          description?: string | null
          difficulty?: string | null
          id?: string
          image_path?: string | null
          material?: string | null
          measurements?: Json | null
          name: string
          oem_code?: string | null
          position?: string | null
          side?: string | null
          tools?: string[] | null
          torque?: string | null
          user_id: string
          vehicle_context?: Json | null
          weight?: string | null
        }
        Update: {
          ai_confidence?: number | null
          ai_raw?: Json | null
          alt_codes?: string[] | null
          avg_time?: string | null
          compatible_vehicles?: Json | null
          created_at?: string
          description?: string | null
          difficulty?: string | null
          id?: string
          image_path?: string | null
          material?: string | null
          measurements?: Json | null
          name?: string
          oem_code?: string | null
          position?: string | null
          side?: string | null
          tools?: string[] | null
          torque?: string | null
          user_id?: string
          vehicle_context?: Json | null
          weight?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          profile_type: Database["public"]["Enums"]["profile_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          profile_type?: Database["public"]["Enums"]["profile_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          profile_type?: Database["public"]["Enums"]["profile_type"]
          updated_at?: string
        }
        Relationships: []
      }
      search_history: {
        Row: {
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["search_kind"]
          part_id: string | null
          query: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: Database["public"]["Enums"]["search_kind"]
          part_id?: string | null
          query?: Json
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["search_kind"]
          part_id?: string | null
          query?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "search_history_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          brand: string
          created_at: string
          engine: string | null
          id: string
          model: string
          nickname: string | null
          user_id: string
          version: string | null
          vin: string | null
          year: number | null
        }
        Insert: {
          brand: string
          created_at?: string
          engine?: string | null
          id?: string
          model: string
          nickname?: string | null
          user_id: string
          version?: string | null
          vin?: string | null
          year?: number | null
        }
        Update: {
          brand?: string
          created_at?: string
          engine?: string | null
          id?: string
          model?: string
          nickname?: string | null
          user_id?: string
          version?: string | null
          vin?: string | null
          year?: number | null
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
      favorite_kind: "part" | "vehicle"
      profile_type: "mechanic" | "parts_shop" | "dealership" | "consumer"
      search_kind: "text" | "image"
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
    Enums: {
      favorite_kind: ["part", "vehicle"],
      profile_type: ["mechanic", "parts_shop", "dealership", "consumer"],
      search_kind: ["text", "image"],
    },
  },
} as const
