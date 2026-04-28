export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          role: "user" | "admin";
          account_type: "real_user" | "internal_test" | "synthetic_demo";
          age_range: string | null;
          primary_goal: string | null;
          secondary_goals: string[];
          activity_level: string | null;
          fitness_experience: string | null;
          current_activities: string[];
          preferred_activities: string[];
          available_equipment: string[];
          training_environment: string | null;
          target_training_days: number | null;
          typical_session_length: number | null;
          preferred_schedule: Json;
          diet_preferences: string[];
          diet_restrictions: string[];
          nutrition_goal: string | null;
          energy_baseline: string | null;
          stress_baseline: string | null;
          wellness_support_focus: string[];
          wellness_checkin_opt_in: boolean;
          injuries_limitations: string[];
          health_considerations: string[];
          avoidances: string[];
          coaching_style: string | null;
          preferred_checkin_style: string | null;
          safety_acknowledged: boolean;
          onboarding_completed: boolean;
          onboarding_summary: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          role?: "user" | "admin";
          account_type?: "real_user" | "internal_test" | "synthetic_demo";
          age_range?: string | null;
          primary_goal?: string | null;
          secondary_goals?: string[];
          activity_level?: string | null;
          fitness_experience?: string | null;
          current_activities?: string[];
          preferred_activities?: string[];
          available_equipment?: string[];
          training_environment?: string | null;
          target_training_days?: number | null;
          typical_session_length?: number | null;
          preferred_schedule?: Json;
          diet_preferences?: string[];
          diet_restrictions?: string[];
          nutrition_goal?: string | null;
          energy_baseline?: string | null;
          stress_baseline?: string | null;
          wellness_support_focus?: string[];
          wellness_checkin_opt_in?: boolean;
          injuries_limitations?: string[];
          health_considerations?: string[];
          avoidances?: string[];
          coaching_style?: string | null;
          preferred_checkin_style?: string | null;
          safety_acknowledged?: boolean;
          onboarding_completed?: boolean;
          onboarding_summary?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          role?: "user" | "admin";
          account_type?: "real_user" | "internal_test" | "synthetic_demo";
          age_range?: string | null;
          primary_goal?: string | null;
          secondary_goals?: string[];
          activity_level?: string | null;
          fitness_experience?: string | null;
          current_activities?: string[];
          preferred_activities?: string[];
          available_equipment?: string[];
          training_environment?: string | null;
          target_training_days?: number | null;
          typical_session_length?: number | null;
          preferred_schedule?: Json;
          diet_preferences?: string[];
          diet_restrictions?: string[];
          nutrition_goal?: string | null;
          energy_baseline?: string | null;
          stress_baseline?: string | null;
          wellness_support_focus?: string[];
          wellness_checkin_opt_in?: boolean;
          injuries_limitations?: string[];
          health_considerations?: string[];
          avoidances?: string[];
          coaching_style?: string | null;
          preferred_checkin_style?: string | null;
          safety_acknowledged?: boolean;
          onboarding_completed?: boolean;
          onboarding_summary?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      conversation_threads: {
        Row: {
          id: string;
          user_id: string;
          title: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      conversation_messages: {
        Row: {
          id: string;
          thread_id: string;
          user_id: string;
          role: "user" | "assistant" | "system";
          message_type:
            | "chat"
            | "onboarding"
            | "log_confirmation"
            | "summary"
            | "recommendation"
            | "checkin_prompt"
            | "system_event";
          content: string;
          structured_payload: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          thread_id: string;
          user_id: string;
          role: "user" | "assistant" | "system";
          message_type?:
            | "chat"
            | "onboarding"
            | "log_confirmation"
            | "summary"
            | "recommendation"
            | "checkin_prompt"
            | "system_event";
          content: string;
          structured_payload?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          thread_id?: string;
          user_id?: string;
          role?: "user" | "assistant" | "system";
          message_type?:
            | "chat"
            | "onboarding"
            | "log_confirmation"
            | "summary"
            | "recommendation"
            | "checkin_prompt"
            | "system_event";
          content?: string;
          structured_payload?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      activity_logs: {
        Row: {
          id: string;
          user_id: string;
          source_message_id: string | null;
          activity_type: string;
          description: string | null;
          duration_minutes: number | null;
          intensity: string | null;
          logged_for_date: string;
          metadata_json: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          source_message_id?: string | null;
          activity_type: string;
          description?: string | null;
          duration_minutes?: number | null;
          intensity?: string | null;
          logged_for_date?: string;
          metadata_json?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          source_message_id?: string | null;
          activity_type?: string;
          description?: string | null;
          duration_minutes?: number | null;
          intensity?: string | null;
          logged_for_date?: string;
          metadata_json?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      diet_logs: {
        Row: {
          id: string;
          user_id: string;
          source_message_id: string | null;
          description: string;
          meal_type: string | null;
          logged_for_date: string;
          confidence: number | null;
          metadata_json: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          source_message_id?: string | null;
          description: string;
          meal_type?: string | null;
          logged_for_date?: string;
          confidence?: number | null;
          metadata_json?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          source_message_id?: string | null;
          description?: string;
          meal_type?: string | null;
          logged_for_date?: string;
          confidence?: number | null;
          metadata_json?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      wellness_checkins: {
        Row: {
          id: string;
          user_id: string;
          source_message_id: string | null;
          energy_score: number | null;
          soreness_score: number | null;
          mood_score: number | null;
          stress_score: number | null;
          motivation_score: number | null;
          notes: string | null;
          logged_for_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          source_message_id?: string | null;
          energy_score?: number | null;
          soreness_score?: number | null;
          mood_score?: number | null;
          stress_score?: number | null;
          motivation_score?: number | null;
          notes?: string | null;
          logged_for_date?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          source_message_id?: string | null;
          energy_score?: number | null;
          soreness_score?: number | null;
          mood_score?: number | null;
          stress_score?: number | null;
          motivation_score?: number | null;
          notes?: string | null;
          logged_for_date?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      product_suggestions: {
        Row: {
          id: string;
          suggestion_type: string;
          title: string;
          summary: string;
          evidence_json: Json;
          status: "proposed" | "under_review" | "approved" | "rejected";
          created_by: string | null;
          created_at: string;
          updated_at: string;
          reviewed_at: string | null;
        };
        Insert: {
          id?: string;
          suggestion_type: string;
          title: string;
          summary: string;
          evidence_json?: Json;
          status?: "proposed" | "under_review" | "approved" | "rejected";
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          reviewed_at?: string | null;
        };
        Update: {
          id?: string;
          suggestion_type?: string;
          title?: string;
          summary?: string;
          evidence_json?: Json;
          status?: "proposed" | "under_review" | "approved" | "rejected";
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          reviewed_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "product_suggestions_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      admin_friction_summary: {
        Args: Record<PropertyKey, never>;
        Returns: {
          detail: string;
          entry_count: number;
          label: string;
        }[];
      };
      admin_overview_metrics: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      admin_prompt_theme_counts: {
        Args: Record<PropertyKey, never>;
        Returns: {
          entry_count: number;
          theme: string;
        }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
