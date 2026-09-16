import { useState } from "react";
import { motion } from "framer-motion";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface AtlasOnboardingOverlayProps {
  onComplete: () => void;
}

export const AtlasOnboardingOverlay = ({ onComplete }: AtlasOnboardingOverlayProps) => {
  const [accepting, setAccepting] = useState(false);

  const handleAccept = async () => {
    if (accepting) return;
    setAccepting(true);
    await onComplete();
  };

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
          <Compass className="h-7 w-7 text-primary" />
        </div>
        <h2 className="mb-3 text-2xl font-bold text-foreground">Welcome to your Atlas</h2>
        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
          Your answers become Dots here. Each quest adds something real about your skills, passions, experiences, and direction. Watch your map grow one discovery at a time.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="mt-10"
      >
        <Button
          onClick={handleAccept}
          disabled={accepting}
          size="lg"
          className="gap-2 px-8"
        >
          {accepting ? "Opening quest…" : "Accept and start"}
          <ArrowRight className="w-4 h-4" />
        </Button>
      </motion.div>
    </motion.div>
  );
};
