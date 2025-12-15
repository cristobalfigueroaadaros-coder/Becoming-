import { motion } from "framer-motion";

interface DualProgressRingProps {
  completionProgress: number;
  learningProgress: number;
  completedSteps: number;
  stepsWithInsights: number;
  totalSteps: number;
}

export function DualProgressRing({
  completionProgress,
  learningProgress,
  completedSteps,
  stepsWithInsights,
  totalSteps
}: DualProgressRingProps) {
  const size = 100;
  const strokeWidth = 8;
  const outerRadius = (size - strokeWidth) / 2;
  const innerRadius = outerRadius - strokeWidth - 4;
  
  const outerCircumference = 2 * Math.PI * outerRadius;
  const innerCircumference = 2 * Math.PI * innerRadius;
  
  const outerOffset = outerCircumference - (completionProgress / 100) * outerCircumference;
  const innerOffset = innerCircumference - (learningProgress / 100) * innerCircumference;

  return (
    <div className="relative">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Outer ring (completion) - background */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={outerRadius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
        />
        {/* Outer ring (completion) - progress */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={outerRadius}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={outerCircumference}
          initial={{ strokeDashoffset: outerCircumference }}
          animate={{ strokeDashoffset: outerOffset }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
        
        {/* Inner ring (learning) - background */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={innerRadius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth - 2}
        />
        {/* Inner ring (learning) - progress */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={innerRadius}
          fill="none"
          stroke="hsl(var(--accent-foreground) / 0.7)"
          strokeWidth={strokeWidth - 2}
          strokeLinecap="round"
          strokeDasharray={innerCircumference}
          initial={{ strokeDashoffset: innerCircumference }}
          animate={{ strokeDashoffset: innerOffset }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
        />
      </svg>
      
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold">{Math.round(completionProgress)}%</span>
      </div>
      
      {/* Legend */}
      <div className="mt-2 space-y-1 text-xs text-center">
        <div className="flex items-center justify-center gap-1">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <span className="text-muted-foreground">{completedSteps}/{totalSteps} done</span>
        </div>
        <div className="flex items-center justify-center gap-1">
          <div className="w-2 h-2 rounded-full bg-accent-foreground/70" />
          <span className="text-muted-foreground">{stepsWithInsights} insights</span>
        </div>
      </div>
    </div>
  );
}
