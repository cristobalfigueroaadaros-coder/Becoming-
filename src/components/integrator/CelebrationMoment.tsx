import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { Sparkles, Star, Zap, Heart } from "lucide-react";

interface CelebrationMomentProps {
  xpEarned: number;
  onDismiss: () => void;
}

const CELEBRATION_MESSAGES = [
  "Nice work. Progress unlocked.",
  "That moved you forward.",
  "You showed up today.",
  "You're building momentum.",
  "One step closer.",
  "That's how it's done.",
  "You took action.",
  "Real progress made.",
];

const CELEBRATION_ICONS = [Sparkles, Star, Zap, Heart];

export function CelebrationMoment({ xpEarned, onDismiss }: CelebrationMomentProps) {
  const [message] = useState(() => 
    CELEBRATION_MESSAGES[Math.floor(Math.random() * CELEBRATION_MESSAGES.length)]
  );
  const [IconComponent] = useState(() => 
    CELEBRATION_ICONS[Math.floor(Math.random() * CELEBRATION_ICONS.length)]
  );

  useEffect(() => {
    // Trigger confetti
    const duration = 2000;
    const end = Date.now() + duration;

    const colors = ['#8B5CF6', '#10B981', '#F59E0B', '#EC4899'];

    const frame = () => {
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors
      });
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();

    // Auto-dismiss after 3 seconds
    const timer = setTimeout(() => {
      onDismiss();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: -20 }}
        className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
      >
        <motion.div
          className="bg-background/95 backdrop-blur-md border-2 border-primary/30 rounded-2xl p-8 shadow-2xl text-center max-w-sm mx-4 pointer-events-auto"
          animate={{
            boxShadow: [
              '0 0 0 0 rgba(139, 92, 246, 0)',
              '0 0 30px 10px rgba(139, 92, 246, 0.3)',
              '0 0 0 0 rgba(139, 92, 246, 0)',
            ]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {/* Icon with glow effect */}
          <motion.div
            className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center"
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <IconComponent className="w-10 h-10 text-primary" />
          </motion.div>

          {/* Message */}
          <motion.h3
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl font-semibold mb-2"
          >
            {message}
          </motion.h3>

          {/* XP Display */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/20 to-amber-500/20 border border-primary/30"
          >
            <Zap className="w-5 h-5 text-amber-500" />
            <span className="text-lg font-bold text-primary">+{xpEarned} XP</span>
          </motion.div>

          {/* Progress hint */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-sm text-muted-foreground mt-4"
          >
            Tap anywhere to continue
          </motion.p>
        </motion.div>

        {/* Click overlay to dismiss */}
        <div 
          className="absolute inset-0 pointer-events-auto"
          onClick={onDismiss}
        />
      </motion.div>
    </AnimatePresence>
  );
}
