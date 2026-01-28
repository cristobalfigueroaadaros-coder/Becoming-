import { motion } from "framer-motion";
import { Check } from "lucide-react";

interface TransmutationNodeProps {
  id: string;
  label: string;
  content: string | null;
  phase: 'black' | 'white' | 'gold';
  x: number;
  y: number;
  size: number;
  isCenter?: boolean;
  isCompleted?: boolean;
  isOptional?: boolean;
  onClick: () => void;
  delay?: number;
}

const getPhaseColors = (phase: 'black' | 'white' | 'gold', hasContent: boolean, isCompleted: boolean) => {
  if (isCompleted) {
    return {
      fill: 'url(#goldGradientComplete)',
      stroke: '#f59e0b',
      glow: 'rgba(245, 158, 11, 0.6)',
      text: '#fef3c7',
    };
  }

  switch (phase) {
    case 'black':
      return {
        fill: hasContent ? '#334155' : '#1e293b',
        stroke: hasContent ? '#64748b' : '#475569',
        glow: hasContent ? 'rgba(100, 116, 139, 0.4)' : 'rgba(71, 85, 105, 0.2)',
        text: '#e2e8f0',
      };
    case 'white':
      return {
        fill: hasContent ? '#f1f5f9' : '#e2e8f0',
        stroke: hasContent ? '#94a3b8' : '#cbd5e1',
        glow: hasContent ? 'rgba(148, 163, 184, 0.4)' : 'rgba(203, 213, 225, 0.2)',
        text: '#1e293b',
      };
    case 'gold':
      return {
        fill: hasContent ? 'url(#goldGradient)' : '#fef3c7',
        stroke: hasContent ? '#f59e0b' : '#fcd34d',
        glow: hasContent ? 'rgba(245, 158, 11, 0.5)' : 'rgba(252, 211, 77, 0.2)',
        text: hasContent ? '#78350f' : '#92400e',
      };
  }
};

export const TransmutationNode = ({
  id,
  label,
  content,
  phase,
  x,
  y,
  size,
  isCenter = false,
  isCompleted = false,
  isOptional = false,
  onClick,
  delay = 0,
}: TransmutationNodeProps) => {
  const hasContent = !!content;
  const colors = getPhaseColors(phase, hasContent, isCompleted);
  const radius = size / 2;

  return (
    <motion.g
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.3, type: "spring" }}
      style={{ cursor: "pointer" }}
      onClick={onClick}
    >
      {/* Glow effect */}
      <circle
        cx={x}
        cy={y}
        r={radius + 8}
        fill="none"
        stroke={colors.glow}
        strokeWidth={hasContent ? 4 : 2}
        opacity={hasContent ? 0.8 : 0.3}
      />
      
      {/* Main node */}
      <circle
        cx={x}
        cy={y}
        r={radius}
        fill={colors.fill}
        stroke={colors.stroke}
        strokeWidth={isCenter ? 3 : 2}
        strokeDasharray={isOptional && !hasContent ? "4 4" : "none"}
      />
      
      {/* Completion check */}
      {hasContent && !isCenter && (
        <motion.g
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
        >
          <circle
            cx={x + radius - 8}
            cy={y - radius + 8}
            r={8}
            fill={isCompleted ? "#10b981" : colors.stroke}
          />
          <Check
            x={x + radius - 13}
            y={y - radius + 3}
            width={10}
            height={10}
            color="white"
          />
        </motion.g>
      )}
      
      {/* Label */}
      <text
        x={x}
        y={hasContent ? y - 4 : y}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={colors.text}
        fontSize={isCenter ? 12 : 10}
        fontWeight={isCenter ? 600 : 500}
        className="pointer-events-none select-none"
      >
        {label}
      </text>
      
      {/* Content preview or placeholder */}
      <text
        x={x}
        y={y + 12}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={colors.text}
        fontSize={8}
        opacity={hasContent ? 0.9 : 0.5}
        className="pointer-events-none select-none"
      >
        {hasContent 
          ? (content.length > 20 ? content.substring(0, 18) + "..." : content)
          : (isOptional ? "Optional" : "Tap to add")
        }
      </text>
    </motion.g>
  );
};
