import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Palette, Loader2, Lock, CheckCircle2 } from 'lucide-react';
import { MicroGuide } from "@/components/MicroGuide";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { PhaseType } from './types';
import { PhaseCircle } from './PhaseCircle';
import { PhaseContent } from './PhaseContent';
import { ProjectThreadExpanded } from './ProjectThreadExpanded';
import { useDesignThinkingLab } from '@/hooks/useDesignThinkingLab';
import { useProblemClarificationStatus } from '@/hooks/useProblemClarificationStatus';

interface DesignThinkingLabProps {
  projectId: string;
  needsProblemClarification?: boolean;
}

export const DesignThinkingLab: React.FC<DesignThinkingLabProps> = ({ projectId, needsProblemClarification = false }) => {
  const [selectedPhase, setSelectedPhase] = useState<PhaseType | null>(null);
  const [hoveredPhase, setHoveredPhase] = useState<PhaseType | null>(null);
  const [showThread, setShowThread] = useState(false);

  const { needsClarification } = useProblemClarificationStatus();

  const {
    phaseContent,
    projectInfo,
    evolutionTimeline,
    keyLearnings,
    beforeNow,
    loading,
    iterations,
    currentIteration,
    addNoteToPhase,
    updateReflection,
    addMilestone,
    completeIteration,
    switchIteration,
  } = useDesignThinkingLab(projectId);

  const generateSnapshot = () => {
    if (evolutionTimeline.length > 0) {
      return evolutionTimeline[0].explanation || evolutionTimeline[0].title;
    }
    if (keyLearnings.length > 0) {
      return keyLearnings[0].text;
    }
    return undefined;
  };

  if (loading) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // Max iterations to show in tabs (completed + active + 2 locked ahead)
  const activeIterationNum = iterations.find(i => i.status === 'active')?.iterationNumber ?? 1;
  const maxTabsToShow = Math.max(activeIterationNum + 2, iterations.length + 2);
  const tabNumbers = Array.from({ length: maxTabsToShow }, (_, i) => i + 1);

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50 overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Palette className="w-5 h-5 text-primary" />
          Design Thinking Lab
          <MicroGuide
            guideKey="design_thinking"
            title="Design Thinking Lab"
            description={"A continuous refinement cycle: Define → Ideate → Prototype → Test → Empathize → Iterate.\n\nComplete the Iterate phase to finish one cycle and unlock the next iteration. Each iteration builds on the last."}
          />
        </CardTitle>
      </CardHeader>

      {/* Iteration tabs */}
      <div className="px-4 pb-2">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {tabNumbers.map((num) => {
            const iter = iterations.find(i => i.iterationNumber === num);
            const isCompleted = iter?.status === 'completed';
            const isActive = iter?.status === 'active';
            const isLocked = !iter;
            const isCurrent = num === currentIteration;

            return (
              <button
                key={num}
                disabled={isLocked}
                onClick={() => !isLocked && switchIteration(num)}
                className={cn(
                  "flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all",
                  isCurrent && !isLocked
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : isCompleted
                      ? "bg-muted text-muted-foreground hover:bg-muted/80 cursor-pointer"
                      : isActive && !isCurrent
                        ? "bg-muted/60 text-muted-foreground hover:bg-muted cursor-pointer"
                        : "bg-muted/30 text-muted-foreground/40 cursor-not-allowed"
                )}
              >
                {isCompleted && <CheckCircle2 className="w-3 h-3 text-green-500" />}
                {isLocked && <Lock className="w-3 h-3" />}
                {`Iteration ${num}`}
              </button>
            );
          })}
        </div>

        {/* Summary for completed iterations */}
        {currentIteration < activeIterationNum && (() => {
          const iter = iterations.find(i => i.iterationNumber === currentIteration);
          return iter?.summary ? (
            <div className="mt-2 p-3 rounded-lg bg-muted/40 border border-border/40">
              <p className="text-xs text-muted-foreground italic">{iter.summary}</p>
            </div>
          ) : null;
        })()}
      </div>

      <CardContent className="relative min-h-[420px]">
        <AnimatePresence mode="wait">
          {/* Default View - Phase Circle */}
          {!selectedPhase && !showThread && (
            <motion.div
              key={`circle-${currentIteration}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-4"
            >
              <PhaseCircle
                selectedPhase={selectedPhase}
                hoveredPhase={hoveredPhase}
                phaseContent={phaseContent}
                projectInfo={projectInfo}
                latestSnapshot={generateSnapshot()}
                highlightedPhase={needsProblemClarification ? 'define' : null}
                onSelectPhase={setSelectedPhase}
                onHoverPhase={setHoveredPhase}
                onOpenThread={() => setShowThread(true)}
              />

              <p className="text-xs text-muted-foreground text-center mt-4">
                Define → Ideate → Prototype → Test → Empathize → Iterate
              </p>
            </motion.div>
          )}

          {/* Phase Content View */}
          {selectedPhase && !showThread && (
            <PhaseContent
              key={`phase-${selectedPhase}-${currentIteration}`}
              phase={selectedPhase}
              content={phaseContent[selectedPhase]}
              needsProblemClarification={needsClarification && selectedPhase === 'define'}
              projectId={projectId}
              projectName={projectInfo?.title}
              isCurrentIterationActive={currentIteration === activeIterationNum}
              onClose={() => setSelectedPhase(null)}
              onAddNote={(note) => addNoteToPhase(selectedPhase, note)}
              onUpdateReflection={(response) => updateReflection(selectedPhase, response)}
              onCompleteIteration={selectedPhase === 'iterate' ? completeIteration : undefined}
            />
          )}

          {/* Project Thread Expanded View */}
          {showThread && projectInfo && (
            <ProjectThreadExpanded
              key="thread"
              projectInfo={projectInfo}
              timeline={evolutionTimeline}
              keyLearnings={keyLearnings}
              beforeNow={beforeNow}
              onClose={() => setShowThread(false)}
              onAddMilestone={addMilestone}
              onJumpToPhase={(phase) => {
                setShowThread(false);
                setSelectedPhase(phase);
              }}
            />
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};
