import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Palette, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PhaseType } from './types';
import { PhaseCircle } from './PhaseCircle';
import { PhaseContent } from './PhaseContent';
import { ProjectThreadExpanded } from './ProjectThreadExpanded';
import { useDesignThinkingLab } from '@/hooks/useDesignThinkingLab';

interface DesignThinkingLabProps {
  projectId: string;
  needsProblemClarification?: boolean; // PDR 3
}

export const DesignThinkingLab: React.FC<DesignThinkingLabProps> = ({ projectId, needsProblemClarification = false }) => {
  const [selectedPhase, setSelectedPhase] = useState<PhaseType | null>(null);
  const [hoveredPhase, setHoveredPhase] = useState<PhaseType | null>(null);
  const [showThread, setShowThread] = useState(false);

  const {
    phaseContent,
    projectInfo,
    evolutionTimeline,
    keyLearnings,
    beforeNow,
    loading,
    addNoteToPhase,
    updateReflection,
    addMilestone,
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

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50 overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Palette className="w-5 h-5 text-primary" />
          Design Thinking Lab
        </CardTitle>
      </CardHeader>
      
      <CardContent className="relative min-h-[420px]">
        <AnimatePresence mode="wait">
          {/* Default View - Phase Circle */}
          {!selectedPhase && !showThread && (
            <motion.div
              key="circle"
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
              
              {/* Hint text */}
              <p className="text-xs text-muted-foreground text-center mt-4">
                Click a phase to explore, or tap the center to view your project thread
              </p>
            </motion.div>
          )}

          {/* Phase Content View */}
          {selectedPhase && !showThread && (
            <PhaseContent
              key={`phase-${selectedPhase}`}
              phase={selectedPhase}
              content={phaseContent[selectedPhase]}
              onClose={() => setSelectedPhase(null)}
              onAddNote={(note) => addNoteToPhase(selectedPhase, note)}
              onUpdateReflection={(response) => updateReflection(selectedPhase, response)}
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
