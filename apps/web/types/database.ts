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
      activity_logs: {
        Row: {
          activity_type: string
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          intensity: string | null
          logged_for_date: string
          metadata_json: Json
          source_message_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          intensity?: string | null
          logged_for_date?: string
          metadata_json?: Json
          source_message_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          intensity?: string | null
          logged_for_date?: string
          metadata_json?: Json
          source_message_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_source_message_id_fkey"
            columns: ["source_message_id"]
            isOneToOne: false
            referencedRelation: "conversation_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_trace_runs: {
        Row: {
          assistant_message_id: string | null
          created_at: string
          error_message: string | null
          error_stage: string | null
          extracted_payload: Json
          extraction_source: string
          fallback_reason: string | null
          final_reply: string
          id: string
          intent: string | null
          latency_ms: number | null
          model_name: string | null
          needs_clarification: boolean
          orchestration_mode: string
          persisted_log_ids: Json
          profile_snapshot: Json
          prompt_version: string | null
          raw_user_message: string
          recent_context_snapshot: Json
          run_status: string
          source_message_id: string | null
          thread_id: string
          thread_title: string | null
          tool_calls: Json
          tool_results: Json
          used_model: boolean
          user_display_name: string | null
          user_email: string | null
          user_id: string
        }
        Insert: {
          assistant_message_id?: string | null
          created_at?: string
          error_message?: string | null
          error_stage?: string | null
          extracted_payload?: Json
          extraction_source: string
          fallback_reason?: string | null
          final_reply: string
          id?: string
          intent?: string | null
          latency_ms?: number | null
          model_name?: string | null
          needs_clarification?: boolean
          orchestration_mode: string
          persisted_log_ids?: Json
          profile_snapshot?: Json
          prompt_version?: string | null
          raw_user_message: string
          recent_context_snapshot?: Json
          run_status?: string
          source_message_id?: string | null
          thread_id: string
          thread_title?: string | null
          tool_calls?: Json
          tool_results?: Json
          used_model?: boolean
          user_display_name?: string | null
          user_email?: string | null
          user_id: string
        }
        Update: {
          assistant_message_id?: string | null
          created_at?: string
          error_message?: string | null
          error_stage?: string | null
          extracted_payload?: Json
          extraction_source?: string
          fallback_reason?: string | null
          final_reply?: string
          id?: string
          intent?: string | null
          latency_ms?: number | null
          model_name?: string | null
          needs_clarification?: boolean
          orchestration_mode?: string
          persisted_log_ids?: Json
          profile_snapshot?: Json
          prompt_version?: string | null
          raw_user_message?: string
          recent_context_snapshot?: Json
          run_status?: string
          source_message_id?: string | null
          thread_id?: string
          thread_title?: string | null
          tool_calls?: Json
          tool_results?: Json
          used_model?: boolean
          user_display_name?: string | null
          user_email?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_trace_runs_assistant_message_id_fkey"
            columns: ["assistant_message_id"]
            isOneToOne: false
            referencedRelation: "conversation_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_trace_runs_source_message_id_fkey"
            columns: ["source_message_id"]
            isOneToOne: false
            referencedRelation: "conversation_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_trace_runs_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "conversation_threads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_trace_runs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_summaries: {
        Row: {
          created_at: string
          id: string
          model_name: string | null
          period_end: string
          period_start: string
          prompt_version: string | null
          source_json: Json
          structured_metrics_json: Json
          summary_text: string
          summary_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          model_name?: string | null
          period_end: string
          period_start: string
          prompt_version?: string | null
          source_json?: Json
          structured_metrics_json?: Json
          summary_text: string
          summary_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          model_name?: string | null
          period_end?: string
          period_start?: string
          prompt_version?: string | null
          source_json?: Json
          structured_metrics_json?: Json
          summary_text?: string
          summary_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_summaries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          message_type: Database["public"]["Enums"]["message_type"]
          role: Database["public"]["Enums"]["message_role"]
          structured_payload: Json
          thread_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          message_type?: Database["public"]["Enums"]["message_type"]
          role: Database["public"]["Enums"]["message_role"]
          structured_payload?: Json
          thread_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          message_type?: Database["public"]["Enums"]["message_type"]
          role?: Database["public"]["Enums"]["message_role"]
          structured_payload?: Json
          thread_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "conversation_threads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_threads: {
        Row: {
          created_at: string
          id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_threads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      diet_logs: {
        Row: {
          confidence: number | null
          created_at: string
          description: string
          id: string
          logged_for_date: string
          meal_type: string | null
          metadata_json: Json
          source_message_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          description: string
          id?: string
          logged_for_date?: string
          meal_type?: string | null
          metadata_json?: Json
          source_message_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          confidence?: number | null
          created_at?: string
          description?: string
          id?: string
          logged_for_date?: string
          meal_type?: string | null
          metadata_json?: Json
          source_message_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "diet_logs_source_message_id_fkey"
            columns: ["source_message_id"]
            isOneToOne: false
            referencedRelation: "conversation_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diet_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      eval_reviews: {
        Row: {
          actual_behavior: string | null
          created_at: string
          eval_run_item_id: string
          expected_behavior: string | null
          field_note: string | null
          id: string
          issue_tags: string[]
          review_check: string
          reviewed_at: string
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          actual_behavior?: string | null
          created_at?: string
          eval_run_item_id: string
          expected_behavior?: string | null
          field_note?: string | null
          id?: string
          issue_tags?: string[]
          review_check: string
          reviewed_at?: string
          reviewed_by?: string | null
          status: string
          updated_at?: string
        }
        Update: {
          actual_behavior?: string | null
          created_at?: string
          eval_run_item_id?: string
          expected_behavior?: string | null
          field_note?: string | null
          id?: string
          issue_tags?: string[]
          review_check?: string
          reviewed_at?: string
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "eval_reviews_eval_run_item_id_fkey"
            columns: ["eval_run_item_id"]
            isOneToOne: false
            referencedRelation: "eval_run_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eval_reviews_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      eval_run_items: {
        Row: {
          actual_json: Json
          assistant_message_id: string | null
          assistant_reply: string | null
          created_at: string
          day_index: number | null
          error_message: string | null
          eval_run_id: string
          expected_json: Json
          id: string
          input_message: string
          pillar: string
          run_status: string
          scenario_id: string
          source_message_id: string | null
          trace_id: string | null
          user_id: string
        }
        Insert: {
          actual_json?: Json
          assistant_message_id?: string | null
          assistant_reply?: string | null
          created_at?: string
          day_index?: number | null
          error_message?: string | null
          eval_run_id: string
          expected_json?: Json
          id?: string
          input_message: string
          pillar: string
          run_status?: string
          scenario_id: string
          source_message_id?: string | null
          trace_id?: string | null
          user_id: string
        }
        Update: {
          actual_json?: Json
          assistant_message_id?: string | null
          assistant_reply?: string | null
          created_at?: string
          day_index?: number | null
          error_message?: string | null
          eval_run_id?: string
          expected_json?: Json
          id?: string
          input_message?: string
          pillar?: string
          run_status?: string
          scenario_id?: string
          source_message_id?: string | null
          trace_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "eval_run_items_assistant_message_id_fkey"
            columns: ["assistant_message_id"]
            isOneToOne: false
            referencedRelation: "conversation_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eval_run_items_eval_run_id_fkey"
            columns: ["eval_run_id"]
            isOneToOne: false
            referencedRelation: "eval_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eval_run_items_source_message_id_fkey"
            columns: ["source_message_id"]
            isOneToOne: false
            referencedRelation: "conversation_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eval_run_items_trace_id_fkey"
            columns: ["trace_id"]
            isOneToOne: false
            referencedRelation: "ai_trace_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eval_run_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      eval_runs: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string | null
          error_message: string | null
          id: string
          metadata_json: Json
          model_name: string | null
          prompt_version: string | null
          run_scope: string
          scenario_id: string | null
          started_at: string
          status: string
          suite_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          id?: string
          metadata_json?: Json
          model_name?: string | null
          prompt_version?: string | null
          run_scope?: string
          scenario_id?: string | null
          started_at?: string
          status?: string
          suite_id?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          id?: string
          metadata_json?: Json
          model_name?: string | null
          prompt_version?: string | null
          run_scope?: string
          scenario_id?: string | null
          started_at?: string
          status?: string
          suite_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "eval_runs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lifestyle_logs: {
        Row: {
          category: string
          created_at: string
          description: string
          id: string
          logged_for_date: string
          metadata_json: Json
          source_message_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          description: string
          id?: string
          logged_for_date?: string
          metadata_json?: Json
          source_message_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          id?: string
          logged_for_date?: string
          metadata_json?: Json
          source_message_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lifestyle_logs_source_message_id_fkey"
            columns: ["source_message_id"]
            isOneToOne: false
            referencedRelation: "conversation_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lifestyle_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          body: string
          created_at: string
          id: string
          metadata_json: Json
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          body: string
          created_at?: string
          id?: string
          metadata_json?: Json
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          body?: string
          created_at?: string
          id?: string
          metadata_json?: Json
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      product_suggestions: {
        Row: {
          created_at: string
          created_by: string | null
          evidence_json: Json
          id: string
          reviewed_at: string | null
          status: Database["public"]["Enums"]["product_suggestion_status"]
          suggestion_type: string
          summary: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          evidence_json?: Json
          id?: string
          reviewed_at?: string | null
          status?: Database["public"]["Enums"]["product_suggestion_status"]
          suggestion_type: string
          summary: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          evidence_json?: Json
          id?: string
          reviewed_at?: string | null
          status?: Database["public"]["Enums"]["product_suggestion_status"]
          suggestion_type?: string
          summary?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_suggestions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_type: Database["public"]["Enums"]["account_type"]
          activity_level: string | null
          age_range: string | null
          available_equipment: string[]
          avoidances: string[]
          coach_persona: string | null
          coaching_style: string | null
          created_at: string
          current_activities: string[]
          diet_preferences: string[]
          diet_restrictions: string[]
          energy_baseline: string | null
          fitness_experience: string | null
          full_name: string | null
          health_considerations: string[]
          id: string
          injuries_limitations: string[]
          nutrition_goal: string | null
          onboarding_completed: boolean
          onboarding_summary: string | null
          preferred_activities: string[]
          preferred_checkin_style: string | null
          preferred_schedule: Json
          primary_goal: string | null
          role: Database["public"]["Enums"]["app_role"]
          safety_acknowledged: boolean
          secondary_goals: string[]
          stress_baseline: string | null
          strict_workout_logging: boolean
          target_training_days: number | null
          training_environment: string | null
          typical_session_length: number | null
          updated_at: string
          wellness_checkin_opt_in: boolean
          wellness_support_focus: string[]
        }
        Insert: {
          account_type?: Database["public"]["Enums"]["account_type"]
          activity_level?: string | null
          age_range?: string | null
          available_equipment?: string[]
          avoidances?: string[]
          coach_persona?: string | null
          coaching_style?: string | null
          created_at?: string
          current_activities?: string[]
          diet_preferences?: string[]
          diet_restrictions?: string[]
          energy_baseline?: string | null
          fitness_experience?: string | null
          full_name?: string | null
          health_considerations?: string[]
          id: string
          injuries_limitations?: string[]
          nutrition_goal?: string | null
          onboarding_completed?: boolean
          onboarding_summary?: string | null
          preferred_activities?: string[]
          preferred_checkin_style?: string | null
          preferred_schedule?: Json
          primary_goal?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          safety_acknowledged?: boolean
          secondary_goals?: string[]
          stress_baseline?: string | null
          strict_workout_logging?: boolean
          target_training_days?: number | null
          training_environment?: string | null
          typical_session_length?: number | null
          updated_at?: string
          wellness_checkin_opt_in?: boolean
          wellness_support_focus?: string[]
        }
        Update: {
          account_type?: Database["public"]["Enums"]["account_type"]
          activity_level?: string | null
          age_range?: string | null
          available_equipment?: string[]
          avoidances?: string[]
          coach_persona?: string | null
          coaching_style?: string | null
          created_at?: string
          current_activities?: string[]
          diet_preferences?: string[]
          diet_restrictions?: string[]
          energy_baseline?: string | null
          fitness_experience?: string | null
          full_name?: string | null
          health_considerations?: string[]
          id?: string
          injuries_limitations?: string[]
          nutrition_goal?: string | null
          onboarding_completed?: boolean
          onboarding_summary?: string | null
          preferred_activities?: string[]
          preferred_checkin_style?: string | null
          preferred_schedule?: Json
          primary_goal?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          safety_acknowledged?: boolean
          secondary_goals?: string[]
          stress_baseline?: string | null
          strict_workout_logging?: boolean
          target_training_days?: number | null
          training_environment?: string | null
          typical_session_length?: number | null
          updated_at?: string
          wellness_checkin_opt_in?: boolean
          wellness_support_focus?: string[]
        }
        Relationships: []
      }
      program_enrollments: {
        Row: {
          created_at: string
          id: string
          program_slug: string
          start_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          program_slug: string
          start_date: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          program_slug?: string
          start_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "program_enrollments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      push_tokens: {
        Row: {
          created_at: string
          device_platform: string | null
          expo_push_token: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_platform?: string | null
          expo_push_token: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_platform?: string | null
          expo_push_token?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      recommendations: {
        Row: {
          body: string | null
          created_at: string
          generated_from_date: string | null
          id: string
          recommendation_type: Database["public"]["Enums"]["recommendation_type"]
          source_json: Json
          status: Database["public"]["Enums"]["recommendation_status"]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          generated_from_date?: string | null
          id?: string
          recommendation_type?: Database["public"]["Enums"]["recommendation_type"]
          source_json?: Json
          status?: Database["public"]["Enums"]["recommendation_status"]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          generated_from_date?: string | null
          id?: string
          recommendation_type?: Database["public"]["Enums"]["recommendation_type"]
          source_json?: Json
          status?: Database["public"]["Enums"]["recommendation_status"]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recommendations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_summaries: {
        Row: {
          created_at: string
          domain: Database["public"]["Enums"]["summary_domain"]
          id: string
          structured_metrics_json: Json
          summary_text: string
          user_id: string
          week_start: string
        }
        Insert: {
          created_at?: string
          domain: Database["public"]["Enums"]["summary_domain"]
          id?: string
          structured_metrics_json?: Json
          summary_text: string
          user_id: string
          week_start: string
        }
        Update: {
          created_at?: string
          domain?: Database["public"]["Enums"]["summary_domain"]
          id?: string
          structured_metrics_json?: Json
          summary_text?: string
          user_id?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_summaries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wellness_checkins: {
        Row: {
          created_at: string
          energy_score: number | null
          id: string
          logged_for_date: string
          mood_score: number | null
          motivation_score: number | null
          notes: string | null
          soreness_score: number | null
          source_message_id: string | null
          stress_score: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          energy_score?: number | null
          id?: string
          logged_for_date?: string
          mood_score?: number | null
          motivation_score?: number | null
          notes?: string | null
          soreness_score?: number | null
          source_message_id?: string | null
          stress_score?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          energy_score?: number | null
          id?: string
          logged_for_date?: string
          mood_score?: number | null
          motivation_score?: number | null
          notes?: string | null
          soreness_score?: number | null
          source_message_id?: string | null
          stress_score?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wellness_checkins_source_message_id_fkey"
            columns: ["source_message_id"]
            isOneToOne: false
            referencedRelation: "conversation_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wellness_checkins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_exercises: {
        Row: {
          created_at: string
          exercise_name: string
          exercise_slug: string
          id: string
          position: number
          session_id: string
        }
        Insert: {
          created_at?: string
          exercise_name: string
          exercise_slug: string
          id?: string
          position?: number
          session_id: string
        }
        Update: {
          created_at?: string
          exercise_name?: string
          exercise_slug?: string
          id?: string
          position?: number
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_exercises_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_sessions: {
        Row: {
          activity_log_id: string | null
          created_at: string
          for_time: boolean
          id: string
          logged_for_date: string
          notes: string | null
          program_day: number | null
          program_slug: string | null
          rounds_count: number | null
          session_type: Database["public"]["Enums"]["workout_session_type"]
          title: string | null
          total_time_seconds: number | null
          updated_at: string
          user_id: string
          wod_template_slug: string | null
        }
        Insert: {
          activity_log_id?: string | null
          created_at?: string
          for_time?: boolean
          id?: string
          logged_for_date?: string
          notes?: string | null
          program_day?: number | null
          program_slug?: string | null
          rounds_count?: number | null
          session_type?: Database["public"]["Enums"]["workout_session_type"]
          title?: string | null
          total_time_seconds?: number | null
          updated_at?: string
          user_id: string
          wod_template_slug?: string | null
        }
        Update: {
          activity_log_id?: string | null
          created_at?: string
          for_time?: boolean
          id?: string
          logged_for_date?: string
          notes?: string | null
          program_day?: number | null
          program_slug?: string | null
          rounds_count?: number | null
          session_type?: Database["public"]["Enums"]["workout_session_type"]
          title?: string | null
          total_time_seconds?: number | null
          updated_at?: string
          user_id?: string
          wod_template_slug?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_sessions_activity_log_id_fkey"
            columns: ["activity_log_id"]
            isOneToOne: false
            referencedRelation: "activity_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_sets: {
        Row: {
          created_at: string
          duration_seconds: number | null
          id: string
          reps: number | null
          set_number: number
          weight: number | null
          weight_unit: Database["public"]["Enums"]["workout_weight_unit"]
          workout_exercise_id: string
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          id?: string
          reps?: number | null
          set_number: number
          weight?: number | null
          weight_unit?: Database["public"]["Enums"]["workout_weight_unit"]
          workout_exercise_id: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          id?: string
          reps?: number | null
          set_number?: number
          weight?: number | null
          weight_unit?: Database["public"]["Enums"]["workout_weight_unit"]
          workout_exercise_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_sets_workout_exercise_id_fkey"
            columns: ["workout_exercise_id"]
            isOneToOne: false
            referencedRelation: "workout_exercises"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_friction_summary: {
        Args: never
        Returns: {
          detail: string
          entry_count: number
          label: string
        }[]
      }
      admin_overview_metrics: { Args: never; Returns: Json }
      admin_prompt_theme_counts: {
        Args: never
        Returns: {
          entry_count: number
          theme: string
        }[]
      }
      current_app_role: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"]
      }
      is_admin: { Args: never; Returns: boolean }
      is_reviewable_account: {
        Args: { target_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      account_type: "real_user" | "internal_test" | "synthetic_demo"
      app_role: "user" | "admin"
      message_role: "user" | "assistant" | "system"
      message_type:
        | "chat"
        | "onboarding"
        | "log_confirmation"
        | "summary"
        | "recommendation"
        | "checkin_prompt"
        | "system_event"
        | "clarification_request"
        | "workout_draft"
      product_suggestion_status:
        | "proposed"
        | "under_review"
        | "approved"
        | "rejected"
      recommendation_status: "active" | "completed" | "dismissed" | "expired"
      recommendation_type: "general" | "activity" | "diet" | "wellness"
      summary_domain: "overall" | "exercise" | "diet" | "wellness"
      workout_session_type: "simple" | "circuit"
      workout_weight_unit: "lb" | "kg"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      account_type: ["real_user", "internal_test", "synthetic_demo"],
      app_role: ["user", "admin"],
      message_role: ["user", "assistant", "system"],
      message_type: [
        "chat",
        "onboarding",
        "log_confirmation",
        "summary",
        "recommendation",
        "checkin_prompt",
        "system_event",
        "clarification_request",
        "workout_draft",
      ],
      product_suggestion_status: [
        "proposed",
        "under_review",
        "approved",
        "rejected",
      ],
      recommendation_status: ["active", "completed", "dismissed", "expired"],
      recommendation_type: ["general", "activity", "diet", "wellness"],
      summary_domain: ["overall", "exercise", "diet", "wellness"],
      workout_session_type: ["simple", "circuit"],
      workout_weight_unit: ["lb", "kg"],
    },
  },
} as const
