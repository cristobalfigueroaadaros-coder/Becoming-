import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProjectInfo } from './types';

interface ProjectThreadCenterProps {
  projectInfo: ProjectInfo | null;
  latestSnapshot?: string;
  onOpenThread: () => void;
}

export const ProjectThreadCenter: React.FC<ProjectThreadCenterProps> = ({
  projectInfo,
  latestSnapshot,
  onOpenThread,
}) => {
  if (!projectInfo) {
    return (
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="w-40 h-40 rounded-full bg-muted/50 backdrop-blur-sm flex items-center justify-center">
          <p className="text-sm text-muted-foreground text-center px-4">
            No project selected
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.2 }}
    >
      <motion.div
        className="w-44 h-44 rounded-full bg-gradient-to-br from-background/95 to-muted/80 backdrop-blur-md border border-border/50 flex flex-col items-center justify-center p-4 cursor-pointer shadow-xl"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.98 }}
        onClick={onOpenThread}
      >
        <div className="flex items-center gap-1.5 mb-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-xs font-medium text-muted-foreground">Project Thread</span>
        </div>
        
        <h3 className="text-sm font-semibold text-foreground text-center line-clamp-2 mb-1">
          {projectInfo.title}
        </h3>
        
        {projectInfo.currentFocus && (
          <p className="text-[10px] text-muted-foreground text-center line-clamp-2 mb-2">
            {projectInfo.currentFocus}
          </p>
        )}
        
        {latestSnapshot && (
          <p className="text-[10px] text-muted-foreground/80 text-center italic line-clamp-2 mb-2">
            "{latestSnapshot}"
          </p>
        )}
        
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-6 text-xs gap-1 text-primary hover:text-primary/80"
        >
          Open Thread
          <ChevronRight className="w-3 h-3" />
        </Button>
      </motion.div>
    </motion.div>
  );
};
