import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import type { ProjectEngineData } from "@/pages/ProjectEngine";

interface StructureNode {
  id: string;
  title: string;
  description?: string;
  status: "not_started" | "in_progress" | "strong";
  importance: "low" | "medium" | "high";
  children: StructureNode[];
}

const STATUS_DOT: Record<string, string> = {
  not_started: "bg-muted-foreground/40",
  in_progress: "bg-yellow-500",
  strong: "bg-green-500",
};

interface Props {
  project: ProjectEngineData;
  onUpdate: (updates: Partial<ProjectEngineData>) => void;
}

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

// Individual block card component (matches reference image)
function BlockCard({
  node,
  onUpdate,
  onDelete,
  onAddChild,
  onDeleteChild,
}: {
  node: StructureNode;
  onUpdate: (id: string, updates: Partial<StructureNode>) => void;
  onDelete: (id: string) => void;
  onAddChild: (parentId: string) => void;
  onDeleteChild: (id: string) => void;
}) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(node.title);
  const [editingChildId, setEditingChildId] = useState<string | null>(null);
  const [editChildTitle, setEditChildTitle] = useState("");

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
    </div>
  );
}

export function ProjectStructure({ project, onUpdate }: Props) {
  const navigate = useNavigate();
  const [structure, setStructure] = useState<StructureNode[]>(() => {
    const raw = project.project_structure;
    return Array.isArray(raw) && raw.length > 0 ? raw : [];
  });

  useEffect(() => {
    const raw = project.project_structure;
    setStructure(Array.isArray(raw) && raw.length > 0 ? raw : []);
  }, [project.id]);

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
                      onUpdate={handleUpdateNode}
                      onDelete={handleDeleteNode}
                      onAddChild={handleAddChild}
                      onDeleteChild={handleDeleteNode}
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
