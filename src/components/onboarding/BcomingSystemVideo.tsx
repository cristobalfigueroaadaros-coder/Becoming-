import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  BriefcaseBusiness,
  Compass,
  Lightbulb,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BcomingSystemVideoProps {
  onNext?: () => void;
  showActions?: boolean;
  className?: string;
}

type SceneKind = "chaos" | "paths" | "atlas" | "mentors" | "project" | "creators" | "together";

interface SceneConfig {
  id: SceneKind;
  eyebrow: string;
  title: string;
  line: string;
  image: string;
  duration: number;
  zoom: [number, number];
  pan: [string, string];
  glow: string;
}

const SCENES: SceneConfig[] = [
  {
    id: "chaos",
    eyebrow: "The problem",
    title: "Too much inside. No clear next step.",
    line: "Ideas, pressure, doubts, dreams. Bcoming starts where life actually feels confusing.",
    image: "/bcoming-system-video/scene1.png",
    duration: 5600,
    zoom: [1.08, 1.16],
    pan: ["50% 48%", "51% 46%"],
    glow: "radial-gradient(circle at 48% 34%, hsl(320 90% 62% / 0.20), hsl(265 90% 62% / 0.12) 34%, transparent 62%)",
  },
  {
    id: "paths",
    eyebrow: "It adapts",
    title: "Lost, idea, or already building.",
    line: "You do not need to fit the app. Bcoming adapts to the phase you are in right now.",
    image: "/bcoming-system-video/scene2.png",
    duration: 7600,
    zoom: [1.06, 1.12],
    pan: ["53% 50%", "56% 47%"],
    glow: "radial-gradient(circle at 61% 42%, hsl(265 90% 62% / 0.26), hsl(320 90% 62% / 0.14) 34%, transparent 65%)",
  },
  {
    id: "atlas",
    eyebrow: "Atlas",
    title: "Your life becomes a map.",
    line: "Experiences, passions, skills, values, and patterns become dots you can finally see.",
    image: "/bcoming-system-video/scene3.png",
    duration: 6200,
    zoom: [1.04, 1.1],
    pan: ["49% 50%", "52% 49%"],
    glow: "radial-gradient(circle at 54% 45%, hsl(190 95% 56% / 0.2), hsl(265 90% 62% / 0.14) 38%, transparent 68%)",
  },
  {
    id: "mentors",
    eyebrow: "Guidance",
    title: "Mentors turn patterns into direction.",
    line: "The system helps you understand what matters, what to focus on, and what to do next.",
    image: "/bcoming-system-video/scene4.png",
    duration: 5800,
    zoom: [1.04, 1.1],
    pan: ["50% 50%", "48% 48%"],
    glow: "radial-gradient(circle at 50% 52%, hsl(265 90% 62% / 0.23), hsl(190 95% 56% / 0.12) 36%, transparent 66%)",
  },
  {
    id: "project",
    eyebrow: "Creation",
    title: "Direction becomes a project.",
    line: "A mission, a roadmap, and a concrete next action replace the feeling of being stuck.",
    image: "/bcoming-system-video/scene5.png",
    duration: 6000,
    zoom: [1.03, 1.08],
    pan: ["50% 50%", "52% 48%"],
    glow: "radial-gradient(circle at 58% 46%, hsl(42 100% 62% / 0.22), hsl(30 95% 57% / 0.13) 36%, transparent 68%)",
  },
  {
    id: "creators",
    eyebrow: "Momentum",
    title: "Build something meaningful.",
    line: "Your Atlas, mentors, and project connect into a system that helps you keep moving.",
    image: "/bcoming-system-video/scene6.png",
    duration: 6000,
    zoom: [1.02, 1.07],
    pan: ["50% 50%", "50% 47%"],
    glow: "radial-gradient(circle at 50% 47%, hsl(42 100% 62% / 0.22), hsl(142 78% 54% / 0.14) 38%, transparent 72%)",
  },
  {
    id: "together",
    eyebrow: "Bcoming",
    title: "A social network for conscious creators.",
    line: "A place for people building from purpose to connect, collaborate, and create what matters.",
    image: "/bcoming-system-video/scene7.png",
    duration: 7000,
    zoom: [1.03, 1.08],
    pan: ["50% 50%", "52% 48%"],
    glow: "radial-gradient(circle at 50% 48%, hsl(42 100% 62% / 0.24), hsl(265 90% 62% / 0.14) 36%, transparent 70%)",
  },
];

const PATHS = [
  {
    id: "lost",
    label: "I feel lost",
    text: "Discover your dots and find a first direction.",
    icon: Compass,
    accent: "text-cyan-200",
    ring: "border-cyan-300/40 bg-cyan-300/10",
  },
  {
    id: "idea",
    label: "I have an idea",
    text: "Shape it into a project you can test and build.",
    icon: Lightbulb,
    accent: "text-amber-200",
    ring: "border-amber-300/40 bg-amber-300/10",
  },
  {
    id: "business",
    label: "I am building",
    text: "Get focus, strategy, and the next meaningful move.",
    icon: BriefcaseBusiness,
    accent: "text-emerald-200",
    ring: "border-emerald-300/40 bg-emerald-300/10",
  },
];

const FLOW = [
  { label: "Atlas", icon: Sparkles },
  { label: "Mentors", icon: Users },
  { label: "Project", icon: Lightbulb },
  { label: "Creators", icon: Compass },
];

const PARTICLE_POSITIONS = [
  { x: 9, y: 20, size: 5, delay: 0 },
  { x: 18, y: 72, size: 8, delay: 0.3 },
  { x: 28, y: 38, size: 4, delay: 0.6 },
  { x: 39, y: 17, size: 7, delay: 0.1 },
  { x: 48, y: 64, size: 5, delay: 0.8 },
  { x: 61, y: 27, size: 9, delay: 0.2 },
  { x: 70, y: 54, size: 4, delay: 1 },
  { x: 84, y: 21, size: 6, delay: 0.45 },
  { x: 91, y: 78, size: 8, delay: 0.7 },
  { x: 76, y: 83, size: 5, delay: 1.1 },
  { x: 52, y: 39, size: 4, delay: 1.3 },
  { x: 34, y: 82, size: 6, delay: 1.45 },
];

const particleColorByScene: Record<SceneKind, string> = {
  chaos: "bg-fuchsia-300 shadow-[0_0_18px_hsl(320_90%_62%/0.75)]",
  paths: "bg-primary shadow-[0_0_18px_hsl(265_90%_62%/0.78)]",
  atlas: "bg-cyan-300 shadow-[0_0_18px_hsl(190_95%_56%/0.78)]",
  mentors: "bg-violet-200 shadow-[0_0_18px_hsl(265_90%_72%/0.78)]",
  project: "bg-amber-300 shadow-[0_0_18px_hsl(42_100%_62%/0.78)]",
  creators: "bg-emerald-300 shadow-[0_0_18px_hsl(142_78%_54%/0.75)]",
  together: "bg-amber-200 shadow-[0_0_18px_hsl(42_100%_72%/0.78)]",
};

const SceneParticles = ({ scene }: { scene: SceneKind }) => {
  const particleColor = particleColorByScene[scene];
  const isChaos = scene === "chaos";

  return (
    <div className="pointer-events-none absolute inset-0">
      {PARTICLE_POSITIONS.map((particle, index) => (
        <motion.span
          key={`${scene}-${particle.x}-${particle.y}`}
          className={cn("absolute rounded-full", particleColor)}
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
          }}
          initial={{ opacity: 0, scale: 0.4 }}
          animate={{
            opacity: [0, 0.85, 0.4, 0.85],
            scale: isChaos ? [0.7, 1.5, 0.8] : [0.75, 1.12, 0.95],
            x: isChaos ? [0, index % 2 ? -16 : 18, 0] : [0, index % 2 ? 7 : -7, 0],
            y: isChaos ? [0, index % 2 ? 12 : -14, 0] : [0, index % 2 ? -6 : 7, 0],
          }}
          transition={{ duration: isChaos ? 2.1 : 3.1, delay: particle.delay, repeat: Infinity }}
        />
      ))}
    </div>
  );
};

const AdaptivePathCards = ({ activePath, onSelect }: { activePath: string; onSelect: (path: string) => void }) => (
  <motion.div
    className="grid gap-2 sm:grid-cols-3"
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.25, duration: 0.5 }}
  >
    {PATHS.map((path) => {
      const Icon = path.icon;
      const isActive = activePath === path.id;
      return (
        <button
          key={path.id}
          type="button"
          onClick={() => onSelect(path.id)}
          className={cn(
            "group rounded-xl border p-3 text-left text-white/78 transition hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/10",
            isActive ? path.ring : "border-white/12 bg-white/6",
          )}
        >
          <div className="mb-2 flex items-center gap-2">
            <Icon className={cn("h-4 w-4", path.accent)} />
            <span className="text-sm font-semibold text-white">{path.label}</span>
          </div>
          <p className="text-xs leading-relaxed text-white/66">{path.text}</p>
        </button>
      );
    })}
  </motion.div>
);

const SystemFlow = ({ scene }: { scene: SceneKind }) => {
  const activeIndex = Math.max(
    0,
    ["atlas", "mentors", "project", "creators", "together"].indexOf(scene),
  );

  if (scene === "chaos" || scene === "paths") return null;

  return (
    <motion.div
      className="mt-4 flex flex-wrap items-center gap-2 rounded-full border border-white/12 bg-white/7 p-2 backdrop-blur-md"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {FLOW.map((step, index) => {
        const Icon = step.icon;
        const isActive = index <= activeIndex;
        return (
          <div key={step.label} className="flex items-center gap-2">
            <span
              className={cn(
                "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition",
                isActive ? "bg-primary/25 text-white" : "text-white/40",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {step.label}
            </span>
            {index < FLOW.length - 1 && <ArrowRight className="h-3.5 w-3.5 text-white/28" />}
          </div>
        );
      })}
    </motion.div>
  );
};

export const BcomingSystemVideo = ({ onNext, showActions = true, className }: BcomingSystemVideoProps) => {
  const shouldReduceMotion = useReducedMotion();
  const [sceneIndex, setSceneIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [activePath, setActivePath] = useState(PATHS[0].id);
  const currentScene = SCENES[sceneIndex];
  const isComplete = sceneIndex === SCENES.length - 1;

  useEffect(() => {
    if (shouldReduceMotion || !isPlaying || isComplete) return;

    const timer = window.setTimeout(() => {
      setSceneIndex((current) => Math.min(current + 1, SCENES.length - 1));
    }, currentScene.duration);

    return () => window.clearTimeout(timer);
  }, [currentScene.duration, isComplete, isPlaying, sceneIndex, shouldReduceMotion]);

  const totalDuration = useMemo(() => SCENES.reduce((sum, scene) => sum + scene.duration, 0), []);
  const elapsedBeforeScene = useMemo(
    () => SCENES.slice(0, sceneIndex).reduce((sum, scene) => sum + scene.duration, 0),
    [sceneIndex],
  );
  const progress = isComplete ? 100 : (elapsedBeforeScene / totalDuration) * 100;

  const restart = () => {
    setSceneIndex(0);
    setIsPlaying(true);
    setActivePath(PATHS[0].id);
  };

  return (
    <div className={cn("relative w-full px-3 py-3 sm:px-5", className)}>
      <div className="relative mx-auto aspect-[16/9] min-h-[440px] w-full max-w-6xl overflow-hidden rounded-2xl border border-white/15 bg-slate-950 shadow-[0_0_70px_hsl(265_90%_62%/0.34)] sm:min-h-[620px]">
        <motion.div
          key={currentScene.id}
          className="absolute inset-0"
          initial={{ opacity: 0, scale: currentScene.zoom[0] - 0.02 }}
          animate={{ opacity: 1, scale: currentScene.zoom[1], backgroundPosition: currentScene.pan[1] }}
          transition={{ opacity: { duration: 0.65 }, scale: { duration: currentScene.duration / 1000, ease: "easeOut" } }}
          style={{
            backgroundImage: `url(${currentScene.image})`,
            backgroundSize: "cover",
            backgroundPosition: currentScene.pan[0],
            filter: "saturate(0.95) contrast(0.95)",
          }}
        />

        <div className="absolute inset-0 bg-[linear-gradient(90deg,hsl(262_55%_8%/0.72),hsl(262_55%_8%/0.38)_45%,hsl(262_55%_8%/0.72)),linear-gradient(180deg,hsl(262_55%_8%/0.16),hsl(262_55%_8%/0.34)_52%,hsl(262_55%_8%/0.86))]" />
        <div className="absolute inset-0" style={{ background: currentScene.glow }} />
        <SceneParticles scene={currentScene.id} />

        <motion.div
          key={`${currentScene.id}-light`}
          className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/2 rotate-12 bg-gradient-to-r from-transparent via-white/14 to-transparent blur-md"
          initial={{ x: "-30%", opacity: 0 }}
          animate={{ x: "260%", opacity: [0, 0.4, 0] }}
          transition={{ duration: 2.45, ease: "easeInOut" }}
        />

        <div className="absolute left-4 right-4 top-4 z-30 flex items-start justify-between gap-3 sm:left-6 sm:right-6 sm:top-5">
          <div className="flex min-w-0 items-center gap-2 rounded-full border border-white/15 bg-slate-950/50 px-3 py-2 text-white shadow-[0_0_28px_hsl(265_90%_62%/0.2)] backdrop-blur-md">
            <Sparkles className="h-4 w-4 shrink-0 text-primary" />
            <span className="truncate text-xs font-semibold uppercase tracking-[0.16em] text-primary sm:text-sm">
              Bcoming System
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              aria-label={isPlaying ? "Pause video" : "Play video"}
              onClick={() => setIsPlaying((current) => !current)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-slate-950/50 text-white backdrop-blur-md transition hover:bg-white/10"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
            <button
              type="button"
              aria-label="Restart video"
              onClick={restart}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-slate-950/50 text-white backdrop-blur-md transition hover:bg-white/10"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="absolute inset-x-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-30 sm:inset-x-6">
          <motion.div
            key={`${currentScene.id}-caption`}
            className="max-w-2xl rounded-xl border border-white/16 bg-slate-950/68 p-4 text-white shadow-[0_0_35px_hsl(265_90%_62%/0.24)] backdrop-blur-md sm:p-5"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 24 }}
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="rounded-full border border-primary/35 bg-primary/18 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
                {currentScene.eyebrow}
              </span>
              <span className="text-xs font-mono text-white/50">
                {String(sceneIndex + 1).padStart(2, "0")} / {String(SCENES.length).padStart(2, "0")}
              </span>
            </div>
            <h2 className="max-w-xl text-xl font-semibold leading-tight sm:text-3xl">{currentScene.title}</h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/76 sm:text-base">{currentScene.line}</p>

            {currentScene.id === "paths" && <AdaptivePathCards activePath={activePath} onSelect={setActivePath} />}
            <SystemFlow scene={currentScene.id} />

            {showActions && (isComplete || shouldReduceMotion) && (
              <motion.div
                className="mt-4 flex gap-2 rounded-full border border-white/16 bg-white/7 p-2 backdrop-blur-md"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Button onClick={onNext} size="lg" className="h-11 flex-1 rounded-full gap-2">
                  Start my quest
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button onClick={onNext} variant="ghost" className="h-11 rounded-full px-5 text-white/68 hover:text-white">
                  Skip
                </Button>
              </motion.div>
            )}
          </motion.div>

          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/12">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-primary via-cyan-300 to-amber-300 shadow-[0_0_18px_hsl(42_100%_62%/0.5)]"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.45, ease: "easeOut" }}
            />
          </div>
        </div>

        {isComplete && (
          <motion.button
            type="button"
            onClick={restart}
            className="absolute left-1/2 top-1/2 z-40 flex -translate-x-1/2 -translate-y-1/2 items-center gap-3 rounded-full border border-white/20 bg-slate-950/68 px-6 py-4 text-sm font-semibold text-white shadow-[0_0_42px_hsl(265_90%_62%/0.38)] backdrop-blur-md transition hover:border-primary/55 hover:bg-slate-950/82 sm:text-base"
            initial={{ opacity: 0, scale: 0.82 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            aria-label="Watch video again"
          >
            <RotateCcw className="h-5 w-5 text-primary" />
            Watch again
          </motion.button>
        )}
      </div>
    </div>
  );
};
