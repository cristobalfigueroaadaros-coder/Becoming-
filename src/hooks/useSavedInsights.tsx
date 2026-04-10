import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SavedInsight {
  id: string;
  user_id: string;
  insight_text: string;
  source_type: string;
  source_mentor: string | null;
  source_context: any;
  created_at: string;
  is_concept: boolean;
  followup_requested: boolean;
  followup_mentor: string | null;
  followup_triggered_at: string | null;
  archived_at: string | null;
}

interface SaveInsightOptions {
  isConcept?: boolean;
  requestFollowup?: boolean;
  followupMentor?: string;
}

export const useSavedInsights = () => {
  const [insights, setInsights] = useState<SavedInsight[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInsights = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('saved_insights')
        .select('*')
        .eq('user_id', user.id)
        .is('archived_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInsights((data || []) as SavedInsight[]);
    } catch (error: any) {
      console.error('Error fetching saved insights:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  const saveInsight = async (
    insightText: string,
    sourceType: string,
    sourceMentor: string | null,
    sourceContext: any = {},
    options: SaveInsightOptions = {}
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { isConcept = false, requestFollowup = false, followupMentor } = options;

      // Insert the saved insight
      const { data: savedInsight, error } = await supabase
        .from('saved_insights')
        .insert({
          user_id: user.id,
          insight_text: insightText,
          source_type: sourceType,
          source_mentor: sourceMentor,
          source_context: sourceContext,
          is_concept: isConcept,
          followup_requested: requestFollowup,
          followup_mentor: followupMentor || null,
        })
        .select()
        .single();

      if (error) throw error;

      // If follow-up requested, insert directly into mentor_daily_outreach
      // for the exact mentor who sent the insight — no edge function dependency
      if (requestFollowup && followupMentor) {
        const preview = insightText.length > 120 ? insightText.slice(0, 120) + '…' : insightText;
        const mentorDisplayName = followupMentor
          .replace(/_/g, ' ')
          .replace(/\b\w/g, (l: string) => l.toUpperCase());

        const followupMessage = `I've been sitting with what you saved: **"${preview}"** — and I want to go deeper on this with you. What feels most alive or unresolved about it right now?`;

        supabase
          .from('mentor_daily_outreach')
          .insert({
            user_id: user.id,
            mentor_type: followupMentor,
            message: followupMessage,
            message_type: 'insight_followup',
            context_source: 'saved_insight',
            context_data: { insight_text: insightText },
          })
          .then(({ error }) => {
            if (error) console.error('Outreach insert error:', error);
          });
      }

      await fetchInsights();
      return savedInsight;
    } catch (error: any) {
      console.error('Error saving insight:', error);
      toast.error('Failed to save insight');
      throw error;
    }
  };

  const archiveInsight = async (insightId: string) => {
    try {
      const { error } = await supabase
        .from('saved_insights')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', insightId);

      if (error) throw error;
      await fetchInsights();
      toast.success('Insight archived');
    } catch (error: any) {
      console.error('Error archiving insight:', error);
      toast.error('Failed to archive insight');
    }
  };

  const deleteInsight = async (insightId: string) => {
    try {
      const { error } = await supabase
        .from('saved_insights')
        .delete()
        .eq('id', insightId);

      if (error) throw error;
      await fetchInsights();
      toast.success('Insight removed');
    } catch (error: any) {
      console.error('Error deleting insight:', error);
      toast.error('Failed to remove insight');
    }
  };

  const getConceptInsights = () => insights.filter(i => i.is_concept);
  const getFollowupInsights = () => insights.filter(i => i.followup_requested);

  return {
    insights,
    loading,
    saveInsight,
    archiveInsight,
    deleteInsight,
    getConceptInsights,
    getFollowupInsights,
    refetch: fetchInsights,
  };
};
