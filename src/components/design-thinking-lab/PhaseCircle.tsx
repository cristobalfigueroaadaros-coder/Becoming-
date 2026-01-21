import React from 'react';
import { motion } from 'framer-motion';
import { PhaseType, PhaseContentData, ProjectInfo } from './types';
import { PHASE_ORDER, PHASE_CONFIG } from './constants';
import { PhaseSegment } from './PhaseSegment';
import { ProjectThreadCenter } from './ProjectThreadCenter';

interface PhaseCircleProps {
  selectedPhase: PhaseType | null;
  hoveredPhase: PhaseType | null;
  phaseContent: Record<PhaseType, PhaseContentData>;
  projectInfo: ProjectInfo | null;
  latestSnapshot?: string;
  highlightedPhase?: PhaseType | null; // PDR 3: For notification cascade
  onSelectPhase: (phase: PhaseType) => void;
  onHoverPhase: (phase: PhaseType | null) => void;
  onOpenThread: () => void;
}

export const PhaseCircle: React.FC<PhaseCircleProps> = ({
  selectedPhase,
  hoveredPhase,
  phaseContent,
  projectInfo,
  latestSnapshot,
  highlightedPhase,
  onSelectPhase,
  onHoverPhase,
  onOpenThread,
}) => {
  // Calculate positions for phases in a circle
  const radius = 120; // Distance from center
  const centerX = 180;
  const centerY = 180;

  const getPhasePosition = (index: number) => {
    // Start from top (-90 degrees) and go clockwise
    const angle = -90 + (index * 72); // 360/5 = 72 degrees between phases
    const radians = (angle * Math.PI) / 180;
    return {
      x: centerX + radius * Math.cos(radians),
      y: centerY + radius * Math.sin(radians),
    };
  };

  const hasContent = (phase: PhaseType) => {
    const content = phaseContent[phase];
    return content.notes.length > 0 || 
           content.autoPopulatedItems.length > 0 || 
           !!content.reflectionResponse;
  };

  return (
    <div className="relative w-[360px] h-[360px] mx-auto">
      {/* Connecting lines (subtle) */}
      <svg 
        className="absolute inset-0 pointer-events-none" 
        viewBox="0 0 360 360"
      >
        <defs>
          <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--muted))" stopOpacity="0.3" />
            <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.2" />
            <stop offset="100%" stopColor="hsl(var(--muted))" stopOpacity="0.3" />
          </linearGradient>
        </defs>
        
        {/* Circle connecting all phases */}
        <circle
          cx={centerX}
          cy={centerY}
          r={radius}
          fill="none"
          stroke="url(#connectionGradient)"
          strokeWidth="1"
          strokeDasharray="4 4"
        />
      </svg>

      {/* Phase segments */}
      {PHASE_ORDER.map((phase, index) => {
        const position = getPhasePosition(index);
        const angle = -90 + (index * 72);
        
        return (
          <PhaseSegment
            key={phase}
            phase={phase}
            isSelected={selectedPhase === phase}
            isHovered={hoveredPhase === phase}
            hasContent={hasContent(phase)}
            isHighlighted={highlightedPhase === phase}
            onClick={() => onSelectPhase(phase)}
            onHover={(hovered) => onHoverPhase(hovered ? phase : null)}
            position={position}
            angle={angle}
          />
        );
      })}

      {/* Center - Project Thread */}
      <ProjectThreadCenter
        projectInfo={projectInfo}
        latestSnapshot={latestSnapshot}
        onOpenThread={onOpenThread}
      />
    </div>
  );
};
