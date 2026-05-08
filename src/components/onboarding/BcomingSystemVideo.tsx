import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ClipboardList, Compass, Globe2, MessageCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BcomingSystemVideoProps {
  onNext?: () => void;
  showActions?: boolean;
  className?: string;
}

const SCENES = [
  {
    key: "mind",
    label: "Inside the mind",
    text: "So much is happening inside: ideas, questions, doubts, gifts, and things the user cannot organize yet.",
  },
  {
    key: "phone",
    label: "They discover Bcoming",
    text: "The app becomes a calm doorway. The messy thoughts start to move toward something they can interact with.",
  },
  {
    key: "atlas",
    label: "Atlas turns chaos into dots",
    text: "What felt random becomes clusters: life events, values, skills, passions, patterns, and signals.",
  },
  {
    key: "mentors",
    label: "Mentors help narrow it down",
    text: "The connected dots feed the chats, and the mentors ask better questions until direction becomes clearer.",
  },
  {
    key: "project",
    label: "A project is born",
    text: "The dots, answers, and mentor insights connect into a mission the user can actually build.",
  },
  {
    key: "creators",
    label: "The work meets the world",
    text: "With structure and momentum, the user connects with creators building related things around the world.",
  },
] as const;

const MIND_SYMBOLS = [
  { text: "?", x: 14, y: 20, color: "text-fuchsia-300", delay: 0 },
  { text: "idea", x: 32, y: 16, color: "text-amber-200", delay: 0.08 },
  { text: "*", x: 52, y: 20, color: "text-cyan-300", delay: 0.16 },
  { text: "what if", x: 70, y: 18, color: "text-primary", delay: 0.24 },
  { text: "!", x: 22, y: 46, color: "text-orange-300", delay: 0.12 },
  { text: "talent", x: 74, y: 48, color: "text-emerald-300", delay: 0.28 },
  { text: "fear", x: 44, y: 58, color: "text-rose-300", delay: 0.2 },
  { text: "dream", x: 60, y: 70, color: "text-violet-200", delay: 0.36 },
  { text: "memory", x: 16, y: 70, color: "text-sky-200", delay: 0.32 },
];

const DOTS = [
  { label: "Values", x: 23, y: 24, color: "hsl(320 90% 62%)" },
  { label: "Skills", x: 43, y: 18, color: "hsl(190 95% 56%)" },
  { label: "Passions", x: 62, y: 28, color: "hsl(265 90% 66%)" },
  { label: "Life", x: 25, y: 57, color: "hsl(42 100% 62%)" },
  { label: "Aha", x: 50, y: 49, color: "hsl(142 78% 54%)" },
  { label: "Needs", x: 73, y: 62, color: "hsl(30 95% 57%)" },
];

const MENTOR_CARDS = [
  { title: "Pattern", line: "This keeps showing up." },
  { title: "Builder", line: "Make it smaller." },
  { title: "Vision", line: "Who does it serve?" },
];

const CREATOR_NODES = [
  { x: 18, y: 25 },
  { x: 36, y: 16 },
  { x: 62, y: 20 },
  { x: 80, y: 34 },
  { x: 72, y: 65 },
  { x: 46, y: 72 },
  { x: 24, y: 62 },
];

const sceneDuration = 3900;

const SpeechBubble = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div
    className={cn(
      "relative rounded-2xl border border-white/25 bg-white/90 px-4 py-2 text-sm font-semibold leading-tight text-slate-950 shadow-[0_12px_30px_hsl(265_90%_20%/0.24)]",
      "after:absolute after:-bottom-2 after:left-8 after:h-4 after:w-4 after:rotate-45 after:border-b after:border-r after:border-white/25 after:bg-white/90",
      className,
    )}
  >
    {children}
  </div>
);

const Character = ({ happy = false }: { happy?: boolean }) => (
  <motion.div
    className="relative h-40 w-28 sm:h-48 sm:w-32"
    animate={{ y: [0, -5, 0] }}
    transition={{ duration: 2.1, repeat: Infinity, ease: "easeInOut" }}
  >
    <div className="absolute left-1/2 top-4 h-16 w-16 -translate-x-1/2 rounded-full border border-primary/30 bg-gradient-to-br from-slate-100 to-violet-100 shadow-[0_0_32px_hsl(265_90%_62%/0.35)]">
      <span className="absolute left-4 top-6 h-1.5 w-1.5 rounded-full bg-slate-950" />
      <span className="absolute right-4 top-6 h-1.5 w-1.5 rounded-full bg-slate-950" />
      <span className={cn("absolute left-1/2 top-10 h-2 w-6 -translate-x-1/2 border-b-2 border-slate-950", happy ? "rounded-b-full" : "rounded-t-full")} />
    </div>
    <div className="absolute left-1/2 top-[4.6rem] h-20 w-16 -translate-x-1/2 rounded-[2rem] border border-primary/30 bg-primary/70 shadow-[0_0_30px_hsl(265_90%_62%/0.28)]" />
    <div className="absolute left-4 top-24 h-12 w-4 rotate-12 rounded-full bg-violet-200" />
    <div className="absolute right-4 top-24 h-12 w-4 -rotate-12 rounded-full bg-violet-200" />
    <div className="absolute bottom-0 left-9 h-14 w-4 rounded-full bg-slate-200" />
    <div className="absolute bottom-0 right-9 h-14 w-4 rounded-full bg-slate-200" />
  </motion.div>
);

const MindChaos = () => (
  <div className="absolute inset-0">
    <div className="absolute left-[8%] top-[14%] h-[70%] w-[84%] rounded-[42%] border border-fuchsia-300/20 bg-fuchsia-400/5 shadow-[inset_0_0_70px_hsl(320_90%_62%/0.13)]" />
    {MIND_SYMBOLS.map((symbol) => (
      <motion.div
        key={`${symbol.text}-${symbol.x}`}
        className={cn("absolute rounded-full border border-white/15 bg-card/55 px-3 py-1.5 text-xs font-bold backdrop-blur-sm", symbol.color)}
        style={{ left: `${symbol.x}%`, top: `${symbol.y}%` }}
        initial={{ opacity: 0, scale: 0.6, rotate: -10 }}
        animate={{ opacity: [0.45, 1, 0.45], scale: [0.9, 1.12, 0.9], rotate: [0, 4, -4, 0] }}
        transition={{ duration: 2.1, repeat: Infinity, delay: symbol.delay }}
      >
        {symbol.text}
      </motion.div>
    ))}
    <svg className="absolute inset-0 h-full w-full opacity-70">
      {MIND_SYMBOLS.slice(0, 7).map((symbol, index) => {
        const next = MIND_SYMBOLS[(index + 2) % MIND_SYMBOLS.length];
        return (
          <motion.line
            key={`${symbol.text}-${next.text}`}
            x1={`${symbol.x + 3}%`}
            y1={`${symbol.y + 3}%`}
            x2={`${next.x + 3}%`}
            y2={`${next.y + 3}%`}
            stroke="hsl(320 90% 62% / 0.35)"
            strokeWidth="1.5"
            strokeDasharray="4 8"
            animate={{ opacity: [0.2, 0.8, 0.2] }}
            transition={{ duration: 1.8, repeat: Infinity, delay: index * 0.1 }}
          />
        );
      })}
    </svg>
  </div>
);

const PhonePortal = () => (
  <motion.div
    className="absolute left-1/2 top-1/2 z-20 h-56 w-32 -translate-x-1/2 -translate-y-1/2 rounded-[2rem] border border-white/25 bg-slate-950 p-2 shadow-[0_0_60px_hsl(265_90%_62%/0.55)]"
    initial={{ opacity: 0, scale: 0.75, rotate: -8 }}
    animate={{ opacity: 1, scale: 1, rotate: 0 }}
    transition={{ type: "spring", stiffness: 220, damping: 20 }}
  >
    <div className="relative h-full overflow-hidden rounded-[1.45rem] bg-gradient-to-b from-violet-950 via-slate-950 to-cyan-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_36%,hsl(265_90%_62%/0.42),transparent_42%)]" />
      <Sparkles className="absolute left-1/2 top-12 h-9 w-9 -translate-x-1/2 text-primary drop-shadow-[0_0_18px_hsl(265_90%_62%/0.8)]" />
      <div className="absolute inset-x-4 top-28 rounded-full border border-primary/30 bg-primary/15 py-2 text-center text-sm font-bold text-white">
        Bcoming
      </div>
      <div className="absolute inset-x-5 bottom-8 h-2 rounded-full bg-white/20" />
    </div>
  </motion.div>
);

const AtlasMind = () => (
  <div className="absolute inset-0">
    <svg className="absolute inset-0 h-full w-full">
      <defs>
        <filter id="comic-gold-glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {DOTS.map((dot, index) => {
        const next = DOTS[(index + 2) % DOTS.length];
        return (
          <motion.line
            key={`${dot.label}-${next.label}`}
            x1={`${dot.x}%`}
            y1={`${dot.y}%`}
            x2={`${next.x}%`}
            y2={`${next.y}%`}
            stroke="hsl(42 100% 62% / 0.82)"
            strokeWidth={2.5}
            filter="url(#comic-gold-glow)"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.86 }}
            transition={{ duration: 0.8, delay: index * 0.1 }}
          />
        );
      })}
    </svg>
    {DOTS.map((dot, index) => (
      <motion.div
        key={dot.label}
        className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1"
        style={{ left: `${dot.x}%`, top: `${dot.y}%` }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 18, delay: index * 0.08 }}
      >
        <span
          className="h-12 w-12 rounded-full border bg-card/70 backdrop-blur-md"
          style={{
            borderColor: dot.color,
            background: `radial-gradient(circle, ${dot.color}55, hsl(262 55% 8% / 0.75))`,
            boxShadow: `0 0 30px ${dot.color}80`,
          }}
        />
        <span className="rounded-full border border-white/15 bg-card/80 px-2 py-0.5 text-[10px] font-semibold text-foreground">
          {dot.label}
        </span>
      </motion.div>
    ))}
  </div>
);

const MentorsScene = () => (
  <div className="absolute inset-0">
    <AtlasMind />
    <div className="absolute right-[7%] top-[12%] grid w-56 gap-3">
      {MENTOR_CARDS.map((card, index) => (
        <motion.div
          key={card.title}
          className="rounded-2xl border border-cyan-300/25 bg-card/80 p-3 shadow-[0_0_24px_hsl(190_95%_56%/0.22)] backdrop-blur-md"
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.12, type: "spring", stiffness: 220, damping: 22 }}
        >
          <div className="mb-1 flex items-center gap-2 text-cyan-200">
            <MessageCircle className="h-3.5 w-3.5" />
            <span className="text-xs font-bold">{card.title}</span>
          </div>
          <p className="text-xs leading-snug text-muted-foreground">{card.line}</p>
        </motion.div>
      ))}
    </div>
  </div>
);

const ProjectScene = () => (
  <div className="absolute inset-0">
    <AtlasMind />
    <motion.div
      className="absolute left-1/2 top-1/2 z-20 w-60 -translate-x-1/2 -translate-y-1/2 rotate-[-2deg] rounded-2xl border border-amber-300/50 bg-amber-100 p-5 text-slate-950 shadow-[0_0_45px_hsl(42_100%_62%/0.44)]"
      initial={{ opacity: 0, y: 24, rotate: -9 }}
      animate={{ opacity: 1, y: 0, rotate: -2 }}
      transition={{ type: "spring", stiffness: 220, damping: 20 }}
    >
      <div className="mb-3 flex items-center gap-2">
        <ClipboardList className="h-5 w-5 text-amber-700" />
        <span className="text-xs font-black uppercase tracking-widest text-amber-700">Mission</span>
      </div>
      <p className="text-lg font-black leading-tight">Build the thing your dots have been pointing toward.</p>
      <div className="mt-4 space-y-1 text-xs font-bold text-slate-700">
        <p>[x] First action</p>
        <p>[ ] Skill to learn</p>
        <p>[ ] Person to help</p>
      </div>
    </motion.div>
  </div>
);

const CreatorsScene = () => (
  <div className="absolute inset-0">
    <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-300/25 bg-emerald-300/5 shadow-[inset_0_0_60px_hsl(142_78%_54%/0.12)]" />
    <svg className="absolute inset-0 h-full w-full">
      {CREATOR_NODES.map((node, index) => (
        <motion.line
          key={`creator-line-${index}`}
          x1="50%"
          y1="50%"
          x2={`${node.x}%`}
          y2={`${node.y}%`}
          stroke="hsl(142 78% 54% / 0.58)"
          strokeWidth={2}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.8 }}
          transition={{ delay: index * 0.08 }}
        />
      ))}
    </svg>
    <motion.div
      className="absolute left-1/2 top-1/2 z-20 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-amber-300/60 bg-amber-300/20 shadow-[0_0_48px_hsl(42_100%_62%/0.55)] backdrop-blur-md"
      initial={{ scale: 0.7, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
    >
      <Globe2 className="h-9 w-9 text-amber-200" />
    </motion.div>
    {CREATOR_NODES.map((node, index) => (
      <motion.div
        key={`${node.x}-${node.y}`}
        className="absolute z-20 h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-200/40 bg-emerald-300/30 shadow-[0_0_26px_hsl(142_78%_54%/0.55)] backdrop-blur-md"
        style={{ left: `${node.x}%`, top: `${node.y}%` }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: [1, 1.08, 1] }}
        transition={{ delay: index * 0.09, duration: 1.8, repeat: Infinity }}
      />
    ))}
  </div>
);

export const BcomingSystemVideo = ({ onNext, showActions = true, className }: BcomingSystemVideoProps) => {
  const shouldReduceMotion = useReducedMotion();
  const [scene, setScene] = useState(0);
  const currentScene = SCENES[Math.min(scene, SCENES.length - 1)];
  const complete = scene >= SCENES.length - 1;

  useEffect(() => {
    if (shouldReduceMotion || complete) return;
    const timer = window.setTimeout(() => setScene((current) => current + 1), sceneDuration);
    return () => window.clearTimeout(timer);
  }, [complete, scene, shouldReduceMotion]);

  const renderScene = () => {
    switch (currentScene.key) {
      case "mind":
        return <MindChaos />;
      case "phone":
        return (
          <>
            <MindChaos />
            <PhonePortal />
          </>
        );
      case "atlas":
        return <AtlasMind />;
      case "mentors":
        return <MentorsScene />;
      case "project":
        return <ProjectScene />;
      case "creators":
        return <CreatorsScene />;
      default:
        return null;
    }
  };

  const characterLeft = ["18%", "23%", "14%", "12%", "14%", "50%"][scene] || "18%";
  const characterTop = ["64%", "66%", "65%", "66%", "70%", "76%"][scene] || "64%";
  const happy = scene >= 4;

  return (
    <div className={cn("relative w-full px-3 py-4 sm:px-5", className)}>
      <div className="relative mx-auto h-[min(780px,calc(100vh-6rem))] min-h-[660px] w-full max-w-6xl overflow-hidden rounded-2xl border border-border/60 bg-card/95 shadow-[0_0_70px_hsl(265_90%_62%/0.28)]">
        <div className="relative h-full bg-cosmic">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_36%,hsl(265_90%_62%/0.16),transparent_46%)]" />
            <div className="absolute left-6 top-6 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute bottom-10 right-10 h-48 w-48 rounded-full bg-emerald-400/10 blur-3xl" />
          </div>

          <div className="absolute left-4 top-4 z-40 flex items-center gap-2 sm:left-6 sm:top-5">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              How Bcoming Works
            </span>
          </div>

          <div className="absolute inset-x-0 bottom-[14.5rem] top-14 overflow-hidden sm:bottom-40 sm:top-16">
            <motion.div
              key={currentScene.key}
              className="absolute inset-0"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45 }}
            >
              {renderScene()}
            </motion.div>

            <motion.div
              className="absolute z-30 -translate-x-1/2 -translate-y-1/2"
              animate={{ left: characterLeft, top: characterTop }}
              transition={{ type: "spring", stiffness: 70, damping: 18 }}
            >
              {scene <= 4 && <Character happy={happy} />}
            </motion.div>

            {scene === 0 && (
              <motion.div className="absolute left-[22%] top-[18%] z-30 max-w-[14rem]" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <SpeechBubble>I have all these thoughts... but what do I do with them?</SpeechBubble>
              </motion.div>
            )}

            {scene === 1 && (
              <motion.div className="absolute right-[14%] top-[18%] z-30 max-w-[13rem]" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <SpeechBubble>This feels like a doorway.</SpeechBubble>
              </motion.div>
            )}

            {scene === 4 && (
              <motion.div className="absolute left-[28%] top-[18%] z-30 max-w-[13rem]" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <SpeechBubble>Now I know what to build next.</SpeechBubble>
              </motion.div>
            )}
          </div>

          <div className="absolute inset-x-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-40 sm:inset-x-6">
            <motion.div
              key={currentScene.key}
              className="mx-auto max-w-3xl rounded-xl border border-border/60 bg-card/80 p-4 shadow-[0_0_35px_hsl(265_90%_62%/0.18)] backdrop-blur-md"
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
