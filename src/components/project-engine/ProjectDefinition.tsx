import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Check } from "lucide-react";
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
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const isEmpty = !brief.trim();

  useEffect(() => {
    setBrief(project.project_brief || project.project_description || "");
  }, [project.id]);

  const handleBlur = () => {
    if (brief.trim() !== (project.project_brief || "")) {
      onUpdate({ project_brief: brief.trim() });
      setSaved(true);
      timeoutRef.current = setTimeout(() => setSaved(false), 2000);
    }
  };

  useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }, []);

  return (
    <Card className="border-border/40">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-primary/80">What are you building?</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="relative">
          <Textarea
            value={brief}
            onChange={e => setBrief(e.target.value)}
            onBlur={handleBlur}
            placeholder="Describe what you're building, where you are, and what matters most."
            rows={4}
            className={cn(
              "resize-none transition-all",
              isEmpty && "animate-pulse border-primary/40"
            )}
          />
          {saved && (
            <div className="absolute top-2 right-2 flex items-center gap-1 text-xs text-green-400">
              <Check className="w-3 h-3" /> Saved
            </div>
          )}
        </div>

        <div className="space-y-1.5 pl-1">
          {SUB_PROMPTS.map(prompt => (
            <p key={prompt} className="text-xs text-muted-foreground">• {prompt}</p>
          ))}
        </div>

        <p className="text-[11px] text-muted-foreground/60 italic">
          This context powers your mentors and weekly guidance.
        </p>
      </CardContent>
    </Card>
  );
}
