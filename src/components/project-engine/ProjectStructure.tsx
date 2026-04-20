import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Sparkles, CheckCircle2, Lightbulb, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { BlockWorkspace } from "./BlockWorkspace";
import type { ProjectEngineData } from "@/pages/ProjectEngine";

export interface StructureNode {
  id: string;
  title: string;
  description?: string;
  status: "not_started" | "in_progress" | "strong" | "completed";
  importance: "low" | "medium" | "high";
  children: StructureNode[];
  mentorType?: string;
  suggestedActivity?: string;
  notes?: string;
  source?: string;
  pending_review?: boolean;
}

const STATUS_DOT: Record<string, string> = {
  not_started: "bg-muted-foreground/40",
  in_progress: "bg-yellow-500",
  strong: "bg-green-500",
  completed: "bg-primary",
};

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

interface Props {
  project: ProjectEngineData;
  onUpdate: (updates: Partial<ProjectEngineData>) => void;
}

export function ProjectStructure({ project, onUpdate }: Props) {
  const navigate = useNavigate();
  const [structure, setStructure] = useState<StructureNode[]>(() => {
    const raw = project.project_structure;
    return Array.isArray(raw) && raw.length > 0 ? raw : [];
  });
  const [userMentors, setUserMentors] = useState<string[]>([]);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [generatingSuggestionFor, setGeneratingSuggestionFor] = useState<string | null>(null);

  useEffect(() => {
    const raw = project.project_structure;
    setStructure(Array.isArray(raw) && raw.length > 0 ? raw : []);
    setActiveBlockId(null);
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
      title: "New Block",
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

  const addChildToNode = (nodes: StructureNode[], parentId: string, child?: Partial<StructureNode>): StructureNode[] => {
    return nodes.map(n => {
      if (n.id === parentId) {
        return {
          ...n,
          children: [...n.children, {
            id: generateId(),
            title: child?.title || "New Activity",
            status: "not_started" as const,
            importance: "medium" as const,
            children: [],
            ...child,
          }],
        };
      }
      return { ...n, children: addChildToNode(n.children, parentId, child) };
    });
  };

  // Generate a single suggested activity for an empty block
  const generateSuggestionForBlock = async (block: StructureNode) => {
    if (block.suggestedActivity || block.children.length > 0) return;
    setGeneratingSuggestionFor(block.id);
    try {
      const { data } = await supabase.functions.invoke("suggest-block-activity", {
        body: {
          blockTitle: block.title,
          projectTitle: project.project_title,
          projectDescription: project.project_description,
          phase: project.current_phase,
        },
      });
      if (data?.suggestion) {
        const updated = updateNodeRecursive(structure, block.id, { suggestedActivity: data.suggestion });
        saveStructure(updated);
      }
    } catch (err) {
      console.error("Failed to generate suggestion:", err);
    } finally {
      setGeneratingSuggestionFor(null);
    }
  };

  // When opening a block workspace, generate suggestion if needed
  const handleOpenBlock = (blockId: string) => {
    setActiveBlockId(blockId);
    const block = structure.find(b => b.id === blockId);
    if (block && block.children.length === 0 && !block.suggestedActivity) {
      generateSuggestionForBlock(block);
    }
  };

  const activeBlock = structure.find(b => b.id === activeBlockId);

  // Block Workspace view
  if (activeBlock) {
    return (
      <Card className="border-border/40">
        <CardContent className="pt-6">
          <BlockWorkspace
            block={activeBlock}
            projectTitle={project.project_title}
            projectId={project.id}
            onBack={() => setActiveBlockId(null)}
            onUpdateBlock={(updates) => {
              saveStructure(updateNodeRecursive(structure, activeBlock.id, updates));
            }}
            onUpdateActivity={(activityId, updates) => {
              saveStructure(updateNodeRecursive(structure, activityId, updates));
            }}
            onAddActivity={() => {
              // If there's a suggestion, use it as the first activity
              if (activeBlock.children.length === 0 && activeBlock.suggestedActivity) {
                const updated = addChildToNode(
                  updateNodeRecursive(structure, activeBlock.id, { suggestedActivity: undefined }),
                  activeBlock.id,
                  { title: activeBlock.suggestedActivity }
                );
                saveStructure(updated);
              } else {
                saveStructure(addChildToNode(structure, activeBlock.id));
              }
            }}
            onDeleteActivity={(id) => saveStructure(deleteNodeRecursive(structure, id))}
            onMarkCompleted={() => {
              saveStructure(updateNodeRecursive(structure, activeBlock.id, { status: "completed" }));
              setActiveBlockId(null);
            }}
            userMentors={userMentors}
            isGeneratingSuggestion={generatingSuggestionFor === activeBlock.id}
          />
        </CardContent>
      </Card>
    );
  }

  // Overview view
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
                <Plus className="w-4 h-4" /> Add block
              </Button>
              <Button size="sm" variant="outline" onClick={() => navigate("/council")} className="gap-1">
                <Sparkles className="w-4 h-4" /> Ask your council to structure this
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Project root */}
            <div className="flex justify-center">
              <span className="inline-block px-5 py-2 rounded-xl border border-primary/30 bg-primary/5 text-sm font-semibold text-foreground">
                {project.project_title}
              </span>
            </div>
            <div className="flex justify-center">
              <div className="w-px h-6 bg-border/60" />
            </div>

            {/* Block cards - clickable */}
            <div className="relative">
              {structure.length > 1 && (
                <div className="absolute top-0 h-px bg-border/40" style={{ left: '10%', right: '10%' }} />
              )}
              <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory">
                {structure.map(node => {
                  const completedChildren = node.children.filter(c => c.status === "completed" || c.status === "strong").length;
                  const totalChildren = node.children.length;
                  const isCompleted = node.status === "completed";

                  return (
                    <div key={node.id} className="snap-start">
                      <div className="flex justify-center mb-2">
                        <div className="w-px h-4 bg-border/40" />
                      </div>
                      <button
                        onClick={() => handleOpenBlock(node.id)}
                        className={cn(
                          "rounded-xl border p-4 min-w-[200px] max-w-[260px] flex-shrink-0 space-y-2 text-left transition-all hover:shadow-md",
                          isCompleted
                            ? "border-green-500/30 bg-green-500/5"
                            : "border-border/50 bg-card/80 backdrop-blur-sm hover:border-primary/30"
                        )}
                      >
                        {/* Title + status */}
                        <div className="flex items-center gap-2">
                          <div className={cn("w-3 h-3 rounded-full flex-shrink-0", STATUS_DOT[node.status])} />
                          <span className="text-sm font-semibold text-foreground truncate">{node.title}</span>
                          {isCompleted && <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />}
                        </div>

                        {/* Activities preview */}
                        {totalChildren > 0 ? (
                          <div className="space-y-1 ml-1">
                            {node.children.slice(0, 3).map(child => (
                              <div key={child.id} className="flex items-center gap-2">
                                <div className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", STATUS_DOT[child.status])} />
                                <span className="text-xs text-muted-foreground truncate">{child.title}</span>
                              </div>
                            ))}
                            {totalChildren > 3 && (
                              <span className="text-xs text-muted-foreground/50 ml-3">+{totalChildren - 3} more</span>
                            )}
                            <div className="text-xs text-muted-foreground/60 mt-1">
                              {completedChildren}/{totalChildren} done
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground/50">
                            <Lightbulb className="w-3 h-3" />
                            Tap to define activities
                          </div>
                        )}
                      </button>
                    </div>
                  );
                })}

                {/* Add block */}
                <div className="snap-start">
                  <div className="flex justify-center mb-2">
                    <div className="w-px h-4 bg-transparent" />
                  </div>
                  <button
                    onClick={addRootNode}
                    className="rounded-xl border-2 border-dashed border-border/40 hover:border-primary/40 p-4 min-w-[160px] h-[100px] flex items-center justify-center gap-2 text-sm text-muted-foreground/50 hover:text-muted-foreground transition-all"
                  >
                    <Plus className="w-4 h-4" /> Add Block
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
