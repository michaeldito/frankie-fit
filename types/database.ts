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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
