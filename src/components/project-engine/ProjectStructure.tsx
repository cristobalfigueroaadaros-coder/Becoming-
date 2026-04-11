import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, ChevronDown, ChevronRight, Trash2, GripVertical, Sparkles } from "lucide-react";
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

const STATUS_STYLES: Record<string, string> = {
  not_started: "border-muted-foreground/30",
  in_progress: "border-yellow-500/50",
  strong: "border-green-500/50",
};

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

function NodeItem({
  node,
  depth,
  onUpdate,
  onDelete,
  onAddChild,
}: {
  node: StructureNode;
  depth: number;
  onUpdate: (id: string, updates: Partial<StructureNode>) => void;
  onDelete: (id: string) => void;
  onAddChild: (parentId: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(node.title);
  const hasChildren = node.children.length > 0;

  const cycleStatus = () => {
    const order: StructureNode["status"][] = ["not_started", "in_progress", "strong"];
    const next = order[(order.indexOf(node.status) + 1) % order.length];
    onUpdate(node.id, { status: next });
  };

  return (
    <div className={cn("space-y-1", depth > 0 && "ml-6")}>
      <div className={cn(
        "flex items-center gap-2 p-2 rounded-lg border transition-all group",
        STATUS_STYLES[node.status],
        "hover:bg-muted/20"
      )}>
        <button onClick={() => setExpanded(!expanded)} className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
          {hasChildren ? (
            expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />
          ) : <GripVertical className="w-3 h-3 text-muted-foreground/30" />}
        </button>

        <button onClick={cycleStatus} className={cn("w-3 h-3 rounded-full flex-shrink-0 transition-colors", STATUS_DOT[node.status])} title="Toggle status" />

        {editing ? (
          <Input
            value={editTitle}
            onChange={e => setEditTitle(e.target.value)}
            onBlur={() => { onUpdate(node.id, { title: editTitle }); setEditing(false); }}
            onKeyDown={e => { if (e.key === "Enter") { onUpdate(node.id, { title: editTitle }); setEditing(false); } }}
            className="h-7 text-sm flex-1"
            autoFocus
          />
        ) : (
          <span className="text-sm font-medium flex-1 cursor-pointer" onClick={() => setEditing(true)}>
            {node.title}
          </span>
        )}

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => onAddChild(node.id)}>
            <Plus className="w-3 h-3" />
          </Button>
          <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => onDelete(node.id)}>
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {expanded && hasChildren && (
        <div className="space-y-1">
          {node.children.map(child => (
            <NodeItem key={child.id} node={child} depth={depth + 1} onUpdate={onUpdate} onDelete={onDelete} onAddChild={onAddChild} />
          ))}
        </div>
      )}
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
      title: "New Area",
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
          children: [...n.children, { id: generateId(), title: "Sub-area", status: "not_started" as const, importance: "medium" as const, children: [] }],
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
                <Plus className="w-4 h-4" /> Add area
              </Button>
              <Button size="sm" variant="outline" onClick={() => navigate("/council")} className="gap-1">
                <Sparkles className="w-4 h-4" /> Ask your council to structure this
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {/* Root project label */}
            <div className="text-center mb-3">
              <span className="inline-block px-4 py-1.5 rounded-lg border border-border/60 text-sm font-semibold bg-muted/20">
                {project.project_title}
              </span>
              <div className="w-px h-4 bg-border/40 mx-auto" />
            </div>

            {structure.map(node => (
              <NodeItem
                key={node.id}
                node={node}
                depth={0}
                onUpdate={handleUpdateNode}
                onDelete={handleDeleteNode}
                onAddChild={handleAddChild}
              />
            ))}

            <Button size="sm" variant="ghost" onClick={addRootNode} className="gap-1 mt-2 text-muted-foreground">
              <Plus className="w-3 h-3" /> Add area
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
