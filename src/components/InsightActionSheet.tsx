import { useState } from 'react';
import { Lightbulb, Clock, MessageCircle, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

const availableMentors = Object.entries(mentorNames);

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
  const [selectedMentor, setSelectedMentor] = useState<string>(sourceMentor || '');
  const [showMentorSelect, setShowMentorSelect] = useState(false);

  const handleAddToConcepts = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please sign in first');
        return;
      }

      // Get active project
      const { data: activeProject } = await supabase
        .from('integrator_projects')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .limit(1)
        .single();

      if (!activeProject) {
        toast.error('No active project', {
          description: 'Start a project first to use Creative Space',
        });
        return;
      }

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

      // Get or create default page
      let { data: pages } = await supabase
        .from('creative_space_pages')
        .select('id')
        .eq('project_id', activeProject.id)
        .eq('user_id', user.id)
        .order('page_order', { ascending: true })
        .limit(1);

      let pageId = pages?.[0]?.id;

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
        pageId = newPage?.id;
      }

      // Create the Creative Space tile
      const { error: tileError } = await supabase
        .from('creative_space_tiles')
        .insert({
          user_id: user.id,
          project_id: activeProject.id,
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
        toast.error('Saved but failed to add to Creative Space');
      } else {
        toast.success('Added to Creative Space', {
          description: `"${conceptTitle}"`,
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

  const handleGoDeeper = async () => {
    if (!selectedMentor) {
      toast.error('Please select a mentor');
      return;
    }

    setSaving(true);
    try {
      await saveInsight(
        insightText,
        sourceType,
        sourceMentor || null,
        sourceContext,
        { 
          requestFollowup: true, 
          followupMentor: selectedMentor 
        }
      );
      toast.success(`${mentorNames[selectedMentor]} will reach out soon`, {
        description: 'They\'ll message you about this insight',
        icon: <MessageCircle className="w-4 h-4" />,
      });
      onOpenChange(false);
      setShowMentorSelect(false);
      setSelectedMentor('');
    } catch (error) {
      // Error handled in hook
    } finally {
      setSaving(false);
    }
  };

  // Truncate text for display
  const displayText = insightText.length > 150 
    ? insightText.substring(0, 150) + '...' 
    : insightText;

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
        </div>

        <div className="space-y-3 pt-2">
          {/* Option 1: Add to Creation Lab */}
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

          {/* Option 2: Go Deeper Later */}
          {!showMentorSelect ? (
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => setShowMentorSelect(true)}
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
                    A mentor will reach out to discuss this with you
                  </p>
                </div>
              </div>
            </motion.button>
          ) : (
            <div className="p-4 rounded-lg border-2 border-primary/50 bg-primary/5 space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                <p className="font-medium">Who should reach out?</p>
              </div>
              
              <Select value={selectedMentor} onValueChange={setSelectedMentor}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a mentor" />
                </SelectTrigger>
                <SelectContent>
                  {availableMentors.map(([key, name]) => (
                    <SelectItem key={key} value={key}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowMentorSelect(false);
                    setSelectedMentor('');
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleGoDeeper}
                  disabled={!selectedMentor || saving}
                  className="flex-1 gap-2"
                >
                  <Check className="w-4 h-4" />
                  Confirm
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
