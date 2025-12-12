import { motion } from "framer-motion";
import { Check, Circle } from "lucide-react";

interface Phase {
  id: string;
  phase_name: string;
  phase_color: string;
  phase_description: string;
  order_index: number;
  start_day: number;
  end_day: number;
  completed_at: string | null;
}

interface IntegratorPhaseTimelineProps {
  phases: Phase[];
  currentDay: number;
  totalDays: number;
}

const PHASE_ICONS: Record<string, string> = {
  exploration: '🔍',
  validation: '✓',
  creation: '🔨',
  expression: '📢',
  reflection: '💭',
};

export function IntegratorPhaseTimeline({ phases, currentDay, totalDays }: IntegratorPhaseTimelineProps) {
  const sortedPhases = [...phases].sort((a, b) => a.order_index - b.order_index);

  const getPhaseStatus = (phase: Phase): 'completed' | 'active' | 'upcoming' => {
    if (phase.completed_at) return 'completed';
    if (currentDay >= phase.start_day && currentDay <= phase.end_day) return 'active';
    if (currentDay < phase.start_day) return 'upcoming';
    return 'completed';
  };

  const getPhaseProgress = (phase: Phase): number => {
    const status = getPhaseStatus(phase);
    if (status === 'completed') return 100;
    if (status === 'upcoming') return 0;
    
    const daysInPhase = phase.end_day - phase.start_day + 1;
    const daysCompleted = currentDay - phase.start_day;
    return Math.min(100, Math.max(0, (daysCompleted / daysInPhase) * 100));
  };

  return (
    <div className="w-full">
      {/* Overall progress bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-muted-foreground">Day {currentDay} of {totalDays}</span>
          <span className="text-muted-foreground">{Math.round((currentDay / totalDays) * 100)}% complete</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden flex">
          {sortedPhases.map((phase) => {
            const widthPercent = ((phase.end_day - phase.start_day + 1) / totalDays) * 100;
            const progress = getPhaseProgress(phase);
            
            return (
              <div
                key={phase.id}
                className="relative h-full"
                style={{ width: `${widthPercent}%` }}
              >
                <div 
                  className="absolute inset-0 opacity-30"
                  style={{ backgroundColor: phase.phase_color }}
                />
                <motion.div
                  className="h-full"
                  style={{ backgroundColor: phase.phase_color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Phase cards */}
      <div className="grid grid-cols-5 gap-2">
        {sortedPhases.map((phase, index) => {
          const status = getPhaseStatus(phase);
          
          return (
            <motion.div
              key={phase.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative p-3 rounded-lg border transition-all ${
                status === 'active' 
                  ? 'border-primary ring-2 ring-primary/20' 
                  : 'border-border'
              }`}
              style={{
                backgroundColor: status === 'active' || status === 'completed' 
                  ? `${phase.phase_color}40` 
                  : undefined
              }}
            >
              {/* Status indicator */}
              <div className="absolute -top-2 -right-2">
                {status === 'completed' && (
                  <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
                {status === 'active' && (
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center animate-pulse">
                    <Circle className="w-3 h-3 text-white fill-white" />
                  </div>
                )}
              </div>

              <div className="text-lg mb-1">{PHASE_ICONS[phase.phase_name] || '📍'}</div>
              <div className="font-medium text-sm capitalize">{phase.phase_name}</div>
              <div className="text-xs text-muted-foreground">
                Days {phase.start_day}-{phase.end_day}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
