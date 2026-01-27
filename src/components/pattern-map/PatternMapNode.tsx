import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

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
  
  return (
    <motion.g
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, type: "spring", stiffness: 200 }}
      onClick={onClick}
      className="cursor-pointer"
      style={{ transformOrigin: `${x}px ${y}px` }}
    >
      {/* Glow effect for center node */}
      {isCenter && (
        <circle
          cx={x}
          cy={y}
          r={size + 8}
          className="fill-indigo-500/20"
          filter="blur(8px)"
        />
      )}
      
      {/* Main circle */}
      <circle
        cx={x}
        cy={y}
        r={size}
        className={cn(
          "transition-all duration-300",
          isCenter 
            ? "fill-indigo-600 stroke-indigo-400 stroke-2" 
            : hasContent
              ? "fill-purple-500/80 stroke-purple-400 stroke-1 hover:fill-purple-400"
              : "fill-muted/50 stroke-muted-foreground/30 stroke-1 stroke-dashed hover:fill-muted"
        )}
      />
      
      {/* Inner highlight for center */}
      {isCenter && (
        <circle
          cx={x}
          cy={y}
          r={size - 4}
          className="fill-none stroke-indigo-300/50 stroke-1"
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
            <p className="text-xs sm:text-sm font-bold text-white text-center leading-tight px-1">
              {content || label}
            </p>
          </div>
        </foreignObject>
      ) : (
        <>
          {/* Node label */}
          <foreignObject
            x={x - 50}
            y={y + size + 6}
            width={100}
            height={40}
            className="overflow-visible pointer-events-none"
          >
            <div className="w-full flex flex-col items-center">
              <p className="text-xs font-medium text-muted-foreground text-center">
                {label}
              </p>
              {hasContent ? (
                <p className="text-xs text-foreground text-center truncate max-w-[90px]">
                  {content}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground/60 italic text-center">
                  Tap to explore
                </p>
              )}
            </div>
          </foreignObject>
        </>
      )}
    </motion.g>
  );
};
