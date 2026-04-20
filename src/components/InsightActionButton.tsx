import { useState } from 'react';
import { Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { InsightActionSheet } from './InsightActionSheet';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface InsightActionButtonProps {
  insightText: string;
  sourceType: 'council_insight' | 'mentor_perspective' | 'council_banter' | 'emotional_reflection' | 'council_guidance' | 'mentor_message' | 'mentor_whisper';
  sourceMentor?: string;
  sourceContext?: any;
  className?: string;
  showTutorialArrow?: boolean;
}

export const InsightActionButton = ({
  insightText,
  sourceType,
  sourceMentor,
  sourceContext = {},
  className,
  showTutorialArrow = false,
}: InsightActionButtonProps) => {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [tutorialOpen, setTutorialOpen] = useState(false);

  const handleClick = () => {
    const tutorialShown = localStorage.getItem('save_tutorial_shown') === '1';
    if (!tutorialShown) {
      setTutorialOpen(true);
      localStorage.setItem('save_tutorial_shown', '1');
    } else {
      setSheetOpen(true);
    }
  };

  const handleTutorialContinue = () => {
    setTutorialOpen(false);
    setSheetOpen(true);
  };

  return (
    <>
      <div className="relative inline-flex items-center">
        {showTutorialArrow && (
          <motion.div
            className="absolute -top-10 left-0 flex flex-col items-start pointer-events-none z-10"
            animate={{ y: [0, -2, 0] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          >
            <span className="text-[10px] font-semibold text-primary bg-primary/15 border border-primary/40 rounded-full px-2.5 py-0.5 whitespace-nowrap shadow-sm">
              Tap to save ↓
            </span>
          </motion.div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClick}
          className={cn(
            "h-7 px-2 text-xs gap-1.5 text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all opacity-60 hover:opacity-100",
            showTutorialArrow && "ring-2 ring-primary/60 ring-offset-1 opacity-100 text-primary bg-primary/10 animate-pulse",
            className
          )}
        >
          <Bookmark className="w-3.5 h-3.5" />
          <span>Save</span>
        </Button>
      </div>

      {/* First-time tutorial dialog */}
      <Dialog open={tutorialOpen} onOpenChange={setTutorialOpen}>
        <DialogContent className="max-w-xs sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">Save Insight</DialogTitle>
            <DialogDescription className="text-sm leading-relaxed">
              When a mentor shares something meaningful, you can save it.{"\n\n"}
              Saved insights help transform conversations into ideas and creative directions.
            </DialogDescription>
          </DialogHeader>
          <Button size="sm" className="w-full" onClick={handleTutorialContinue}>
            Continue
          </Button>
        </DialogContent>
      </Dialog>

      <InsightActionSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        insightText={insightText}
        sourceType={sourceType}
        sourceMentor={sourceMentor}
        sourceContext={sourceContext}
      />
    </>
  );
};
