import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Compass, Users, FlaskConical, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

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
    text: "Chats is where your mentors help you reflect, clarify, and turn your dots into meaning.\n\nWhen enough of your Atlas is alive, the right conversations open.",
  },
  {
    icon: FlaskConical,
    label: "Projects",
    text: "Projects is where your discoveries become structure.\n\nIdeas turn into blocks, activities, and next steps you can actually build.",
  },
  {
    icon: Globe,
    label: "Creators",
    text: "Creators is where you connect with other people building their own path.\n\nYou can share, discover, and find support as your map grows.",
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
  }, []);

  const activeSection = SECTIONS[step];
  const ActiveIcon = activeSection.icon;
  const isLastStep = step === SECTIONS.length - 1;

  const handleContinue = () => {
    if (isLastStep) {
      onComplete();
      return;
    }
    setStep((current) => current + 1);
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
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${i === step ? "bg-primary/20 shadow-[0_0_22px_hsl(265_90%_62%/0.45)]" : "bg-muted"}`}>
                <Icon className={`w-6 h-6 ${i === step ? "text-primary" : "text-muted-foreground"}`} />
              </div>
              <span className={`text-[11px] font-medium ${i === step ? "text-primary" : "text-muted-foreground"}`}>{section.label}</span>
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
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 shadow-[0_0_24px_hsl(265_90%_62%/0.35)]">
          <ActiveIcon className="h-7 w-7 text-primary" />
        </div>
        <h2 className="mb-3 text-2xl font-bold text-foreground">{activeSection.label}</h2>
        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
          {activeSection.text}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="mt-10"
      >
        <Button
          onClick={handleContinue}
          size="lg"
          className="gap-2 px-8"
        >
          {isLastStep ? "Start first quest" : "Continue"}
          <ArrowRight className="w-4 h-4" />
        </Button>
      </motion.div>
    </motion.div>
  );
};
