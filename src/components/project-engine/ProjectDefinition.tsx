import { useState, useEffect, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Check, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ProjectEngineData } from "@/pages/ProjectEngine";

interface Props {
  project: ProjectEngineData;
  onUpdate: (updates: Partial<ProjectEngineData>) => void;
}

const SUB_PROMPTS = [
  "Why does this matter?",
  "What problem are you solving?",
  "Who are you building this for?",
];

export function ProjectDefinition({ project, onUpdate }: Props) {
  const [brief, setBrief] = useState(project.project_brief || project.project_description || "");
  const [saved, setSaved] = useState(false);
  const [expanded, setExpanded] = useState(!brief.trim());
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const isEmpty = !brief.trim();

  useEffect(() => {
    const val = project.project_brief || project.project_description || "";
    setBrief(val);
    setExpanded(!val.trim());
  }, [project.id]);

  const handleBlur = () => {
    if (brief.trim() !== (project.project_brief || "")) {
      onUpdate({ project_brief: brief.trim() });
      setSaved(true);
      timeoutRef.current = setTimeout(() => setSaved(false), 2000);
    }
  };

  useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }, []);

  const preview = brief.trim().split("\n")[0].slice(0, 120);

  return (
    <div className="rounded-xl border border-border/40 bg-card/60 overflow-hidden">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-muted/20 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <span className="text-xs font-semibold text-primary/70 uppercase tracking-wider">What you're building</span>
          {!expanded && preview && (
            <p className="text-sm text-muted-foreground truncate mt-0.5">{preview}</p>
          )}
          {!expanded && isEmpty && (
            <p className="text-sm text-muted-foreground/50 italic mt-0.5">Add your project brief</p>
          )}
        </div>
        <ChevronDown
          className={cn("w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform duration-200", expanded && "rotate-180")}
        />
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              <div className="relative">
                <Textarea
                  value={brief}
                  onChange={e => setBrief(e.target.value)}
                  onBlur={handleBlur}
                  placeholder="Describe what you're building, where you are, and what matters most."
                  rows={4}
                  className={cn("resize-none transition-all", isEmpty && "animate-pulse border-primary/40")}
                />
                {saved && (
                  <div className="absolute top-2 right-2 flex items-center gap-1 text-xs text-green-400">
                    <Check className="w-3 h-3" /> Saved
                  </div>
                )}
              </div>
              <div className="space-y-1 pl-1">
                {SUB_PROMPTS.map(p => (
                  <p key={p} className="text-xs text-muted-foreground">• {p}</p>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
