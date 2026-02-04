import { motion } from "framer-motion";

interface PatternMapNodeProps {
  id: string;
  label: string;
  content: string | null;
  x: number;
  y: number;
  size: number;
  isCenter?: boolean;
  onClick: () => void;
  delay?: number;
}

export const PatternMapNode = ({
  id,
  label,
  content,
  x,
  y,
  size,
  isCenter = false,
  onClick,
  delay = 0,
}: PatternMapNodeProps) => {
  const hasContent = content && content.trim().length > 0;
  
  // Color schemes for better visibility
  const centerColors = {
    fill: 'hsl(280, 70%, 35%)',
    stroke: 'hsl(280, 80%, 65%)',
    glow: 'hsl(280, 80%, 60%)',
    text: 'hsl(0, 0%, 100%)',
  };
  
  const filledColors = {
    fill: 'hsl(270, 65%, 45%)',
    stroke: 'hsl(270, 75%, 65%)',
    glow: 'hsl(270, 70%, 55%)',
    text: 'hsl(0, 0%, 100%)',
  };
  
  const emptyColors = {
    fill: 'hsl(280, 20%, 25%)',
    stroke: 'hsl(280, 40%, 50%)',
    glow: 'hsl(280, 30%, 40%)',
    text: 'hsl(280, 30%, 70%)',
  };
  
  const colors = isCenter ? centerColors : hasContent ? filledColors : emptyColors;
  
  return (
    <motion.g
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, type: "spring", stiffness: 200 }}
      onClick={onClick}
      className="cursor-pointer"
      style={{ transformOrigin: `${x}px ${y}px` }}
    >
      {/* Glow effect for center and filled nodes */}
      {(isCenter || hasContent) && (
        <circle
          cx={x}
          cy={y}
          r={size + (isCenter ? 12 : 8)}
          fill={colors.glow}
          opacity={isCenter ? 0.4 : 0.25}
          filter="url(#glow)"
        />
      )}
      
      {/* Pulsing animation for empty nodes */}
      {!isCenter && !hasContent && (
        <motion.circle
          cx={x}
          cy={y}
          r={size + 4}
          fill="none"
          stroke={emptyColors.stroke}
          strokeWidth="1"
          opacity={0.5}
          animate={{ 
            r: [size + 4, size + 8, size + 4],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{ 
            duration: 2.5, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      )}
      
      {/* Main circle */}
      <circle
        cx={x}
        cy={y}
        r={size}
        fill={colors.fill}
        stroke={colors.stroke}
        strokeWidth={isCenter ? 3 : 2}
        strokeDasharray={!isCenter && !hasContent ? "4 4" : "none"}
      />
      
      {/* Inner highlight ring for center */}
      {isCenter && (
        <circle
          cx={x}
          cy={y}
          r={size - 6}
          fill="none"
          stroke="hsl(280, 70%, 75%)"
          strokeWidth="1"
          opacity="0.5"
        />
      )}
      
      {/* Label - positioned below for peripheral nodes, inside for center */}
      {isCenter ? (
        <foreignObject
          x={x - size + 8}
          y={y - size / 2}
          width={(size - 8) * 2}
          height={size}
          className="overflow-visible pointer-events-none"
        >
          <div className="w-full h-full flex items-center justify-center">
            <p 
              className="text-xs sm:text-sm font-bold text-center leading-tight px-1"
              style={{ color: colors.text }}
            >
              {content || label}
            </p>
          </div>
        </foreignObject>
      ) : (
        <foreignObject
          x={x - 55}
          y={y + size + 8}
          width={110}
          height={48}
          className="overflow-visible pointer-events-none"
        >
          <div className="w-full flex flex-col items-center">
            <p 
              className="text-xs font-semibold text-center"
              style={{ color: hasContent ? 'hsl(270, 60%, 80%)' : 'hsl(280, 30%, 60%)' }}
            >
              {label}
            </p>
            {hasContent ? (
              <p 
                className="text-xs text-center truncate max-w-[100px] mt-0.5"
                style={{ color: 'hsl(270, 50%, 90%)' }}
              >
                {content}
              </p>
            ) : (
              <p 
                className="text-[10px] italic text-center mt-0.5"
                style={{ color: 'hsl(280, 40%, 55%)' }}
              >
                Tap to explore
              </p>
            )}
          </div>
        </foreignObject>
      )}
    </motion.g>
  );
};
