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
          coach_persona: string | null;
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
          coach_persona?: string | null;
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
          coach_persona?: string | null;
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
            | "system_event"
            | "clarification_request";
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
            | "system_event"
            | "clarification_request";
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
            | "system_event"
            | "clarification_request";
          content?: string;
          structured_payload?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      ai_trace_runs: {
        Row: {
          id: string;
          user_id: string;
          thread_id: string;
          source_message_id: string | null;
          assistant_message_id: string | null;
          user_email: string | null;
          user_display_name: string | null;
          thread_title: string | null;
          orchestration_mode: string;
          extraction_source: string;
          used_model: boolean;
          model_name: string | null;
          prompt_version: string | null;
          intent: string | null;
          raw_user_message: string;
          profile_snapshot: Json;
          recent_context_snapshot: Json;
          extracted_payload: Json;
          tool_calls: Json;
          tool_results: Json;
          persisted_log_ids: Json;
          needs_clarification: boolean;
          fallback_reason: string | null;
          final_reply: string;
          run_status: string;
          error_stage: string | null;
          error_message: string | null;
          latency_ms: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          thread_id: string;
          source_message_id?: string | null;
          assistant_message_id?: string | null;
          user_email?: string | null;
          user_display_name?: string | null;
          thread_title?: string | null;
          orchestration_mode: string;
          extraction_source: string;
          used_model?: boolean;
          model_name?: string | null;
          prompt_version?: string | null;
          intent?: string | null;
          raw_user_message: string;
          profile_snapshot?: Json;
          recent_context_snapshot?: Json;
          extracted_payload?: Json;
          tool_calls?: Json;
          tool_results?: Json;
          persisted_log_ids?: Json;
          needs_clarification?: boolean;
          fallback_reason?: string | null;
          final_reply: string;
          run_status?: string;
          error_stage?: string | null;
          error_message?: string | null;
          latency_ms?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          thread_id?: string;
          source_message_id?: string | null;
          assistant_message_id?: string | null;
          user_email?: string | null;
          user_display_name?: string | null;
          thread_title?: string | null;
          orchestration_mode?: string;
          extraction_source?: string;
          used_model?: boolean;
          model_name?: string | null;
          prompt_version?: string | null;
          intent?: string | null;
          raw_user_message?: string;
          profile_snapshot?: Json;
          recent_context_snapshot?: Json;
          extracted_payload?: Json;
          tool_calls?: Json;
          tool_results?: Json;
          persisted_log_ids?: Json;
          needs_clarification?: boolean;
          fallback_reason?: string | null;
          final_reply?: string;
          run_status?: string;
          error_stage?: string | null;
          error_message?: string | null;
          latency_ms?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
      eval_runs: {
        Row: {
          id: string;
          suite_id: string;
          scenario_id: string | null;
          run_scope: "scenario" | "suite";
          status: "running" | "completed" | "failed";
          model_name: string | null;
          prompt_version: string | null;
          error_message: string | null;
          started_at: string;
          completed_at: string | null;
          created_by: string | null;
          metadata_json: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          suite_id?: string;
          scenario_id?: string | null;
          run_scope?: "scenario" | "suite";
          status?: "running" | "completed" | "failed";
          model_name?: string | null;
          prompt_version?: string | null;
          error_message?: string | null;
          started_at?: string;
          completed_at?: string | null;
          created_by?: string | null;
          metadata_json?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          suite_id?: string;
          scenario_id?: string | null;
          run_scope?: "scenario" | "suite";
          status?: "running" | "completed" | "failed";
          model_name?: string | null;
          prompt_version?: string | null;
          error_message?: string | null;
          started_at?: string;
          completed_at?: string | null;
          created_by?: string | null;
          metadata_json?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "eval_runs_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      eval_run_items: {
        Row: {
          id: string;
          eval_run_id: string;
          scenario_id: string;
          user_id: string;
          day_index: number | null;
          pillar: "activity" | "diet" | "wellness" | "summary";
          input_message: string;
          expected_json: Json;
          trace_id: string | null;
          source_message_id: string | null;
          assistant_message_id: string | null;
          assistant_reply: string | null;
          actual_json: Json;
          run_status: string;
          error_message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          eval_run_id: string;
          scenario_id: string;
          user_id: string;
          day_index?: number | null;
          pillar: "activity" | "diet" | "wellness" | "summary";
          input_message: string;
          expected_json?: Json;
          trace_id?: string | null;
          source_message_id?: string | null;
          assistant_message_id?: string | null;
          assistant_reply?: string | null;
          actual_json?: Json;
          run_status?: string;
          error_message?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          eval_run_id?: string;
          scenario_id?: string;
          user_id?: string;
          day_index?: number | null;
          pillar?: "activity" | "diet" | "wellness" | "summary";
          input_message?: string;
          expected_json?: Json;
          trace_id?: string | null;
          source_message_id?: string | null;
          assistant_message_id?: string | null;
          assistant_reply?: string | null;
          actual_json?: Json;
          run_status?: string;
          error_message?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "eval_run_items_eval_run_id_fkey";
            columns: ["eval_run_id"];
            isOneToOne: false;
            referencedRelation: "eval_runs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "eval_run_items_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "eval_run_items_trace_id_fkey";
            columns: ["trace_id"];
            isOneToOne: false;
            referencedRelation: "ai_trace_runs";
            referencedColumns: ["id"];
          }
        ];
      };
      eval_reviews: {
        Row: {
          id: string;
          eval_run_item_id: string;
          review_check: string;
          status: "good" | "needs_work" | "not_applicable";
          issue_tags: string[];
          field_note: string | null;
          expected_behavior: string | null;
          actual_behavior: string | null;
          reviewed_by: string | null;
          reviewed_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          eval_run_item_id: string;
          review_check: string;
          status: "good" | "needs_work" | "not_applicable";
          issue_tags?: string[];
          field_note?: string | null;
          expected_behavior?: string | null;
          actual_behavior?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          eval_run_item_id?: string;
          review_check?: string;
          status?: "good" | "needs_work" | "not_applicable";
          issue_tags?: string[];
          field_note?: string | null;
          expected_behavior?: string | null;
          actual_behavior?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "eval_reviews_eval_run_item_id_fkey";
            columns: ["eval_run_item_id"];
            isOneToOne: false;
            referencedRelation: "eval_run_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "eval_reviews_reviewed_by_fkey";
            columns: ["reviewed_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      coach_summaries: {
        Row: {
          id: string;
          user_id: string;
          summary_type: "daily" | "weekly";
          period_start: string;
          period_end: string;
          summary_text: string;
          structured_metrics_json: Json;
          model_name: string | null;
          prompt_version: string | null;
          source_json: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          summary_type: "daily" | "weekly";
          period_start: string;
          period_end: string;
          summary_text: string;
          structured_metrics_json?: Json;
          model_name?: string | null;
          prompt_version?: string | null;
          source_json?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          summary_type?: "daily" | "weekly";
          period_start?: string;
          period_end?: string;
          summary_text?: string;
          structured_metrics_json?: Json;
          model_name?: string | null;
          prompt_version?: string | null;
          source_json?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "coach_summaries_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
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
      workout_sessions: {
        Row: {
          id: string;
          user_id: string;
          activity_log_id: string | null;
          session_type: "simple" | "circuit";
          title: string | null;
          notes: string | null;
          wod_template_slug: string | null;
          rounds_count: number | null;
          for_time: boolean;
          total_time_seconds: number | null;
          logged_for_date: string;
          program_slug: string | null;
          program_day: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          activity_log_id?: string | null;
          session_type?: "simple" | "circuit";
          title?: string | null;
          notes?: string | null;
          wod_template_slug?: string | null;
          rounds_count?: number | null;
          for_time?: boolean;
          total_time_seconds?: number | null;
          logged_for_date?: string;
          program_slug?: string | null;
          program_day?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          activity_log_id?: string | null;
          session_type?: "simple" | "circuit";
          title?: string | null;
          notes?: string | null;
          wod_template_slug?: string | null;
          rounds_count?: number | null;
          for_time?: boolean;
          total_time_seconds?: number | null;
          logged_for_date?: string;
          program_slug?: string | null;
          program_day?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      program_enrollments: {
        Row: {
          id: string;
          user_id: string;
          program_slug: string;
          start_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          program_slug: string;
          start_date: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          program_slug?: string;
          start_date?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      workout_exercises: {
        Row: {
          id: string;
          session_id: string;
          exercise_slug: string;
          exercise_name: string;
          position: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          exercise_slug: string;
          exercise_name: string;
          position?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          exercise_slug?: string;
          exercise_name?: string;
          position?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      workout_sets: {
        Row: {
          id: string;
          workout_exercise_id: string;
          set_number: number;
          reps: number | null;
          weight: number | null;
          weight_unit: "lb" | "kg";
          duration_seconds: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          workout_exercise_id: string;
          set_number: number;
          reps?: number | null;
          weight?: number | null;
          weight_unit?: "lb" | "kg";
          duration_seconds?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          workout_exercise_id?: string;
          set_number?: number;
          reps?: number | null;
          weight?: number | null;
          weight_unit?: "lb" | "kg";
          duration_seconds?: number | null;
          created_at?: string;
        };
        Relationships: [];
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
