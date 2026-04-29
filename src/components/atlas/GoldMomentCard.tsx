import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import confetti from "canvas-confetti";

interface Props {
  frustrationTitle: string;
  strengthTitle: string;
  superpowerName: string;
  transformationDescription: string;
  onContinue: () => void;
}

export const GoldMomentCard = ({
  frustrationTitle,
  strengthTitle,
  superpowerName,
  transformationDescription,
  onContinue,
}: Props) => {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    // Pause before revealing — let it feel like a discovery
    const revealTimer = setTimeout(() => {
      setRevealed(true);
    }, 1200);

    const confettiTimer = setTimeout(() => {
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.5 },
        colors: ["#f59e0b", "#fbbf24", "#d97706", "#fcd34d"],
      });
    }, 1800);

    return () => {
      clearTimeout(revealTimer);
      clearTimeout(confettiTimer);
    };
  }, []);

  return (
    <AnimatePresence>
      {revealed && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center text-center gap-6 px-6"
        >
          <motion.div
            animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, hsl(40 80% 55%), hsl(35 90% 65%))", boxShadow: "0 0 30px hsl(40 80% 55% / 0.4)" }}
          >
            <Crown className="w-8 h-8 text-white" />
          </motion.div>

          <div className="space-y-2">
            <p className="text-xs uppercase tracking-widest" style={{ color: "hsl(40 80% 55%)" }}>
              ✦ Gold Moment ✦
            </p>
            <h2 className="text-2xl font-bold text-foreground">{superpowerName}</h2>
          </div>

          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="px-3 py-1 rounded-full bg-muted">{frustrationTitle}</span>
            <ArrowRight className="w-4 h-4" style={{ color: "hsl(40 80% 55%)" }} />
            <span className="px-3 py-1 rounded-full bg-muted">{strengthTitle}</span>
          </div>

          <p className="text-sm text-muted-foreground max-w-sm leading-relaxed italic">
            {transformationDescription}
          </p>

          <Button onClick={onContinue} className="w-full max-w-xs gap-2" style={{ background: "linear-gradient(135deg, hsl(40 80% 55%), hsl(35 90% 50%))" }}>
            Continue <ArrowRight className="w-4 h-4" />
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
