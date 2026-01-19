import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, Sparkles, GitBranch, Lightbulb, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ProjectInfo, EvolutionMilestone, PhaseType } from './types';
import { PHASE_CONFIG, PHASE_ORDER } from './constants';
import { format } from 'date-fns';

interface ProjectThreadExpandedProps {
  projectInfo: ProjectInfo;
  timeline: EvolutionMilestone[];
  keyLearnings: string[];
  beforeNow: { before: string; now: string } | null;
  onClose: () => void;
  onAddMilestone: (title: string, explanation: string, phase?: PhaseType) => Promise<void>;
  onJumpToPhase: (phase: PhaseType) => void;
}

export const ProjectThreadExpanded: React.FC<ProjectThreadExpandedProps> = ({
  projectInfo,
  timeline,
  keyLearnings,
  beforeNow,
  onClose,
  onAddMilestone,
  onJumpToPhase,
}) => {
  const [showAddMilestone, setShowAddMilestone] = useState(false);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [newMilestoneExplanation, setNewMilestoneExplanation] = useState('');
  const [newMilestonePhase, setNewMilestonePhase] = useState<PhaseType | ''>('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddMilestone = async () => {
    if (!newMilestoneTitle.trim()) return;
    setIsAdding(true);
    await onAddMilestone(
      newMilestoneTitle.trim(),
      newMilestoneExplanation.trim(),
      newMilestonePhase || undefined
    );
    setNewMilestoneTitle('');
    setNewMilestoneExplanation('');
    setNewMilestonePhase('');
    setShowAddMilestone(false);
    setIsAdding(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="absolute inset-0 z-30 bg-background/98 backdrop-blur-lg rounded-2xl border border-border overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">{projectInfo.title}</h2>
            <p className="text-xs text-muted-foreground">Project Thread</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      <ScrollArea className="h-[calc(100%-64px)]">
        <div className="p-4 space-y-6">
          {/* Latest Snapshot */}
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
            <h3 className="text-sm font-medium text-primary mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Latest Snapshot
            </h3>
            <p className="text-sm text-foreground">
              {projectInfo.currentFocus || projectInfo.description}
            </p>
          </div>

          {/* Timeline of Evolution */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                <GitBranch className="w-4 h-4" />
                Timeline of Evolution
              </h3>
              <Dialog open={showAddMilestone} onOpenChange={setShowAddMilestone}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1">
                    <Plus className="w-3 h-3" />
                    Mark Turning Point
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Mark a Turning Point</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <Input
                      placeholder="What changed? (e.g., 'Problem clarified')"
                      value={newMilestoneTitle}
                      onChange={(e) => setNewMilestoneTitle(e.target.value)}
                    />
                    <Textarea
                      placeholder="Why does this matter?"
                      value={newMilestoneExplanation}
                      onChange={(e) => setNewMilestoneExplanation(e.target.value)}
                      className="min-h-[80px]"
                    />
                    <Select 
                      value={newMilestonePhase} 
                      onValueChange={(v) => setNewMilestonePhase(v as PhaseType)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Related phase (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {PHASE_ORDER.map((phase) => (
                          <SelectItem key={phase} value={phase}>
                            {phase.charAt(0).toUpperCase() + phase.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button 
                      className="w-full" 
                      onClick={handleAddMilestone}
                      disabled={isAdding || !newMilestoneTitle.trim()}
                    >
                      {isAdding ? 'Adding...' : 'Add Milestone'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {timeline.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No milestones yet. Mark your first turning point above.
              </p>
            ) : (
              <div className="space-y-3">
                {timeline.map((milestone, index) => (
                  <motion.div
                    key={milestone.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="relative pl-6 pb-4 border-l-2 border-muted last:border-l-0 last:pb-0"
                  >
                    <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-primary" />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">
                          {milestone.title}
                        </span>
                        {milestone.relatedPhase && (
                          <Badge 
                            variant="outline" 
                            className="text-xs cursor-pointer"
                            style={{ 
                              borderColor: PHASE_CONFIG[milestone.relatedPhase].borderColor,
                              color: PHASE_CONFIG[milestone.relatedPhase].color,
                            }}
                            onClick={() => onJumpToPhase(milestone.relatedPhase!)}
                          >
                            {milestone.relatedPhase}
                          </Badge>
                        )}
                      </div>
                      {milestone.explanation && (
                        <p className="text-xs text-muted-foreground">
                          {milestone.explanation}
                        </p>
                      )}
                      <p className="text-[10px] text-muted-foreground/60">
                        {format(new Date(milestone.date), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Key Learnings */}
          {keyLearnings.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                <Lightbulb className="w-4 h-4" />
                Key Learnings
              </h3>
              <div className="space-y-2">
                {keyLearnings.map((learning, index) => (
                  <div 
                    key={index}
                    className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20"
                  >
                    <p className="text-sm text-foreground">{learning}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Before / Now Comparison */}
          {beforeNow && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-foreground">Before / Now</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                    Before
                  </p>
                  <p className="text-xs text-foreground/70">{beforeNow.before}</p>
                </div>
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <p className="text-[10px] uppercase tracking-wider text-primary mb-2">
                    Now
                  </p>
                  <p className="text-xs text-foreground">{beforeNow.now}</p>
                </div>
              </div>
            </div>
          )}

          {/* Quick Jump to Phases */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-foreground">Jump to Phase</h3>
            <div className="flex flex-wrap gap-2">
              {PHASE_ORDER.map((phase) => {
                const config = PHASE_CONFIG[phase];
                return (
                  <Button
                    key={phase}
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    style={{ 
                      borderColor: config.borderColor,
                      color: config.color,
                    }}
                    onClick={() => onJumpToPhase(phase)}
                  >
                    <config.icon className="w-3 h-3" />
                    {phase.charAt(0).toUpperCase() + phase.slice(1)}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      </ScrollArea>
    </motion.div>
  );
};
