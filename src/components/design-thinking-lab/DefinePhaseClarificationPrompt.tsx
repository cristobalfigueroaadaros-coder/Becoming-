import React from 'react';
import { motion } from 'framer-motion';
import { Target, MessageSquare, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface DefinePhaseClarificationPromptProps {
  projectName: string;
  onStartClarification: () => void;
}

const EXAMPLE_PROBLEM = `We are solving [problem] for [specific people], who struggle with [pain or friction] because [current situation is broken or missing something].`;

export const DefinePhaseClarificationPrompt: React.FC<DefinePhaseClarificationPromptProps> = ({
  projectName,
  onStartClarification,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Core Question */}
      <div className="p-4 rounded-xl bg-[hsl(20,85%,72%,0.15)] border border-[hsl(20,85%,62%,0.3)]">
        <div className="flex items-center gap-2 mb-2">
          <Target className="w-5 h-5 text-[hsl(20,85%,72%)]" />
          <span className="font-medium text-[hsl(20,85%,72%)]">Core Question</span>
        </div>
        <p className="text-lg font-medium text-foreground">
          What am I focusing on solving right now?
        </p>
      </div>

      {/* Example Problem Statement */}
      <Card className="border-dashed border-2 border-muted-foreground/30 bg-muted/20">
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Example
            </span>
          </div>
          <p className="text-sm text-muted-foreground italic leading-relaxed">
            "{EXAMPLE_PROBLEM}"
          </p>
          <p className="text-xs text-muted-foreground/70 mt-3">
            This example disappears once your problem is confirmed.
          </p>
        </CardContent>
      </Card>

      {/* Working Space (Read-Only) */}
      <div className="p-4 rounded-xl bg-muted/50 border border-border">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-muted-foreground">Your Problem Statement</span>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
            Awaiting clarification
          </span>
        </div>
        <p className="text-sm text-muted-foreground/70 italic">
          Complete the mentor conversation below to define your problem.
        </p>
      </div>

      {/* Primary CTA - Mandatory first time */}
      <div className="space-y-3">
        <Button 
          onClick={onStartClarification}
          className="w-full h-12 gap-3 text-base bg-gradient-to-r from-[hsl(20,85%,55%)] to-[hsl(20,85%,65%)] hover:from-[hsl(20,85%,50%)] hover:to-[hsl(20,85%,60%)] text-white"
        >
          <MessageSquare className="w-5 h-5" />
          Clarify the problem with the Business mentor
        </Button>
        <p className="text-xs text-center text-muted-foreground">
          Work through who this is for, what's not working, and why it matters.
        </p>
      </div>

      {/* No Save / Manual Completion for first-time */}
      {/* This component intentionally has no input fields or save buttons */}
    </motion.div>
  );
};
