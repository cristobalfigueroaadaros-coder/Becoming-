import { useState } from 'react';
import { Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InsightActionSheet } from './InsightActionSheet';
import { cn } from '@/lib/utils';

interface InsightActionButtonProps {
  insightText: string;
  sourceType: 'council_insight' | 'mentor_perspective' | 'council_banter' | 'emotional_reflection' | 'council_guidance' | 'mentor_message' | 'mentor_whisper';
  sourceMentor?: string;
  sourceContext?: any;
  className?: string;
}

export const InsightActionButton = ({
  insightText,
  sourceType,
  sourceMentor,
  sourceContext = {},
  className,
}: InsightActionButtonProps) => {
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setSheetOpen(true)}
        className={cn(
          "h-7 px-2 text-xs gap-1.5 text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all opacity-60 hover:opacity-100",
          className
        )}
      >
        <Bookmark className="w-3.5 h-3.5" />
        <span>Save</span>
      </Button>

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
