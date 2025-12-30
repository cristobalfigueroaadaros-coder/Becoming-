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
          journey_topic: string | null
          processed: boolean
          source_mentor_type: string
          source_messages: Json
          target_mentor_type: string
          user_id: string
        }
        Insert: {
          chain_position?: number | null
          created_at?: string
          handoff_chain_id?: string | null
          handoff_summary?: string | null
          id?: string
          journey_topic?: string | null
          processed?: boolean
          source_mentor_type: string
          source_messages?: Json
          target_mentor_type: string
          user_id: string
        }
        Update: {
          chain_position?: number | null
          created_at?: string
          handoff_chain_id?: string | null
          handoff_summary?: string | null
          id?: string
          journey_topic?: string | null
          processed?: boolean
          source_mentor_type?: string
          source_messages?: Json
          target_mentor_type?: string
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
      insight_dots: {
        Row: {
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
          completed_at: string | null
          created_at: string
          day_number: number
          encouragement: string | null
          estimated_minutes: number
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
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          day_number: number
          encouragement?: string | null
          estimated_minutes?: number
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
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          day_number?: number
          encouragement?: string | null
          estimated_minutes?: number
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
          project_description: string
          project_title: string
          seed_breakthrough_id: string | null
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
          id?: string
          learning_insights_count?: number | null
          project_description: string
          project_title: string
          seed_breakthrough_id?: string | null
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
          id?: string
          learning_insights_count?: number | null
          project_description?: string
          project_title?: string
          seed_breakthrough_id?: string | null
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
          birth_date: string | null
          birth_location: string | null
          birth_name: string | null
          birth_time: string | null
          birth_time_unknown: boolean | null
          constellation_insights: Json | null
          council_introduction_completed: boolean | null
          council_unlocked: boolean | null
          council_unlocked_at: string | null
          created_at: string | null
          creation_gate_passed_at: string | null
          display_name: string | null
          emotional_tone: string | null
          first_win_completed_at: string | null
          first_win_path: string | null
          first_win_proof_text: string | null
          first_win_proof_url: string | null
          future_age: number | null
          future_lifestyle: string | null
          future_location: string | null
          future_self_avatar: string | null
          future_self_voice_note: string | null
          human_design_data: Json | null
          id: string
          last_future_self_message_at: string | null
          last_whisper_date: string | null
          main_mission: string | null
          main_strengths: string[] | null
          numerology_profile: Json | null
          numerology_signals: Json | null
          priority_growth_area: string | null
          purpose_path: string | null
          reflection_loop_count: number | null
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
          birth_date?: string | null
          birth_location?: string | null
          birth_name?: string | null
          birth_time?: string | null
          birth_time_unknown?: boolean | null
          constellation_insights?: Json | null
          council_introduction_completed?: boolean | null
          council_unlocked?: boolean | null
          council_unlocked_at?: string | null
          created_at?: string | null
          creation_gate_passed_at?: string | null
          display_name?: string | null
          emotional_tone?: string | null
          first_win_completed_at?: string | null
          first_win_path?: string | null
          first_win_proof_text?: string | null
          first_win_proof_url?: string | null
          future_age?: number | null
          future_lifestyle?: string | null
          future_location?: string | null
          future_self_avatar?: string | null
          future_self_voice_note?: string | null
          human_design_data?: Json | null
          id: string
          last_future_self_message_at?: string | null
          last_whisper_date?: string | null
          main_mission?: string | null
          main_strengths?: string[] | null
          numerology_profile?: Json | null
          numerology_signals?: Json | null
          priority_growth_area?: string | null
          purpose_path?: string | null
          reflection_loop_count?: number | null
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
          birth_date?: string | null
          birth_location?: string | null
          birth_name?: string | null
          birth_time?: string | null
          birth_time_unknown?: boolean | null
          constellation_insights?: Json | null
          council_introduction_completed?: boolean | null
          council_unlocked?: boolean | null
          council_unlocked_at?: string | null
          created_at?: string | null
          creation_gate_passed_at?: string | null
          display_name?: string | null
          emotional_tone?: string | null
          first_win_completed_at?: string | null
          first_win_path?: string | null
          first_win_proof_text?: string | null
          first_win_proof_url?: string | null
          future_age?: number | null
          future_lifestyle?: string | null
          future_location?: string | null
          future_self_avatar?: string | null
          future_self_voice_note?: string | null
          human_design_data?: Json | null
          id?: string
          last_future_self_message_at?: string | null
          last_whisper_date?: string | null
          main_mission?: string | null
          main_strengths?: string[] | null
          numerology_profile?: Json | null
          numerology_signals?: Json | null
          priority_growth_area?: string | null
          purpose_path?: string | null
          reflection_loop_count?: number | null
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
        | "discipline_mentor"
        | "marketing_mentor"
        | "scientific_mentor"
        | "alignment_mentor"
        | "oracle_mother"
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
      ],
    },
  },
} as const
