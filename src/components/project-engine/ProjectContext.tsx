import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ProjectEngineData } from "@/pages/ProjectEngine";

interface Props {
  project: ProjectEngineData;
  onUpdate: (updates: Partial<ProjectEngineData>) => void;
}

const MATURITY_STAGES = [
  { key: "idea", label: "Idea", desc: "Exploring what to build" },
  { key: "prototype", label: "Prototype", desc: "Testing early versions" },
  { key: "mvp", label: "MVP", desc: "Getting real users" },
  { key: "growing", label: "Growing", desc: "Improving and expanding" },
  { key: "scaling", label: "Scaling", desc: "Optimizing and scaling" },
];

const TIME_OPTIONS = ["<5h/week", "5–10h", "10–20h", "Full-time"];
const MONEY_OPTIONS = ["$0", "Low", "Medium", "High"];
const SKILL_OPTIONS = ["Beginner", "Intermediate", "Strong"];

export function ProjectContext({ project, onUpdate }: Props) {
  const [stage, setStage] = useState(project.project_maturity_stage || "idea");
  const constraints = (project.project_constraints as any) || {};
  const [time, setTime] = useState(constraints.time || "");
  const [money, setMoney] = useState(constraints.money || "");
  const [skills, setSkills] = useState(constraints.skills || "");

  useEffect(() => {
    setStage(project.project_maturity_stage || "idea");
    const c = (project.project_constraints as any) || {};
    setTime(c.time || "");
    setMoney(c.money || "");
    setSkills(c.skills || "");
  }, [project.id]);

  const handleStageChange = (s: string) => {
    setStage(s);
    onUpdate({ project_maturity_stage: s } as any);
  };

  const handleConstraintChange = (key: string, value: string) => {
    const updated = { ...constraints, [key]: value };
    if (key === "time") setTime(value);
    if (key === "money") setMoney(value);
    if (key === "skills") setSkills(value);
    onUpdate({ project_constraints: updated } as any);
  };

  return (
    <Card className="border-border/40">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-primary/80">Project Context</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Maturity Stage */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground/80">Maturity Stage</p>
          <div className="flex flex-wrap gap-2">
            {MATURITY_STAGES.map(s => (
              <button
                key={s.key}
                onClick={() => handleStageChange(s.key)}
                className={cn(
                  "px-4 py-1.5 rounded-md text-sm font-medium transition-all border",
                  stage === s.key
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted/30 text-muted-foreground border-border/40 hover:bg-muted/60"
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Constraints */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground/80">Constraints</p>
          <div className="flex flex-wrap items-center gap-2">
            {/* Time */}
            {TIME_OPTIONS.map(opt => (
              <Badge
                key={opt}
                variant="outline"
                onClick={() => handleConstraintChange("time", opt)}
                className={cn(
                  "cursor-pointer transition-all",
                  time === opt ? "bg-primary/20 text-primary border-primary/40" : "hover:bg-muted/40"
                )}
              >
                {opt}
              </Badge>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {MONEY_OPTIONS.map(opt => (
              <Badge
                key={opt}
                variant="outline"
                onClick={() => handleConstraintChange("money", opt)}
                className={cn(
                  "cursor-pointer transition-all",
                  money === opt ? "bg-green-500/20 text-green-400 border-green-500/30" : "hover:bg-muted/40"
                )}
              >
                Budget: {opt}
              </Badge>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {SKILL_OPTIONS.map(opt => (
              <Badge
                key={opt}
                variant="outline"
                onClick={() => handleConstraintChange("skills", opt)}
                className={cn(
                  "cursor-pointer transition-all",
                  skills === opt ? "bg-orange-500/20 text-orange-400 border-orange-500/30" : "hover:bg-muted/40"
                )}
              >
                Skills: {opt}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
