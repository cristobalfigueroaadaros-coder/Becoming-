import { useState } from 'react';
import { Lightbulb, Clock, MessageCircle, ChevronLeft } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useSavedInsights } from '@/hooks/useSavedInsights';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';

interface InsightActionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  insightText: string;
  sourceType: string;
  sourceMentor?: string;
  sourceContext?: any;
}

const mentorList: { key: string; name: string; icon: string }[] = [
  { key: "future_self", name: "Future Self", icon: "✨" },
  { key: "discipline_mentor", name: "Discipline Mentor", icon: "🎯" },
  { key: "strategist_mentor", name: "Strategist Mentor", icon: "♟️" },
  { key: "creative_visionary", name: "Creative Visionary", icon: "🎨" },
  { key: "quantum_inventor", name: "Quantum Inventor", icon: "⚡" },
  { key: "mystic_mentor", name: "Mystic Mentor", icon: "🔮" },
  { key: "business_mentor", name: "Business Mentor", icon: "📈" },
  { key: "marketing_mentor", name: "Marketing Mentor", icon: "📣" },
  { key: "scientific_mentor", name: "Scientific Mentor", icon: "🔬" },
  { key: "heart_mentor", name: "Heart Mentor", icon: "💗" },
  { key: "ancient_sage", name: "Ancient Sage", icon: "📜" },
  { key: "alignment_mentor", name: "Alignment Mentor", icon: "🧭" },
  { key: "oracle_mother", name: "Oracle Mother", icon: "🌙" },
];

const mentorNames: Record<string, string> = Object.fromEntries(mentorList.map(m => [m.key, m.name]));

export const InsightActionSheet = ({
  open,
  onOpenChange,
  insightText,
  sourceType,
  sourceMentor,
  sourceContext = {},
}: InsightActionSheetProps) => {
  const { saveInsight } = useSavedInsights();
  const [saving, setSaving] = useState(false);
  const [showMentorPicker, setShowMentorPicker] = useState(false);
  const [showFullText, setShowFullText] = useState(false);

  const handleClose = () => {
    onOpenChange(false);
    setShowMentorPicker(false);
  };

  const handleAddToConcepts = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please sign in first');
        return;
      }

      // Try to get active project (optional - may be null for inbox)
      const { data: activeProject } = await supabase
        .from('integrator_projects')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Save to saved_insights
      await saveInsight(
        insightText,
        sourceType,
        sourceMentor || null,
        sourceContext,
        { isConcept: true }
      );

      // Extract concept title using edge function
      let conceptTitle = insightText.slice(0, 40) + (insightText.length > 40 ? '...' : '');
      try {
        const { data: titleData } = await supabase.functions.invoke('extract-concept-title', {
          body: { insightText }
        });
        if (titleData?.title) {
          conceptTitle = titleData.title;
        }
      } catch (titleErr) {
        console.error('Title extraction failed, using fallback:', titleErr);
      }

      // Get or create default page only if we have a project
      let pageId: string | null = null;
      if (activeProject) {
        let { data: pages } = await supabase
          .from('creative_space_pages')
          .select('id')
          .eq('project_id', activeProject.id)
          .eq('user_id', user.id)
          .order('page_order', { ascending: true })
          .limit(1);

        pageId = pages?.[0]?.id || null;

        if (!pageId) {
          const { data: newPage } = await supabase
            .from('creative_space_pages')
            .insert({
              user_id: user.id,
              project_id: activeProject.id,
              page_name: 'Main',
              page_order: 0
            })
            .select('id')
            .single();
          pageId = newPage?.id || null;
        }
      }

      // Create the Creative Space tile (project_id can be null for inbox)
      const { error: tileError } = await supabase
        .from('creative_space_tiles')
        .insert({
          user_id: user.id,
          project_id: activeProject?.id || null,
          tile_type: 'insight',
          title: conceptTitle,
          content: insightText,
          source_type: sourceType,
          source_label: sourceMentor ? (mentorNames[sourceMentor] || sourceMentor) : sourceType,
          position_x: Math.random() * 300 + 50,
          position_y: Math.random() * 200 + 50,
          page_id: pageId
        });

      if (tileError) {
        console.error('Error creating tile:', tileError);
        toast.error('Failed to save insight');
      } else if (activeProject) {
        toast.success('Added to Creative Space', {
          description: `"${conceptTitle}"`,
          icon: <Lightbulb className="w-4 h-4" />,
        });
      } else {
        toast.success('Saved to your Inbox', {
          description: `"${conceptTitle}" — assign to a project later`,
          icon: <Lightbulb className="w-4 h-4" />,
        });
      }

      handleClose();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleSelectMentor = async (mentorKey: string) => {
    setSaving(true);
    try {
      await saveInsight(
        insightText,
        sourceType,
        sourceMentor || null,
        sourceContext,
        {
          requestFollowup: true,
          followupMentor: mentorKey,
        }
      );
      toast.success(`${mentorNames[mentorKey] || 'Your mentor'} will reach out soon`, {
        description: "They'll message you about this insight",
        icon: <MessageCircle className="w-4 h-4" />,
      });
      handleClose();
    } catch (error) {
      // Error handled in hook
    } finally {
      setSaving(false);
    }
  };

  // Truncate text for display with read more option
  const isLongText = insightText.length > 150;
  const displayText = showFullText || !isLongText
    ? insightText
    : insightText.substring(0, 150) + '...';

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        {showMentorPicker ? (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowMentorPicker(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <DialogTitle className="text-base">Who should reach out?</DialogTitle>
              </div>
              <DialogDescription className="text-sm pl-7">
                Pick a mentor — even locked ones will send you a notification.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-2 max-h-[60vh] overflow-y-auto py-1">
              {mentorList.map((mentor) => {
                const isSource = mentor.key === sourceMentor;
                return (
                  <motion.button
                    key={mentor.key}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleSelectMentor(mentor.key)}
                    disabled={saving}
                    className={`flex items-center gap-2 p-3 rounded-lg border text-left transition-all disabled:opacity-50 ${
                      isSource
                        ? 'border-primary/60 bg-primary/10 text-primary'
                        : 'border-border hover:border-primary/40 hover:bg-muted/60'
                    }`}
                  >
                    <span className="text-xl">{mentor.icon}</span>
                    <span className="text-xs font-medium leading-tight">{mentor.name}</span>
                    {isSource && (
                      <span className="ml-auto text-[10px] text-primary/70 shrink-0">suggested</span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-lg">What would you like to do?</DialogTitle>
              <DialogDescription className="text-sm">
                This insight feels meaningful to you.
              </DialogDescription>
            </DialogHeader>

            {/* Preview of saved text */}
            <div className="p-3 rounded-lg bg-muted/50 border-l-4 border-accent text-sm text-muted-foreground italic">
              "{displayText}"
              {isLongText && (
                <button
                  onClick={() => setShowFullText(!showFullText)}
                  className="ml-2 text-primary hover:underline text-xs font-medium not-italic"
                >
                  {showFullText ? "Show less" : "Read more"}
                </button>
              )}
            </div>

            <div className="space-y-3 pt-2">
              {/* Option 1: Add to Creative Space */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleAddToConcepts}
                disabled={saving}
                className="w-full p-4 rounded-lg border-2 border-accent/30 hover:border-accent/60 bg-gradient-to-r from-accent/5 to-transparent transition-all text-left group disabled:opacity-50"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 group-hover:bg-accent/30 transition-colors">
                    <Lightbulb className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="font-medium">Add to Creative Space</p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Save as an idea tile to explore freely
                    </p>
                  </div>
                </div>
              </motion.button>

              {/* Option 2: Go Deeper Later — pick any mentor */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => setShowMentorPicker(true)}
                disabled={saving}
                className="w-full p-4 rounded-lg border-2 border-primary/30 hover:border-primary/60 bg-gradient-to-r from-primary/5 to-transparent transition-all text-left group disabled:opacity-50"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/30 transition-colors">
                    <Clock className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Go Deeper Later</p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Choose a mentor — they'll reach out to explore this with you
                    </p>
                  </div>
                </div>
              </motion.button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
