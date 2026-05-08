import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Brain, ClipboardList, Compass, Globe2, MessageCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BcomingSystemVideoProps {
  onNext?: () => void;
  showActions?: boolean;
  className?: string;
}

const SCENES = [
  {
    key: "chaos",
    label: "A mind full of dots",
    text: "Ideas, doubts, memories, talents, and questions arrive all at once.",
  },
  {
    key: "atlas",
    label: "Atlas gives them shape",
    text: "The chaos becomes clusters: values, skills, passions, patterns, and lived experience.",
  },
  {
    key: "mentors",
    label: "Mentors read the signal",
    text: "Chats use the Atlas to ask better questions and narrow what matters.",
  },
  {
    key: "project",
    label: "A mission appears",
    text: "The user receives a project direction, structure, and the next action to take.",
  },
  {
    key: "creators",
    label: "The path meets the world",
    text: "Creators connect the user with people building, learning, and moving in the same direction.",
  },
] as const;

const FLOW = [
  { id: "chaos", icon: Brain, label: "Mind", x: 12, y: 50, color: "hsl(320 90% 62%)" },
  { id: "atlas", icon: Compass, label: "Atlas", x: 34, y: 42, color: "hsl(265 90% 66%)" },
  { id: "mentors", icon: MessageCircle, label: "Chats", x: 56, y: 48, color: "hsl(190 95% 56%)" },
  { id: "project", icon: ClipboardList, label: "Project", x: 74, y: 40, color: "hsl(42 100% 62%)" },
  { id: "creators", icon: Globe2, label: "Creators", x: 88, y: 55, color: "hsl(142 78% 54%)" },
];

const CHAOS_MARKS = Array.from({ length: 18 }, (_, index) => ({
  id: index,
  angle: index * 38,
  radius: 34 + (index % 5) * 10,
  delay: index * 0.06,
  size: 5 + (index % 4) * 2,
  color: ["bg-primary", "bg-fuchsia-400", "bg-cyan-400", "bg-amber-300"][index % 4],
}));

const ATLAS_DOTS = [
  { x: 23, y: 27, color: "hsl(320 90% 62%)" },
  { x: 34, y: 20, color: "hsl(265 90% 66%)" },
  { x: 47, y: 28, color: "hsl(190 95% 56%)" },
  { x: 25, y: 56, color: "hsl(42 100% 62%)" },
  { x: 40, y: 49, color: "hsl(142 78% 54%)" },
  { x: 52, y: 61, color: "hsl(30 95% 57%)" },
];

const MENTORS = ["Clarity", "Builder", "Vision", "Pattern"];
const CREATOR_NODES = [
  { x: 72, y: 22 },
  { x: 86, y: 26 },
  { x: 94, y: 44 },
  { x: 80, y: 68 },
  { x: 63, y: 60 },
];

export const BcomingSystemVideo = ({ onNext, showActions = true, className }: BcomingSystemVideoProps) => {
  const shouldReduceMotion = useReducedMotion();
  const [scene, setScene] = useState(0);
  const currentScene = SCENES[Math.min(scene, SCENES.length - 1)];
  const complete = scene >= SCENES.length - 1;

  useEffect(() => {
    if (shouldReduceMotion || complete) return;
    const timer = window.setTimeout(() => setScene((current) => current + 1), 4200);
    return () => window.clearTimeout(timer);
  }, [complete, scene, shouldReduceMotion]);

  const activeFlowIndex = shouldReduceMotion ? FLOW.length - 1 : scene;
  const traveler = FLOW[Math.min(activeFlowIndex, FLOW.length - 1)];

  const visibleConnections = useMemo(
    () => FLOW.slice(0, Math.min(activeFlowIndex + 1, FLOW.length - 1)),
    [activeFlowIndex],
  );

  return (
    <div className={cn("relative w-full px-3 py-4 sm:px-5", className)}>
      <div className="relative mx-auto h-[min(760px,calc(100vh-7rem))] min-h-[640px] w-full max-w-6xl overflow-hidden rounded-2xl border border-border/60 bg-card/95 shadow-[0_0_70px_hsl(265_90%_62%/0.28)]">
        <div className="relative h-full bg-cosmic">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_45%_38%,hsl(265_90%_62%/0.16),transparent_44%)]" />
            <div className="absolute left-6 top-6 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute bottom-10 right-10 h-48 w-48 rounded-full bg-emerald-400/10 blur-3xl" />
          </div>

          <div className="absolute left-4 top-4 z-30 flex items-center gap-2 sm:left-6 sm:top-5">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              How Bcoming Works
            </span>
          </div>

          <div className="absolute inset-x-0 bottom-[14rem] top-14 sm:bottom-36 sm:top-16">
            <svg className="absolute inset-0 h-full w-full pointer-events-none" style={{ zIndex: 1 }}>
              <defs>
                <filter id="system-video-glow">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <linearGradient id="system-video-flow" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="hsl(265 90% 66%)" />
                  <stop offset="48%" stopColor="hsl(190 95% 56%)" />
                  <stop offset="100%" stopColor="hsl(42 100% 62%)" />
                </linearGradient>
              </defs>
              {visibleConnections.map((item, index) => {
                const next = FLOW[index + 1];
                if (!next) return null;
                return (
                  <motion.line
                    key={item.id}
                    x1={`${item.x}%`}
                    y1={`${item.y}%`}
                    x2={`${next.x}%`}
                    y2={`${next.y}%`}
                    stroke="url(#system-video-flow)"
                    strokeWidth={3}
                    strokeLinecap="round"
                    filter="url(#system-video-glow)"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 0.82 }}
                    transition={{ duration: shouldReduceMotion ? 0 : 0.8 }}
                  />
                );
              })}
            </svg>

            {FLOW.map((item, index) => {
              const Icon = item.icon;
              const isActive = index <= activeFlowIndex;
              return (
                <motion.div
                  key={item.id}
                  className="absolute z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2"
                  style={{ left: `${item.x}%`, top: `${item.y}%` }}
                  initial={{ opacity: 0, scale: 0.72 }}
                  animate={{ opacity: isActive ? 1 : 0.32, scale: isActive ? 1 : 0.78 }}
                  transition={{ type: "spring", stiffness: 220, damping: 22 }}
                >
                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-full border bg-background/55 backdrop-blur-md sm:h-16 sm:w-16"
                    style={{
                      borderColor: `${item.color}aa`,
                      boxShadow: isActive ? `0 0 32px ${item.color}66` : `0 0 12px ${item.color}22`,
                    }}
                  >
                    <Icon className="h-6 w-6" style={{ color: item.color }} />
                  </div>
                  <span className="rounded-full border border-border/50 bg-card/70 px-2 py-0.5 text-[10px] font-semibold text-foreground backdrop-blur-sm">
                    {item.label}
                  </span>
                </motion.div>
              );
            })}

            <motion.div
              className="absolute z-20 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
              animate={{ left: `${traveler.x}%`, top: `${traveler.y + 18}%` }}
              transition={{ type: "spring", stiffness: 80, damping: 18 }}
            >
              <motion.div
                className="relative flex h-16 w-16 items-center justify-center rounded-full border border-primary/40 bg-background/70 shadow-[0_0_34px_hsl(265_90%_62%/0.4)] backdrop-blur-md"
                animate={{ y: shouldReduceMotion ? 0 : [0, -4, 0] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              >
                <span className="h-7 w-7 rounded-full bg-gradient-to-br from-primary via-cyan-300 to-amber-200 shadow-[0_0_24px_hsl(190_95%_56%/0.55)]" />
                <span className="absolute -bottom-2 h-3 w-9 rounded-full bg-primary/20 blur-sm" />
              </motion.div>
            </motion.div>

            {activeFlowIndex === 0 && (
              <div className="absolute left-[12%] top-[50%] z-20">
                {CHAOS_MARKS.map((mark) => (
                  <motion.span
                    key={mark.id}
                    className={cn("absolute rounded-full shadow-[0_0_14px_currentColor]", mark.color)}
                    style={{
                      width: mark.size,
                      height: mark.size,
                      left: Math.cos((mark.angle * Math.PI) / 180) * mark.radius,
                      top: Math.sin((mark.angle * Math.PI) / 180) * mark.radius,
                    }}
                    animate={{ scale: [0.7, 1.35, 0.7], opacity: [0.35, 1, 0.35], rotate: 180 }}
                    transition={{ duration: 1.8, repeat: Infinity, delay: mark.delay }}
                  />
                ))}
              </div>
            )}

            {activeFlowIndex >= 1 && (
              <div className="absolute inset-0 z-20 pointer-events-none">
                {ATLAS_DOTS.map((dot, index) => (
                  <motion.span
                    key={`${dot.x}-${dot.y}`}
                    className="absolute h-3 w-3 rounded-full"
                    style={{
                      left: `${dot.x}%`,
                      top: `${dot.y}%`,
                      backgroundColor: dot.color,
                      boxShadow: `0 0 18px ${dot.color}`,
                    }}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.08, type: "spring", stiffness: 240, damping: 18 }}
                  />
                ))}
              </div>
            )}

            {activeFlowIndex >= 2 && (
              <div className="absolute left-[48%] top-[18%] z-20 grid grid-cols-2 gap-2 sm:left-[50%]">
                {MENTORS.map((mentor, index) => (
                  <motion.div
                    key={mentor}
                    className="rounded-xl border border-cyan-300/25 bg-card/70 px-3 py-2 text-xs font-semibold text-cyan-100 shadow-[0_0_18px_hsl(190_95%_56%/0.18)] backdrop-blur-md"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.08 }}
                  >
                    {mentor}
                  </motion.div>
                ))}
              </div>
            )}

            {activeFlowIndex >= 3 && (
              <motion.div
                className="absolute left-[64%] top-[62%] z-20 w-48 rotate-[-3deg] rounded-xl border border-amber-300/40 bg-amber-100/90 p-4 text-slate-950 shadow-[0_0_32px_hsl(42_100%_62%/0.36)]"
                initial={{ opacity: 0, y: 18, rotate: -10 }}
                animate={{ opacity: 1, y: 0, rotate: -3 }}
                transition={{ type: "spring", stiffness: 220, damping: 20 }}
              >
                <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700">Mission note</p>
                <p className="mt-1 text-sm font-bold leading-tight">Build from what your dots keep revealing.</p>
              </motion.div>
            )}

            {activeFlowIndex >= 4 && (
              <div className="absolute inset-0 z-20 pointer-events-none">
                {CREATOR_NODES.map((node, index) => (
                  <motion.div
                    key={`${node.x}-${node.y}`}
                    className="absolute h-4 w-4 rounded-full bg-emerald-300 shadow-[0_0_20px_hsl(142_78%_54%/0.8)]"
                    style={{ left: `${node.x}%`, top: `${node.y}%` }}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: [1, 1.25, 1] }}
                    transition={{ delay: index * 0.1, duration: 1.8, repeat: Infinity }}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="absolute inset-x-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-30 sm:inset-x-6">
            <motion.div
              key={currentScene.key}
              className="mx-auto max-w-3xl rounded-xl border border-border/60 bg-card/75 p-4 shadow-[0_0_35px_hsl(265_90%_62%/0.18)] backdrop-blur-md"
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 240, damping: 24 }}
            >
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-xs font-mono text-muted-foreground">
                  {String(Math.min(scene + 1, SCENES.length)).padStart(2, "0")} / {String(SCENES.length).padStart(2, "0")}
                </span>
                <span className="rounded-full border border-primary/30 bg-primary/15 px-2 py-0.5 text-[10px] uppercase tracking-wider text-primary">
                  System
                </span>
              </div>
              <h2 className="text-sm font-semibold leading-snug text-foreground sm:text-base">
                {currentScene.label}
              </h2>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                {currentScene.text}
              </p>

              {showActions && (complete || shouldReduceMotion) && (
                <motion.div
                  className="mt-4 flex gap-2 rounded-full border border-border/50 bg-background/55 p-2 backdrop-blur-md"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Button onClick={onNext} size="lg" className="h-11 flex-1 rounded-full gap-2">
                    Start my quest
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button onClick={onNext} variant="ghost" className="h-11 rounded-full px-5 text-muted-foreground">
                    Skip
                  </Button>
                </motion.div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};
