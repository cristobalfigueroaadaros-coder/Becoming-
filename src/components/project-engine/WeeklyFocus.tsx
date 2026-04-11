import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Check } from "lucide-react";
import type { ProjectEngineData } from "@/pages/ProjectEngine";

interface Props {
  project: ProjectEngineData;
  onUpdate: (updates: Partial<ProjectEngineData>) => void;
}

export function WeeklyFocus({ project, onUpdate }: Props) {
  const [focus, setFocus] = useState(project.weekly_focus_intent || "");
  const [saved, setSaved] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    setFocus(project.weekly_focus_intent || "");
  }, [project.id]);

  const handleBlur = () => {
    if (focus.trim() !== (project.weekly_focus_intent || "")) {
      onUpdate({ weekly_focus_intent: focus.trim() } as any);
      setSaved(true);
      timeoutRef.current = setTimeout(() => setSaved(false), 2000);
    }
  };

  useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }, []);

  return (
    <Card className="border-border/40">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-primary/80">This Week's Focus</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <Input
            value={focus}
            onChange={e => setFocus(e.target.value)}
            onBlur={handleBlur}
            placeholder="What do you want to focus on this week?"
            className="pr-16"
          />
          {saved && (
            <div className="absolute top-1/2 right-3 -translate-y-1/2 flex items-center gap-1 text-xs text-green-400">
              <Check className="w-3 h-3" /> Saved
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
