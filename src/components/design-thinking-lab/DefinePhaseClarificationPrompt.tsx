import React from 'react';
import { motion } from 'framer-motion';
import { Target, MessageSquare, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface DefinePhaseClarificationPromptProps {
  projectName: string;
  onStartClarification: () => void;
}

const EXAMPLE_PROBLEM = `We are solving disconnection in families for parents with children over 6, who struggle to create meaningful time together because daily routines and screens replace intentional connection.`;

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
      <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
        <div className="flex items-center gap-2 mb-2">
          <Target className="w-5 h-5 text-primary" />
          <span className="font-medium text-primary">Core Question</span>
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
              Example Format
            </span>
          </div>
          <p className="text-sm text-muted-foreground italic leading-relaxed">
            "{EXAMPLE_PROBLEM}"
          </p>
          <div className="mt-4 pt-3 border-t border-border/50">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium">Structure:</span> We are solving [problem] for [people] who struggle with [pain] because [root cause].
            </p>
          </div>
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

      {/* Primary CTA */}
      <div className="space-y-3">
        <Button 
          onClick={onStartClarification}
          className="w-full h-12 gap-3 text-base bg-gradient-to-r from-primary to-primary/80 hover:opacity-90"
        >
          <MessageSquare className="w-5 h-5" />
          Clarify the problem with the Business Mentor
        </Button>
        <p className="text-xs text-center text-muted-foreground">
          Understand who this is for, what's not working, and why it matters.
        </p>
      </div>

      {/* Info Note */}
      <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
        <p className="text-xs text-amber-700 dark:text-amber-300 text-center">
          💡 This is a one-time conversation. After you clarify your problem, you can edit it freely.
        </p>
      </div>
    </motion.div>
  );
};
