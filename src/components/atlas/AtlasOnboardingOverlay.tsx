import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Compass, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface AtlasOnboardingOverlayProps {
  onComplete: () => void;
  mode?: "atlas" | "lifetime" | "founder";
}

const SECTIONS = {
  atlas: {
    icon: Compass,
    label: "Atlas",
    text: "This is your Atlas.\n\nHere we collect dots from your life, your gifts, your questions, and what you have lived.\n\nThe more dots you create, the more Becoming can connect the pattern behind who you are becoming.",
    action: "Talk to Future Self",
  },
  lifetime: {
    icon: BookOpen,
    label: "Life Timeline",
    text: "Now we place one real life moment on your timeline.\n\nThis gives your Atlas a grounded anchor: not only what you say about yourself, but what actually shaped you.",
    action: "Place Life Moment",
  },
  founder: {
    icon: Sparkles,
    label: "Cris's Map",
    text: "I'm Cris, the founder of Becoming.\n\nThis is my map. I want to show you how life events, skills, experiments, and patterns can connect into something meaningful.\n\nThen you continue building yours.",
    action: "See the example",
  },
};

export const AtlasOnboardingOverlay = ({ onComplete, mode = "atlas" }: AtlasOnboardingOverlayProps) => {
  const activeSection = SECTIONS[mode];
  const ActiveIcon = activeSection.icon;

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('atlas-onboarding-step', { detail: { step: 0 } }));
  }, []);

  useEffect(() => {
    return () => {
      window.dispatchEvent(new CustomEvent('atlas-onboarding-step', { detail: { step: -1 } }));
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/90 backdrop-blur-sm"
    >
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
          onClick={onComplete}
          size="lg"
          className="gap-2 px-8"
        >
          {activeSection.action}
          <ArrowRight className="w-4 h-4" />
        </Button>
      </motion.div>
    </motion.div>
  );
};
