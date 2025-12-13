import { useState } from 'react';
import { Lightbulb, Clock, MessageCircle, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useSavedInsights } from '@/hooks/useSavedInsights';
import { motion } from 'framer-motion';

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
      await saveInsight(
        insightText,
        sourceType,
        sourceMentor || null,
        sourceContext,
        { isConcept: true }
      );
      toast.success('Saved to Creation Lab', {
        description: 'This insight is now in your concepts',
        icon: <Lightbulb className="w-4 h-4" />,
      });
      onOpenChange(false);
    } catch (error) {
      // Error handled in hook
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
                <p className="font-medium">Add to Creation Lab</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Save as a concept to explore later
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
