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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      bookmarks: {
        Row: {
          created_at: string | null
          id: string
          manga_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          manga_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          manga_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmarks_manga_id_fkey"
            columns: ["manga_id"]
            isOneToOne: false
            referencedRelation: "manga"
            referencedColumns: ["id"]
          },
        ]
      }
      chapter_unlocks: {
        Row: {
          chapter_id: string
          id: string
          unlocked_at: string | null
          user_id: string
        }
        Insert: {
          chapter_id: string
          id?: string
          unlocked_at?: string | null
          user_id: string
        }
        Update: {
          chapter_id?: string
          id?: string
          unlocked_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chapter_unlocks_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      chapters: {
        Row: {
          chapter_type: string | null
          created_at: string | null
          download_count: number | null
          id: string
          images: string[] | null
          is_locked: boolean | null
          manga_id: string
          number: number
          pdf_url: string | null
          title: string | null
          token_cost: number | null
        }
        Insert: {
          chapter_type?: string | null
          created_at?: string | null
          download_count?: number | null
          id?: string
          images?: string[] | null
          is_locked?: boolean | null
          manga_id: string
          number: number
          pdf_url?: string | null
          title?: string | null
          token_cost?: number | null
        }
        Update: {
          chapter_type?: string | null
          created_at?: string | null
          download_count?: number | null
          id?: string
          images?: string[] | null
          is_locked?: boolean | null
          manga_id?: string
          number?: number
          pdf_url?: string | null
          title?: string | null
          token_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "chapters_manga_id_fkey"
            columns: ["manga_id"]
            isOneToOne: false
            referencedRelation: "manga"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string | null
          id: string
          manga_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          manga_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          manga_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_manga_id_fkey"
            columns: ["manga_id"]
            isOneToOne: false
            referencedRelation: "manga"
            referencedColumns: ["id"]
          },
        ]
      }
      manga: {
        Row: {
          alternative_names: string[] | null
          artist: string | null
          author: string | null
          cover_url: string | null
          created_at: string | null
          genres: string[] | null
          id: string
          publish_status: string
          rating: number | null
          rating_count: number | null
          released: string | null
          source: string | null
          source_url: string | null
          status: string | null
          summary: string | null
          title: string
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          alternative_names?: string[] | null
          artist?: string | null
          author?: string | null
          cover_url?: string | null
          created_at?: string | null
          genres?: string[] | null
          id?: string
          publish_status?: string
          rating?: number | null
          rating_count?: number | null
          released?: string | null
          source?: string | null
          source_url?: string | null
          status?: string | null
          summary?: string | null
          title: string
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          alternative_names?: string[] | null
          artist?: string | null
          author?: string | null
          cover_url?: string | null
          created_at?: string | null
          genres?: string[] | null
          id?: string
          publish_status?: string
          rating?: number | null
          rating_count?: number | null
          released?: string | null
          source?: string | null
          source_url?: string | null
          status?: string | null
          summary?: string | null
          title?: string
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          display_name: string | null
          email: string
          id: string
          theme_preference: string | null
          tokens: number | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          email: string
          id: string
          theme_preference?: string | null
          tokens?: number | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string
          id?: string
          theme_preference?: string | null
          tokens?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      promo_codes: {
        Row: {
          code: string
          created_at: string | null
          current_uses: number | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          max_uses: number | null
          tokens: number
        }
        Insert: {
          code: string
          created_at?: string | null
          current_uses?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          tokens: number
        }
        Update: {
          code?: string
          created_at?: string | null
          current_uses?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          tokens?: number
        }
        Relationships: []
      }
      promo_redemptions: {
        Row: {
          id: string
          promo_id: string
          redeemed_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          promo_id: string
          redeemed_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          promo_id?: string
          redeemed_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promo_redemptions_promo_id_fkey"
            columns: ["promo_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      reading_history: {
        Row: {
          chapter_id: string
          id: string
          last_read: string | null
          manga_id: string
          page: number | null
          user_id: string
        }
        Insert: {
          chapter_id: string
          id?: string
          last_read?: string | null
          manga_id: string
          page?: number | null
          user_id: string
        }
        Update: {
          chapter_id?: string
          id?: string
          last_read?: string | null
          manga_id?: string
          page?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reading_history_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reading_history_manga_id_fkey"
            columns: ["manga_id"]
            isOneToOne: false
            referencedRelation: "manga"
            referencedColumns: ["id"]
          },
        ]
      }
      scraper_queue: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          manga_id: string | null
          manga_url: string
          priority: number | null
          retry_count: number | null
          source_name: string
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          manga_id?: string | null
          manga_url: string
          priority?: number | null
          retry_count?: number | null
          source_name: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          manga_id?: string | null
          manga_url?: string
          priority?: number | null
          retry_count?: number | null
          source_name?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scraper_queue_manga_id_fkey"
            columns: ["manga_id"]
            isOneToOne: false
            referencedRelation: "manga"
            referencedColumns: ["id"]
          },
        ]
      }
      scraper_sources: {
        Row: {
          created_at: string | null
          display_name: string
          endpoint: string | null
          id: string
          is_active: boolean | null
          last_sync: string | null
          manga_count: number | null
          name: string
          script_content: string | null
        }
        Insert: {
          created_at?: string | null
          display_name: string
          endpoint?: string | null
          id?: string
          is_active?: boolean | null
          last_sync?: string | null
          manga_count?: number | null
          name: string
          script_content?: string | null
        }
        Update: {
          created_at?: string | null
          display_name?: string
          endpoint?: string | null
          id?: string
          is_active?: boolean | null
          last_sync?: string | null
          manga_count?: number | null
          name?: string
          script_content?: string | null
        }
        Relationships: []
      }
      telegram_sessions: {
        Row: {
          chapter_id: string | null
          chat_id: string
          created_at: string | null
          id: string
          images: string[] | null
          manga_id: string | null
          updated_at: string | null
        }
        Insert: {
          chapter_id?: string | null
          chat_id: string
          created_at?: string | null
          id?: string
          images?: string[] | null
          manga_id?: string | null
          updated_at?: string | null
        }
        Update: {
          chapter_id?: string | null
          chat_id?: string
          created_at?: string | null
          id?: string
          images?: string[] | null
          manga_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "telegram_sessions_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "telegram_sessions_manga_id_fkey"
            columns: ["manga_id"]
            isOneToOne: false
            referencedRelation: "manga"
            referencedColumns: ["id"]
          },
        ]
      }
      user_ratings: {
        Row: {
          created_at: string | null
          id: string
          manga_id: string
          rating: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          manga_id: string
          rating?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          manga_id?: string
          rating?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_ratings_manga_id_fkey"
            columns: ["manga_id"]
            isOneToOne: false
            referencedRelation: "manga"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      view_logs: {
        Row: {
          chapter_id: string | null
          created_at: string | null
          id: string
          manga_id: string
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          chapter_id?: string | null
          created_at?: string | null
          id?: string
          manga_id: string
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          chapter_id?: string | null
          created_at?: string | null
          id?: string
          manga_id?: string
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "view_logs_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "view_logs_manga_id_fkey"
            columns: ["manga_id"]
            isOneToOne: false
            referencedRelation: "manga"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "user" | "admin" | "owner"
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
      app_role: ["user", "admin", "owner"],
    },
  },
} as const
