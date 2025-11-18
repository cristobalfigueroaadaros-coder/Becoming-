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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      chats: {
        Row: {
          content: string
          created_at: string | null
          id: string
          mentor_type: Database["public"]["Enums"]["mentor_type"]
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          mentor_type: Database["public"]["Enums"]["mentor_type"]
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          mentor_type?: Database["public"]["Enums"]["mentor_type"]
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      council_meetings: {
        Row: {
          answers: Json
          created_at: string | null
          id: string
          question: string
          user_id: string
        }
        Insert: {
          answers: Json
          created_at?: string | null
          id?: string
          question: string
          user_id: string
        }
        Update: {
          answers?: Json
          created_at?: string | null
          id?: string
          question?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_whispers: {
        Row: {
          created_at: string | null
          id: string
          mentor_type: Database["public"]["Enums"]["mentor_type"]
          message: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          mentor_type: Database["public"]["Enums"]["mentor_type"]
          message: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          mentor_type?: Database["public"]["Enums"]["mentor_type"]
          message?: string
          user_id?: string
        }
        Relationships: []
      }
      premium_waitlist: {
        Row: {
          created_at: string | null
          desired_feature: string | null
          email: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          desired_feature?: string | null
          email: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          desired_feature?: string | null
          email?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          emotional_tone: string | null
          future_age: number | null
          future_lifestyle: string | null
          future_location: string | null
          id: string
          main_mission: string | null
          main_strengths: string[] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          emotional_tone?: string | null
          future_age?: number | null
          future_lifestyle?: string | null
          future_location?: string | null
          id: string
          main_mission?: string | null
          main_strengths?: string[] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          emotional_tone?: string | null
          future_age?: number | null
          future_lifestyle?: string | null
          future_location?: string | null
          id?: string
          main_mission?: string | null
          main_strengths?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_mentors: {
        Row: {
          created_at: string | null
          id: string
          mentor_type: Database["public"]["Enums"]["mentor_type"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          mentor_type: Database["public"]["Enums"]["mentor_type"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          mentor_type?: Database["public"]["Enums"]["mentor_type"]
          user_id?: string
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
      mentor_type:
        | "mamba_mentor"
        | "creative_visionary"
        | "quantum_inventor"
        | "ancient_sage"
        | "compassionate_elder"
        | "future_self"
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
      mentor_type: [
        "mamba_mentor",
        "creative_visionary",
        "quantum_inventor",
        "ancient_sage",
        "compassionate_elder",
        "future_self",
      ],
    },
  },
} as const
