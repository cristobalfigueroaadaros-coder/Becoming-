import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Compass, Users, FlaskConical, Globe, MapPin,
  Sparkles, ArrowRight, CheckCircle2, ChevronRight, Send,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAtlas } from "@/hooks/useAtlas";
import { useIntegratorProjects } from "@/hooks/useIntegratorProjects";
import { cn } from "@/lib/utils";

// ─── Stage definitions ────────────────────────────────────────────────────────

interface Stage {
  id: string;
  icon: React.ElementType;
  name: string;
  tagline: string;
  path: string;
  detail: string;
  neverComplete?: boolean;
}

const STAGES: Stage[] = [
  {
    id: "atlas",
    icon: Compass,
    name: "Atlas",
    tagline: "Discover who you are",
    path: "/atlas",
    detail:
      "Map your identity through quests. Each dot you place is a signal — a skill, a passion, a pattern, a moment that shaped you. The more you explore, the richer every other part of the system becomes.",
    neverComplete: true,
  },
  {
    id: "council",
    icon: Users,
    name: "Council",
    tagline: "Shape your direction",
    path: "/console-thread",
    detail:
      "Seven mentors assembled around your Atlas map. They ask the hard questions, challenge your assumptions, and help you name what you actually want to build.",
  },
  {
    id: "projects",
    icon: FlaskConical,
    name: "Projects",
    tagline: "Build something meaningful",
    path: "/creation-lab",
    detail:
      "A creation lab with design thinking tools, daily goals, and a canvas to turn your idea into a real structure. This is where direction becomes work.",
  },
  {
    id: "creators",
    icon: Globe,
    name: "Creators",
    tagline: "Connect and share",
    path: "/creators",
    detail:
      "A community of people building with purpose. Share what you're creating, support others, and grow alongside people on the same kind of journey.",
  },
];

// ─── Goal lines by phase ──────────────────────────────────────────────────────

const GOAL_LINE: Record<string, string> = {
  DISCOVER: "Your goal: build a project that reflects who you are",
  GROW: "Your goal: test and validate your MVP",
  BUILD: "Your goal: land a meaningful win in the next 30 days",
};

// ─── Phase config (mirrors AtlasPage) ────────────────────────────────────────

const COUNCIL_THRESHOLDS: Record<string, number> = { DISCOVER: 4, GROW: 3, BUILD: 2 };
const PHASE1_SLUGS: Record<string, string[]> = {
  DISCOVER: ["skills", "passions", "personal-frustrations", "experiments"],
  GROW: ["skills", "passions", "personal-frustrations"],
  BUILD: ["skills", "passions"],
};

// ─── Guidance logic ───────────────────────────────────────────────────────────

function getNextAction(
  currentStageId: string,
  entryState: string,
  phase1Count: number,
  councilUnlocked: boolean,
  councilStarted: boolean,
  hasProject: boolean,
): string {
  if (!councilUnlocked) {
    const threshold = COUNCIL_THRESHOLDS[entryState] ?? 4;
    const remaining = Math.max(0, threshold - phase1Count);
    if (remaining > 0) {
      return `Complete ${remaining} more quest${remaining !== 1 ? "s" : ""} in Atlas to unlock your Council.`;
    }
    return "Your Council is ready. Go to Chats to meet your mentors.";
  }
  if (!councilStarted) {
    return "Open Chats and answer the three questions so your mentors can be assembled.";
  }
  if (!hasProject) {
    return "Your Council is shaping your direction. Check Chats to keep the conversation going.";
  }
  return "Your project is active. Open Projects to keep building and reach your next milestone.";
}

function getQuickAnswer(
  question: string,
  ctx: {
    entryState: string;
    totalDots: number;
    phase1Count: number;
    councilUnlocked: boolean;
    councilStarted: boolean;
    hasProject: boolean;
    currentStageId: string;
  },
): string {
  const q = question.toLowerCase();
  const { entryState, totalDots, councilUnlocked, councilStarted, hasProject, currentStageId, phase1Count } = ctx;

  if (/what.*do|where.*start|next step|what.*now|help|stuck/i.test(q)) {
    return getNextAction(currentStageId, entryState, phase1Count, councilUnlocked, councilStarted, hasProject);
  }
  if (/atlas|quest|dot/i.test(q)) {
    return `Atlas is your identity map. Each quest adds a dot — a real signal about who you are. You have ${totalDots} so far. The richer your map, the more personalized everything else becomes.`;
  }
  if (/council|mentor|chat/i.test(q)) {
    if (!councilUnlocked) return "Your Council unlocks once you've explored enough of Atlas. Keep going with the quests.";
    if (!councilStarted) return "Your Council is ready. Open Chats and answer three questions to assemble the right mentors for you.";
    return "Your Council is seven mentors shaped by your Atlas map. They help you think, decide, and move on your project.";
  }
  if (/project|creat|build|lab/i.test(q)) {
    return "Your project emerges from the Council process. Once your mentors have enough context, they'll help you shape something real you can start building in the Creation Lab.";
  }
  if (/creator|community|social/i.test(q)) {
    return "Creators is the community layer. Once you have a project, you can share it, get feedback, and connect with others building purposeful things.";
  }
  if (/how.*work|system|app|everything/i.test(q)) {
    return "The system is a loop. Atlas helps you understand yourself. Council helps you decide what to build. Projects is where you build it. Creators is where you share it. Each stage feeds the next.";
  }
  if (/goal|phase|discover|grow/i.test(q)) {
    return GOAL_LINE[entryState] || GOAL_LINE.DISCOVER;
  }
  return "The best next step is always to keep exploring Atlas. The more dots you place, the better your Council conversations and project direction will be.";
}

// ─── Component ────────────────────────────────────────────────────────────────

export const JourneyPanel = () => {
  const [open, setOpen] = useState(false);
  const [expandedStageId, setExpandedStageId] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [pulse, setPulse] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const { totalDots, clusters } = useAtlas();
  const { projects } = useIntegratorProjects();

  const hasProject = Array.isArray(projects) && projects.length > 0;
  const entryState: string = profile?.entry_state || "DISCOVER";
  const councilStarted: boolean = !!profile?.console_intake_completed;

  const phase1Slugs = PHASE1_SLUGS[entryState] ?? PHASE1_SLUGS.DISCOVER;
  const phase1Count = phase1Slugs.filter(
    slug => (clusters.find(c => c.slug === slug)?.dotCount ?? 0) > 0,
  ).length;
  const councilUnlocked = phase1Count >= (COUNCIL_THRESHOLDS[entryState] ?? 4);

  // Derive current stage
  const currentStageId: string = (() => {
    if (hasProject) return "creators";
    if (councilStarted) return "projects";
    if (councilUnlocked) return "council";
    return "atlas";
  })();

  // Fetch profile (called on mount and every time the panel opens)
  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("entry_state, console_intake_completed" as any)
      .eq("id", user.id)
      .single();
    setProfile(data);
  };

  useEffect(() => { fetchProfile(); }, []);

  // Pulse when dots increased or stage advanced since panel was last opened
  useEffect(() => {
    const lastSeen = parseInt(localStorage.getItem("journey_seen_dots") || "-1");
    if (totalDots > lastSeen) setPulse(true);
  }, [totalDots]);

  useEffect(() => {
    const lastStage = localStorage.getItem("journey_seen_stage");
    if (lastStage && lastStage !== currentStageId) setPulse(true);
  }, [currentStageId]);

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      fetchProfile();
      setPulse(false);
      localStorage.setItem("journey_seen_dots", String(totalDots));
      localStorage.setItem("journey_seen_stage", currentStageId);
      setAnswer(null);
      setQuestion("");
    }
  };

  const handleAsk = () => {
    if (!question.trim()) return;
    const ctx = { entryState, totalDots, phase1Count, councilUnlocked, councilStarted, hasProject, currentStageId };
    setAnswer(getQuickAnswer(question.trim(), ctx));
    setQuestion("");
  };

  const stageStateFor = (stageId: string): "completed" | "current" | "upcoming" => {
    const order = STAGES.map(s => s.id);
    const currentIdx = order.indexOf(currentStageId);
    const thisIdx = order.indexOf(stageId);
    if (thisIdx < currentIdx) return "completed";
    if (thisIdx === currentIdx) return "current";
    return "upcoming";
  };

  const isChatPage = ["/council", "/chat", "/console-thread"].some(p => location.pathname.includes(p));
  const isAtlasPage = location.pathname === "/atlas";
  const buttonBottom = isAtlasPage || isChatPage ? "bottom-36" : "bottom-24";

  return (
    <>
      {/* Floating trigger */}
      <button
        onClick={() => handleOpen(true)}
        className={cn(
          "fixed right-4 z-40 flex items-center gap-1.5 px-3 h-9 rounded-full",
          "bg-background/90 backdrop-blur-sm border border-primary/30",
          "text-primary hover:bg-primary/10 transition-all duration-200",
          "shadow-[0_0_14px_hsl(265_90%_62%/0.2)]",
          buttonBottom,
        )}
      >
        <div className="relative">
          <MapPin className="w-4 h-4" />
          {pulse && (
            <motion.span
              className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-primary"
              animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            />
          )}
        </div>
        <span className="text-xs font-medium">Journey</span>
      </button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => handleOpen(false)}
            />

            {/* Bottom sheet */}
            <motion.div
              className="fixed bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-2xl bg-background border-t border-border/40"
              style={{ height: "82vh" }}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 280 }}
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1 shrink-0">
                <div className="w-10 h-1 rounded-full bg-muted-foreground/25" />
              </div>

              {/* Header */}
              <div className="px-5 pt-2 pb-4 border-b border-border/40 shrink-0">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      Your Journey
                    </h2>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                      {GOAL_LINE[entryState] || GOAL_LINE.DISCOVER}
                    </p>
                  </div>
                  <button
                    onClick={() => handleOpen(false)}
                    className="text-[11px] text-muted-foreground px-2 py-1 rounded-lg hover:bg-muted/50 transition-colors mt-0.5"
                  >
                    Close
                  </button>
                </div>
              </div>

              {/* Scrollable track */}
              <div className="flex-1 overflow-y-auto px-5 py-4">

                {/* Stage track */}
                <div className="relative">
                  {/* Vertical line */}
                  <div
                    className="absolute left-[19px] top-5 w-px"
                    style={{
                      bottom: "20px",
                      background: "linear-gradient(to bottom, hsl(265 90% 62% / 0.5), hsl(265 90% 62% / 0.08))",
                    }}
                  />

                  <div className="space-y-0">
                    {STAGES.map((stage) => {
                      const state = stageStateFor(stage.id);
                      const isExpanded = expandedStageId === stage.id;
                      const Icon = stage.icon;
                      const isCurrent = state === "current";
                      const isCompleted = state === "completed";
                      const isUpcoming = state === "upcoming";

                      return (
                        <div key={stage.id}>
                          <button
                            className="relative z-10 w-full flex items-start gap-3 py-3 text-left"
                            onClick={() => setExpandedStageId(isExpanded ? null : stage.id)}
                          >
                            {/* Node */}
                            <div className="relative shrink-0">
                              <div
                                className={cn(
                                  "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                                  isCurrent && "border-primary bg-primary/15 shadow-[0_0_16px_hsl(265_90%_62%/0.45)]",
                                  isCompleted && "border-primary bg-primary",
                                  isUpcoming && "border-muted-foreground/20 bg-background",
                                )}
                              >
                                {isCompleted ? (
                                  <CheckCircle2 className="w-4 h-4 text-white" />
                                ) : (
                                  <Icon
                                    className={cn(
                                      "w-4 h-4",
                                      isCurrent && "text-primary",
                                      isUpcoming && "text-muted-foreground/30",
                                    )}
                                  />
                                )}
                              </div>
                              {/* Pulse ring on current */}
                              {isCurrent && (
                                <motion.div
                                  className="absolute inset-0 rounded-full border-2 border-primary pointer-events-none"
                                  animate={{ scale: [1, 1.4], opacity: [0.5, 0] }}
                                  transition={{ duration: 1.8, repeat: Infinity }}
                                />
                              )}
                            </div>

                            {/* Labels */}
                            <div className="flex-1 min-w-0 pt-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span
                                  className={cn(
                                    "text-sm font-semibold",
                                    isCurrent && "text-primary",
                                    isCompleted && "text-foreground",
                                    isUpcoming && "text-muted-foreground/40",
                                  )}
                                >
                                  {stage.name}
                                </span>

                                {/* Atlas dot count badge — always visible */}
                                {stage.id === "atlas" && totalDots > 0 && (
                                  <span className="text-[10px] text-primary/80 bg-primary/10 px-1.5 py-0.5 rounded-full border border-primary/20">
                                    {totalDots} dot{totalDots !== 1 ? "s" : ""}
                                  </span>
                                )}

                                {/* "Now" badge */}
                                {isCurrent && (
                                  <span className="text-[10px] text-primary/80 bg-primary/10 px-1.5 py-0.5 rounded-full border border-primary/20">
                                    Now
                                  </span>
                                )}
                              </div>

                              <p
                                className={cn(
                                  "text-[11px] mt-0.5 leading-snug",
                                  isUpcoming ? "text-muted-foreground/35" : "text-muted-foreground",
                                )}
                              >
                                {stage.tagline}
                              </p>
                            </div>

                            <ChevronRight
                              className={cn(
                                "w-3.5 h-3.5 mt-2.5 shrink-0 text-muted-foreground/30 transition-transform duration-200",
                                isExpanded && "rotate-90 text-primary/60",
                              )}
                            />
                          </button>

                          {/* Expanded detail */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.22 }}
                                className="overflow-hidden"
                              >
                                <div className="ml-[52px] pb-4 pr-1">
                                  <div
                                    className="p-3 rounded-xl text-[12px] text-muted-foreground leading-relaxed border"
                                    style={{
                                      backgroundColor: "hsl(265 90% 62% / 0.05)",
                                      borderColor: "hsl(265 90% 62% / 0.15)",
                                    }}
                                  >
                                    {stage.detail}

                                    {!isUpcoming && (
                                      <button
                                        onClick={() => { handleOpen(false); navigate(stage.path); }}
                                        className="mt-3 flex items-center gap-1 text-primary text-[11px] font-medium"
                                      >
                                        Go to {stage.name} <ArrowRight className="w-3 h-3" />
                                      </button>
                                    )}

                                    {isUpcoming && (
                                      <p className="mt-2 text-[11px] text-muted-foreground/50 italic">
                                        This unlocks as you progress through the journey.
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* What to do next */}
                <div
                  className="mt-4 p-3.5 rounded-xl border"
                  style={{
                    backgroundColor: "hsl(265 90% 62% / 0.06)",
                    borderColor: "hsl(265 90% 62% / 0.18)",
                  }}
                >
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                    <p className="text-[12px] text-foreground/80 leading-relaxed">
                      {getNextAction(currentStageId, entryState, phase1Count, councilUnlocked, councilStarted, hasProject)}
                    </p>
                  </div>
                </div>

                {/* Answer from chat */}
                <AnimatePresence>
                  {answer && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="mt-3 p-3 rounded-xl bg-muted/50 border border-border/40"
                    >
                      <p className="text-[12px] text-foreground/80 leading-relaxed">{answer}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Bottom spacer so content clears the chat input */}
                <div className="h-4" />
              </div>

              {/* Sticky chat input */}
              <div className="shrink-0 px-4 pb-6 pt-3 border-t border-border/30 bg-background">
                <div className="flex items-center gap-2 bg-muted/50 rounded-full px-4 py-2.5 border border-border/40 focus-within:border-primary/40 transition-colors">
                  <input
                    ref={inputRef}
                    value={question}
                    onChange={e => setQuestion(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleAsk()}
                    placeholder="Not sure what to do? Ask."
                    className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground/45 focus:outline-none text-foreground"
                  />
                  <button
                    onClick={handleAsk}
                    disabled={!question.trim()}
                    className="shrink-0 text-primary disabled:text-muted-foreground/25 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
