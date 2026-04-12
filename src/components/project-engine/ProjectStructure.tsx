import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Sparkles, MessageCircle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { ProjectEngineData } from "@/pages/ProjectEngine";

interface StructureNode {
  id: string;
  title: string;
  description?: string;
  status: "not_started" | "in_progress" | "strong";
  importance: "low" | "medium" | "high";
  children: StructureNode[];
  mentorType?: string;
}

const STATUS_DOT: Record<string, string> = {
  not_started: "bg-muted-foreground/40",
  in_progress: "bg-yellow-500",
  strong: "bg-green-500",
};

// Subset of mentors relevant for project work
const MENTOR_CONFIG: Record<string, { name: string; icon: string }> = {
  strategist_mentor:      { name: "Strategist",      icon: "♟️" },
  business_mentor:        { name: "Business",        icon: "📈" },
  marketing_mentor:       { name: "Marketing",       icon: "📣" },
  creative_visionary:     { name: "Creative",        icon: "🎨" },
  design_thinking_mentor: { name: "Design Thinking", icon: "🧪" },
  quantum_inventor:       { name: "Inventor",        icon: "⚡" },
  heart_mentor:           { name: "Heart",           icon: "💗" },
  scientific_mentor:      { name: "Scientific",      icon: "🔬" },
  discipline_mentor:      { name: "Discipline",      icon: "🎯" },
  alignment_mentor:       { name: "Alignment",       icon: "🧭" },
};

function suggestMentorForBlock(title: string): string {
  const t = title.toLowerCase();
  if (/market|audience|brand|reach|messaging|social|promot|content/.test(t)) return "marketing_mentor";
  if (/business|revenue|sales|finance|pricing|model|money|monetiz/.test(t)) return "business_mentor";
  if (/design|ux|user|interface|experience|prototype|product/.test(t)) return "design_thinking_mentor";
  if (/creative|vision|story|idea|art|concept|narrative/.test(t)) return "creative_visionary";
  if (/tech|build|develop|code|engineer|invent|technical/.test(t)) return "quantum_inventor";
  if (/research|data|test|experiment|science|validate|analys/.test(t)) return "scientific_mentor";
  if (/community|people|relation|team|connect|heart|emotion|impact/.test(t)) return "heart_mentor";
  if (/discipline|habit|routine|focus|consistency|execut/.test(t)) return "discipline_mentor";
  if (/align|value|purpose|mission|clarity|direction/.test(t)) return "alignment_mentor";
  return "strategist_mentor";
}

interface Props {
  project: ProjectEngineData;
  onUpdate: (updates: Partial<ProjectEngineData>) => void;
}

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

// Individual block card component
function BlockCard({
  node,
  projectTitle,
  onUpdate,
  onDelete,
  onAddChild,
  onDeleteChild,
  availableMentors,
  onMentorSelect,
}: {
  node: StructureNode;
  projectTitle: string;
  onUpdate: (id: string, updates: Partial<StructureNode>) => void;
  onDelete: (id: string) => void;
  onAddChild: (parentId: string) => void;
  onDeleteChild: (id: string) => void;
  availableMentors: string[];
  onMentorSelect: (nodeId: string, mentorType: string) => void;
}) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(node.title);
  const [editingChildId, setEditingChildId] = useState<string | null>(null);
  const [editChildTitle, setEditChildTitle] = useState("");
  const [showMentorPicker, setShowMentorPicker] = useState(false);

  const linkedMentor = node.mentorType || suggestMentorForBlock(node.title);
  const mentorInfo = MENTOR_CONFIG[linkedMentor] || MENTOR_CONFIG.strategist_mentor;

  // Only show mentors that exist in the user's council (or all if council is empty)
  const mentorList = availableMentors.length > 0
    ? availableMentors.filter(m => MENTOR_CONFIG[m])
    : Object.keys(MENTOR_CONFIG);

  const cycleStatus = () => {
    const order: StructureNode["status"][] = ["not_started", "in_progress", "strong"];
    const next = order[(order.indexOf(node.status) + 1) % order.length];
    onUpdate(node.id, { status: next });
  };

  return (
    <div className="rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm p-4 min-w-[200px] max-w-[260px] flex-shrink-0 space-y-3 group relative">
      {/* Delete block button */}
      <Button
        size="icon"
        variant="ghost"
        className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
        onClick={() => onDelete(node.id)}
      >
        <Trash2 className="w-3 h-3" />
      </Button>

      {/* Block title */}
      <div className="flex items-center gap-2">
        <button
          onClick={cycleStatus}
          className={cn("w-3 h-3 rounded-full flex-shrink-0 transition-colors", STATUS_DOT[node.status])}
          title="Toggle status"
        />
        {editingTitle ? (
          <Input
            value={editTitle}
            onChange={e => setEditTitle(e.target.value)}
            onBlur={() => { onUpdate(node.id, { title: editTitle }); setEditingTitle(false); }}
            onKeyDown={e => { if (e.key === "Enter") { onUpdate(node.id, { title: editTitle }); setEditingTitle(false); } }}
            className="h-7 text-sm font-semibold flex-1"
            autoFocus
          />
        ) : (
          <span
            className="text-sm font-semibold text-foreground cursor-pointer hover:text-primary transition-colors flex-1"
            onClick={() => setEditingTitle(true)}
          >
            {node.title}
          </span>
        )}
      </div>

      {/* Activities */}
      <div className="space-y-1.5 ml-1">
        {node.children.map(child => (
          <div key={child.id} className="flex items-center gap-2 group/activity">
            <button
              onClick={() => {
                const order: StructureNode["status"][] = ["not_started", "in_progress", "strong"];
                const next = order[(order.indexOf(child.status) + 1) % order.length];
                onUpdate(child.id, { status: next });
              }}
              className={cn("w-2 h-2 rounded-full flex-shrink-0 transition-colors", STATUS_DOT[child.status])}
            />
            {editingChildId === child.id ? (
              <Input
                value={editChildTitle}
                onChange={e => setEditChildTitle(e.target.value)}
                onBlur={() => { onUpdate(child.id, { title: editChildTitle }); setEditingChildId(null); }}
                onKeyDown={e => { if (e.key === "Enter") { onUpdate(child.id, { title: editChildTitle }); setEditingChildId(null); } }}
                className="h-6 text-xs flex-1"
                autoFocus
              />
            ) : (
              <span
                className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors flex-1"
                onClick={() => { setEditingChildId(child.id); setEditChildTitle(child.title); }}
              >
                {child.title}
              </span>
            )}
            <Button
              size="icon"
              variant="ghost"
              className="h-5 w-5 opacity-0 group-hover/activity:opacity-100 transition-opacity text-destructive"
              onClick={() => onDeleteChild(child.id)}
            >
              <Trash2 className="w-2.5 h-2.5" />
            </Button>
          </div>
        ))}

        {/* Add Activity placeholder */}
        <button
          onClick={() => onAddChild(node.id)}
          className="flex items-center gap-2 text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors py-1 w-full"
        >
          <div className="w-2 h-2 rounded-full border border-dashed border-muted-foreground/30" />
          Add Activity...
        </button>
      </div>

      {/* Mentor section */}
      <div className="pt-2 border-t border-border/30">
        {!showMentorPicker ? (
          <div className="flex items-center justify-between gap-1">
            <button
              onClick={() => onMentorSelect(node.id, linkedMentor)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors flex-1 min-w-0"
            >
              <MessageCircle className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{mentorInfo.icon} {mentorInfo.name}</span>
              <ArrowRight className="w-3 h-3 flex-shrink-0" />
            </button>
            <button
              onClick={() => setShowMentorPicker(true)}
              className="text-xs text-muted-foreground/40 hover:text-muted-foreground transition-colors flex-shrink-0"
            >
              change
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <span className="text-xs text-muted-foreground">Pick a mentor:</span>
            <div className="flex flex-wrap gap-1">
              {mentorList.map(mt => {
                const cfg = MENTOR_CONFIG[mt];
                if (!cfg) return null;
                return (
                  <button
                    key={mt}
                    onClick={() => {
                      onUpdate(node.id, { mentorType: mt });
                      setShowMentorPicker(false);
                    }}
                    className={cn(
                      "flex items-center gap-1 text-xs px-2 py-1 rounded-full border transition-colors",
                      mt === linkedMentor
                        ? "border-primary/50 bg-primary/10 text-foreground"
                        : "border-border/40 text-muted-foreground hover:text-foreground hover:border-border"
                    )}
                  >
                    <span>{cfg.icon}</span>
                    <span>{cfg.name}</span>
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setShowMentorPicker(false)}
              className="text-xs text-muted-foreground/40 hover:text-muted-foreground transition-colors"
            >
              cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function ProjectStructure({ project, onUpdate }: Props) {
  const navigate = useNavigate();
  const [structure, setStructure] = useState<StructureNode[]>(() => {
    const raw = project.project_structure;
    return Array.isArray(raw) && raw.length > 0 ? raw : [];
  });
  const [userMentors, setUserMentors] = useState<string[]>([]);

  useEffect(() => {
    const raw = project.project_structure;
    setStructure(Array.isArray(raw) && raw.length > 0 ? raw : []);
  }, [project.id]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from("user_mentors").select("mentor_type").eq("user_id", user.id).then(({ data }) => {
        if (data) setUserMentors(data.map((m: any) => m.mentor_type));
      });
    });
  }, []);

  const saveStructure = (updated: StructureNode[]) => {
    setStructure(updated);
    onUpdate({ project_structure: updated } as any);
  };

  const addRootNode = () => {
    const newNode: StructureNode = {
      id: generateId(),
      title: "New Chapter",
      status: "not_started",
      importance: "medium",
      children: [],
    };
    saveStructure([...structure, newNode]);
  };

  const updateNodeRecursive = (nodes: StructureNode[], id: string, updates: Partial<StructureNode>): StructureNode[] => {
    return nodes.map(n => {
      if (n.id === id) return { ...n, ...updates };
      return { ...n, children: updateNodeRecursive(n.children, id, updates) };
    });
  };

  const deleteNodeRecursive = (nodes: StructureNode[], id: string): StructureNode[] => {
    return nodes.filter(n => n.id !== id).map(n => ({
      ...n,
      children: deleteNodeRecursive(n.children, id),
    }));
  };

  const addChildRecursive = (nodes: StructureNode[], parentId: string): StructureNode[] => {
    return nodes.map(n => {
      if (n.id === parentId) {
        return {
          ...n,
          children: [...n.children, { id: generateId(), title: "New Activity", status: "not_started" as const, importance: "medium" as const, children: [] }],
        };
      }
      return { ...n, children: addChildRecursive(n.children, parentId) };
    });
  };

  const handleUpdateNode = (id: string, updates: Partial<StructureNode>) => {
    saveStructure(updateNodeRecursive(structure, id, updates));
  };

  const handleDeleteNode = (id: string) => {
    saveStructure(deleteNodeRecursive(structure, id));
  };

  const handleAddChild = (parentId: string) => {
    saveStructure(addChildRecursive(structure, parentId));
  };

  const handleMentorSelect = (nodeId: string, mentorType: string) => {
    // Save the chosen mentor to the block
    const updated = updateNodeRecursive(structure, nodeId, { mentorType });
    saveStructure(updated);

    // Find the block title for context
    const findNode = (nodes: StructureNode[], id: string): StructureNode | undefined => {
      for (const n of nodes) {
        if (n.id === id) return n;
        const found = findNode(n.children, id);
        if (found) return found;
      }
    };
    const node = findNode(updated, nodeId);
    const blockTitle = node?.title || "this phase";

    navigate(`/council?view=${mentorType}`, {
      state: {
        prefilledQuestion: `I need help with "${blockTitle}" — this is one phase of my project "${project.project_title}". Can you help me understand and plan this?`,
        projectName: project.project_title,
      },
    });
  };

  return (
    <Card className="border-border/40">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-primary/80">Project Structure</CardTitle>
      </CardHeader>
      <CardContent>
        {structure.length === 0 ? (
          <div className="text-center py-8 space-y-3">
            <p className="text-sm text-muted-foreground">
              Break your project into parts to get better guidance.
            </p>
            <div className="flex gap-2 justify-center flex-wrap">
              <Button size="sm" onClick={addRootNode} className="gap-1">
                <Plus className="w-4 h-4" /> Add chapter
              </Button>
              <Button size="sm" variant="outline" onClick={() => navigate("/council")} className="gap-1">
                <Sparkles className="w-4 h-4" /> Ask your council to structure this
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Project root label */}
            <div className="flex justify-center">
              <span className="inline-block px-5 py-2 rounded-xl border border-primary/30 bg-primary/5 text-sm font-semibold text-foreground">
                {project.project_title}
              </span>
            </div>

            {/* Connector line */}
            <div className="flex justify-center">
              <div className="w-px h-6 bg-border/60" />
            </div>

            {/* Horizontal connector + blocks */}
            <div className="relative">
              {/* Horizontal line */}
              {structure.length > 1 && (
                <div className="absolute top-0 left-[calc(50%/(var(--count)))] right-[calc(50%/(var(--count)))] h-px bg-border/40"
                  style={{ left: '10%', right: '10%' }}
                />
              )}

              {/* Block cards - horizontal scroll on mobile */}
              <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory">
                {structure.map(node => (
                  <div key={node.id} className="snap-start">
                    {/* Vertical connector from horizontal line */}
                    <div className="flex justify-center mb-2">
                      <div className="w-px h-4 bg-border/40" />
                    </div>
                    <BlockCard
                      node={node}
                      projectTitle={project.project_title}
                      onUpdate={handleUpdateNode}
                      onDelete={handleDeleteNode}
                      onAddChild={handleAddChild}
                      onDeleteChild={handleDeleteNode}
                      availableMentors={userMentors}
                      onMentorSelect={handleMentorSelect}
                    />
                  </div>
                ))}

                {/* Add Chapter dashed card */}
                <div className="snap-start">
                  <div className="flex justify-center mb-2">
                    <div className="w-px h-4 bg-transparent" />
                  </div>
                  <button
                    onClick={addRootNode}
                    className="rounded-xl border-2 border-dashed border-border/40 hover:border-primary/40 p-4 min-w-[160px] h-[120px] flex items-center justify-center gap-2 text-sm text-muted-foreground/50 hover:text-muted-foreground transition-all"
                  >
                    <Plus className="w-4 h-4" /> Add Chapter
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
