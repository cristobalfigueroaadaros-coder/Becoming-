import { useEffect } from "react";
import { motion } from "framer-motion";
import { Compass, Users, FlaskConical, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface AtlasOnboardingOverlayProps {
  onComplete: () => void;
}

const SECTIONS = [
  { icon: Compass, label: "Atlas" },
  { icon: Users, label: "Chats" },
  { icon: FlaskConical, label: "Projects" },
  { icon: Globe, label: "Creators" },
];

export const AtlasOnboardingOverlay = ({ onComplete }: AtlasOnboardingOverlayProps) => {
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('atlas-onboarding-step', { detail: { step: 0 } }));
    return () => {
      window.dispatchEvent(new CustomEvent('atlas-onboarding-step', { detail: { step: -1 } }));
    };
  }, [onComplete]);

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
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-muted">
                <Icon className="w-6 h-6 text-muted-foreground" />
              </div>
              <span className="text-[11px] font-medium text-muted-foreground">{section.label}</span>
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
        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
          {"Everything starts here.\n\nYou answer simple quests\nand the system begins to understand who you are.\n\nYour strengths, your patterns, your direction."}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="mt-10"
      >
        <Button
          onClick={onComplete}
          size="lg"
          className="gap-2 px-8"
        >
          Continue
          <ArrowRight className="w-4 h-4" />
        </Button>
      </motion.div>
    </motion.div>
  );
};
