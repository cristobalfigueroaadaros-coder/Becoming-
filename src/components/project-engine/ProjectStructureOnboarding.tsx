import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Layers, ArrowRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "project_structure_onboarded";

const STEPS = [
  {
    icon: Layers,
    title: "Your project, broken into blocks",
    body: "Each block is a major part of your project — like Marketing, Product, or Revenue. Tap any block to go deeper.",
  },
  {
    icon: Zap,
    title: "Follow the focus",
    body: "The highlighted block is where you should be right now. Move through them one by one as you build.",
  },
  {
    icon: ArrowRight,
    title: "Add activities inside each block",
    body: "Inside each block you'll define the actions that move it forward. Your council can help you fill them in.",
  },
];

interface Props {
  onDone: () => void;
}

export function ProjectStructureOnboarding({ onDone }: Props) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const Icon = current.icon;

  const advance = () => {
    if (isLast) {
      localStorage.setItem(STORAGE_KEY, "1");
      onDone();
    } else {
      setStep(s => s + 1);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
      className="rounded-xl border border-primary/30 bg-primary/5 p-5 space-y-4 relative"
    >
      <button
        onClick={() => { localStorage.setItem(STORAGE_KEY, "1"); onDone(); }}
        className="absolute top-3 right-3 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
      >
        <X className="w-4 h-4" />
      </button>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
          className="space-y-3"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
              <Icon className="w-4 h-4 text-primary" />
            </div>
            <p className="text-sm font-semibold text-foreground">{current.title}</p>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{current.body}</p>
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                i === step ? "bg-primary" : "bg-primary/25"
              }`}
            />
          ))}
        </div>
        <Button size="sm" onClick={advance} className="gap-1.5 h-8 text-xs">
          {isLast ? "Got it" : "Next"}
          {!isLast && <ArrowRight className="w-3 h-3" />}
        </Button>
      </div>
    </motion.div>
  );
}

export function useProjectStructureOnboarding() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen) setShow(true);
  }, []);

  return { show, dismiss: () => setShow(false) };
}
