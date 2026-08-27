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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      cards: {
        Row: {
          audio_url: string | null
          category_id: string | null
          child_id: string
          context_tags: string[] | null
          created_at: string
          emoji: string | null
          id: string
          image_url: string | null
          label: string
          last_used_at: string | null
          part_of_speech: Database["public"]["Enums"]["part_of_speech"]
          use_count: number
        }
        Insert: {
          audio_url?: string | null
          category_id?: string | null
          child_id: string
          context_tags?: string[] | null
          created_at?: string
          emoji?: string | null
          id?: string
          image_url?: string | null
          label: string
          last_used_at?: string | null
          part_of_speech?: Database["public"]["Enums"]["part_of_speech"]
          use_count?: number
        }
        Update: {
          audio_url?: string | null
          category_id?: string | null
          child_id?: string
          context_tags?: string[] | null
          created_at?: string
          emoji?: string | null
          id?: string
          image_url?: string | null
          label?: string
          last_used_at?: string | null
          part_of_speech?: Database["public"]["Enums"]["part_of_speech"]
          use_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "cards_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cards_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          child_id: string
          color: string | null
          created_at: string
          icon: string | null
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          child_id: string
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          child_id?: string
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "categories_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      children: {
        Row: {
          birth_year: number | null
          created_at: string
          current_level: Database["public"]["Enums"]["scaffold_level"]
          id: string
          name: string
          parent_id: string
          voice_preference: string
        }
        Insert: {
          birth_year?: number | null
          created_at?: string
          current_level?: Database["public"]["Enums"]["scaffold_level"]
          id?: string
          name: string
          parent_id: string
          voice_preference?: string
        }
        Update: {
          birth_year?: number | null
          created_at?: string
          current_level?: Database["public"]["Enums"]["scaffold_level"]
          id?: string
          name?: string
          parent_id?: string
          voice_preference?: string
        }
        Relationships: []
      }
      interactions: {
        Row: {
          card_id: string | null
          child_id: string
          created_at: string
          hour_of_day: number
          id: number
          label: string
          part_of_speech: Database["public"]["Enums"]["part_of_speech"] | null
          position_in_utterance: number | null
          suggestion_accepted: boolean | null
          utterance_id: string | null
          was_suggested: boolean
        }
        Insert: {
          card_id?: string | null
          child_id: string
          created_at?: string
          hour_of_day: number
          id?: number
          label: string
          part_of_speech?: Database["public"]["Enums"]["part_of_speech"] | null
          position_in_utterance?: number | null
          suggestion_accepted?: boolean | null
          utterance_id?: string | null
          was_suggested?: boolean
        }
        Update: {
          card_id?: string | null
          child_id?: string
          created_at?: string
          hour_of_day?: number
          id?: number
          label?: string
          part_of_speech?: Database["public"]["Enums"]["part_of_speech"] | null
          position_in_utterance?: number | null
          suggestion_accepted?: boolean | null
          utterance_id?: string | null
          was_suggested?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "interactions_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interactions_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      scaffold_state: {
        Row: {
          card_id: string
          child_id: string
          failed_suggestions: number
          id: string
          level: Database["public"]["Enums"]["scaffold_level"]
          updated_at: string
          uses_at_current_level: number
        }
        Insert: {
          card_id: string
          child_id: string
          failed_suggestions?: number
          id?: string
          level?: Database["public"]["Enums"]["scaffold_level"]
          updated_at?: string
          uses_at_current_level?: number
        }
        Update: {
          card_id?: string
          child_id?: string
          failed_suggestions?: number
          id?: string
          level?: Database["public"]["Enums"]["scaffold_level"]
          updated_at?: string
          uses_at_current_level?: number
        }
        Relationships: [
          {
            foreignKeyName: "scaffold_state_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scaffold_state_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      utterances: {
        Row: {
          child_id: string
          created_at: string
          id: string
          level: Database["public"]["Enums"]["scaffold_level"]
          text: string
          word_count: number
        }
        Insert: {
          child_id: string
          created_at?: string
          id?: string
          level: Database["public"]["Enums"]["scaffold_level"]
          text: string
          word_count: number
        }
        Update: {
          child_id?: string
          created_at?: string
          id?: string
          level?: Database["public"]["Enums"]["scaffold_level"]
          text?: string
          word_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "utterances_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      seed_categories_for_child: {
        Args: { p_child_id: string }
        Returns: undefined
      }
    }
    Enums: {
      part_of_speech: "noun" | "verb" | "adjective" | "phrase" | "pronoun"
      scaffold_level: "level_1" | "level_2" | "level_3" | "level_4"
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
      part_of_speech: ["noun", "verb", "adjective", "phrase", "pronoun"],
      scaffold_level: ["level_1", "level_2", "level_3", "level_4"],
    },
  },
} as const
