import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Pause, Play, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BcomingSystemVideoProps {
  onNext?: () => void;
  showActions?: boolean;
  className?: string;
}

interface SceneConfig {
  id: string;
  title: string;
  line: string;
  image: string;
  duration: number;
  focus: string;
  zoom: [number, number];
  pan: [string, string];
  glow: string;
  particles: "chaos" | "portal" | "atlas" | "mentors" | "blueprint" | "impact";
}

const SCENES: SceneConfig[] = [
  {
    id: "chaos",
    title: "Lost in the noise",
    line: "Most people do not lack potential. They lack clarity.",
    image: "/bcoming-system-video/scene1.png",
    duration: 3600,
    focus: "Lost",
    zoom: [1.08, 1.16],
    pan: ["50% 48%", "51% 46%"],
    glow: "radial-gradient(circle at 48% 34%, hsl(320 90% 62% / 0.22), hsl(265 90% 62% / 0.12) 34%, transparent 62%)",
    particles: "chaos",
  },
  {
    id: "discovery",
    title: "Bcoming appears",
    line: "A doorway opens: your map, your purpose, your becoming.",
    image: "/bcoming-system-video/scene2.png",
    duration: 3200,
    focus: "Discovery",
    zoom: [1.06, 1.13],
    pan: ["52% 50%", "56% 47%"],
    glow: "radial-gradient(circle at 59% 42%, hsl(265 90% 62% / 0.28), hsl(320 90% 62% / 0.14) 34%, transparent 65%)",
    particles: "portal",
  },
  {
    id: "atlas",
    title: "Chaos becomes dots",
    line: "Atlas connects your life, passions, gifts, and patterns.",
    image: "/bcoming-system-video/scene3.png",
    duration: 4000,
    focus: "Clarity",
    zoom: [1.05, 1.12],
    pan: ["49% 50%", "52% 49%"],
    glow: "radial-gradient(circle at 54% 45%, hsl(190 95% 56% / 0.2), hsl(265 90% 62% / 0.15) 38%, transparent 68%)",
    particles: "atlas",
  },
  {
    id: "mentors",
    title: "Guidance finds the path",
    line: "Mentors help turn insight into direction.",
    image: "/bcoming-system-video/scene4.png",
    duration: 3600,
    focus: "Guidance",
    zoom: [1.05, 1.11],
    pan: ["50% 50%", "48% 48%"],
    glow: "radial-gradient(circle at 50% 52%, hsl(265 90% 62% / 0.24), hsl(190 95% 56% / 0.12) 36%, transparent 66%)",
    particles: "mentors",
  },
  {
    id: "creation",
    title: "From purpose to impact",
    line: "Clarity becomes purpose. Purpose becomes something real you can build.",
    image: "/bcoming-system-video/scene5.png",
    duration: 4000,
    focus: "Creation",
    zoom: [1.03, 1.09],
    pan: ["50% 50%", "52% 48%"],
    glow: "radial-gradient(circle at 58% 46%, hsl(42 100% 62% / 0.22), hsl(30 95% 57% / 0.13) 36%, transparent 68%)",
    particles: "blueprint",
  },
  {
    id: "impact",
    title: "Connect the dots",
    line: "Your Atlas, mentors, and project turn your patterns into something meaningful.",
    image: "/bcoming-system-video/scene6.png",
    duration: 4600,
    focus: "Impact",
    zoom: [1.02, 1.08],
    pan: ["50% 50%", "50% 47%"],
    glow: "radial-gradient(circle at 50% 47%, hsl(42 100% 62% / 0.24), hsl(142 78% 54% / 0.14) 38%, transparent 72%)",
    particles: "impact",
  },
  {
    id: "together",
    title: "You were never meant to build alone",
    line: "Real people. Real projects. Real impact.",
    image: "/bcoming-system-video/scene7.png",
    duration: 4000,
    focus: "Creation",
    zoom: [1.03, 1.09],
    pan: ["50% 50%", "52% 48%"],
    glow: "radial-gradient(circle at 58% 46%, hsl(42 100% 62% / 0.22), hsl(30 95% 57% / 0.13) 36%, transparent 68%)",
    particles: "blueprint",
  },
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

const getParticleColor = (kind: SceneConfig["particles"]) => {
  if (kind === "impact") return "bg-emerald-300 shadow-[0_0_18px_hsl(142_78%_54%/0.75)]";
  if (kind === "blueprint") return "bg-amber-300 shadow-[0_0_18px_hsl(42_100%_62%/0.78)]";
  if (kind === "atlas") return "bg-cyan-300 shadow-[0_0_18px_hsl(190_95%_56%/0.78)]";
  if (kind === "portal") return "bg-fuchsia-300 shadow-[0_0_18px_hsl(320_90%_62%/0.75)]";
  return "bg-primary shadow-[0_0_18px_hsl(265_90%_62%/0.75)]";
};

const SceneParticles = ({ kind }: { kind: SceneConfig["particles"] }) => {
  const particleColor = getParticleColor(kind);

  return (
    <div className="pointer-events-none absolute inset-0">
      {PARTICLE_POSITIONS.map((particle, index) => (
        <motion.span
          key={`${kind}-${particle.x}-${particle.y}`}
          className={cn("absolute rounded-full", particleColor)}
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
          }}
          initial={{ opacity: 0, scale: 0.4 }}
          animate={{
            opacity: [0, 0.9, 0.45, 0.9],
            scale: kind === "chaos" ? [0.7, 1.4, 0.85] : [0.75, 1.15, 0.95],
            x: kind === "chaos" ? [0, index % 2 ? -12 : 14, 0] : [0, index % 2 ? 6 : -6, 0],
            y: kind === "chaos" ? [0, index % 2 ? 10 : -12, 0] : [0, index % 2 ? -5 : 7, 0],
          }}
          transition={{ duration: kind === "chaos" ? 2.2 : 3.2, delay: particle.delay, repeat: Infinity }}
        />
      ))}
    </div>
  );
};

export const BcomingSystemVideo = ({ onNext, showActions = true, className }: BcomingSystemVideoProps) => {
  const shouldReduceMotion = useReducedMotion();
  const [sceneIndex, setSceneIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
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
  };

  return (
    <div className={cn("relative w-full px-3 py-3 sm:px-5", className)}>
      <div className="relative mx-auto aspect-[16/9] min-h-[420px] w-full max-w-6xl overflow-hidden rounded-2xl border border-white/15 bg-slate-950 shadow-[0_0_70px_hsl(265_90%_62%/0.34)] sm:min-h-[620px]">
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
          }}
        />

        <div className="absolute inset-0 bg-[linear-gradient(180deg,hsl(262_55%_8%/0.08),hsl(262_55%_8%/0.24)_54%,hsl(262_55%_8%/0.82))]" />
        <div className="absolute inset-0" style={{ background: currentScene.glow }} />
        <SceneParticles kind={currentScene.particles} />

        <motion.div
          key={`${currentScene.id}-light`}
          className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/2 rotate-12 bg-gradient-to-r from-transparent via-white/14 to-transparent blur-md"
          initial={{ x: "-30%", opacity: 0 }}
          animate={{ x: "260%", opacity: [0, 0.45, 0] }}
          transition={{ duration: 2.6, ease: "easeInOut" }}
        />

        {isComplete && (
          <motion.button
            type="button"
            onClick={restart}
            className="absolute left-1/2 top-1/2 z-40 flex -translate-x-1/2 -translate-y-1/2 items-center gap-3 rounded-full border border-white/20 bg-slate-950/62 px-6 py-4 text-sm font-semibold text-white shadow-[0_0_42px_hsl(265_90%_62%/0.38)] backdrop-blur-md transition hover:border-primary/55 hover:bg-slate-950/78 sm:text-base"
            initial={{ opacity: 0, scale: 0.82 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            aria-label="Watch video again"
          >
            <RotateCcw className="h-5 w-5 text-primary" />
            Watch again
          </motion.button>
        )}

        <div className="absolute left-4 right-4 top-4 z-30 flex items-start justify-between gap-3 sm:left-6 sm:right-6 sm:top-5">
          <div className="flex min-w-0 items-center gap-2 rounded-full border border-white/15 bg-slate-950/45 px-3 py-2 text-white shadow-[0_0_28px_hsl(265_90%_62%/0.2)] backdrop-blur-md">
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
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-slate-950/45 text-white backdrop-blur-md transition hover:bg-white/10"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
            <button
              type="button"
              aria-label="Restart video"
              onClick={restart}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-slate-950/45 text-white backdrop-blur-md transition hover:bg-white/10"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="absolute bottom-[calc(1rem+env(safe-area-inset-bottom))] left-4 right-4 z-30 sm:left-6 sm:right-6">
          <motion.div
            key={`${currentScene.id}-caption`}
            className="max-w-2xl rounded-xl border border-white/16 bg-slate-950/58 p-4 text-white shadow-[0_0_35px_hsl(265_90%_62%/0.24)] backdrop-blur-md sm:p-5"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 24 }}
          >
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="text-xs font-mono text-white/60">
                {String(sceneIndex + 1).padStart(2, "0")} / {String(SCENES.length).padStart(2, "0")}
              </span>
              <span className="rounded-full border border-primary/35 bg-primary/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
                {currentScene.focus}
              </span>
            </div>
            <h2 className="text-lg font-semibold leading-tight sm:text-2xl">{currentScene.title}</h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/76 sm:text-base">{currentScene.line}</p>

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
              className="h-full rounded-full bg-gradient-to-r from-primary via-fuchsia-300 to-amber-300 shadow-[0_0_18px_hsl(42_100%_62%/0.5)]"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.45, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
