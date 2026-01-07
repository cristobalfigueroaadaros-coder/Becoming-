import { motion } from "framer-motion";

interface NeuralDotProps {
  id: string;
  x: number;
  y: number;
  size: number;
  color: string;
  label: string;
  isInteractive?: boolean;
  onClick?: () => void;
  delay?: number;
}

export const NeuralDot = ({ 
  id, 
  x, 
  y, 
  size, 
  color, 
  label,
  isInteractive = true,
  onClick,
  delay = 0,
}: NeuralDotProps) => {
  return (
    <motion.g
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay, duration: 0.3, ease: "easeOut" }}
    >
      {/* Glow effect */}
      <circle
        cx={x}
        cy={y}
        r={size + 4}
        fill={color}
        opacity={0.2}
        filter="blur(4px)"
      />
      
      {/* Main dot */}
      <circle
        cx={x}
        cy={y}
        r={size}
        fill={color}
        stroke="hsl(var(--background))"
        strokeWidth={2}
        className={isInteractive ? "cursor-pointer hover:opacity-80 transition-opacity" : ""}
        onClick={isInteractive ? onClick : undefined}
      />
      
      {/* Inner highlight */}
      <circle
        cx={x - size * 0.25}
        cy={y - size * 0.25}
        r={size * 0.3}
        fill="white"
        opacity={0.3}
      />
    </motion.g>
  );
};

interface NeuralConnectionProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  type: 'neural' | 'bridge' | 'cluster';
  delay?: number;
}

export const NeuralConnection = ({ 
  x1, y1, x2, y2, color, type, delay = 0 
}: NeuralConnectionProps) => {
  // Calculate control points for bezier curve
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  
  // Perpendicular offset for curve
  const curveOffset = type === 'bridge' ? 30 : 15;
  const controlX = midX + (dy / Math.sqrt(dx * dx + dy * dy || 1)) * curveOffset;
  const controlY = midY - (dx / Math.sqrt(dx * dx + dy * dy || 1)) * curveOffset;
  
  const path = `M ${x1} ${y1} Q ${controlX} ${controlY} ${x2} ${y2}`;
  
  const strokeWidth = type === 'bridge' ? 2 : type === 'cluster' ? 1 : 1.5;
  const opacity = type === 'bridge' ? 0.6 : type === 'cluster' ? 0.3 : 0.4;

  return (
    <motion.path
      d={path}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      opacity={opacity}
      strokeLinecap="round"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity }}
      transition={{ delay, duration: 0.5, ease: "easeOut" }}
    />
  );
};
