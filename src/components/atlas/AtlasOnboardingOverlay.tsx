import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Compass, Users, FlaskConical, Globe, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AtlasOnboardingOverlayProps {
  onComplete: () => void;
}

const SECTIONS = [
  {
    icon: Compass,
    label: "Atlas",
    text: "Everything starts here.\n\nYou answer simple quests and the system begins to understand who you are.\n\nYour strengths, your patterns, your direction.",
  },
  {
    icon: Users,
    label: "Chats",
    text: "Chats is where your mentors meet you.\n\nThey use what your Atlas reveals to help you reflect, clarify, and move with more awareness.",
  },
  {
    icon: FlaskConical,
    label: "Projects",
    text: "Projects is where reflection becomes movement.\n\nYour ideas, experiments, and next steps get shaped into something you can actually build.",
  },
  {
    icon: Globe,
    label: "Creators",
    text: "Creators is where you remember you are not doing this alone.\n\nYou can see other builders, connect, and grow around people who are also becoming.",
  },
];

export const AtlasOnboardingOverlay = ({ onComplete }: AtlasOnboardingOverlayProps) => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('atlas-onboarding-step', { detail: { step } }));
  }, [step]);

  useEffect(() => {
    return () => {
      window.dispatchEvent(new CustomEvent('atlas-onboarding-step', { detail: { step: -1 } }));
    };
  }, [onComplete]);

  const currentSection = SECTIONS[step];
  const CurrentIcon = currentSection.icon;

  const handleNext = () => {
    if (step < SECTIONS.length - 1) {
      setStep(step + 1);
      return;
    }
    onComplete();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/90 backdrop-blur-sm"
    >
      <div className="flex items-center gap-6 mb-8">
        {SECTIONS.map((section, i) => {
          const Icon = section.icon;
          return (
            <motion.div
              key={section.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="flex flex-col items-center gap-1.5"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${i === step ? "bg-primary/20" : "bg-muted"}`}>
                <Icon className={`w-6 h-6 ${i === step ? "text-primary" : "text-muted-foreground"}`} />
              </div>
              <span className={`text-[11px] font-medium ${i === step ? "text-foreground" : "text-muted-foreground"}`}>{section.label}</span>
            </motion.div>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="max-w-sm mx-auto px-6 text-center"
      >
        <CurrentIcon className="w-5 h-5 text-primary mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-foreground mb-4">{currentSection.label}</h2>
        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
          {currentSection.text}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="mt-10"
      >
        <Button
          onClick={handleNext}
          size="lg"
          className="gap-2 px-8"
        >
          {step < SECTIONS.length - 1 ? "Next" : "Start first quest"}
          <ArrowRight className="w-4 h-4" />
        </Button>
      </motion.div>
    </motion.div>
  );
};
