import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ValueMapBlock {
  id: string;
  user_id: string;
  block_key: string;
  content: string | null;
  is_unlocked: boolean;
  unlocked_at: string | null;
  unlock_source: string | null;
  unlock_source_id: string | null;
  ai_suggestions: Array<{
    text: string;
    source: string;
    accepted: boolean;
    timestamp: string;
  }>;
  user_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ValueMapSuggestion {
  id: string;
  user_id: string;
  block_key: string;
  suggestion_text: string;
  source_type: string;
  source_id: string | null;
  source_context: Record<string, unknown>;
  status: 'pending' | 'accepted' | 'edited' | 'discarded';
  created_at: string;
}

export interface BlockConfig {
  key: string;
  title: string;
  category: 'foundation' | 'people' | 'value' | 'distribution';
  color: string;
  prompts: string[];
  unlockHint: string;
}

export const BLOCK_CONFIGS: BlockConfig[] = [
  // Foundation (Purple)
  {
    key: 'purpose',
    title: 'Purpose',
    category: 'foundation',
    color: 'violet',
    prompts: [
      'What feels meaningful for you to work on?',
      'What keeps coming back in your reflections?',
      'What feels worth struggling for?'
    ],
    unlockHint: 'Unlocks when you define your mission or discuss purpose with mentors'
  },
  {
    key: 'strengths',
    title: 'Strengths & Lived Assets',
    category: 'foundation',
    color: 'violet',
    prompts: [
      'What do people come to you for?',
      'What have you survived or mastered?',
      'What feels easy for you but hard for others?'
    ],
    unlockHint: 'Unlocks when you identify your strengths in your profile or discussions'
  },
  // People & Problem (Blue)
  {
    key: 'audience',
    title: 'Who This Is For',
    category: 'people',
    color: 'blue',
    prompts: [
      'Who struggles with this?',
      'Who would care deeply about this?',
      'Who do you already understand?'
    ],
    unlockHint: 'Unlocks when conversations mention who you want to help'
  },
  {
    key: 'problems',
    title: 'What They Struggle With',
    category: 'people',
    color: 'blue',
    prompts: [
      'What feels broken for them?',
      'What do they complain about?',
      'When do they feel this pain most?'
    ],
    unlockHint: 'Unlocks when you explore problems in council or mentor sessions'
  },
  {
    key: 'alternatives',
    title: 'Existing Alternatives',
    category: 'people',
    color: 'blue',
    prompts: [
      'How are they solving this now?',
      'What are they tolerating instead?',
      'What clearly isn\'t working?'
    ],
    unlockHint: 'Unlocks when you analyze the current landscape'
  },
  // Value Creation (Green)
  {
    key: 'unique_value',
    title: 'Your Unique Value',
    category: 'value',
    color: 'emerald',
    prompts: [
      'Why is your approach different?',
      'What makes this feel personal, not generic?',
      'What clarity do you offer that others don\'t?'
    ],
    unlockHint: 'Unlocks when you have 5+ connected insight dots'
  },
  {
    key: 'solution',
    title: 'Solution',
    category: 'value',
    color: 'emerald',
    prompts: [
      'What is the simplest form of this?',
      'Tool, guide, experience, framework, product, service?',
      'What\'s the smallest viable expression?'
    ],
    unlockHint: 'Unlocks when you start a project in Focus Mode'
  },
  {
    key: 'impact',
    title: 'Impact Reflection',
    category: 'value',
    color: 'emerald',
    prompts: [
      'Who does this help, really?',
      'How will this make them feel?',
      'What changes in their life after?'
    ],
    unlockHint: 'Unlocks when you complete your first Focus Mode phase'
  },
  // Distribution & Money (Orange)
  {
    key: 'channels',
    title: 'Channels',
    category: 'distribution',
    color: 'amber',
    prompts: [
      'Where do these people already hang out?',
      'How could they discover this naturally?'
    ],
    unlockHint: 'Unlocks when you think about reaching your audience'
  },
  {
    key: 'revenue',
    title: 'Revenue Streams',
    category: 'distribution',
    color: 'amber',
    prompts: [
      'How could this create income?',
      'One-time, recurring, service, product, hybrid?'
    ],
    unlockHint: 'Unlocks when you explore sustainability'
  },
  {
    key: 'costs',
    title: 'Cost & Energy Structure',
    category: 'distribution',
    color: 'amber',
    prompts: [
      'What does this require emotionally, financially, energetically?',
      'What feels sustainable?'
    ],
    unlockHint: 'Unlocks when you consider what this takes from you'
  },
  {
    key: 'unfair_advantage',
    title: 'Unfair Advantage',
    category: 'distribution',
    color: 'amber',
    prompts: [
      'What part of this comes from your life?',
      'What can\'t be replicated by AI or templates?'
    ],
    unlockHint: 'Unlocks when you identify what makes you unique'
  },
  {
    key: 'signals',
    title: 'Signals of Progress',
    category: 'distribution',
    color: 'amber',
    prompts: [
      'How would you know this is working?',
      'What small signals matter at the beginning?'
    ],
    unlockHint: 'Unlocks when you define success metrics'
  }
];

export const useValueMap = () => {
  const [blocks, setBlocks] = useState<ValueMapBlock[]>([]);
  const [suggestions, setSuggestions] = useState<ValueMapSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  const loadBlocks = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('value_map_blocks')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      // Initialize missing blocks
      const existingKeys = new Set((data || []).map(b => b.block_key));
      const missingBlocks = BLOCK_CONFIGS.filter(c => !existingKeys.has(c.key));

      if (missingBlocks.length > 0) {
        const { data: newBlocks, error: insertError } = await supabase
          .from('value_map_blocks')
          .insert(missingBlocks.map(c => ({
            user_id: user.id,
            block_key: c.key,
            is_unlocked: false,
            ai_suggestions: []
          })))
          .select();

        if (insertError) throw insertError;
        setBlocks([...(data || []), ...(newBlocks || [])] as ValueMapBlock[]);
      } else {
        setBlocks((data || []) as ValueMapBlock[]);
      }
    } catch (error) {
      console.error('Error loading value map blocks:', error);
    }
  }, []);

  const loadSuggestions = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('value_map_suggestions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSuggestions((data || []) as ValueMapSuggestion[]);
    } catch (error) {
      console.error('Error loading suggestions:', error);
    }
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadBlocks(), loadSuggestions()]);
    setLoading(false);
  }, [loadBlocks, loadSuggestions]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const unlockBlock = async (blockKey: string, source: string, sourceId?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('value_map_blocks')
        .update({
          is_unlocked: true,
          unlocked_at: new Date().toISOString(),
          unlock_source: source,
          unlock_source_id: sourceId || null
        })
        .eq('user_id', user.id)
        .eq('block_key', blockKey);

      if (error) throw error;

      setBlocks(prev => prev.map(b => 
        b.block_key === blockKey 
          ? { ...b, is_unlocked: true, unlocked_at: new Date().toISOString(), unlock_source: source }
          : b
      ));

      // Trigger Future Self celebration
      const config = BLOCK_CONFIGS.find(c => c.key === blockKey);
      if (config) {
        await triggerUnlockCelebration(user.id, config.title);
      }

      toast.success(`${config?.title || 'Block'} unlocked!`);
    } catch (error) {
      console.error('Error unlocking block:', error);
      toast.error('Failed to unlock block');
    }
  };

  const updateBlockContent = async (blockKey: string, content: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('value_map_blocks')
        .update({ 
          content,
          is_unlocked: true,
          unlocked_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('block_key', blockKey);

      if (error) throw error;

      setBlocks(prev => prev.map(b => 
        b.block_key === blockKey 
          ? { ...b, content, is_unlocked: true }
          : b
      ));

      toast.success('Block updated');
    } catch (error) {
      console.error('Error updating block:', error);
      toast.error('Failed to update block');
    }
  };

  const acceptSuggestion = async (suggestionId: string, editedText?: string) => {
    try {
      const suggestion = suggestions.find(s => s.id === suggestionId);
      if (!suggestion) return;

      const finalText = editedText || suggestion.suggestion_text;

      // Update suggestion status
      await supabase
        .from('value_map_suggestions')
        .update({ status: editedText ? 'edited' : 'accepted' })
        .eq('id', suggestionId);

      // Update block content
      await updateBlockContent(suggestion.block_key, finalText);

      setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
      toast.success('Suggestion applied');
    } catch (error) {
      console.error('Error accepting suggestion:', error);
      toast.error('Failed to apply suggestion');
    }
  };

  const discardSuggestion = async (suggestionId: string) => {
    try {
      await supabase
        .from('value_map_suggestions')
        .update({ status: 'discarded' })
        .eq('id', suggestionId);

      setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
      toast.success('Suggestion discarded');
    } catch (error) {
      console.error('Error discarding suggestion:', error);
    }
  };

  const analyzeAndGenerateSuggestions = async () => {
    try {
      setAnalyzing(true);
      const { data, error } = await supabase.functions.invoke('analyze-value-map', {
        body: {}
      });

      if (error) throw error;

      if (data?.suggestions?.length > 0) {
        toast.success(`Generated ${data.suggestions.length} new suggestions`);
        await loadSuggestions();
      } else {
        toast.info('No new suggestions found based on your current data');
      }
    } catch (error) {
      console.error('Error analyzing value map:', error);
      toast.error('Failed to analyze. Try again later.');
    } finally {
      setAnalyzing(false);
    }
  };

  const checkAutoUnlocks = async (profileData?: { main_mission?: string; main_strengths?: string[] }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Check purpose unlock from profile
    if (profileData?.main_mission) {
      const purposeBlock = blocks.find(b => b.block_key === 'purpose');
      if (purposeBlock && !purposeBlock.is_unlocked) {
        await unlockBlock('purpose', 'profile');
        await updateBlockContent('purpose', profileData.main_mission);
      }
    }

    // Check strengths unlock from profile
    if (profileData?.main_strengths && profileData.main_strengths.length > 0) {
      const strengthsBlock = blocks.find(b => b.block_key === 'strengths');
      if (strengthsBlock && !strengthsBlock.is_unlocked) {
        await unlockBlock('strengths', 'profile');
        await updateBlockContent('strengths', profileData.main_strengths.join('\n• '));
      }
    }

    // Check for Focus Mode unlocks
    await checkFocusModeUnlocks();
  };

  // Check for Focus Mode project and insights to unlock relevant blocks
  const checkFocusModeUnlocks = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Check for active integrator projects - unlocks Solution block
    const { data: projects } = await supabase
      .from('integrator_projects')
      .select('id, project_title, project_description, current_phase')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .limit(1);

    if (projects && projects.length > 0) {
      const project = projects[0];
      
      const solutionBlock = blocks.find(b => b.block_key === 'solution');
      if (solutionBlock && !solutionBlock.is_unlocked) {
        await unlockBlock('solution', 'focus_mode', project.id);
      }
    }

    // Check for Focus Mode insights
    const { data: insights } = await supabase
      .from('insight_dots')
      .select('id, insight_text, skill_tags, vibrational_context')
      .eq('user_id', user.id)
      .eq('source_type', 'integrator_step')
      .order('created_at', { ascending: false })
      .limit(20);

    if (insights && insights.length > 0) {
      // Count insights by phase for potential block unlocks
      const phaseInsights: Record<string, number> = {};
      insights.forEach(i => {
        const context = i.vibrational_context as any;
        const phase = context?.phase_name?.toLowerCase() || 'unknown';
        phaseInsights[phase] = (phaseInsights[phase] || 0) + 1;
      });

      // Unlock Impact block after 2+ insights from creation or expression phases
      const impactBlock = blocks.find(b => b.block_key === 'impact');
      if (impactBlock && !impactBlock.is_unlocked) {
        const creationCount = (phaseInsights['creation'] || 0) + (phaseInsights['expression'] || 0);
        if (creationCount >= 2) {
          await unlockBlock('impact', 'focus_mode', insights[0].id);
        }
      }

      // Unlock Signals block after reflection phase insights
      const signalsBlock = blocks.find(b => b.block_key === 'signals');
      if (signalsBlock && !signalsBlock.is_unlocked && phaseInsights['reflection'] >= 1) {
        await unlockBlock('signals', 'focus_mode', insights[0].id);
      }
    }
  };

  // Computed values
  const unlockedCount = blocks.filter(b => b.is_unlocked).length;
  const filledCount = blocks.filter(b => b.content).length;
  const progress = blocks.length > 0 ? filledCount / blocks.length : 0;
  const pendingSuggestionsCount = suggestions.length;

  const getBlockByKey = (key: string) => blocks.find(b => b.block_key === key);
  const getSuggestionsForBlock = (key: string) => suggestions.filter(s => s.block_key === key);

  return {
    blocks,
    suggestions,
    loading,
    analyzing,
    unlockedCount,
    filledCount,
    progress,
    pendingSuggestionsCount,
    getBlockByKey,
    getSuggestionsForBlock,
    unlockBlock,
    updateBlockContent,
    acceptSuggestion,
    discardSuggestion,
    analyzeAndGenerateSuggestions,
    checkAutoUnlocks,
    checkFocusModeUnlocks,
    refresh: loadAll
  };
};

// Helper function to trigger Future Self celebration
async function triggerUnlockCelebration(userId: string, blockTitle: string) {
  try {
    const celebrationMessages = [
      `You just clarified "${blockTitle}". Your vision is becoming clearer.`,
      `"${blockTitle}" unlocked. The path forward is taking shape.`,
      `Another piece of the puzzle: "${blockTitle}". You're building something real.`,
      `"${blockTitle}" is now part of your map. Each block brings coherence.`
    ];
    
    const message = celebrationMessages[Math.floor(Math.random() * celebrationMessages.length)];
    
    await supabase.from('future_self_messages').insert({
      user_id: userId,
      message,
      trigger_reason: 'value_map_unlock',
      emotional_tone: 'encouraging'
    });
  } catch (error) {
    console.error('Error triggering celebration:', error);
  }
}
