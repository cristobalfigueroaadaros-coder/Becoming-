import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Compass, Users, FlaskConical, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AtlasOnboardingOverlayProps {
  onComplete: () => void;
}

const SECTIONS = [
  {
    icon: Compass,
    label: "Atlas",
    color: "hsl(var(--primary))",
  },
  {
    icon: Users,
    label: "Chats",
    color: "hsl(var(--primary))",
  },
  {
    icon: FlaskConical,
    label: "Projects",
    color: "hsl(var(--primary))",
  },
  {
    icon: Globe,
    label: "Creators",
    color: "hsl(var(--primary))",
  },
];

const SCREEN_CONTENT = [
  {
    title: "This is your Atlas",
    description: "A map of who you are. Every quest you answer adds a discovery. Over time, patterns emerge — and you start seeing yourself more clearly.",
  },
  {
    title: "This is your Chat space",
    description: "Where you reflect, get challenged, and go deeper. Your Future Self and mentors live here — ready to help you think through what matters.",
  },
  {
    title: "These are your Projects",
    description: "Where ideas become real. Once you know what drives you, this is where you build it — step by step, with guidance.",
  },
  {
    title: "This is the Creators wall",
    description: "People like you, building things that matter. Share what you're working on, get inspired, and find others on a similar path.",
  },
  {
    title: "You're not here to consume content.",
    description: "You're here to discover who you are, what you carry, and what you're meant to build. Every answer you give becomes a piece of your map. Let's start.",
  },
];

export const AtlasOnboardingOverlay = ({ onComplete }: AtlasOnboardingOverlayProps) => {
  const [currentStep, setCurrentStep] = useState(0);

  const isMission = currentStep === 4;
  const screen = SCREEN_CONTENT[currentStep];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/90 backdrop-blur-sm"
    >
      {/* Section icons row */}
      {!isMission && (
        <div className="flex items-center gap-6 mb-8">
          {SECTIONS.map((section, i) => {
            const Icon = section.icon;
            const isHighlighted = i === currentStep;
            return (
              <motion.div
                key={section.label}
                animate={{ opacity: isHighlighted ? 1 : 0.2, scale: isHighlighted ? 1.15 : 1 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col items-center gap-1.5"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{
                    backgroundColor: isHighlighted ? "hsl(var(--primary) / 0.15)" : "hsl(var(--muted))",
                  }}
                >
                  <Icon
                    className="w-6 h-6"
                    style={{ color: isHighlighted ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))" }}
                  />
                </div>
                <span
                  className="text-[11px] font-medium"
                  style={{ color: isHighlighted ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))" }}
                >
                  {section.label}
                </span>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Content card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: isMission ? 0.6 : 0.4 }}
          className="max-w-sm mx-auto px-6 text-center"
        >
          <h2 className="text-lg font-bold text-foreground mb-3">{screen.title}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{screen.description}</p>
        </motion.div>
      </AnimatePresence>

      {/* Progress + button */}
      <div className="mt-8 flex flex-col items-center gap-3">
        {!isMission && (
          <span className="text-[11px] text-muted-foreground">
            {currentStep + 1} of 4
          </span>
        )}
        <Button
          onClick={() => {
            if (isMission) {
              onComplete();
            } else {
              setCurrentStep((s) => s + 1);
            }
          }}
          className="rounded-full px-8"
          size="lg"
        >
          {isMission ? "Start Your First Quest" : "Next"}
        </Button>
      </div>
    </motion.div>
  );
};
