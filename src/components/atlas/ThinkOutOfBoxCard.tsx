import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb, MessageCircle, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface OpportunityIdea {
  type: "obvious" | "interesting" | "out_of_the_box";
  text: string;
}

interface Opportunity {
  setup: string;
  question: string;
  ideas: OpportunityIdea[];
  mentor_stage: string;
  mentor_type: string;
}

interface ThinkOutOfBoxCardProps {
  opportunity: Opportunity;
  onDismiss: () => void;
}

const IDEA_LABELS: Record<string, { label: string; icon: string }> = {
  obvious: { label: "Clear path", icon: "→" },
  interesting: { label: "Interesting angle", icon: "✦" },
  out_of_the_box: { label: "Out of the box", icon: "💡" },
};

const MENTOR_LABELS: Record<string, string> = {
  creative_visionary: "Creative Visionary",
  strategist: "Strategist",
  business_mentor: "Business Mentor",
};

export const ThinkOutOfBoxCard = ({ opportunity, onDismiss }: ThinkOutOfBoxCardProps) => {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);

  const handleTalkToMentor = () => {
    const mentorType = opportunity.mentor_type || "creative_visionary";
    navigate(`/chat?mentor=${mentorType}`);
  };

  const handleDismiss = () => {
    setDismissed(true);
    setTimeout(onDismiss, 300);
  };

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="mx-4 my-3 p-5 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 relative overflow-hidden"
        >
          {/* Background glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "radial-gradient(circle at 20% 30%, hsl(var(--primary) / 0.08), transparent 60%)",
            }}
          />

          {/* Dismiss */}
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-2 mb-3 relative">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Lightbulb className="w-4 h-4 text-primary" />
            </div>
            <span className="text-[10px] uppercase tracking-wider text-primary font-semibold">
              Something caught my eye
            </span>
          </div>

          {/* Setup */}
          <p className="text-sm text-foreground/80 mb-3 relative leading-relaxed">
            {opportunity.setup}
          </p>

          {/* Question */}
          <p className="text-base font-semibold text-foreground mb-4 relative">
            {opportunity.question}
          </p>

          {/* Ideas */}
          <div className="space-y-2 mb-4 relative">
            {opportunity.ideas.map((idea, i) => {
              const meta = IDEA_LABELS[idea.type] || IDEA_LABELS.obvious;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.1 }}
                  className="flex items-start gap-2 p-3 rounded-xl bg-background/60 border border-border/30"
                >
                  <span className="text-sm mt-0.5">{meta.icon}</span>
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                      {meta.label}
                    </span>
                    <p className="text-sm text-foreground mt-0.5">{idea.text}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex gap-2 relative">
            <Button size="sm" className="gap-1.5 flex-1" onClick={handleTalkToMentor}>
              <MessageCircle className="w-3.5 h-3.5" />
              Talk to {MENTOR_LABELS[opportunity.mentor_type] || "a Mentor"}
            </Button>
            <Button size="sm" variant="outline" onClick={handleDismiss}>
              Not now
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
