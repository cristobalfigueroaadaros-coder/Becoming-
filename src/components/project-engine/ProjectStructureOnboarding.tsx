import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Layers, Zap, Users } from "lucide-react";

const STORAGE_KEY = "project_structure_onboarded";

const STEPS = [
  {
    icon: Layers,
    label: "Blocks",
    title: "This is your project structure",
    body: "Break your project into blocks.\nEach block is a major area to work through,\nlike Marketing, Product, or Revenue.",
  },
  {
    icon: Zap,
    label: "Focus",
    title: "Follow the focus",
    body: "The highlighted block shows where to start.\nWork through them one at a time\nas you build your project forward.",
  },
  {
    icon: Users,
    label: "Council",
    title: "Your council is inside each block",
    body: "Tap any block to go deeper.\nDefine activities and ask your council\nto help you think through each one.",
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

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    onDone();
  };

  const advance = () => {
    if (isLast) {
      dismiss();
    } else {
      setStep(s => s + 1);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/90 backdrop-blur-sm px-6"
      onClick={advance}
    >
      {/* Step icons row */}
      <div className="flex items-center gap-6 mb-10">
        {STEPS.map((s, i) => {
          const SIcon = s.icon;
          const isActive = i === step;
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: isActive ? 1 : 0.3, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="flex flex-col items-center gap-1.5"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${isActive ? "bg-primary/20" : "bg-muted"}`}>
                <SIcon className={`w-6 h-6 transition-colors ${isActive ? "text-primary" : "text-muted-foreground"}`} />
              </div>
              <span className={`text-[11px] font-medium transition-colors ${isActive ? "text-foreground" : "text-muted-foreground/50"}`}>{s.label}</span>
            </motion.div>
          );
        })}
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
          className="max-w-xs mx-auto text-center"
        >
          <p className="text-base font-semibold text-foreground mb-3">{current.title}</p>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{current.body}</p>
        </motion.div>
      </AnimatePresence>

      {/* Dots + CTA */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-10 flex flex-col items-center gap-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex gap-1.5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`rounded-full transition-all duration-300 ${i === step ? "w-4 h-1.5 bg-primary" : "w-1.5 h-1.5 bg-primary/25"}`}
            />
          ))}
        </div>
        <button
          onClick={advance}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {isLast ? "Got it, let's build" : "Tap anywhere to continue"}
        </button>
      </motion.div>
    </motion.div>
  );
}

export function useProjectStructureOnboarding() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    if (seen) return;
    const timer = setTimeout(() => setShow(true), 4000);
    return () => clearTimeout(timer);
  }, []);

  return { show, dismiss: () => { localStorage.setItem(STORAGE_KEY, "1"); setShow(false); } };
}
