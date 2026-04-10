import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProjectInfo } from './types';

interface ProjectThreadCenterProps {
  projectInfo: ProjectInfo | null;
  latestSnapshot?: string;
  onOpenThread: () => void;
  centerX?: number;
  centerY?: number;
}

export const ProjectThreadCenter: React.FC<ProjectThreadCenterProps> = ({
  projectInfo,
  latestSnapshot,
  onOpenThread,
  centerX,
  centerY,
}) => {
  // If explicit pixel coordinates provided, use them (PhaseCircle usage)
  const positionStyle = centerX !== undefined && centerY !== undefined
    ? {
        position: 'absolute' as const,
        left: centerX,
        top: centerY,
        transform: 'translate(-50%, -50%)',
        zIndex: 10,
      }
    : {
        position: 'absolute' as const,
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 10,
      };

  if (!projectInfo) {
    return (
      <motion.div
        style={positionStyle}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="w-28 h-28 rounded-full bg-muted/50 backdrop-blur-sm flex items-center justify-center">
          <p className="text-xs text-muted-foreground text-center px-3">
            No project selected
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      style={positionStyle}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.2 }}
    >
      <motion.div
        className="w-28 h-28 rounded-full bg-gradient-to-br from-background/95 to-muted/80 backdrop-blur-md border border-border/50 flex flex-col items-center justify-center p-2 cursor-pointer shadow-xl"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.98 }}
        onClick={onOpenThread}
      >
        <div className="flex items-center gap-1 mb-1">
          <Sparkles className="w-3 h-3 text-primary" />
          <span className="text-[10px] font-medium text-muted-foreground">Thread</span>
        </div>

        <h3 className="text-[11px] font-semibold text-foreground text-center line-clamp-2 mb-0.5 px-1">
          {projectInfo.title}
        </h3>

        {projectInfo.currentFocus && (
          <p className="text-[9px] text-muted-foreground text-center line-clamp-1 px-1">
            {projectInfo.currentFocus}
          </p>
        )}

        <Button
          variant="ghost"
          size="sm"
          className="h-5 text-[10px] gap-0.5 text-primary hover:text-primary/80 mt-1 px-1"
        >
          Open
          <ChevronRight className="w-2.5 h-2.5" />
        </Button>
      </motion.div>
    </motion.div>
  );
};
