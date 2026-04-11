import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pencil, Check, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProjectEngineData } from "@/pages/ProjectEngine";

const PHASE_COLORS: Record<string, string> = {
  discovery: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  growth: "bg-green-500/20 text-green-400 border-green-500/30",
  build: "bg-orange-500/20 text-orange-400 border-orange-500/30",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-primary/20 text-primary border-primary/30",
  paused: "bg-muted text-muted-foreground border-border",
  completed: "bg-green-500/20 text-green-400 border-green-500/30",
  archived: "bg-muted text-muted-foreground border-border",
};

interface Props {
  project: ProjectEngineData;
  onUpdate: (updates: Partial<ProjectEngineData>) => void;
}

export function ProjectCoreHeader({ project, onUpdate }: Props) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(project.project_title);
  const [showStatus, setShowStatus] = useState(false);

  const phase = project.current_phase || "build";
  const status = project.status || "active";

  const handleSave = () => {
    if (title.trim()) {
      onUpdate({ project_title: title.trim() });
      setEditing(false);
    }
  };

  const handleStatusChange = (newStatus: string) => {
    onUpdate({ status: newStatus } as any);
    setShowStatus(false);
  };

  return (
    <Card className="border-border/40">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            {editing ? (
              <div className="flex items-center gap-2">
                <Input value={title} onChange={e => setTitle(e.target.value)} className="text-2xl font-bold" autoFocus />
                <Button size="icon" variant="ghost" onClick={handleSave}><Check className="w-4 h-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => { setTitle(project.project_title); setEditing(false); }}><X className="w-4 h-4" /></Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold">{project.project_title}</h2>
                <Button size="icon" variant="ghost" onClick={() => setEditing(true)} className="flex-shrink-0">
                  <Pencil className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge variant="outline" className={cn("capitalize", PHASE_COLORS[phase])}>
              {phase} Phase
            </Badge>
            <div className="relative">
              <Badge
                variant="outline"
                className={cn("capitalize cursor-pointer", STATUS_COLORS[status])}
                onClick={() => setShowStatus(!showStatus)}
              >
                {status}
                <ChevronDown className="w-3 h-3 ml-1" />
              </Badge>
              {showStatus && (
                <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-lg z-10 min-w-[120px]">
                  {["active", "paused", "completed"].map(s => (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(s)}
                      className="w-full text-left px-3 py-2 text-sm capitalize hover:bg-muted/50 first:rounded-t-lg last:rounded-b-lg"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
