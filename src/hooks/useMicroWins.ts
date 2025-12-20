import { useCallback } from "react";
import { toast } from "sonner";

// Subtle, emotional micro-win messages
const MICRO_WIN_MESSAGES: Record<string, string[]> = {
  insight: [
    "That just got clearer.",
    "This is taking shape.",
    "You're building momentum.",
    "Movement. That's all it takes.",
    "Small step, real progress.",
  ],
  naming: [
    "Now it has a name. Now it's real.",
    "Naming creates reality.",
    "This is beginning to matter.",
    "From thought to intention.",
  ],
  reflection: [
    "Depth brings clarity.",
    "You're seeing yourself more clearly.",
    "Awareness is the first step.",
    "That took courage.",
  ],
  valueMap: [
    "Another piece of your map.",
    "Your values are taking shape.",
    "This connects to who you are.",
    "Building your foundation.",
  ],
  focus: [
    "Focused attention. Real results.",
    "One step at a time.",
    "Progress happens in moments.",
    "You showed up. That matters.",
  ],
  general: [
    "That just got clearer.",
    "This is taking shape.",
    "You're building momentum.",
    "Small step, real progress.",
  ],
};

export type MicroWinType = 'insight' | 'naming' | 'reflection' | 'valueMap' | 'focus' | 'general';

export const useMicroWins = () => {
  const triggerMicroWin = useCallback((type: MicroWinType = 'general') => {
    const messages = MICRO_WIN_MESSAGES[type] || MICRO_WIN_MESSAGES.general;
    const message = messages[Math.floor(Math.random() * messages.length)];
    
    toast(message, {
      duration: 2500,
      icon: "✨",
      style: {
        background: 'hsl(var(--accent) / 0.1)',
        border: '1px solid hsl(var(--accent) / 0.2)',
        color: 'hsl(var(--foreground))',
      },
    });
  }, []);

  return { triggerMicroWin };
};