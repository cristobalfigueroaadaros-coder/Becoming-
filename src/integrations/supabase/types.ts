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
      archived_integrator_steps: {
        Row: {
          action_type: string | null
          archive_reason: string | null
          archived_at: string | null
          day_number: number
          encouragement: string | null
          estimated_minutes: number | null
          hint: string | null
          id: string
          insight_text: string | null
          original_step_id: string
          project_id: string
          scheduled_date: string | null
          status: string | null
          step_description: string
          step_title: string
          user_id: string
          why_it_matters: string | null
        }
        Insert: {
          action_type?: string | null
          archive_reason?: string | null
          archived_at?: string | null
          day_number: number
          encouragement?: string | null
          estimated_minutes?: number | null
          hint?: string | null
          id?: string
          insight_text?: string | null
          original_step_id: string
          project_id: string
          scheduled_date?: string | null
          status?: string | null
          step_description: string
          step_title: string
          user_id: string
          why_it_matters?: string | null
        }
        Update: {
          action_type?: string | null
          archive_reason?: string | null
          archived_at?: string | null
          day_number?: number
          encouragement?: string | null
          estimated_minutes?: number | null
          hint?: string | null
          id?: string
          insight_text?: string | null
          original_step_id?: string
          project_id?: string
          scheduled_date?: string | null
          status?: string | null
          step_description?: string
          step_title?: string
          user_id?: string
          why_it_matters?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "archived_integrator_steps_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "integrator_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      atlas_analysis_snapshots: {
        Row: {
          cluster_count: number
          created_at: string
          creation_ideas: Json
          cross_connections: Json
          dot_count: number
          emerging_genius: Json
          id: string
          patterns: Json
          purpose_signal: string | null
          trigger_type: string
          user_id: string
          user_resonance: string | null
        }
        Insert: {
          cluster_count?: number
          created_at?: string
          creation_ideas?: Json
          cross_connections?: Json
          dot_count?: number
          emerging_genius?: Json
          id?: string
          patterns?: Json
          purpose_signal?: string | null
          trigger_type?: string
          user_id: string
          user_resonance?: string | null
        }
        Update: {
          cluster_count?: number
          created_at?: string
          creation_ideas?: Json
          cross_connections?: Json
          dot_count?: number
          emerging_genius?: Json
          id?: string
          patterns?: Json
          purpose_signal?: string | null
          trigger_type?: string
          user_id?: string
          user_resonance?: string | null
        }
        Relationships: []
      }
      atlas_breakthroughs: {
        Row: {
          approach: string | null
          concept_name: string
          conversation_depth: number
          created_at: string
          first_step: string | null
          id: string
          readiness_score: number
          source_mentor_type: string | null
          target_audience: string | null
          user_id: string
        }
        Insert: {
          approach?: string | null
          concept_name: string
          conversation_depth?: number
          created_at?: string
          first_step?: string | null
          id?: string
          readiness_score?: number
          source_mentor_type?: string | null
          target_audience?: string | null
          user_id: string
        }
        Update: {
          approach?: string | null
          concept_name?: string
          conversation_depth?: number
          created_at?: string
          first_step?: string | null
          id?: string
          readiness_score?: number
          source_mentor_type?: string | null
          target_audience?: string | null
          user_id?: string
        }
        Relationships: []
      }
      atlas_cluster_progress: {
        Row: {
          activated_at: string | null
          cluster_id: string | null
          created_at: string | null
          growth_level: number
          id: string
          last_interaction_at: string | null
          unlock_phase: number
          user_id: string
        }
        Insert: {
          activated_at?: string | null
          cluster_id?: string | null
          created_at?: string | null
          growth_level?: number
          id?: string
          last_interaction_at?: string | null
          unlock_phase?: number
          user_id: string
        }
        Update: {
          activated_at?: string | null
          cluster_id?: string | null
          created_at?: string | null
          growth_level?: number
          id?: string
          last_interaction_at?: string | null
          unlock_phase?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "atlas_cluster_progress_cluster_id_fkey"
            columns: ["cluster_id"]
            isOneToOne: false
            referencedRelation: "atlas_clusters"
            referencedColumns: ["id"]
          },
        ]
      }
      atlas_cluster_project_connections: {
        Row: {
          cluster_id: string | null
          created_at: string | null
          id: string
          project_id: string | null
        }
        Insert: {
          cluster_id?: string | null
          created_at?: string | null
          id?: string
          project_id?: string | null
        }
        Update: {
          cluster_id?: string | null
          created_at?: string | null
          id?: string
          project_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "atlas_cluster_project_connections_cluster_id_fkey"
            columns: ["cluster_id"]
            isOneToOne: false
            referencedRelation: "atlas_clusters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atlas_cluster_project_connections_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "atlas_project_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      atlas_clusters: {
        Row: {
          cluster_category: string | null
          created_at: string | null
          description: string | null
          id: string
          meta_domain_id: string | null
          name: string
          slug: string
          sort_order: number
          state: string
        }
        Insert: {
          cluster_category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          meta_domain_id?: string | null
          name: string
          slug: string
          sort_order?: number
          state?: string
        }
        Update: {
          cluster_category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          meta_domain_id?: string | null
          name?: string
          slug?: string
          sort_order?: number
          state?: string
        }
        Relationships: [
          {
            foreignKeyName: "atlas_clusters_meta_domain_id_fkey"
            columns: ["meta_domain_id"]
            isOneToOne: false
            referencedRelation: "atlas_meta_domains"
            referencedColumns: ["id"]
          },
        ]
      }
      atlas_connections: {
        Row: {
          connection_type: string
          created_at: string | null
          dot_id_a: string | null
          dot_id_b: string | null
          id: string
          insight_text: string | null
          is_gold_moment: boolean | null
          shared_signals: Json | null
          strength: number | null
          user_id: string
        }
        Insert: {
          connection_type?: string
          created_at?: string | null
          dot_id_a?: string | null
          dot_id_b?: string | null
          id?: string
          insight_text?: string | null
          is_gold_moment?: boolean | null
          shared_signals?: Json | null
          strength?: number | null
          user_id: string
        }
        Update: {
          connection_type?: string
          created_at?: string | null
          dot_id_a?: string | null
          dot_id_b?: string | null
          id?: string
          insight_text?: string | null
          is_gold_moment?: boolean | null
          shared_signals?: Json | null
          strength?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "atlas_connections_dot_id_a_fkey"
            columns: ["dot_id_a"]
            isOneToOne: false
            referencedRelation: "atlas_dots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atlas_connections_dot_id_b_fkey"
            columns: ["dot_id_b"]
            isOneToOne: false
            referencedRelation: "atlas_dots"
            referencedColumns: ["id"]
          },
        ]
      }
      atlas_dot_evolutions: {
        Row: {
          created_at: string | null
          dot_id: string | null
          evolution_type: string
          id: string
          new_description: string | null
          new_title: string
          previous_description: string | null
          previous_title: string
          trigger_reason: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          dot_id?: string | null
          evolution_type: string
          id?: string
          new_description?: string | null
          new_title: string
          previous_description?: string | null
          previous_title: string
          trigger_reason?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          dot_id?: string | null
          evolution_type?: string
          id?: string
          new_description?: string | null
          new_title?: string
          previous_description?: string | null
          previous_title?: string
          trigger_reason?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "atlas_dot_evolutions_dot_id_fkey"
            columns: ["dot_id"]
            isOneToOne: false
            referencedRelation: "atlas_dots"
            referencedColumns: ["id"]
          },
        ]
      }
      atlas_dot_project_connections: {
        Row: {
          created_at: string | null
          dot_id: string | null
          id: string
          project_id: string | null
        }
        Insert: {
          created_at?: string | null
          dot_id?: string | null
          id?: string
          project_id?: string | null
        }
        Update: {
          created_at?: string | null
          dot_id?: string | null
          id?: string
          project_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "atlas_dot_project_connections_dot_id_fkey"
            columns: ["dot_id"]
            isOneToOne: false
            referencedRelation: "atlas_dots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atlas_dot_project_connections_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "atlas_project_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      atlas_dots: {
        Row: {
          cluster_id: string | null
          confidence_score: number | null
          created_at: string | null
          dot_category: string
          dot_type: string | null
          evolution_stage: number | null
          evolution_type: string | null
          evolved_from_ids: string[] | null
          id: string
          is_gold_moment: boolean | null
          origin: string | null
          original_description: string | null
          original_title: string | null
          short_description: string | null
          signal_sources: Json | null
          signal_strength: number | null
          signal_tags: Json | null
          source_system: string
          title: string
          user_edited: boolean | null
          user_id: string
          user_validated: boolean | null
        }
        Insert: {
          cluster_id?: string | null
          confidence_score?: number | null
          created_at?: string | null
          dot_category?: string
          dot_type?: string | null
          evolution_stage?: number | null
          evolution_type?: string | null
          evolved_from_ids?: string[] | null
          id?: string
          is_gold_moment?: boolean | null
          origin?: string | null
          original_description?: string | null
          original_title?: string | null
          short_description?: string | null
          signal_sources?: Json | null
          signal_strength?: number | null
          signal_tags?: Json | null
          source_system?: string
          title: string
          user_edited?: boolean | null
          user_id: string
          user_validated?: boolean | null
        }
        Update: {
          cluster_id?: string | null
          confidence_score?: number | null
          created_at?: string | null
          dot_category?: string
          dot_type?: string | null
          evolution_stage?: number | null
          evolution_type?: string | null
          evolved_from_ids?: string[] | null
          id?: string
          is_gold_moment?: boolean | null
          origin?: string | null
          original_description?: string | null
          original_title?: string | null
          short_description?: string | null
          signal_sources?: Json | null
          signal_strength?: number | null
          signal_tags?: Json | null
          source_system?: string
          title?: string
          user_edited?: boolean | null
          user_id?: string
          user_validated?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "atlas_dots_cluster_id_fkey"
            columns: ["cluster_id"]
            isOneToOne: false
            referencedRelation: "atlas_clusters"
            referencedColumns: ["id"]
          },
        ]
      }
      atlas_meta_domains: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      atlas_mini_dots: {
        Row: {
          cluster_slug: string | null
          content: string
          created_at: string | null
          id: string
          origin: string
          parent_dot_id: string
          user_id: string
        }
        Insert: {
          cluster_slug?: string | null
          content: string
          created_at?: string | null
          id?: string
          origin?: string
          parent_dot_id: string
          user_id: string
        }
        Update: {
          cluster_slug?: string | null
          content?: string
          created_at?: string | null
          id?: string
          origin?: string
          parent_dot_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "atlas_mini_dots_parent_dot_id_fkey"
            columns: ["parent_dot_id"]
            isOneToOne: false
            referencedRelation: "atlas_dots"
            referencedColumns: ["id"]
          },
        ]
      }
      atlas_patterns: {
        Row: {
          cluster_slug: string
          created_at: string | null
          generated_dot_id: string | null
          id: string
          pattern_description: string | null
          pattern_key: string
          pattern_title: string
          signal_names: string[]
          total_strength: number
          user_id: string
        }
        Insert: {
          cluster_slug: string
          created_at?: string | null
          generated_dot_id?: string | null
          id?: string
          pattern_description?: string | null
          pattern_key: string
          pattern_title: string
          signal_names: string[]
          total_strength: number
          user_id: string
        }
        Update: {
          cluster_slug?: string
          created_at?: string | null
          generated_dot_id?: string | null
          id?: string
          pattern_description?: string | null
          pattern_key?: string
          pattern_title?: string
          signal_names?: string[]
          total_strength?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "atlas_patterns_generated_dot_id_fkey"
            columns: ["generated_dot_id"]
            isOneToOne: false
            referencedRelation: "atlas_dots"
            referencedColumns: ["id"]
          },
        ]
      }
      atlas_project_nodes: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      atlas_quests: {
        Row: {
          cluster_id: string | null
          completed_at: string | null
          created_at: string | null
          generated_dot_id: string | null
          id: string
          interactions: Json | null
          is_onboarding: boolean | null
          onboarding_sequence: number | null
          quest_key: string
          status: string
          user_id: string
        }
        Insert: {
          cluster_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          generated_dot_id?: string | null
          id?: string
          interactions?: Json | null
          is_onboarding?: boolean | null
          onboarding_sequence?: number | null
          quest_key: string
          status?: string
          user_id: string
        }
        Update: {
          cluster_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          generated_dot_id?: string | null
          id?: string
          interactions?: Json | null
          is_onboarding?: boolean | null
          onboarding_sequence?: number | null
          quest_key?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "atlas_quests_cluster_id_fkey"
            columns: ["cluster_id"]
            isOneToOne: false
            referencedRelation: "atlas_clusters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atlas_quests_generated_dot_id_fkey"
            columns: ["generated_dot_id"]
            isOneToOne: false
            referencedRelation: "atlas_dots"
            referencedColumns: ["id"]
          },
        ]
      }
      atlas_signals: {
        Row: {
          cluster_id: string | null
          created_at: string | null
          id: string
          signal_category: string
          signal_name: string
          source_interaction_index: number
          source_quest_key: string
          strength: number
          user_id: string
        }
        Insert: {
          cluster_id?: string | null
          created_at?: string | null
          id?: string
          signal_category: string
          signal_name: string
          source_interaction_index: number
          source_quest_key: string
          strength?: number
          user_id: string
        }
        Update: {
          cluster_id?: string | null
          created_at?: string | null
          id?: string
          signal_category?: string
          signal_name?: string
          source_interaction_index?: number
          source_quest_key?: string
          strength?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "atlas_signals_cluster_id_fkey"
            columns: ["cluster_id"]
            isOneToOne: false
            referencedRelation: "atlas_clusters"
            referencedColumns: ["id"]
          },
        ]
      }
      becoming_discoveries: {
        Row: {
          created_at: string | null
          discovery_type: string
          element_key: string
          element_value: string
          id: string
          source: string | null
          source_message_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          discovery_type: string
          element_key: string
          element_value: string
          id?: string
          source?: string | null
          source_message_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          discovery_type?: string
          element_key?: string
          element_value?: string
          id?: string
          source?: string | null
          source_message_id?: string | null
          updated_at?: string | null
          user_id?: string
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
      console_thread_messages: {
        Row: {
          card_data: Json | null
          card_type: string | null
          content: string
          created_at: string | null
          id: string
          mentor_color: string | null
          mentor_icon: string | null
          mentor_name: string | null
          mentor_type: string | null
          phase: string | null
          role: string
          user_id: string
        }
        Insert: {
          card_data?: Json | null
          card_type?: string | null
          content?: string
          created_at?: string | null
          id?: string
          mentor_color?: string | null
          mentor_icon?: string | null
          mentor_name?: string | null
          mentor_type?: string | null
          phase?: string | null
          role?: string
          user_id: string
        }
        Update: {
          card_data?: Json | null
          card_type?: string | null
          content?: string
          created_at?: string | null
          id?: string
          mentor_color?: string | null
          mentor_icon?: string | null
          mentor_name?: string | null
          mentor_type?: string | null
          phase?: string | null
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
          anchor_type: string | null
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
          anchor_type?: string | null
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
          anchor_type?: string | null
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
      conversation_breakthroughs: {
        Row: {
          actionable_next_step: string | null
          breakthrough_description: string
          breakthrough_title: string
          converted_to_goal: boolean
          created_at: string
          dismissed: boolean
          goal_id: string | null
          id: string
          mentor_type: string
          source_conversation: Json
          user_id: string
        }
        Insert: {
          actionable_next_step?: string | null
          breakthrough_description: string
          breakthrough_title: string
          converted_to_goal?: boolean
          created_at?: string
          dismissed?: boolean
          goal_id?: string | null
          id?: string
          mentor_type: string
          source_conversation?: Json
          user_id: string
        }
        Update: {
          actionable_next_step?: string | null
          breakthrough_description?: string
          breakthrough_title?: string
          converted_to_goal?: boolean
          created_at?: string
          dismissed?: boolean
          goal_id?: string | null
          id?: string
          mentor_type?: string
          source_conversation?: Json
          user_id?: string
        }
        Relationships: []
      }
      conversation_handoffs: {
        Row: {
          chain_position: number | null
          created_at: string
          handoff_chain_id: string | null
          handoff_summary: string | null
          id: string
          initiated_by: string | null
          journey_topic: string | null
          processed: boolean
          source_mentor_type: string
          source_messages: Json
          target_mentor_type: string
          user_id: string
          voice_context: Json | null
        }
        Insert: {
          chain_position?: number | null
          created_at?: string
          handoff_chain_id?: string | null
          handoff_summary?: string | null
          id?: string
          initiated_by?: string | null
          journey_topic?: string | null
          processed?: boolean
          source_mentor_type: string
          source_messages?: Json
          target_mentor_type: string
          user_id: string
          voice_context?: Json | null
        }
        Update: {
          chain_position?: number | null
          created_at?: string
          handoff_chain_id?: string | null
          handoff_summary?: string | null
          id?: string
          initiated_by?: string | null
          journey_topic?: string | null
          processed?: boolean
          source_mentor_type?: string
          source_messages?: Json
          target_mentor_type?: string
          user_id?: string
          voice_context?: Json | null
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
      council_notifications: {
        Row: {
          breakthrough_id: string | null
          context_data: Json | null
          created_at: string
          dismissed: boolean
          id: string
          message: string
          notification_type: string
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          breakthrough_id?: string | null
          context_data?: Json | null
          created_at?: string
          dismissed?: boolean
          id?: string
          message: string
          notification_type?: string
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          breakthrough_id?: string | null
          context_data?: Json | null
          created_at?: string
          dismissed?: boolean
          id?: string
          message?: string
          notification_type?: string
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "council_notifications_breakthrough_id_fkey"
            columns: ["breakthrough_id"]
            isOneToOne: false
            referencedRelation: "conversation_breakthroughs"
            referencedColumns: ["id"]
          },
        ]
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
      creative_space_connections: {
        Row: {
          connection_color: string | null
          created_at: string
          from_tile_id: string
          id: string
          page_id: string | null
          project_id: string
          to_tile_id: string
          user_id: string
        }
        Insert: {
          connection_color?: string | null
          created_at?: string
          from_tile_id: string
          id?: string
          page_id?: string | null
          project_id: string
          to_tile_id: string
          user_id: string
        }
        Update: {
          connection_color?: string | null
          created_at?: string
          from_tile_id?: string
          id?: string
          page_id?: string | null
          project_id?: string
          to_tile_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "creative_space_connections_from_tile_id_fkey"
            columns: ["from_tile_id"]
            isOneToOne: false
            referencedRelation: "creative_space_tiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creative_space_connections_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "creative_space_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creative_space_connections_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "integrator_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creative_space_connections_to_tile_id_fkey"
            columns: ["to_tile_id"]
            isOneToOne: false
            referencedRelation: "creative_space_tiles"
            referencedColumns: ["id"]
          },
        ]
      }
      creative_space_pages: {
        Row: {
          created_at: string
          id: string
          page_name: string | null
          page_order: number
          project_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          page_name?: string | null
          page_order?: number
          project_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          page_name?: string | null
          page_order?: number
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "creative_space_pages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "integrator_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      creative_space_patterns: {
        Row: {
          created_at: string
          dismissed: boolean | null
          engaged_at: string | null
          id: string
          pattern_description: string
          project_id: string
          related_tile_ids: string[]
          user_id: string
        }
        Insert: {
          created_at?: string
          dismissed?: boolean | null
          engaged_at?: string | null
          id?: string
          pattern_description: string
          project_id: string
          related_tile_ids: string[]
          user_id: string
        }
        Update: {
          created_at?: string
          dismissed?: boolean | null
          engaged_at?: string | null
          id?: string
          pattern_description?: string
          project_id?: string
          related_tile_ids?: string[]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "creative_space_patterns_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "integrator_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      creative_space_tiles: {
        Row: {
          color: string | null
          content: string | null
          created_at: string
          id: string
          page_id: string | null
          position_x: number
          position_y: number
          project_id: string | null
          source_id: string | null
          source_label: string | null
          source_type: string | null
          tile_type: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          content?: string | null
          created_at?: string
          id?: string
          page_id?: string | null
          position_x?: number
          position_y?: number
          project_id?: string | null
          source_id?: string | null
          source_label?: string | null
          source_type?: string | null
          tile_type?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          content?: string | null
          created_at?: string
          id?: string
          page_id?: string | null
          position_x?: number
          position_y?: number
          project_id?: string | null
          source_id?: string | null
          source_label?: string | null
          source_type?: string | null
          tile_type?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "creative_space_tiles_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "creative_space_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creative_space_tiles_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "integrator_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_chat_messages: {
        Row: {
          chat_id: string
          content: string
          created_at: string
          id: string
          is_system: boolean
          sender_id: string
        }
        Insert: {
          chat_id: string
          content: string
          created_at?: string
          id?: string
          is_system?: boolean
          sender_id: string
        }
        Update: {
          chat_id?: string
          content?: string
          created_at?: string
          id?: string
          is_system?: boolean
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_chat_messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "creator_chats"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_chat_requests: {
        Row: {
          created_at: string
          id: string
          message: string | null
          receiver_id: string
          sender_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          receiver_id: string
          sender_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          receiver_id?: string
          sender_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      creator_chats: {
        Row: {
          created_at: string
          id: string
          user1_id: string
          user2_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user1_id: string
          user2_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user1_id?: string
          user2_id?: string
        }
        Relationships: []
      }
      creator_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "creator_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_posts: {
        Row: {
          created_at: string
          goal: string | null
          id: string
          image_url: string | null
          location: string | null
          next_step: string | null
          post_type: string
          statement: string
          user_id: string
        }
        Insert: {
          created_at?: string
          goal?: string | null
          id?: string
          image_url?: string | null
          location?: string | null
          next_step?: string | null
          post_type: string
          statement: string
          user_id: string
        }
        Update: {
          created_at?: string
          goal?: string | null
          id?: string
          image_url?: string | null
          location?: string | null
          next_step?: string | null
          post_type?: string
          statement?: string
          user_id?: string
        }
        Relationships: []
      }
      creator_resonances: {
        Row: {
          created_at: string
          id: string
          post_id: string
          resonance_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          resonance_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          resonance_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_resonances_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "creator_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_updates: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_updates_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "creator_posts"
            referencedColumns: ["id"]
          },
        ]
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
      daily_journal: {
        Row: {
          content: string
          created_at: string | null
          detected_emotions: Json | null
          detected_patterns: Json | null
          detected_themes: Json | null
          entry_date: string
          id: string
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          detected_emotions?: Json | null
          detected_patterns?: Json | null
          detected_themes?: Json | null
          entry_date?: string
          id?: string
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          detected_emotions?: Json | null
          detected_patterns?: Json | null
          detected_themes?: Json | null
          entry_date?: string
          id?: string
          title?: string | null
          updated_at?: string | null
          user_id?: string
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
          read_at: string | null
          trigger_reason: string | null
          user_id: string
          whisper_type: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          mentor_type: Database["public"]["Enums"]["mentor_type"]
          message: string
          read_at?: string | null
          trigger_reason?: string | null
          user_id: string
          whisper_type?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          mentor_type?: Database["public"]["Enums"]["mentor_type"]
          message?: string
          read_at?: string | null
          trigger_reason?: string | null
          user_id?: string
          whisper_type?: string | null
        }
        Relationships: []
      }
      design_thinking_content: {
        Row: {
          content: Json | null
          created_at: string | null
          id: string
          phase: string
          project_id: string
          reflection_response: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content?: Json | null
          created_at?: string | null
          id?: string
          phase: string
          project_id: string
          reflection_response?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: Json | null
          created_at?: string | null
          id?: string
          phase?: string
          project_id?: string
          reflection_response?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "design_thinking_content_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "integrator_projects"
            referencedColumns: ["id"]
          },
        ]
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
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      energetic_snapshots: {
        Row: {
          activity_context: string | null
          alignment_feeling: number | null
          captured_at: string
          clarity_level: number | null
          coherence_level: number | null
          emotional_state: string | null
          energy_level: number | null
          expansion_level: number | null
          id: string
          overall_frequency: string | null
          related_dot_id: string | null
          related_task_id: string | null
          snapshot_metadata: Json | null
          snapshot_type: string
          somatic_data: Json | null
          user_id: string
          user_notes: string | null
        }
        Insert: {
          activity_context?: string | null
          alignment_feeling?: number | null
          captured_at?: string
          clarity_level?: number | null
          coherence_level?: number | null
          emotional_state?: string | null
          energy_level?: number | null
          expansion_level?: number | null
          id?: string
          overall_frequency?: string | null
          related_dot_id?: string | null
          related_task_id?: string | null
          snapshot_metadata?: Json | null
          snapshot_type: string
          somatic_data?: Json | null
          user_id: string
          user_notes?: string | null
        }
        Update: {
          activity_context?: string | null
          alignment_feeling?: number | null
          captured_at?: string
          clarity_level?: number | null
          coherence_level?: number | null
          emotional_state?: string | null
          energy_level?: number | null
          expansion_level?: number | null
          id?: string
          overall_frequency?: string | null
          related_dot_id?: string | null
          related_task_id?: string | null
          snapshot_metadata?: Json | null
          snapshot_type?: string
          somatic_data?: Json | null
          user_id?: string
          user_notes?: string | null
        }
        Relationships: []
      }
      evolution_nodes: {
        Row: {
          completion_summary: string | null
          created_at: string
          current_day: number
          current_phase: string
          evolution_insight: string | null
          id: string
          learning_insights_count: number | null
          node_number: number
          node_title: string
          parent_node_id: string | null
          refined_description: string
          seed_breakthrough_id: string | null
          spine_id: string
          start_date: string
          status: string
          target_end_date: string
          timeframe_days: number
          updated_at: string
          user_id: string
          why_this_matters: string | null
        }
        Insert: {
          completion_summary?: string | null
          created_at?: string
          current_day?: number
          current_phase?: string
          evolution_insight?: string | null
          id?: string
          learning_insights_count?: number | null
          node_number?: number
          node_title: string
          parent_node_id?: string | null
          refined_description: string
          seed_breakthrough_id?: string | null
          spine_id: string
          start_date?: string
          status?: string
          target_end_date: string
          timeframe_days?: number
          updated_at?: string
          user_id: string
          why_this_matters?: string | null
        }
        Update: {
          completion_summary?: string | null
          created_at?: string
          current_day?: number
          current_phase?: string
          evolution_insight?: string | null
          id?: string
          learning_insights_count?: number | null
          node_number?: number
          node_title?: string
          parent_node_id?: string | null
          refined_description?: string
          seed_breakthrough_id?: string | null
          spine_id?: string
          start_date?: string
          status?: string
          target_end_date?: string
          timeframe_days?: number
          updated_at?: string
          user_id?: string
          why_this_matters?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evolution_nodes_parent_node_id_fkey"
            columns: ["parent_node_id"]
            isOneToOne: false
            referencedRelation: "evolution_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evolution_nodes_spine_id_fkey"
            columns: ["spine_id"]
            isOneToOne: false
            referencedRelation: "project_spines"
            referencedColumns: ["id"]
          },
        ]
      }
      first_win_proofs: {
        Row: {
          created_at: string | null
          id: string
          path_type: string
          proof_content: string
          proof_type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          path_type: string
          proof_content: string
          proof_type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          path_type?: string
          proof_content?: string
          proof_type?: string
          user_id?: string
        }
        Relationships: []
      }
      future_self_messages: {
        Row: {
          created_at: string | null
          dismissed_at: string | null
          emotional_tone: string | null
          id: string
          message: string
          shown_at: string | null
          snapshot_id: string | null
          trigger_reason: string
          user_id: string
          was_received: boolean | null
        }
        Insert: {
          created_at?: string | null
          dismissed_at?: string | null
          emotional_tone?: string | null
          id?: string
          message: string
          shown_at?: string | null
          snapshot_id?: string | null
          trigger_reason: string
          user_id: string
          was_received?: boolean | null
        }
        Update: {
          created_at?: string | null
          dismissed_at?: string | null
          emotional_tone?: string | null
          id?: string
          message?: string
          shown_at?: string | null
          snapshot_id?: string | null
          trigger_reason?: string
          user_id?: string
          was_received?: boolean | null
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
      ideal_life_snapshots: {
        Row: {
          contribution: string | null
          created_at: string | null
          environment: string | null
          family: string | null
          generated_image_url: string | null
          id: string
          lifestyle: string | null
          relationships: string | null
          updated_at: string | null
          user_id: string
          work: string | null
        }
        Insert: {
          contribution?: string | null
          created_at?: string | null
          environment?: string | null
          family?: string | null
          generated_image_url?: string | null
          id?: string
          lifestyle?: string | null
          relationships?: string | null
          updated_at?: string | null
          user_id: string
          work?: string | null
        }
        Update: {
          contribution?: string | null
          created_at?: string | null
          environment?: string | null
          family?: string | null
          generated_image_url?: string | null
          id?: string
          lifestyle?: string | null
          relationships?: string | null
          updated_at?: string | null
          user_id?: string
          work?: string | null
        }
        Relationships: []
      }
      inner_patterns: {
        Row: {
          body_sensation: string | null
          created_at: string
          earliest_memory_age: number | null
          gold_shift_text: string | null
          id: string
          life_events: Json | null
          pattern_description: string | null
          pattern_name: string
          pattern_type: string
          primary_emotion: string | null
          related_emotions: string[] | null
          source_council_meeting_id: string | null
          source_mentor: string | null
          status: string
          transformed_at: string | null
          transmutation_data: Json | null
          trigger_context: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          body_sensation?: string | null
          created_at?: string
          earliest_memory_age?: number | null
          gold_shift_text?: string | null
          id?: string
          life_events?: Json | null
          pattern_description?: string | null
          pattern_name: string
          pattern_type?: string
          primary_emotion?: string | null
          related_emotions?: string[] | null
          source_council_meeting_id?: string | null
          source_mentor?: string | null
          status?: string
          transformed_at?: string | null
          transmutation_data?: Json | null
          trigger_context?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          body_sensation?: string | null
          created_at?: string
          earliest_memory_age?: number | null
          gold_shift_text?: string | null
          id?: string
          life_events?: Json | null
          pattern_description?: string | null
          pattern_name?: string
          pattern_type?: string
          primary_emotion?: string | null
          related_emotions?: string[] | null
          source_council_meeting_id?: string | null
          source_mentor?: string | null
          status?: string
          transformed_at?: string | null
          transmutation_data?: Json | null
          trigger_context?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inner_patterns_source_council_meeting_id_fkey"
            columns: ["source_council_meeting_id"]
            isOneToOne: false
            referencedRelation: "council_meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      insight_dots: {
        Row: {
          anchor_type: string | null
          coherence_indicators: Json | null
          connection_ids: string[] | null
          core_theme: string
          created_at: string
          emotional_tone: string | null
          energetic_frequency: string | null
          flow_state_detected: boolean | null
          id: string
          insight_text: string
          intuition_signal: boolean | null
          resonance_level: number | null
          reviewed_at: string | null
          skill_tags: string[] | null
          somatic_notes: string | null
          source_id: string | null
          source_mentor: string | null
          source_type: string
          user_id: string
          user_reflection: string | null
          vibrational_context: Json | null
        }
        Insert: {
          anchor_type?: string | null
          coherence_indicators?: Json | null
          connection_ids?: string[] | null
          core_theme: string
          created_at?: string
          emotional_tone?: string | null
          energetic_frequency?: string | null
          flow_state_detected?: boolean | null
          id?: string
          insight_text: string
          intuition_signal?: boolean | null
          resonance_level?: number | null
          reviewed_at?: string | null
          skill_tags?: string[] | null
          somatic_notes?: string | null
          source_id?: string | null
          source_mentor?: string | null
          source_type: string
          user_id: string
          user_reflection?: string | null
          vibrational_context?: Json | null
        }
        Update: {
          anchor_type?: string | null
          coherence_indicators?: Json | null
          connection_ids?: string[] | null
          core_theme?: string
          created_at?: string
          emotional_tone?: string | null
          energetic_frequency?: string | null
          flow_state_detected?: boolean | null
          id?: string
          insight_text?: string
          intuition_signal?: boolean | null
          resonance_level?: number | null
          reviewed_at?: string | null
          skill_tags?: string[] | null
          somatic_notes?: string | null
          source_id?: string | null
          source_mentor?: string | null
          source_type?: string
          user_id?: string
          user_reflection?: string | null
          vibrational_context?: Json | null
        }
        Relationships: []
      }
      integrator_daily_steps: {
        Row: {
          action_type: string | null
          completed_at: string | null
          created_at: string
          day_number: number
          encouragement: string | null
          estimated_minutes: number
          hint: string | null
          id: string
          insight_shared_with_mentors: boolean
          insight_text: string | null
          node_id: string | null
          phase_id: string
          project_id: string
          reflection_question: string | null
          rescheduled_from: string | null
          scheduled_date: string
          skip_reason: string | null
          status: string
          step_description: string
          step_title: string
          updated_at: string
          user_edited_description: string | null
          user_edited_title: string | null
          user_id: string
          why_it_matters: string | null
        }
        Insert: {
          action_type?: string | null
          completed_at?: string | null
          created_at?: string
          day_number: number
          encouragement?: string | null
          estimated_minutes?: number
          hint?: string | null
          id?: string
          insight_shared_with_mentors?: boolean
          insight_text?: string | null
          node_id?: string | null
          phase_id: string
          project_id: string
          reflection_question?: string | null
          rescheduled_from?: string | null
          scheduled_date: string
          skip_reason?: string | null
          status?: string
          step_description: string
          step_title: string
          updated_at?: string
          user_edited_description?: string | null
          user_edited_title?: string | null
          user_id: string
          why_it_matters?: string | null
        }
        Update: {
          action_type?: string | null
          completed_at?: string | null
          created_at?: string
          day_number?: number
          encouragement?: string | null
          estimated_minutes?: number
          hint?: string | null
          id?: string
          insight_shared_with_mentors?: boolean
          insight_text?: string | null
          node_id?: string | null
          phase_id?: string
          project_id?: string
          reflection_question?: string | null
          rescheduled_from?: string | null
          scheduled_date?: string
          skip_reason?: string | null
          status?: string
          step_description?: string
          step_title?: string
          updated_at?: string
          user_edited_description?: string | null
          user_edited_title?: string | null
          user_id?: string
          why_it_matters?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integrator_daily_steps_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "evolution_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integrator_daily_steps_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "integrator_phases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integrator_daily_steps_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "integrator_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      integrator_phases: {
        Row: {
          completed_at: string | null
          created_at: string
          end_day: number
          id: string
          node_id: string | null
          order_index: number
          phase_color: string
          phase_description: string
          phase_name: string
          project_id: string
          start_day: number
          started_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          end_day: number
          id?: string
          node_id?: string | null
          order_index: number
          phase_color: string
          phase_description: string
          phase_name: string
          project_id: string
          start_day: number
          started_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          end_day?: number
          id?: string
          node_id?: string | null
          order_index?: number
          phase_color?: string
          phase_description?: string
          phase_name?: string
          project_id?: string
          start_day?: number
          started_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "integrator_phases_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "evolution_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integrator_phases_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "integrator_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      integrator_projects: {
        Row: {
          completion_summary: string | null
          created_at: string
          current_day: number
          current_phase: string
          id: string
          learning_insights_count: number | null
          needs_problem_clarification: boolean | null
          problem_clarified_at: string | null
          project_brief: string | null
          project_constraints: Json | null
          project_description: string
          project_maturity_stage: string | null
          project_structure: Json | null
          project_title: string
          project_type: string | null
          seed_breakthrough_id: string | null
          start_date: string
          status: string
          target_end_date: string
          timeframe_days: number
          updated_at: string
          user_id: string
          weekly_focus_intent: string | null
          why_this_matters: string | null
        }
        Insert: {
          completion_summary?: string | null
          created_at?: string
          current_day?: number
          current_phase?: string
          id?: string
          learning_insights_count?: number | null
          needs_problem_clarification?: boolean | null
          problem_clarified_at?: string | null
          project_brief?: string | null
          project_constraints?: Json | null
          project_description: string
          project_maturity_stage?: string | null
          project_structure?: Json | null
          project_title: string
          project_type?: string | null
          seed_breakthrough_id?: string | null
          start_date?: string
          status?: string
          target_end_date: string
          timeframe_days?: number
          updated_at?: string
          user_id: string
          weekly_focus_intent?: string | null
          why_this_matters?: string | null
        }
        Update: {
          completion_summary?: string | null
          created_at?: string
          current_day?: number
          current_phase?: string
          id?: string
          learning_insights_count?: number | null
          needs_problem_clarification?: boolean | null
          problem_clarified_at?: string | null
          project_brief?: string | null
          project_constraints?: Json | null
          project_description?: string
          project_maturity_stage?: string | null
          project_structure?: Json | null
          project_title?: string
          project_type?: string | null
          seed_breakthrough_id?: string | null
          start_date?: string
          status?: string
          target_end_date?: string
          timeframe_days?: number
          updated_at?: string
          user_id?: string
          weekly_focus_intent?: string | null
          why_this_matters?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integrator_projects_seed_breakthrough_id_fkey"
            columns: ["seed_breakthrough_id"]
            isOneToOne: false
            referencedRelation: "conversation_breakthroughs"
            referencedColumns: ["id"]
          },
        ]
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
      lifetime_events: {
        Row: {
          created_at: string
          event_description: string | null
          event_label: string
          event_type: string | null
          gold_outcome: string | null
          id: string
          is_transmuted: boolean | null
          pattern_id: string | null
          pattern_name: string | null
          time_period: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_description?: string | null
          event_label: string
          event_type?: string | null
          gold_outcome?: string | null
          id?: string
          is_transmuted?: boolean | null
          pattern_id?: string | null
          pattern_name?: string | null
          time_period: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_description?: string | null
          event_label?: string
          event_type?: string | null
          gold_outcome?: string | null
          id?: string
          is_transmuted?: boolean | null
          pattern_id?: string | null
          pattern_name?: string | null
          time_period?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lifetime_events_pattern_id_fkey"
            columns: ["pattern_id"]
            isOneToOne: false
            referencedRelation: "inner_patterns"
            referencedColumns: ["id"]
          },
        ]
      }
      mentor_daily_outreach: {
        Row: {
          context_data: Json | null
          context_source: string | null
          created_at: string
          id: string
          mentor_type: string
          message: string
          message_type: string
          read_at: string | null
          responded: boolean | null
          user_id: string
        }
        Insert: {
          context_data?: Json | null
          context_source?: string | null
          created_at?: string
          id?: string
          mentor_type: string
          message: string
          message_type: string
          read_at?: string | null
          responded?: boolean | null
          user_id: string
        }
        Update: {
          context_data?: Json | null
          context_source?: string | null
          created_at?: string
          id?: string
          mentor_type?: string
          message?: string
          message_type?: string
          read_at?: string | null
          responded?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      mentor_followup_queue: {
        Row: {
          created_at: string
          id: string
          insight_text: string
          mentor_type: string
          saved_insight_id: string | null
          scheduled_for: string
          sent_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          insight_text: string
          mentor_type: string
          saved_insight_id?: string | null
          scheduled_for?: string
          sent_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          insight_text?: string
          mentor_type?: string
          saved_insight_id?: string | null
          scheduled_for?: string
          sent_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentor_followup_queue_saved_insight_id_fkey"
            columns: ["saved_insight_id"]
            isOneToOne: false
            referencedRelation: "saved_insights"
            referencedColumns: ["id"]
          },
        ]
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
      mentor_private_messages: {
        Row: {
          council_meeting_id: string | null
          created_at: string | null
          id: string
          mentor_type: string
          message: string
          read: boolean | null
          user_id: string
        }
        Insert: {
          council_meeting_id?: string | null
          created_at?: string | null
          id?: string
          mentor_type: string
          message: string
          read?: boolean | null
          user_id: string
        }
        Update: {
          council_meeting_id?: string | null
          created_at?: string | null
          id?: string
          mentor_type?: string
          message?: string
          read?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentor_private_messages_council_meeting_id_fkey"
            columns: ["council_meeting_id"]
            isOneToOne: false
            referencedRelation: "council_meetings"
            referencedColumns: ["id"]
          },
        ]
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
      momentum_capabilities: {
        Row: {
          acquisition_channel: string | null
          activation_count: number | null
          capability_name: string
          category: string | null
          created_at: string
          description: string | null
          first_activated_at: string
          id: string
          last_activated_at: string
          level: number | null
          source_type: string | null
          user_id: string
        }
        Insert: {
          acquisition_channel?: string | null
          activation_count?: number | null
          capability_name: string
          category?: string | null
          created_at?: string
          description?: string | null
          first_activated_at?: string
          id?: string
          last_activated_at?: string
          level?: number | null
          source_type?: string | null
          user_id: string
        }
        Update: {
          acquisition_channel?: string | null
          activation_count?: number | null
          capability_name?: string
          category?: string | null
          created_at?: string
          description?: string | null
          first_activated_at?: string
          id?: string
          last_activated_at?: string
          level?: number | null
          source_type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      momentum_weekly_reports: {
        Row: {
          active_days: number | null
          avg_usefulness_rating: number | null
          biggest_win_type: string | null
          created_at: string
          evolution_narrative: string | null
          focus_category: string | null
          friction_points: Json | null
          friction_type: string | null
          id: string
          insights_captured: number | null
          momentum_score: number | null
          phases_active: Json | null
          reflection_rate: number | null
          ritual_completed_at: string | null
          self_ratings: Json | null
          sprint_direction: string | null
          streak_weeks: number | null
          system_insight: string | null
          tasks_completed: number | null
          tasks_skipped: number | null
          tasks_total: number | null
          top_insights: Json | null
          top_wins: Json | null
          usefulness_answer: string | null
          user_id: string
          week_end: string
          week_start: string
          wins_captured: number | null
        }
        Insert: {
          active_days?: number | null
          avg_usefulness_rating?: number | null
          biggest_win_type?: string | null
          created_at?: string
          evolution_narrative?: string | null
          focus_category?: string | null
          friction_points?: Json | null
          friction_type?: string | null
          id?: string
          insights_captured?: number | null
          momentum_score?: number | null
          phases_active?: Json | null
          reflection_rate?: number | null
          ritual_completed_at?: string | null
          self_ratings?: Json | null
          sprint_direction?: string | null
          streak_weeks?: number | null
          system_insight?: string | null
          tasks_completed?: number | null
          tasks_skipped?: number | null
          tasks_total?: number | null
          top_insights?: Json | null
          top_wins?: Json | null
          usefulness_answer?: string | null
          user_id: string
          week_end: string
          week_start: string
          wins_captured?: number | null
        }
        Update: {
          active_days?: number | null
          avg_usefulness_rating?: number | null
          biggest_win_type?: string | null
          created_at?: string
          evolution_narrative?: string | null
          focus_category?: string | null
          friction_points?: Json | null
          friction_type?: string | null
          id?: string
          insights_captured?: number | null
          momentum_score?: number | null
          phases_active?: Json | null
          reflection_rate?: number | null
          ritual_completed_at?: string | null
          self_ratings?: Json | null
          sprint_direction?: string | null
          streak_weeks?: number | null
          system_insight?: string | null
          tasks_completed?: number | null
          tasks_skipped?: number | null
          tasks_total?: number | null
          top_insights?: Json | null
          top_wins?: Json | null
          usefulness_answer?: string | null
          user_id?: string
          week_end?: string
          week_start?: string
          wins_captured?: number | null
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
          action_patterns: Json | null
          atlas_onboarding_completed: boolean | null
          birth_date: string | null
          birth_location: string | null
          birth_name: string | null
          birth_time: string | null
          birth_time_unknown: boolean | null
          capability_map_unlocked: boolean | null
          chat_unlocked: boolean | null
          console_intake_completed: boolean | null
          console_thread_phase: string | null
          constellation_insights: Json | null
          council_introduction_completed: boolean | null
          council_unlocked: boolean | null
          council_unlocked_at: string | null
          created_at: string | null
          creation_gate_passed_at: string | null
          creators_unlocked: boolean | null
          display_name: string | null
          emotional_tone: string | null
          entry_state: string | null
          first_project_created_at: string | null
          first_project_id: string | null
          first_win_completed_at: string | null
          first_win_path: string | null
          first_win_proof_text: string | null
          first_win_proof_url: string | null
          future_age: number | null
          future_lifestyle: string | null
          future_location: string | null
          future_self_avatar: string | null
          future_self_voice_note: string | null
          gravity_orientation_completed: boolean | null
          gravity_transition_completed: boolean | null
          human_design_data: Json | null
          id: string
          identity_direction_statement: string | null
          last_future_self_message_at: string | null
          last_whisper_date: string | null
          main_mission: string | null
          main_strengths: string[] | null
          numerology_profile: Json | null
          numerology_signals: Json | null
          onboarding_completion_seen: boolean
          onboarding_quest_completed: boolean | null
          payment_completed_at: string | null
          payment_status: string
          priority_growth_area: string | null
          projects_unlocked: boolean | null
          purpose_path: string | null
          reflection_loop_count: number | null
          second_win_completed_at: string | null
          self_discovery_completed: boolean | null
          self_discovery_completed_at: string | null
          shadow_intensity: string | null
          updated_at: string | null
          user_foundation_audio_url: string | null
          user_foundation_story: string | null
          user_foundation_summary: Json | null
          work_context: string | null
        }
        Insert: {
          action_patterns?: Json | null
          atlas_onboarding_completed?: boolean | null
          birth_date?: string | null
          birth_location?: string | null
          birth_name?: string | null
          birth_time?: string | null
          birth_time_unknown?: boolean | null
          capability_map_unlocked?: boolean | null
          chat_unlocked?: boolean | null
          console_intake_completed?: boolean | null
          console_thread_phase?: string | null
          constellation_insights?: Json | null
          council_introduction_completed?: boolean | null
          council_unlocked?: boolean | null
          council_unlocked_at?: string | null
          created_at?: string | null
          creation_gate_passed_at?: string | null
          creators_unlocked?: boolean | null
          display_name?: string | null
          emotional_tone?: string | null
          entry_state?: string | null
          first_project_created_at?: string | null
          first_project_id?: string | null
          first_win_completed_at?: string | null
          first_win_path?: string | null
          first_win_proof_text?: string | null
          first_win_proof_url?: string | null
          future_age?: number | null
          future_lifestyle?: string | null
          future_location?: string | null
          future_self_avatar?: string | null
          future_self_voice_note?: string | null
          gravity_orientation_completed?: boolean | null
          gravity_transition_completed?: boolean | null
          human_design_data?: Json | null
          id: string
          identity_direction_statement?: string | null
          last_future_self_message_at?: string | null
          last_whisper_date?: string | null
          main_mission?: string | null
          main_strengths?: string[] | null
          numerology_profile?: Json | null
          numerology_signals?: Json | null
          onboarding_completion_seen?: boolean
          onboarding_quest_completed?: boolean | null
          payment_completed_at?: string | null
          payment_status?: string
          priority_growth_area?: string | null
          projects_unlocked?: boolean | null
          purpose_path?: string | null
          reflection_loop_count?: number | null
          second_win_completed_at?: string | null
          self_discovery_completed?: boolean | null
          self_discovery_completed_at?: string | null
          shadow_intensity?: string | null
          updated_at?: string | null
          user_foundation_audio_url?: string | null
          user_foundation_story?: string | null
          user_foundation_summary?: Json | null
          work_context?: string | null
        }
        Update: {
          action_patterns?: Json | null
          atlas_onboarding_completed?: boolean | null
          birth_date?: string | null
          birth_location?: string | null
          birth_name?: string | null
          birth_time?: string | null
          birth_time_unknown?: boolean | null
          capability_map_unlocked?: boolean | null
          chat_unlocked?: boolean | null
          console_intake_completed?: boolean | null
          console_thread_phase?: string | null
          constellation_insights?: Json | null
          council_introduction_completed?: boolean | null
          council_unlocked?: boolean | null
          council_unlocked_at?: string | null
          created_at?: string | null
          creation_gate_passed_at?: string | null
          creators_unlocked?: boolean | null
          display_name?: string | null
          emotional_tone?: string | null
          entry_state?: string | null
          first_project_created_at?: string | null
          first_project_id?: string | null
          first_win_completed_at?: string | null
          first_win_path?: string | null
          first_win_proof_text?: string | null
          first_win_proof_url?: string | null
          future_age?: number | null
          future_lifestyle?: string | null
          future_location?: string | null
          future_self_avatar?: string | null
          future_self_voice_note?: string | null
          gravity_orientation_completed?: boolean | null
          gravity_transition_completed?: boolean | null
          human_design_data?: Json | null
          id?: string
          identity_direction_statement?: string | null
          last_future_self_message_at?: string | null
          last_whisper_date?: string | null
          main_mission?: string | null
          main_strengths?: string[] | null
          numerology_profile?: Json | null
          numerology_signals?: Json | null
          onboarding_completion_seen?: boolean
          onboarding_quest_completed?: boolean | null
          payment_completed_at?: string | null
          payment_status?: string
          priority_growth_area?: string | null
          projects_unlocked?: boolean | null
          purpose_path?: string | null
          reflection_loop_count?: number | null
          second_win_completed_at?: string | null
          self_discovery_completed?: boolean | null
          self_discovery_completed_at?: string | null
          shadow_intensity?: string | null
          updated_at?: string | null
          user_foundation_audio_url?: string | null
          user_foundation_story?: string | null
          user_foundation_summary?: Json | null
          work_context?: string | null
        }
        Relationships: []
      }
      project_branches: {
        Row: {
          branch_description: string
          branch_title: string
          branch_type: string
          created_at: string
          id: string
          parent_node_id: string | null
          spine_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          branch_description: string
          branch_title: string
          branch_type?: string
          created_at?: string
          id?: string
          parent_node_id?: string | null
          spine_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          branch_description?: string
          branch_title?: string
          branch_type?: string
          created_at?: string
          id?: string
          parent_node_id?: string | null
          spine_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_branches_parent_node_id_fkey"
            columns: ["parent_node_id"]
            isOneToOne: false
            referencedRelation: "evolution_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_branches_spine_id_fkey"
            columns: ["spine_id"]
            isOneToOne: false
            referencedRelation: "project_spines"
            referencedColumns: ["id"]
          },
        ]
      }
      project_name_history: {
        Row: {
          change_reason: string | null
          change_type: string | null
          created_at: string | null
          id: string
          new_name: string
          old_name: string
          project_id: string
          related_phase: string | null
          user_id: string
        }
        Insert: {
          change_reason?: string | null
          change_type?: string | null
          created_at?: string | null
          id?: string
          new_name: string
          old_name: string
          project_id: string
          related_phase?: string | null
          user_id: string
        }
        Update: {
          change_reason?: string | null
          change_type?: string | null
          created_at?: string | null
          id?: string
          new_name?: string
          old_name?: string
          project_id?: string
          related_phase?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_name_history_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "integrator_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_problems: {
        Row: {
          change_reason: string | null
          confirmation_source: string | null
          confirmed_at: string | null
          created_at: string | null
          full_problem_text: string
          id: string
          is_confirmed: boolean | null
          mentor_conversation_id: string | null
          pain_points: string | null
          previous_version_id: string | null
          problem_statement: string
          project_id: string
          root_cause: string | null
          target_audience: string | null
          updated_at: string | null
          user_id: string
          version: number | null
        }
        Insert: {
          change_reason?: string | null
          confirmation_source?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          full_problem_text: string
          id?: string
          is_confirmed?: boolean | null
          mentor_conversation_id?: string | null
          pain_points?: string | null
          previous_version_id?: string | null
          problem_statement: string
          project_id: string
          root_cause?: string | null
          target_audience?: string | null
          updated_at?: string | null
          user_id: string
          version?: number | null
        }
        Update: {
          change_reason?: string | null
          confirmation_source?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          full_problem_text?: string
          id?: string
          is_confirmed?: boolean | null
          mentor_conversation_id?: string | null
          pain_points?: string | null
          previous_version_id?: string | null
          problem_statement?: string
          project_id?: string
          root_cause?: string | null
          target_audience?: string | null
          updated_at?: string | null
          user_id?: string
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "project_problems_previous_version_id_fkey"
            columns: ["previous_version_id"]
            isOneToOne: false
            referencedRelation: "project_problems"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_problems_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "integrator_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_spines: {
        Row: {
          broad_contribution: string | null
          core_intention: string
          core_theme: string | null
          core_theme_confidence: number | null
          created_at: string
          id: string
          last_coherence_card_at: string | null
          spine_title: string
          start_date: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          broad_contribution?: string | null
          core_intention: string
          core_theme?: string | null
          core_theme_confidence?: number | null
          created_at?: string
          id?: string
          last_coherence_card_at?: string | null
          spine_title: string
          start_date?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          broad_contribution?: string | null
          core_intention?: string
          core_theme?: string | null
          core_theme_confidence?: number | null
          created_at?: string
          id?: string
          last_coherence_card_at?: string | null
          spine_title?: string
          start_date?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      project_thread_milestones: {
        Row: {
          created_at: string | null
          explanation: string | null
          id: string
          milestone_date: string | null
          project_id: string
          related_phase: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          explanation?: string | null
          id?: string
          milestone_date?: string | null
          project_id: string
          related_phase?: string | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          explanation?: string | null
          id?: string
          milestone_date?: string | null
          project_id?: string
          related_phase?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_thread_milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "integrator_projects"
            referencedColumns: ["id"]
          },
        ]
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
      saved_insights: {
        Row: {
          archived_at: string | null
          created_at: string
          followup_mentor: string | null
          followup_requested: boolean
          followup_triggered_at: string | null
          id: string
          initiated_by: string | null
          insight_text: string
          is_concept: boolean
          source_context: Json | null
          source_mentor: string | null
          source_type: string
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          followup_mentor?: string | null
          followup_requested?: boolean
          followup_triggered_at?: string | null
          id?: string
          initiated_by?: string | null
          insight_text: string
          is_concept?: boolean
          source_context?: Json | null
          source_mentor?: string | null
          source_type: string
          user_id: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          followup_mentor?: string | null
          followup_requested?: boolean
          followup_triggered_at?: string | null
          id?: string
          initiated_by?: string | null
          insight_text?: string
          is_concept?: boolean
          source_context?: Json | null
          source_mentor?: string | null
          source_type?: string
          user_id?: string
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
      superpowers: {
        Row: {
          category: string | null
          color: string
          created_at: string
          description: string
          icon: string
          id: string
          name: string
          pattern_id: string
          user_id: string
        }
        Insert: {
          category?: string | null
          color?: string
          created_at?: string
          description: string
          icon?: string
          id?: string
          name: string
          pattern_id: string
          user_id: string
        }
        Update: {
          category?: string | null
          color?: string
          created_at?: string
          description?: string
          icon?: string
          id?: string
          name?: string
          pattern_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "superpowers_pattern_id_fkey"
            columns: ["pattern_id"]
            isOneToOne: false
            referencedRelation: "inner_patterns"
            referencedColumns: ["id"]
          },
        ]
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      task_feedback: {
        Row: {
          created_at: string | null
          id: string
          improvement_text: string | null
          insight_text: string
          step_id: string | null
          usefulness_rating: number | null
          user_id: string
          win_text: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          improvement_text?: string | null
          insight_text: string
          step_id?: string | null
          usefulness_rating?: number | null
          user_id: string
          win_text: string
        }
        Update: {
          created_at?: string | null
          id?: string
          improvement_text?: string | null
          insight_text?: string
          step_id?: string | null
          usefulness_rating?: number | null
          user_id?: string
          win_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_feedback_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "integrator_daily_steps"
            referencedColumns: ["id"]
          },
        ]
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
      user_keywords: {
        Row: {
          context: string | null
          created_at: string | null
          frequency_count: number | null
          id: string
          keyword: string
          keyword_type: string
          last_seen_at: string | null
          source: string
          source_id: string | null
          user_id: string
        }
        Insert: {
          context?: string | null
          created_at?: string | null
          frequency_count?: number | null
          id?: string
          keyword: string
          keyword_type: string
          last_seen_at?: string | null
          source: string
          source_id?: string | null
          user_id: string
        }
        Update: {
          context?: string | null
          created_at?: string | null
          frequency_count?: number | null
          id?: string
          keyword?: string
          keyword_type?: string
          last_seen_at?: string | null
          source?: string
          source_id?: string | null
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
      value_map_blocks: {
        Row: {
          ai_suggestions: Json | null
          block_key: string
          content: string | null
          created_at: string | null
          id: string
          is_unlocked: boolean | null
          unlock_source: string | null
          unlock_source_id: string | null
          unlocked_at: string | null
          updated_at: string | null
          user_id: string
          user_notes: string | null
        }
        Insert: {
          ai_suggestions?: Json | null
          block_key: string
          content?: string | null
          created_at?: string | null
          id?: string
          is_unlocked?: boolean | null
          unlock_source?: string | null
          unlock_source_id?: string | null
          unlocked_at?: string | null
          updated_at?: string | null
          user_id: string
          user_notes?: string | null
        }
        Update: {
          ai_suggestions?: Json | null
          block_key?: string
          content?: string | null
          created_at?: string | null
          id?: string
          is_unlocked?: boolean | null
          unlock_source?: string | null
          unlock_source_id?: string | null
          unlocked_at?: string | null
          updated_at?: string | null
          user_id?: string
          user_notes?: string | null
        }
        Relationships: []
      }
      value_map_suggestions: {
        Row: {
          block_key: string
          created_at: string | null
          id: string
          source_context: Json | null
          source_id: string | null
          source_type: string
          status: string | null
          suggestion_text: string
          user_id: string
        }
        Insert: {
          block_key: string
          created_at?: string | null
          id?: string
          source_context?: Json | null
          source_id?: string | null
          source_type: string
          status?: string | null
          suggestion_text: string
          user_id: string
        }
        Update: {
          block_key?: string
          created_at?: string | null
          id?: string
          source_context?: Json | null
          source_id?: string | null
          source_type?: string
          status?: string | null
          suggestion_text?: string
          user_id?: string
        }
        Relationships: []
      }
      vibrational_patterns: {
        Row: {
          average_frequency: string | null
          coherence_metrics: Json | null
          contraction_indicators: string[] | null
          created_at: string
          detection_count: number
          embodiment_notes: string | null
          evolution_stage: string | null
          expansion_indicators: string[] | null
          first_detected_at: string
          flow_conditions: string[] | null
          frequency_trend: string | null
          id: string
          integration_level: number | null
          last_detected_at: string
          pattern_metadata: Json | null
          pattern_name: string
          pattern_type: string
          related_dot_ids: string[] | null
          related_themes: string[] | null
          resonance_strength: number | null
          trigger_contexts: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          average_frequency?: string | null
          coherence_metrics?: Json | null
          contraction_indicators?: string[] | null
          created_at?: string
          detection_count?: number
          embodiment_notes?: string | null
          evolution_stage?: string | null
          expansion_indicators?: string[] | null
          first_detected_at?: string
          flow_conditions?: string[] | null
          frequency_trend?: string | null
          id?: string
          integration_level?: number | null
          last_detected_at?: string
          pattern_metadata?: Json | null
          pattern_name: string
          pattern_type: string
          related_dot_ids?: string[] | null
          related_themes?: string[] | null
          resonance_strength?: number | null
          trigger_contexts?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          average_frequency?: string | null
          coherence_metrics?: Json | null
          contraction_indicators?: string[] | null
          created_at?: string
          detection_count?: number
          embodiment_notes?: string | null
          evolution_stage?: string | null
          expansion_indicators?: string[] | null
          first_detected_at?: string
          flow_conditions?: string[] | null
          frequency_trend?: string | null
          id?: string
          integration_level?: number | null
          last_detected_at?: string
          pattern_metadata?: Json | null
          pattern_name?: string
          pattern_type?: string
          related_dot_ids?: string[] | null
          related_themes?: string[] | null
          resonance_strength?: number | null
          trigger_contexts?: Json | null
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
      user_energetic_summary: {
        Row: {
          avg_resonance: number | null
          contraction_dots: number | null
          expansion_dots: number | null
          expansion_percentage: number | null
          flow_dots: number | null
          intuition_dots: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
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
        | "discipline_mentor"
        | "marketing_mentor"
        | "scientific_mentor"
        | "alignment_mentor"
        | "oracle_mother"
        | "perspective_mentor"
        | "challenger_mentor"
        | "design_thinking_mentor"
        | "ux_mentor"
        | "gamification_mentor"
        | "problem_mentor"
        | "inner_clarity_mentor"
        | "release_mentor"
        | "storybreaker_mentor"
        | "phoenix_mentor"
        | "stoic_mentor"
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
        "discipline_mentor",
        "marketing_mentor",
        "scientific_mentor",
        "alignment_mentor",
        "oracle_mother",
        "perspective_mentor",
        "challenger_mentor",
        "design_thinking_mentor",
        "ux_mentor",
        "gamification_mentor",
        "problem_mentor",
        "inner_clarity_mentor",
        "release_mentor",
        "storybreaker_mentor",
        "phoenix_mentor",
        "stoic_mentor",
      ],
    },
  },
} as const
