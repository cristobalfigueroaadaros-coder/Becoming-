import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import confetti from "canvas-confetti";

interface VoiceCelebrationMomentProps {
  onDismiss: () => void;
  customMessage?: string;
}

const CELEBRATION_MESSAGES = [
  "You clarified something important today. That's progress.",
  "You moved from stuck to moving. That's the work.",
  "Uncertainty → Action. That's how momentum builds.",
  "You didn't stay stuck. You asked for help. That's strength.",
  "One conversation. One insight. One step forward.",
  "You turned confusion into clarity. Well done.",
  "Movement is progress. You moved today.",
  "The fog lifted a little. That's enough for now.",
];

const ICONS = [Sparkles, CheckCircle2];

export const VoiceCelebrationMoment = ({ 
  onDismiss, 
  customMessage 
}: VoiceCelebrationMomentProps) => {
  const [message] = useState(() => 
    customMessage || CELEBRATION_MESSAGES[Math.floor(Math.random() * CELEBRATION_MESSAGES.length)]
  );
  const [Icon] = useState(() => ICONS[Math.floor(Math.random() * ICONS.length)]);

  useEffect(() => {
    // Subtle confetti burst
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['hsl(var(--primary))', 'hsl(var(--accent))', '#FFD700'],
    });

    // Auto-dismiss after 5 seconds
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
        onClick={onDismiss}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ 
            scale: 1, 
            opacity: 1, 
            y: 0,
            boxShadow: [
              '0 0 20px hsl(var(--primary) / 0.2)',
              '0 0 40px hsl(var(--primary) / 0.3)',
              '0 0 20px hsl(var(--primary) / 0.2)',
            ]
          }}
          transition={{ 
            type: "spring", 
            duration: 0.6,
            boxShadow: { repeat: Infinity, duration: 2 }
          }}
          exit={{ scale: 0.8, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-gradient-to-br from-card to-primary/5 rounded-2xl p-8 max-w-md w-full border border-primary/30 shadow-xl"
        >
          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center"
          >
            <Icon className="w-8 h-8 text-primary-foreground" />
          </motion.div>

          {/* Message */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center text-lg font-medium leading-relaxed mb-6"
          >
            {message}
          </motion.p>

          {/* Dismiss Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Button
              onClick={onDismiss}
              className="w-full gap-2"
              variant="outline"
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </Button>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
