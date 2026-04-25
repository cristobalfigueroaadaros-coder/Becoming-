import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FoundersIntroModalProps {
  onNext: () => void;
}

export const FoundersIntroModal = ({ onNext }: FoundersIntroModalProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 26 }}
        className="relative w-full max-w-lg rounded-2xl border border-border/60 bg-card/95 p-6 sm:p-8 shadow-[0_0_60px_hsl(265_90%_62%/0.25)]"
      >
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">
            Founder's Atlas
          </span>
        </div>

        <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4">
          This is my map.
        </h2>

        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
          I left home at 22 with something in me I couldn't name. I cleaned floors in
          Germany, built a board game across years of construction days and late
          nights in Australia, broke my leg during COVID, missed the investment,
          asked God for a sign, and kept moving. Every dot that looked like a failure
          turned out to be exactly what came next. I built Becoming because I needed
          it. And I built it for you.
        </p>

        <p className="text-sm text-foreground/80 mt-4 italic">
          — Cris, founder of Becoming
        </p>

        <div className="mt-6 flex justify-end">
          <Button onClick={onNext} size="lg" className="gap-2">
            Next
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};