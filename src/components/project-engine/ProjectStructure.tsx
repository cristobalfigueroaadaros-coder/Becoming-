import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Sparkles, CheckCircle2, Lightbulb, Check, X, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { BlockWorkspace } from "./BlockWorkspace";
import { PaymentModal } from "@/components/PaymentModal";
import { ProjectStructureOnboarding, useProjectStructureOnboarding } from "./ProjectStructureOnboarding";
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

// Derive an action-oriented CTA from the block title
const ACTION_VERB_MAP: Array<[RegExp, string]> = [
  [/market|audience|brand|reach|messag|social|promot|content/i, "Build the strategy"],
  [/business|revenue|sales|finance|pric|model|money|monetiz/i, "Shape the model"],
  [/design|ux|user|interface|experience|prototype/i, "Design the experience"],
  [/creative|vision|story|idea|art|concept|narrative/i, "Craft the vision"],
  [/tech|build|develop|code|engineer|invent|technical/i, "Define the build"],
  [/research|data|test|experiment|science|validate|analys/i, "Run the research"],
  [/community|people|relation|team|connect|heart|emotion/i, "Map the connections"],
  [/discipline|habit|routine|focus|consistency|execut/i, "Set the rhythm"],
  [/align|value|purpose|mission|clarity|direction/i, "Define the direction"],
  [/space|place|environment|setting/i, "Design the space"],
  [/offer|product|service|solution/i, "Shape the offer"],
  [/impact|outcome|result|goal/i, "Define the outcome"],
];

function getBlockCta(title: string): string {
  for (const [pattern, cta] of ACTION_VERB_MAP) {
    if (pattern.test(title)) return cta;
  }
  return "Start this block";
}

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
  const [showPayment, setShowPayment] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const holdTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const holdProgressRef = useRef(0);
  const holdCompletedRef = useRef(false);
  const { show: showOnboarding, dismiss: dismissOnboarding } = useProjectStructureOnboarding();

  const HOLD_DURATION = 5000;
  const TICK = 50;

  const startHold = () => {
    if (holdTimerRef.current) return;
    holdProgressRef.current = 0;
    holdCompletedRef.current = false;
    holdTimerRef.current = setInterval(() => {
      holdProgressRef.current += (TICK / HOLD_DURATION) * 100;
      const clamped = Math.min(holdProgressRef.current, 100);
      setHoldProgress(clamped);
      if (holdProgressRef.current >= 100) {
        clearInterval(holdTimerRef.current!);
        holdTimerRef.current = null;
        holdCompletedRef.current = true;
        setHoldProgress(0);
        setShowPayment(true);
      }
    }, TICK);
  };

  const cancelHold = () => {
    if (holdTimerRef.current) {
      clearInterval(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    setHoldProgress(0);
    holdProgressRef.current = 0;
  };

  const handleFocusBannerClick = () => {
    if (holdCompletedRef.current) {
      holdCompletedRef.current = false;
      return;
    }
    if (focusBlock) handleOpenBlock(focusBlock.id);
  };

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

  // Builder Team pending suggestions
  const pendingActivities = structure.flatMap(b =>
    b.children.filter(c => c.pending_review && c.source === "builder_team").map(c => ({ block: b, activity: c }))
  );
  const pendingBlocks = structure.filter(b => b.pending_review && b.source === "builder_team");
  const totalPending = pendingActivities.length + pendingBlocks.length;

  const acceptNode = (id: string) => {
    saveStructure(updateNodeRecursive(structure, id, { pending_review: false }));
  };
  const rejectNode = (id: string) => {
    saveStructure(deleteNodeRecursive(structure, id));
  };
  const acceptAllPending = () => {
    const clear = (nodes: StructureNode[]): StructureNode[] => nodes.map(n => ({
      ...n,
      pending_review: n.pending_review ? false : n.pending_review,
      children: clear(n.children),
    }));
    saveStructure(clear(structure));
  };

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

  const handleOpenBlock = (blockId: string) => {
    setActiveBlockId(blockId);
    const block = structure.find(b => b.id === blockId);
    if (block && block.children.length === 0 && !block.suggestedActivity) {
      generateSuggestionForBlock(block);
    }
  };

  const activeBlock = structure.find(b => b.id === activeBlockId);

  // Determine which block is the "current focus" — first non-completed block
  const visibleBlocks = structure.filter(b => !b.pending_review);
  const focusBlockIndex = visibleBlocks.findIndex(b => b.status !== "completed");
  const focusBlock = focusBlockIndex >= 0 ? visibleBlocks[focusBlockIndex] : null;

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
    <>
    <AnimatePresence>
      {showOnboarding && <ProjectStructureOnboarding onDone={dismissOnboarding} />}
    </AnimatePresence>
    <PaymentModal open={showPayment} onClose={() => setShowPayment(false)} />
    <Card className="border-border/40">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-primary/80">Focus</CardTitle>
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
            {/* Builder Team pending suggestions banner */}
            {totalPending > 0 && (
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">
                      Builder Team suggested {pendingActivities.length > 0 ? `${pendingActivities.length} activit${pendingActivities.length === 1 ? "y" : "ies"}` : ""}
                      {pendingActivities.length > 0 && pendingBlocks.length > 0 ? " and " : ""}
                      {pendingBlocks.length > 0 ? `${pendingBlocks.length} new block${pendingBlocks.length === 1 ? "" : "s"}` : ""}
                    </span>
                  </div>
                  <Button size="sm" variant="ghost" onClick={acceptAllPending} className="h-7 text-xs">
                    Accept all
                  </Button>
                </div>
                <div className="space-y-1.5">
                  {pendingActivities.map(({ block, activity }) => (
                    <div key={activity.id} className="flex items-center gap-2 text-xs">
                      <span className="text-muted-foreground truncate flex-1">
                        <span className="text-foreground">{activity.title}</span>
                        <span className="text-muted-foreground/60"> → in "{block.title}"</span>
                      </span>
                      <Button size="icon" variant="ghost" onClick={() => acceptNode(activity.id)} className="h-6 w-6">
                        <Check className="w-3 h-3" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => rejectNode(activity.id)} className="h-6 w-6">
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                  {pendingBlocks.map(block => (
                    <div key={block.id} className="flex items-center gap-2 text-xs">
                      <span className="text-muted-foreground truncate flex-1">
                        <span className="text-foreground">New block: {block.title}</span>
                      </span>
                      <Button size="icon" variant="ghost" onClick={() => acceptNode(block.id)} className="h-6 w-6">
                        <Check className="w-3 h-3" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => rejectNode(block.id)} className="h-6 w-6">
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Next step banner — tap to open, hold 5 s to unlock premium */}
            {focusBlock && (
              <motion.button
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                onClick={handleFocusBannerClick}
                onPointerDown={startHold}
                onPointerUp={cancelHold}
                onPointerLeave={cancelHold}
                className="relative w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-primary/25 bg-primary/5 hover:bg-primary/8 hover:border-primary/40 active:scale-[0.98] transition-colors text-left overflow-hidden select-none"
              >
                {/* Hold-progress fill */}
                {holdProgress > 0 && (
                  <div
                    className="absolute inset-0 rounded-xl bg-primary/20 pointer-events-none"
                    style={{ clipPath: `inset(0 ${100 - holdProgress}% 0 0 round 12px)` }}
                  />
                )}
                <div className="relative flex items-center gap-2 min-w-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse flex-shrink-0" />
                  <span className="text-xs text-muted-foreground flex-shrink-0">Start with:</span>
                  <span className="text-sm font-semibold text-foreground truncate">{focusBlock.title}</span>
                </div>
                <ArrowRight className="relative w-4 h-4 text-primary flex-shrink-0" />
              </motion.button>
            )}

            {/* Project root */}
            <div className="flex justify-center">
              <span className="inline-block px-5 py-2 rounded-xl border border-primary/30 bg-primary/5 text-sm font-semibold text-foreground">
                {project.project_title}
              </span>
            </div>
            <div className="flex justify-center">
              <div className="w-px h-6 bg-border/60" />
            </div>

            {/* Block cards */}
            <div className="relative">
              {structure.length > 1 && (
                <div className="absolute top-0 h-px bg-border/40" style={{ left: '10%', right: '10%' }} />
              )}
              <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory">
                {visibleBlocks.map((node, idx) => {
                  const completedChildren = node.children.filter(c => c.status === "completed" || c.status === "strong").length;
                  const totalChildren = node.children.length;
                  const isCompleted = node.status === "completed";
                  const isFocus = focusBlock?.id === node.id;
                  const isDimmed = !isCompleted && !isFocus;

                  return (
                    <motion.div
                      key={node.id}
                      className="snap-start"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: isDimmed ? 0.65 : 1, y: 0 }}
                      transition={{ delay: idx * 0.05, duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
                    >
                      <div className="flex justify-center mb-2">
                        <div className="w-px h-4 bg-border/40" />
                      </div>
                      <button
                        onClick={() => handleOpenBlock(node.id)}
                        className={cn(
                          "rounded-xl border p-4 min-w-[200px] max-w-[260px] flex-shrink-0 space-y-2 text-left transition-all",
                          isCompleted
                            ? "border-green-500/30 bg-green-500/5 hover:border-green-500/50"
                            : isFocus
                            ? "border-primary/50 bg-primary/5 shadow-[0_0_20px_hsl(265_90%_62%/0.12)] hover:shadow-[0_0_28px_hsl(265_90%_62%/0.18)] hover:border-primary/70"
                            : "border-border/50 bg-card/80 backdrop-blur-sm hover:border-primary/30"
                        )}
                      >
                        {/* Title + state indicators */}
                        <div className="flex items-center gap-2">
                          {isFocus ? (
                            <motion.div
                              className="w-3 h-3 rounded-full bg-primary flex-shrink-0"
                              animate={{ scale: [1, 1.25, 1], opacity: [0.7, 1, 0.7] }}
                              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            />
                          ) : (
                            <div className={cn("w-3 h-3 rounded-full flex-shrink-0", STATUS_DOT[node.status])} />
                          )}
                          <span className="text-sm font-semibold text-foreground truncate flex-1">{node.title}</span>
                          {isCompleted && <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />}
                        </div>

                        {/* "Start here" badge on focus block */}
                        {isFocus && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary/80 bg-primary/10 px-2 py-0.5 rounded-full">
                            Start here
                          </span>
                        )}

                        {/* Activities preview */}
                        {totalChildren > 0 ? (
                          <div className="space-y-1 ml-1">
                            {node.children.slice(0, 3).map(child => (
                              <div key={child.id} className="flex items-center gap-2">
                                <div className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", STATUS_DOT[child.status])} />
                                <span className="text-xs text-muted-foreground truncate flex-1">{child.title}</span>
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
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground/60">
                            <Lightbulb className="w-3 h-3" />
                            {getBlockCta(node.title)}
                          </div>
                        )}
                      </button>
                    </motion.div>
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
    </>
  );
}
