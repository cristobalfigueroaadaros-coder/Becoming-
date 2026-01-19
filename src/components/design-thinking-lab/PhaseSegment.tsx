import React from 'react';
import { motion } from 'framer-motion';
import { PhaseType } from './types';
import { PHASE_CONFIG } from './constants';

interface PhaseSegmentProps {
  phase: PhaseType;
  isSelected: boolean;
  isHovered: boolean;
  hasContent: boolean;
  onClick: () => void;
  onHover: (hovered: boolean) => void;
  position: { x: number; y: number };
  angle: number;
}

export const PhaseSegment: React.FC<PhaseSegmentProps> = ({
  phase,
  isSelected,
  isHovered,
  hasContent,
  onClick,
  onHover,
  position,
  angle,
}) => {
  const config = PHASE_CONFIG[phase];
  const Icon = config.icon;
  
  const scale = isSelected ? 1.15 : isHovered ? 1.08 : 1;
  const opacity = isSelected ? 1 : 0.85;

  return (
    <motion.div
      className="absolute cursor-pointer"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -50%)',
      }}
      animate={{
        scale,
        opacity,
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      onClick={onClick}
    >
      <motion.div
        className="relative flex flex-col items-center justify-center rounded-2xl p-4 backdrop-blur-sm"
        style={{
          background: config.bgColor,
          border: `2px solid ${config.borderColor}`,
          minWidth: '80px',
          minHeight: '80px',
          boxShadow: isSelected 
            ? `0 8px 32px ${config.color.replace(')', ', 0.4)')}` 
            : isHovered 
              ? `0 4px 16px ${config.color.replace(')', ', 0.3)')}`
              : 'none',
        }}
        whileHover={{ y: -2 }}
      >
        {/* Content indicator */}
        {hasContent && (
          <div 
            className="absolute -top-1 -right-1 w-3 h-3 rounded-full"
            style={{ background: config.color }}
          />
        )}
        
        <Icon 
          className="w-6 h-6 mb-1" 
          style={{ color: config.color }} 
        />
        <span 
          className="text-xs font-medium capitalize text-center"
          style={{ color: config.color }}
        >
          {phase}
        </span>
      </motion.div>
    </motion.div>
  );
};
