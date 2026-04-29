import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface ConnectionLineProps {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  onDelete: () => void;
}

export function ConnectionLine({ id, x1, y1, x2, y2, color, onDelete }: ConnectionLineProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Calculate midpoint for delete button
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;

  // Create a curved path
  const dx = x2 - x1;
  const dy = y2 - y1;
  const curvature = Math.min(Math.abs(dx), Math.abs(dy)) * 0.3;
  
  const path = `M ${x1} ${y1} Q ${x1 + dx/2} ${y1 - curvature}, ${midX} ${midY} T ${x2} ${y2}`;

  return (
    <g 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="cursor-pointer pointer-events-auto"
    >
      {/* Invisible wider path for easier hovering */}
      <path
        d={path}
        stroke="transparent"
        strokeWidth="20"
        fill="none"
      />
      
      {/* Visible dashed line */}
      <path
        d={path}
        stroke={color}
        strokeWidth={isHovered ? 3 : 2}
        strokeDasharray="6 4"
        fill="none"
        className="transition-all duration-200"
        style={{ opacity: isHovered ? 1 : 0.7 }}
      />

      {/* Delete button at midpoint */}
      {isHovered && (
        <g onClick={onDelete}>
          <circle
            cx={midX}
            cy={midY}
            r="10"
            fill="hsl(var(--destructive))"
            className="cursor-pointer"
          />
          <text
            x={midX}
            y={midY}
            textAnchor="middle"
            dominantBaseline="central"
            fill="white"
            fontSize="12"
            fontWeight="bold"
            className="pointer-events-none"
          >
            ×
          </text>
        </g>
      )}
    </g>
  );
}
