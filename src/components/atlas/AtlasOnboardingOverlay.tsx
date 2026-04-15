import { useState, useEffect } from "react";
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
    title: "",
    description: "Everything starts here.\n\nYou answer simple quests\nand the system begins to understand who you are.\n\nYour strengths, your patterns, your direction.\n\nThe more you explore,\nthe more you will discover about yourself.",
  },
  {
    title: "",
    description: "Once we start seeing who you are... we guide you.\n\nYou will talk with your Future Self\nand build a personal council of mentors.\n\nThey will think with you,\nchallenge you,\nand help you move forward.",
  },
  {
    title: "",
    description: "This is where you take action.\n\nYou turn your ideas into something real.\n\nWith tools to help you build,\nstay accountable,\nand track your progress.\n\nThis is where things start to move.",
  },
  {
    title: "",
    description: "You are not alone.\n\nYou will connect with conscious creators\nwho are also building and evolving.\n\nPeople like you,\nworking to create meaningful impact in the world.",
  },
  {
    title: "",
    description: "You are not here by accident.\n\nYou have something unique.\nSomething that only you can build.\n\nBecoming exists to help you discover it\nand turn it into something real.\n\nThis is a process. It takes time.\nBut we believe that by crafting something meaningful\nwith our unique gifts,\nwe can create a positive impact\nand change the world together.",
  },
];

export const AtlasOnboardingOverlay = ({ onComplete }: AtlasOnboardingOverlayProps) => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('atlas-onboarding-step', { detail: { step: currentStep } }));
    return () => {
      window.dispatchEvent(new CustomEvent('atlas-onboarding-step', { detail: { step: -1 } }));
    };
  }, [currentStep]);

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
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{screen.description}</p>
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
