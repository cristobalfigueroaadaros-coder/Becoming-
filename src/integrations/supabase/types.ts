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
      achievements: {
        Row: {
          achievement_key: string
          created_at: string
          description: string
          icon: string
          id: string
          requirement_type: string
          requirement_value: number
          tier: string
          title: string
          xp_reward: number
        }
        Insert: {
          achievement_key: string
          created_at?: string
          description: string
          icon: string
          id?: string
          requirement_type: string
          requirement_value: number
          tier?: string
          title: string
          xp_reward?: number
        }
        Update: {
          achievement_key?: string
          created_at?: string
          description?: string
          icon?: string
          id?: string
          requirement_type?: string
          requirement_value?: number
          tier?: string
          title?: string
          xp_reward?: number
        }
        Relationships: []
      }
      actual_self_journal: {
        Row: {
          created_at: string | null
          emotional_tone: string | null
          entry_text: string | null
          id: string
          shadow_detected: string | null
          user_id: string
          voice_note_url: string | null
        }
        Insert: {
          created_at?: string | null
          emotional_tone?: string | null
          entry_text?: string | null
          id?: string
          shadow_detected?: string | null
          user_id: string
          voice_note_url?: string | null
        }
        Update: {
          created_at?: string | null
          emotional_tone?: string | null
          entry_text?: string | null
          id?: string
          shadow_detected?: string | null
          user_id?: string
          voice_note_url?: string | null
        }
        Relationships: []
      }
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
      constellation_connections: {
        Row: {
          connection_insight: string
          created_at: string
          entry_ids: string[]
          id: string
          pattern_type: string
          user_id: string
        }
        Insert: {
          connection_insight: string
          created_at?: string
          entry_ids: string[]
          id?: string
          pattern_type: string
          user_id: string
        }
        Update: {
          connection_insight?: string
          created_at?: string
          entry_ids?: string[]
          id?: string
          pattern_type?: string
          user_id?: string
        }
        Relationships: []
      }
      constellation_entries: {
        Row: {
          created_at: string
          description: string
          emotional_tone: string | null
          entry_type: string
          id: string
          key_takeaway: string | null
          related_domains: string[] | null
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description: string
          emotional_tone?: string | null
          entry_type: string
          id?: string
          key_takeaway?: string | null
          related_domains?: string[] | null
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          emotional_tone?: string | null
          entry_type?: string
          id?: string
          key_takeaway?: string | null
          related_domains?: string[] | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      council_meetings: {
        Row: {
          answers: Json
          banter: string | null
          clarifying_questions: Json | null
          conversation_flow: Json | null
          created_at: string | null
          emotional_tone: string | null
          id: string
          pattern_detected: string | null
          question: string
          resolution: string | null
          shadow_triggers: Json | null
          threshold_moment: boolean | null
          user_id: string
        }
        Insert: {
          answers: Json
          banter?: string | null
          clarifying_questions?: Json | null
          conversation_flow?: Json | null
          created_at?: string | null
          emotional_tone?: string | null
          id?: string
          pattern_detected?: string | null
          question: string
          resolution?: string | null
          shadow_triggers?: Json | null
          threshold_moment?: boolean | null
          user_id: string
        }
        Update: {
          answers?: Json
          banter?: string | null
          clarifying_questions?: Json | null
          conversation_flow?: Json | null
          created_at?: string | null
          emotional_tone?: string | null
          id?: string
          pattern_detected?: string | null
          question?: string
          resolution?: string | null
          shadow_triggers?: Json | null
          threshold_moment?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      council_patterns: {
        Row: {
          context: Json | null
          first_detected_at: string | null
          id: string
          last_detected_at: string | null
          pattern_count: number | null
          pattern_type: string
          user_id: string
        }
        Insert: {
          context?: Json | null
          first_detected_at?: string | null
          id?: string
          last_detected_at?: string | null
          pattern_count?: number | null
          pattern_type: string
          user_id: string
        }
        Update: {
          context?: Json | null
          first_detected_at?: string | null
          id?: string
          last_detected_at?: string | null
          pattern_count?: number | null
          pattern_type?: string
          user_id?: string
        }
        Relationships: []
      }
      creation_projects: {
        Row: {
          completed_at: string | null
          created_at: string
          description: string
          dot_connections: Json
          first_step: string
          id: string
          impact: string | null
          progress_notes: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          description: string
          dot_connections?: Json
          first_step: string
          id?: string
          impact?: string | null
          progress_notes?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          description?: string
          dot_connections?: Json
          first_step?: string
          id?: string
          impact?: string | null
          progress_notes?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      current_challenge: {
        Row: {
          challenge_description: string
          challenge_title: string
          challenge_type: string
          created_at: string
          id: string
          shadow_tag: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          challenge_description: string
          challenge_title: string
          challenge_type: string
          created_at?: string
          id?: string
          shadow_tag?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          challenge_description?: string
          challenge_title?: string
          challenge_type?: string
          created_at?: string
          id?: string
          shadow_tag?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_challenge: {
        Row: {
          challenge_description: string
          challenge_title: string
          completed_at: string | null
          created_at: string
          date: string
          id: string
          reflection_text: string | null
          source_reason: string
          status: string
          user_id: string
        }
        Insert: {
          challenge_description: string
          challenge_title: string
          completed_at?: string | null
          created_at?: string
          date: string
          id?: string
          reflection_text?: string | null
          source_reason: string
          status?: string
          user_id: string
        }
        Update: {
          challenge_description?: string
          challenge_title?: string
          completed_at?: string | null
          created_at?: string
          date?: string
          id?: string
          reflection_text?: string | null
          source_reason?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_goals: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          goal_text: string
          id: string
          user_id: string
          xp_awarded: boolean
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          goal_text: string
          id?: string
          user_id: string
          xp_awarded?: boolean
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          goal_text?: string
          id?: string
          user_id?: string
          xp_awarded?: boolean
        }
        Relationships: []
      }
      daily_portal_entries: {
        Row: {
          created_at: string | null
          evolution_reminder: string | null
          future_self_message: string | null
          id: string
          mentor_message: string | null
          mini_challenge: string | null
          one_sentence_truth: string | null
          quest_step: string | null
          shadow_warning: string | null
          shown_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          evolution_reminder?: string | null
          future_self_message?: string | null
          id?: string
          mentor_message?: string | null
          mini_challenge?: string | null
          one_sentence_truth?: string | null
          quest_step?: string | null
          shadow_warning?: string | null
          shown_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          evolution_reminder?: string | null
          future_self_message?: string | null
          id?: string
          mentor_message?: string | null
          mini_challenge?: string | null
          one_sentence_truth?: string | null
          quest_step?: string | null
          shadow_warning?: string | null
          shown_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      daily_rituals: {
        Row: {
          check_in_text: string
          completed_at: string
          created_at: string
          id: string
          streak_count: number
          user_id: string
          voice_note_url: string | null
        }
        Insert: {
          check_in_text: string
          completed_at?: string
          created_at?: string
          id?: string
          streak_count?: number
          user_id: string
          voice_note_url?: string | null
        }
        Update: {
          check_in_text?: string
          completed_at?: string
          created_at?: string
          id?: string
          streak_count?: number
          user_id?: string
          voice_note_url?: string | null
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
      dot_analysis_history: {
        Row: {
          connections: Json
          created_at: string
          emerging_genius: string | null
          id: string
          next_steps: Json
          patterns: Json
          stats: Json
          user_id: string
        }
        Insert: {
          connections?: Json
          created_at?: string
          emerging_genius?: string | null
          id?: string
          next_steps?: Json
          patterns?: Json
          stats?: Json
          user_id: string
        }
        Update: {
          connections?: Json
          created_at?: string
          emerging_genius?: string | null
          id?: string
          next_steps?: Json
          patterns?: Json
          stats?: Json
          user_id?: string
        }
        Relationships: []
      }
      dot_connections: {
        Row: {
          ai_generated: boolean
          connection_insight: string
          connection_type: string
          discovered_at: string
          dot_id_1: string
          dot_id_2: string
          id: string
          user_id: string
          user_notes: string | null
        }
        Insert: {
          ai_generated?: boolean
          connection_insight: string
          connection_type: string
          discovered_at?: string
          dot_id_1: string
          dot_id_2: string
          id?: string
          user_id: string
          user_notes?: string | null
        }
        Update: {
          ai_generated?: boolean
          connection_insight?: string
          connection_type?: string
          discovered_at?: string
          dot_id_1?: string
          dot_id_2?: string
          id?: string
          user_id?: string
          user_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dot_connections_dot_id_1_fkey"
            columns: ["dot_id_1"]
            isOneToOne: false
            referencedRelation: "insight_dots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dot_connections_dot_id_2_fkey"
            columns: ["dot_id_2"]
            isOneToOne: false
            referencedRelation: "insight_dots"
            referencedColumns: ["id"]
          },
        ]
      }
      dot_review_prompts: {
        Row: {
          completed: boolean
          dots_reviewed: string[] | null
          id: string
          prompt_type: string
          shown_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          dots_reviewed?: string[] | null
          id?: string
          prompt_type: string
          shown_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          dots_reviewed?: string[] | null
          id?: string
          prompt_type?: string
          shown_at?: string
          user_id?: string
        }
        Relationships: []
      }
      future_self_progress: {
        Row: {
          created_at: string | null
          evolution_level: number
          global_xp: number
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          evolution_level?: number
          global_xp?: number
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          evolution_level?: number
          global_xp?: number
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      insight_dots: {
        Row: {
          connection_ids: string[] | null
          core_theme: string
          created_at: string
          emotional_tone: string | null
          id: string
          insight_text: string
          reviewed_at: string | null
          skill_tags: string[] | null
          source_id: string | null
          source_mentor: string | null
          source_type: string
          user_id: string
          user_reflection: string | null
        }
        Insert: {
          connection_ids?: string[] | null
          core_theme: string
          created_at?: string
          emotional_tone?: string | null
          id?: string
          insight_text: string
          reviewed_at?: string | null
          skill_tags?: string[] | null
          source_id?: string | null
          source_mentor?: string | null
          source_type: string
          user_id: string
          user_reflection?: string | null
        }
        Update: {
          connection_ids?: string[] | null
          core_theme?: string
          created_at?: string
          emotional_tone?: string | null
          id?: string
          insight_text?: string
          reviewed_at?: string | null
          skill_tags?: string[] | null
          source_id?: string | null
          source_mentor?: string | null
          source_type?: string
          user_id?: string
          user_reflection?: string | null
        }
        Relationships: []
      }
      life_domains: {
        Row: {
          created_at: string
          current_score: number
          domain_name: string
          future_score: number
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_score: number
          domain_name: string
          future_score: number
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_score?: number
          domain_name?: string
          future_score?: number
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      mentor_learning_modules: {
        Row: {
          created_at: string
          id: string
          mentor_type: Database["public"]["Enums"]["mentor_type"]
          module_content: string
          module_title: string
          quiz_questions: Json
          skill_focus: string
        }
        Insert: {
          created_at?: string
          id?: string
          mentor_type: Database["public"]["Enums"]["mentor_type"]
          module_content: string
          module_title: string
          quiz_questions?: Json
          skill_focus: string
        }
        Update: {
          created_at?: string
          id?: string
          mentor_type?: Database["public"]["Enums"]["mentor_type"]
          module_content?: string
          module_title?: string
          quiz_questions?: Json
          skill_focus?: string
        }
        Relationships: []
      }
      mentor_progress: {
        Row: {
          created_at: string | null
          id: string
          level: number
          mentor_name: string
          updated_at: string | null
          user_id: string
          xp: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          level?: number
          mentor_name: string
          updated_at?: string | null
          user_id: string
          xp?: number
        }
        Update: {
          created_at?: string | null
          id?: string
          level?: number
          mentor_name?: string
          updated_at?: string | null
          user_id?: string
          xp?: number
        }
        Relationships: []
      }
      monthly_goals: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          goal_text: string
          id: string
          month_start: string
          user_id: string
          xp_awarded: boolean
          xp_value: number
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          goal_text: string
          id?: string
          month_start: string
          user_id: string
          xp_awarded?: boolean
          xp_value?: number
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          goal_text?: string
          id?: string
          month_start?: string
          user_id?: string
          xp_awarded?: boolean
          xp_value?: number
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
      profile_badges: {
        Row: {
          badge_key: string
          color: string
          created_at: string
          criteria_type: string
          criteria_value: number | null
          description: string
          icon: string
          id: string
          name: string
          priority: number
        }
        Insert: {
          badge_key: string
          color: string
          created_at?: string
          criteria_type: string
          criteria_value?: number | null
          description: string
          icon: string
          id?: string
          name: string
          priority?: number
        }
        Update: {
          badge_key?: string
          color?: string
          created_at?: string
          criteria_type?: string
          criteria_value?: number | null
          description?: string
          icon?: string
          id?: string
          name?: string
          priority?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          birth_date: string | null
          birth_location: string | null
          birth_time: string | null
          birth_time_unknown: boolean | null
          constellation_insights: Json | null
          created_at: string | null
          emotional_tone: string | null
          future_age: number | null
          future_lifestyle: string | null
          future_location: string | null
          future_self_avatar: string | null
          future_self_voice_note: string | null
          human_design_data: Json | null
          id: string
          main_mission: string | null
          main_strengths: string[] | null
          priority_growth_area: string | null
          purpose_path: string | null
          shadow_intensity: string | null
          updated_at: string | null
        }
        Insert: {
          birth_date?: string | null
          birth_location?: string | null
          birth_time?: string | null
          birth_time_unknown?: boolean | null
          constellation_insights?: Json | null
          created_at?: string | null
          emotional_tone?: string | null
          future_age?: number | null
          future_lifestyle?: string | null
          future_location?: string | null
          future_self_avatar?: string | null
          future_self_voice_note?: string | null
          human_design_data?: Json | null
          id: string
          main_mission?: string | null
          main_strengths?: string[] | null
          priority_growth_area?: string | null
          purpose_path?: string | null
          shadow_intensity?: string | null
          updated_at?: string | null
        }
        Update: {
          birth_date?: string | null
          birth_location?: string | null
          birth_time?: string | null
          birth_time_unknown?: boolean | null
          constellation_insights?: Json | null
          created_at?: string | null
          emotional_tone?: string | null
          future_age?: number | null
          future_lifestyle?: string | null
          future_location?: string | null
          future_self_avatar?: string | null
          future_self_voice_note?: string | null
          human_design_data?: Json | null
          id?: string
          main_mission?: string | null
          main_strengths?: string[] | null
          priority_growth_area?: string | null
          purpose_path?: string | null
          shadow_intensity?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      purpose_history: {
        Row: {
          created_at: string
          id: string
          purpose_text: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          purpose_text: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          purpose_text?: string
          user_id?: string
        }
        Relationships: []
      }
      quest_progress: {
        Row: {
          completed_steps: Json
          created_at: string | null
          id: string
          quest_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_steps?: Json
          created_at?: string | null
          id?: string
          quest_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_steps?: Json
          created_at?: string | null
          id?: string
          quest_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quest_progress_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "quests"
            referencedColumns: ["quest_id"]
          },
        ]
      }
      quests: {
        Row: {
          created_at: string | null
          description: string
          quest_id: string
          quest_name: string
          reward_xp: number
          steps: Json
        }
        Insert: {
          created_at?: string | null
          description: string
          quest_id?: string
          quest_name: string
          reward_xp?: number
          steps?: Json
        }
        Update: {
          created_at?: string | null
          description?: string
          quest_id?: string
          quest_name?: string
          reward_xp?: number
          steps?: Json
        }
        Relationships: []
      }
      seasonal_events: {
        Row: {
          created_at: string | null
          description: string
          end_date: string
          event_data: Json | null
          event_id: string
          event_name: string
          start_date: string
        }
        Insert: {
          created_at?: string | null
          description: string
          end_date: string
          event_data?: Json | null
          event_id?: string
          event_name: string
          start_date: string
        }
        Update: {
          created_at?: string | null
          description?: string
          end_date?: string
          event_data?: Json | null
          event_id?: string
          event_name?: string
          start_date?: string
        }
        Relationships: []
      }
      self_discovery_progress: {
        Row: {
          answers: Json | null
          completed: boolean | null
          created_at: string | null
          current_step: number | null
          id: string
          purpose_path: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          answers?: Json | null
          completed?: boolean | null
          created_at?: string | null
          current_step?: number | null
          id?: string
          purpose_path: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          answers?: Json | null
          completed?: boolean | null
          created_at?: string | null
          current_step?: number | null
          id?: string
          purpose_path?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      self_discovery_quests: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          insights_generated: string | null
          quest_data: Json
          quest_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          insights_generated?: string | null
          quest_data?: Json
          quest_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          insights_generated?: string | null
          quest_data?: Json
          quest_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      shadow_encounters: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          integration_insight: string | null
          mentor_type: string | null
          reflection_prompts: Json
          shadow_name: string
          shadow_statement: string
          status: string
          task_description: string
          triggered_by: string | null
          triggered_context: Json | null
          user_id: string
          voice_note_url: string | null
          xp_reward: number
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          integration_insight?: string | null
          mentor_type?: string | null
          reflection_prompts?: Json
          shadow_name: string
          shadow_statement: string
          status?: string
          task_description: string
          triggered_by?: string | null
          triggered_context?: Json | null
          user_id: string
          voice_note_url?: string | null
          xp_reward?: number
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          integration_insight?: string | null
          mentor_type?: string | null
          reflection_prompts?: Json
          shadow_name?: string
          shadow_statement?: string
          status?: string
          task_description?: string
          triggered_by?: string | null
          triggered_context?: Json | null
          user_id?: string
          voice_note_url?: string | null
          xp_reward?: number
        }
        Relationships: []
      }
      shadow_progress: {
        Row: {
          created_at: string | null
          encounters: number
          id: string
          integrations: number
          last_triggered_at: string | null
          shadow_name: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          encounters?: number
          id?: string
          integrations?: number
          last_triggered_at?: string | null
          shadow_name: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          encounters?: number
          id?: string
          integrations?: number
          last_triggered_at?: string | null
          shadow_name?: string
          user_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          completion_insights: Json | null
          completion_reflection: string | null
          created_at: string
          due_date: string
          id: string
          mentor_name: string
          status: string
          task_description: string
          task_title: string
          user_id: string
          xp_value: number
        }
        Insert: {
          completion_insights?: Json | null
          completion_reflection?: string | null
          created_at?: string
          due_date?: string
          id?: string
          mentor_name: string
          status?: string
          task_description: string
          task_title: string
          user_id: string
          xp_value?: number
        }
        Update: {
          completion_insights?: Json | null
          completion_reflection?: string | null
          created_at?: string
          due_date?: string
          id?: string
          mentor_name?: string
          status?: string
          task_description?: string
          task_title?: string
          user_id?: string
          xp_value?: number
        }
        Relationships: []
      }
      transformation_timeline: {
        Row: {
          created_at: string | null
          event_data: Json
          event_type: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          event_data?: Json
          event_type: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          event_data?: Json
          event_type?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_key: string
          created_at: string
          id: string
          progress: number
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_key: string
          created_at?: string
          id?: string
          progress?: number
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_key?: string
          created_at?: string
          id?: string
          progress?: number
          unlocked_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_affirmations: {
        Row: {
          affirmation_text: string | null
          created_at: string
          id: string
          is_favorite: boolean
          song_link: string | null
          song_name: string | null
          user_id: string
        }
        Insert: {
          affirmation_text?: string | null
          created_at?: string
          id?: string
          is_favorite?: boolean
          song_link?: string | null
          song_name?: string | null
          user_id: string
        }
        Update: {
          affirmation_text?: string | null
          created_at?: string
          id?: string
          is_favorite?: boolean
          song_link?: string | null
          song_name?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          awarded_at: string
          badge_key: string
          display_order: number | null
          id: string
          is_visible: boolean
          user_id: string
        }
        Insert: {
          awarded_at?: string
          badge_key: string
          display_order?: number | null
          id?: string
          is_visible?: boolean
          user_id: string
        }
        Update: {
          awarded_at?: string
          badge_key?: string
          display_order?: number | null
          id?: string
          is_visible?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_key_fkey"
            columns: ["badge_key"]
            isOneToOne: false
            referencedRelation: "profile_badges"
            referencedColumns: ["badge_key"]
          },
        ]
      }
      user_display_names: {
        Row: {
          created_at: string
          display_name: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_mentor_badges: {
        Row: {
          badge_icon: string
          badge_name: string
          earned_at: string
          id: string
          mentor_type: Database["public"]["Enums"]["mentor_type"]
          quiz_score: number
          user_id: string
        }
        Insert: {
          badge_icon: string
          badge_name: string
          earned_at?: string
          id?: string
          mentor_type: Database["public"]["Enums"]["mentor_type"]
          quiz_score: number
          user_id: string
        }
        Update: {
          badge_icon?: string
          badge_name?: string
          earned_at?: string
          id?: string
          mentor_type?: Database["public"]["Enums"]["mentor_type"]
          quiz_score?: number
          user_id?: string
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
      user_theme_preferences: {
        Row: {
          accent_color: string
          background_style: string
          card_style: string
          created_at: string
          id: string
          show_achievements_publicly: boolean
          show_stats_publicly: boolean
          show_timeline_publicly: boolean
          theme_color: string
          updated_at: string
          user_id: string
        }
        Insert: {
          accent_color?: string
          background_style?: string
          card_style?: string
          created_at?: string
          id?: string
          show_achievements_publicly?: boolean
          show_stats_publicly?: boolean
          show_timeline_publicly?: boolean
          theme_color?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          accent_color?: string
          background_style?: string
          card_style?: string
          created_at?: string
          id?: string
          show_achievements_publicly?: boolean
          show_stats_publicly?: boolean
          show_timeline_publicly?: boolean
          theme_color?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      vision_goals: {
        Row: {
          created_at: string
          id: string
          milestones: Json | null
          updated_at: string
          user_id: string
          vision_text: string
        }
        Insert: {
          created_at?: string
          id?: string
          milestones?: Json | null
          updated_at?: string
          user_id: string
          vision_text: string
        }
        Update: {
          created_at?: string
          id?: string
          milestones?: Json | null
          updated_at?: string
          user_id?: string
          vision_text?: string
        }
        Relationships: []
      }
      weekly_goals: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          goal_text: string
          id: string
          user_id: string
          week_start: string
          xp_awarded: boolean
          xp_value: number
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          goal_text: string
          id?: string
          user_id: string
          week_start: string
          xp_awarded?: boolean
          xp_value?: number
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          goal_text?: string
          id?: string
          user_id?: string
          week_start?: string
          xp_awarded?: boolean
          xp_value?: number
        }
        Relationships: []
      }
      yearly_goals: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          goal_text: string
          id: string
          user_id: string
          xp_awarded: boolean
          xp_value: number
          year: number
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          goal_text: string
          id?: string
          user_id: string
          xp_awarded?: boolean
          xp_value?: number
          year: number
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          goal_text?: string
          id?: string
          user_id?: string
          xp_awarded?: boolean
          xp_value?: number
          year?: number
        }
        Relationships: []
      }
    }
    Views: {
      leaderboard_stats: {
        Row: {
          achievement_count: number | null
          avatar: string | null
          completed_tasks: number | null
          display_name: string | null
          joined_at: string | null
          level: number | null
          max_streak: number | null
          shadows_faced: number | null
          total_xp: number | null
          user_id: string | null
        }
        Relationships: []
      }
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
        | "business_mentor"
        | "creator_mentor"
        | "mystic_mentor"
        | "heart_mentor"
        | "strategist_mentor"
        | "explorer_mentor"
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
        "business_mentor",
        "creator_mentor",
        "mystic_mentor",
        "heart_mentor",
        "strategist_mentor",
        "explorer_mentor",
      ],
    },
  },
} as const
