import { useState } from 'react';
import { Lightbulb, Clock, MessageCircle } from 'lucide-react';
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

const mentorNames: Record<string, string> = {
  discipline_mentor: "Discipline Mentor",
  strategist_mentor: "Strategist Mentor",
  creative_visionary: "Creative Visionary",
  quantum_inventor: "Quantum Inventor",
  mystic_mentor: "Mystic Mentor",
  business_mentor: "Business Mentor",
  marketing_mentor: "Marketing Mentor",
  scientific_mentor: "Scientific Mentor",
  heart_mentor: "Heart Mentor",
  ancient_sage: "Ancient Sage",
  alignment_mentor: "Alignment Mentor",
  oracle_mother: "Oracle Mother",
  future_self: "Future Self",
};

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
  const [showFullText, setShowFullText] = useState(false);

  // The mentor who sent the insight is the one who reaches out.
  // Fall back to Future Self only if the insight has no specific source mentor.
  const followupMentor = sourceMentor || 'future_self';

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

      onOpenChange(false);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleGoDeeper = () => {
    console.log('[GoDeeper] sourceMentor:', sourceMentor, '→ followupMentor:', followupMentor);
    setSaving(true);
    saveInsight(
      insightText,
      sourceType,
      sourceMentor || null,
      sourceContext,
      { requestFollowup: true, followupMentor }
    ).then(() => {
      toast.success(`${mentorNames[followupMentor] || 'Your mentor'} will reach out soon`, {
        description: "They'll message you about this insight",
        icon: <MessageCircle className="w-4 h-4" />,
      });
      onOpenChange(false);
    }).catch(() => {}).finally(() => setSaving(false));
  };

  // Truncate text for display with read more option
  const isLongText = insightText.length > 150;
  const displayText = showFullText || !isLongText
    ? insightText
    : insightText.substring(0, 150) + '...';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
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
                  Save this to your notebook and connect it with other ideas
                </p>
              </div>
            </div>
          </motion.button>

          {/* Option 2: Go Deeper Later — the same mentor reaches back out */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={handleGoDeeper}
            disabled={saving}
            className="w-full p-4 rounded-lg border-2 border-primary/30 hover:border-primary/60 bg-gradient-to-r from-primary/5 to-transparent transition-all text-left group disabled:opacity-50"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/30 transition-colors">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Go deeper</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Your mentor will text you about this
                </p>
              </div>
            </div>
          </motion.button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
