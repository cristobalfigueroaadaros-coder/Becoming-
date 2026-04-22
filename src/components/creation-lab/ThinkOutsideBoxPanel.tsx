import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb, RefreshCw, MessageCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useThinkOutsideBox } from "@/hooks/useThinkOutsideBox";

interface Project {
  title: string;
  description?: string;
}

interface ActivePhase {
  name?: string;
  phase_name?: string;
}

interface ThinkOutsideBoxPanelProps {
  project: Project;
  currentPhase?: ActivePhase | null;
}

const IDEA_META: Record<string, { label: string; icon: string }> = {
  obvious: { label: "Clear path", icon: "→" },
  interesting: { label: "Interesting angle", icon: "✦" },
  out_of_the_box: { label: "Out of the box", icon: "💡" },
};

const MENTOR_LABELS: Record<string, string> = {
  creative_visionary: "Creative Visionary",
  strategist: "Strategist",
  business_mentor: "Business Mentor",
};

export const ThinkOutsideBoxPanel = ({ project, currentPhase }: ThinkOutsideBoxPanelProps) => {
  const navigate = useNavigate();
  const { generate, loading, result, error, reset } = useThinkOutsideBox();
  const [expanded, setExpanded] = useState(false);

  const handleGenerate = async () => {
    setExpanded(true);
    await generate({
      name: project.title,
      description: project.description,
      phase: currentPhase?.phase_name ?? currentPhase?.name,
    });
  };

  const handleTalkToMentor = () => {
    const mentorType = result?.mentor_type || "creative_visionary";
    navigate(`/chat?mentor=${mentorType}`);
  };

  const handleReset = () => {
    reset();
    setExpanded(false);
  };

  return (
    <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 overflow-hidden">
      {/* Header row — always visible */}
      <button
        className="w-full flex items-center gap-3 p-4 text-left"
        onClick={() => (result || error) ? setExpanded(!expanded) : handleGenerate()}
        disabled={loading}
      >
        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <Lightbulb className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">Think Outside the Box</p>
          <p className="text-xs text-muted-foreground">
            {loading
              ? "Finding new angles..."
              : result
              ? "New angles for your project"
              : "Combine your identity patterns with your project"}
          </p>
        </div>
        {loading ? (
          <RefreshCw className="w-4 h-4 text-muted-foreground animate-spin shrink-0" />
        ) : result || error ? (
          expanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
          )
        ) : null}
      </button>

      {/* Expandable results */}
      <AnimatePresence>
        {expanded && (result || error) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4">
              {error && (
                <p className="text-sm text-muted-foreground">{error}</p>
              )}

              {result && (
                <>
                  <p className="text-sm text-foreground/80 leading-relaxed">{result.setup}</p>
                  <p className="text-sm font-semibold text-foreground">{result.question}</p>

                  <div className="space-y-2">
                    {result.ideas.map((idea, i) => {
                      const meta = IDEA_META[idea.type] || IDEA_META.obvious;
                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.08 }}
                          className="flex items-start gap-2 p-3 rounded-xl bg-background/60 border border-border/30"
                        >
                          <span className="text-sm mt-0.5 shrink-0">{meta.icon}</span>
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

                  <div className="flex gap-2 pt-1">
                    <Button size="sm" className="gap-1.5 flex-1" onClick={handleTalkToMentor}>
                      <MessageCircle className="w-3.5 h-3.5" />
                      Talk to {MENTOR_LABELS[result.mentor_type] || "a Mentor"}
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1.5" onClick={handleGenerate} disabled={loading}>
                      <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                      New angle
                    </Button>
                  </div>
                </>
              )}

              <button
                onClick={handleReset}
                className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
