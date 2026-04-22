import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pencil, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProjectEngineData } from "@/pages/ProjectEngine";

const PHASE_COLORS: Record<string, string> = {
  discovery: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  growth: "bg-green-500/20 text-green-400 border-green-500/30",
  build: "bg-orange-500/20 text-orange-400 border-orange-500/30",
};

interface Props {
  project: ProjectEngineData;
  onUpdate: (updates: Partial<ProjectEngineData>) => void;
}

export function ProjectCoreHeader({ project, onUpdate }: Props) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(project.project_title);
  const phase = project.current_phase || "build";

  const handleSave = () => {
    if (title.trim()) {
      onUpdate({ project_title: title.trim() });
      setEditing(false);
    }
  };

  return (
    <div className="flex items-center gap-3 min-w-0">
      {editing ? (
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Input
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSave()}
            className="text-2xl font-bold h-auto py-1"
            autoFocus
          />
          <Button size="icon" variant="ghost" onClick={handleSave} className="flex-shrink-0">
            <Check className="w-4 h-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={() => { setTitle(project.project_title); setEditing(false); }} className="flex-shrink-0">
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="flex items-center gap-2 group flex-1 min-w-0 text-left"
        >
          <h2 className="text-2xl font-bold text-foreground truncate">{project.project_title}</h2>
          <Pencil className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-60 transition-opacity flex-shrink-0" />
        </button>
      )}
      <Badge variant="outline" className={cn("capitalize flex-shrink-0 text-xs", PHASE_COLORS[phase])}>
        {phase}
      </Badge>
    </div>
  );
}
