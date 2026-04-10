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
  highlightedPhase?: PhaseType | null;
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
  // 6 phases: 360/6 = 60° apart, radius increased to give space
  const radius = 138;
  const centerX = 190;
  const centerY = 190;
  const viewSize = 380;

  const getPhasePosition = (index: number) => {
    // Start from top (-90°), clockwise
    const angle = -90 + (index * 60);
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

  // Build SVG arrow path connecting all 6 phases in order (cycle)
  const phasePositions = PHASE_ORDER.map((_, i) => getPhasePosition(i));

  // Create the circular dashed path points
  const circlePathD = phasePositions.map((pos, i) =>
    i === 0 ? `M ${pos.x} ${pos.y}` : `L ${pos.x} ${pos.y}`
  ).join(' ') + ' Z';

  // Arrowhead marker id
  const arrowId = 'dt-arrow';

  return (
    <div className="relative mx-auto" style={{ width: viewSize, height: viewSize }}>
      <svg
        className="absolute inset-0 pointer-events-none"
        viewBox={`0 0 ${viewSize} ${viewSize}`}
      >
        <defs>
          <linearGradient id="cycleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.5" />
            <stop offset="50%" stopColor="hsl(174, 72%, 56%)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.5" />
          </linearGradient>
          <marker
            id={arrowId}
            markerWidth="6"
            markerHeight="6"
            refX="3"
            refY="3"
            orient="auto"
          >
            <path d="M0,0 L0,6 L6,3 z" fill="hsl(var(--primary))" opacity="0.5" />
          </marker>
        </defs>

        {/* Continuous cycle circle — solid enough to read as a loop */}
        <circle
          cx={centerX}
          cy={centerY}
          r={radius}
          fill="none"
          stroke="url(#cycleGradient)"
          strokeWidth="1.5"
          strokeDasharray="6 4"
        />

        {/* One directional arrow at top of circle to signal "this is a loop" */}
        {/* Arrow at ~-60° (between define and iterate, just before define) */}
        {(() => {
          const arrowAngle = -80; // degrees
          const radians = (arrowAngle * Math.PI) / 180;
          const ax = centerX + radius * Math.cos(radians);
          const ay = centerY + radius * Math.sin(radians);
          // Tangent direction (perpendicular to radius, clockwise = +90°)
          const tangentAngle = arrowAngle + 90;
          const tRad = (tangentAngle * Math.PI) / 180;
          const dx = Math.cos(tRad) * 14;
          const dy = Math.sin(tRad) * 14;
          return (
            <line
              x1={ax - dx / 2}
              y1={ay - dy / 2}
              x2={ax + dx / 2}
              y2={ay + dy / 2}
              stroke="hsl(var(--primary))"
              strokeWidth="1.5"
              strokeOpacity="0.6"
              markerEnd={`url(#${arrowId})`}
            />
          );
        })()}
      </svg>

      {/* Phase nodes */}
      {PHASE_ORDER.map((phase, index) => {
        const position = getPhasePosition(index);
        const angle = -90 + (index * 60);
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

      {/* Center — Project Thread, truly centered using explicit pixel positioning */}
      <ProjectThreadCenter
        projectInfo={projectInfo}
        latestSnapshot={latestSnapshot}
        onOpenThread={onOpenThread}
        centerX={centerX}
        centerY={centerY}
      />
    </div>
  );
};
