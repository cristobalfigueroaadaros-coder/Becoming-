import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FOUNDERS_CLUSTERS, type FounderCluster } from "@/data/foundersMap";
import { FoundersClusterNode } from "./FoundersClusterNode";
import { cn } from "@/lib/utils";

interface FounderOriginVideoModalProps {
  onNext: () => void;
  variant?: "modal" | "embedded";
}

type OriginMoment = {
  tag: "Life Event" | "Aha Moment" | "Skill" | "Experiment" | "Inspiration" | "Project";
  title: string;
  year: string;
  context: string;
  dotAdds: Record<string, number>;
  connections: [string, string][];
};

const TAG_STYLES: Record<OriginMoment["tag"], string> = {
  "Life Event": "bg-primary/15 text-primary border-primary/30",
  "Aha Moment": "bg-amber-500/15 text-amber-300 border-amber-500/30",
  Skill: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
  Experiment: "bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30",
  Inspiration: "bg-orange-500/15 text-orange-300 border-orange-500/30",
  Project: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
};

const CENTER_PROJECT = {
  id: "becoming-project",
  name: "Bcoming",
  position: { x: 50, y: 50 },
};

const BECOMING_REVEAL_STEP = 8;

const VIDEO_POSITION_OVERRIDES: Record<string, { x: number; y: number }> = {
  frustrations: { x: 37, y: 68 },
  experiments: { x: 67, y: 42 },
  "how-i-create-impact": { x: 70, y: 90 },
};

const MOMENTS: OriginMoment[] = [
  {
    tag: "Inspiration",
    title: "My grandfather",
    year: "Lineage",
    context: "Contribution was never charity. It was everyone doing their part toward something bigger.",
    dotAdds: { inspirations: 1, values: 1, "how-i-create-impact": 1, "ideal-life": 1 },
    connections: [["inspirations", "values"], ["inspirations", "how-i-create-impact"]],
  },
  {
    tag: "Experiment",
    title: "First business: e-commerce for women",
    year: "2016",
    context: "The first real dot. I learned what building actually costs.",
    dotAdds: { experiments: 1, skills: 1, "personal-frustrations": 1 },
    connections: [["experiments", "skills"]],
  },
  {
    tag: "Life Event",
    title: "Left Chile",
    year: "2016",
    context: "Stable life, good family, and something calling that I could not name yet.",
    dotAdds: { "life-events": 1, values: 1, "childhood-signals": 1 },
    connections: [["life-events", "values"]],
  },
  {
    tag: "Life Event",
    title: "Germany: cleaned floors",
    year: "2017",
    context: "I left comfort and worked for food. The ego work began there.",
    dotAdds: { "life-events": 1, skills: 1, values: 1 },
    connections: [["life-events", "skills"]],
  },
  {
    tag: "Aha Moment",
    title: "Mauer Park",
    year: "2017",
    context: "A stranger sang and I understood that hidden talent is everywhere.",
    dotAdds: { "aha-moments": 1, passions: 1, "who-i-serve": 1, "external-reflections": 1 },
    connections: [["aha-moments", "who-i-serve"]],
  },
  {
    tag: "Life Event",
    title: "Melbourne, Australia",
    year: "2018",
    context: "The festival rejection opened five other doors and pushed the next experiment forward.",
    dotAdds: { "life-events": 1, experiments: 1, passions: 1, skills: 1 },
    connections: [["life-events", "experiments"], ["passions", "experiments"]],
  },
  {
    tag: "Experiment",
    title: "Family Squad was born",
    year: "2018",
    context: "A board game became the container for play, family, psychology, and belonging.",
    dotAdds: { experiments: 1, skills: 1, passions: 1, "how-i-create-impact": 1 },
    connections: [["experiments", "skills"], ["passions", "experiments"]],
  },
  {
    tag: "Life Event",
    title: "Broken leg",
    year: "2020",
    context: "COVID went dark, but the pause gave me the time to finish what mattered.",
    dotAdds: { "life-events": 1, values: 1, skills: 1, "aha-moments": 1 },
    connections: [["life-events", "skills"]],
  },
  {
    tag: "Natural Talent",
    title: "Seeing patterns",
    year: "Always",
    context: "I could see the thread before I had the words for it.",
    dotAdds: { "natural-talents": 2, "childhood-signals": 1, "aha-moments": 1, "external-reflections": 1 },
    connections: [["childhood-signals", "natural-talents"], ["natural-talents", "aha-moments"]],
  },
  {
    tag: "Experiment",
    title: "Family Squad Digital",
    year: "2021",
    context: "A dream after asking for a sign turned the board game into a digital experience.",
    dotAdds: { experiments: 1, skills: 2, "how-i-create-impact": 1, passions: 1 },
    connections: [["experiments", "skills"], ["experiments", "how-i-create-impact"]],
  },
  {
    tag: "Aha Moment",
    title: "Peyote ceremony",
    year: "2023",
    context: "The vision arrived the week before the AI council idea.",
    dotAdds: { "aha-moments": 2, inspirations: 2, "who-i-serve": 1, vision: 1 },
    connections: [["inspirations", "aha-moments"], ["aha-moments", "who-i-serve"]],
  },
  {
    tag: "Aha Moment",
    title: "Temazcal: Rainbow Warriors",
    year: "2023",
    context: "I understood the deeper why behind everything I had been building toward.",
    dotAdds: { "aha-moments": 1, vision: 1, values: 1, "ideal-life": 1 },
    connections: [["aha-moments", "vision"], ["values", "vision"]],
  },
  {
    tag: "Experiment",
    title: "Bali festival",
    year: "2024",
    context: "Paintings, fire, dancing, and real interaction. The dots started showing themselves.",
    dotAdds: { experiments: 1, passions: 1, "external-reflections": 1, "how-i-create-impact": 1 },
    connections: [["experiments", "passions"], ["external-reflections", "how-i-create-impact"]],
  },
  {
    tag: "Project",
    title: "Bcoming was born",
    year: "Now",
    context: "Not one idea. A lifetime of dots finally connecting into the system I needed at the beginning.",
    dotAdds: { experiments: 1, "how-i-create-impact": 1, vision: 1, frustrations: 2, "ideal-life": 1 },
    connections: [
      ["inspirations", "becoming-project"],
      ["life-events", "becoming-project"],
      ["aha-moments", "becoming-project"],
      ["experiments", "becoming-project"],
      ["skills", "becoming-project"],
      ["passions", "becoming-project"],
      ["values", "becoming-project"],
      ["natural-talents", "becoming-project"],
      ["childhood-signals", "becoming-project"],
      ["frustrations", "becoming-project"],
      ["vision", "becoming-project"],
      ["external-reflections", "becoming-project"],
      ["ideal-life", "becoming-project"],
      ["who-i-serve", "becoming-project"],
      ["how-i-create-impact", "becoming-project"],
    ],
  },
];

const clusterById = FOUNDERS_CLUSTERS.reduce<Record<string, FounderCluster>>((acc, cluster) => {
  acc[cluster.id] = cluster;
  return acc;
}, {});

const getPosition = (id: string) => {
  if (id === CENTER_PROJECT.id) return CENTER_PROJECT.position;
  return VIDEO_POSITION_OVERRIDES[id] || clusterById[id]?.position;
};

const getDotCounts = (step: number) => {
  const counts: Record<string, number> = {};
  if (step >= MOMENTS.length - 1) {
    FOUNDERS_CLUSTERS.forEach((cluster) => {
      counts[cluster.id] = cluster.dots.length;
    });
    return counts;
  }
  MOMENTS.slice(0, step + 1).forEach((moment) => {
    Object.entries(moment.dotAdds).forEach(([clusterId, count]) => {
      counts[clusterId] = (counts[clusterId] || 0) + count;
    });
  });

  const progress = (step + 1) / MOMENTS.length;
  FOUNDERS_CLUSTERS.forEach((cluster, index) => {
    const ambientDots = Math.floor(progress * cluster.dots.length * 0.72 + ((step + index) % 3 === 0 ? 1 : 0));
    counts[cluster.id] = Math.max(counts[cluster.id] || 0, Math.min(cluster.dots.length, ambientDots));
  });

  return counts;
};

const FINAL_CLUSTER_CONNECTIONS: [string, string][] = [
  ["inspirations", "values"],
  ["inspirations", "how-i-create-impact"],
  ["inspirations", "vision"],
  ["life-events", "skills"],
  ["life-events", "experiments"],
  ["life-events", "values"],
  ["passions", "experiments"],
  ["passions", "how-i-create-impact"],
  ["childhood-signals", "natural-talents"],
  ["natural-talents", "aha-moments"],
  ["aha-moments", "who-i-serve"],
  ["aha-moments", "vision"],
  ["experiments", "skills"],
  ["experiments", "how-i-create-impact"],
  ["frustrations", "vision"],
  ["frustrations", "who-i-serve"],
  ["external-reflections", "natural-talents"],
  ["ideal-life", "vision"],
  ["who-i-serve", "how-i-create-impact"],
];

const BECOMING_CONNECTIONS: [string, string][] = FOUNDERS_CLUSTERS.map((cluster) => [
  cluster.id,
  CENTER_PROJECT.id,
]);

export const FounderOriginVideoModal = ({ onNext, variant = "modal" }: FounderOriginVideoModalProps) => {
  const shouldReduceMotion = useReducedMotion();
  const isEmbedded = variant === "embedded";
  const [step, setStep] = useState(0);
  const activeMoment = MOMENTS[Math.min(step, MOMENTS.length - 1)];
  const complete = step >= MOMENTS.length - 1;
  const projectProgress = shouldReduceMotion ? 1 : Math.min(1, Math.max(0, (step - BECOMING_REVEAL_STEP) / (MOMENTS.length - BECOMING_REVEAL_STEP - 1)));

  useEffect(() => {
    if (shouldReduceMotion || complete) return;
    const timer = window.setTimeout(() => setStep((current) => current + 1), 2700);
    return () => window.clearTimeout(timer);
  }, [complete, shouldReduceMotion, step]);

  const dotCounts = useMemo(() => getDotCounts(shouldReduceMotion ? MOMENTS.length - 1 : step), [shouldReduceMotion, step]);

  const displayClusters = useMemo(
    () =>
      FOUNDERS_CLUSTERS.map((cluster) => ({
        ...cluster,
        dots: cluster.dots.slice(0, dotCounts[cluster.id] || 0),
      })),
    [dotCounts],
  );

  const visibleConnections = useMemo(
    () => {
      const storyConnections = MOMENTS.slice(0, shouldReduceMotion ? MOMENTS.length : step + 1)
        .flatMap((moment) => moment.connections)
        .filter(([from, to]) => getPosition(from) && getPosition(to));

      if (complete || shouldReduceMotion) {
        return [...storyConnections, ...FINAL_CLUSTER_CONNECTIONS, ...BECOMING_CONNECTIONS].filter(
          ([from, to]) => getPosition(from) && getPosition(to),
        );
      }

      if (step >= BECOMING_REVEAL_STEP) {
        const partialBecomingConnections = BECOMING_CONNECTIONS.slice(
          0,
          Math.min(BECOMING_CONNECTIONS.length, (step - BECOMING_REVEAL_STEP + 1) * 3),
        );
        return [...storyConnections, ...partialBecomingConnections].filter(
          ([from, to]) => getPosition(from) && getPosition(to),
        );
      }

      return storyConnections;
    },
    [shouldReduceMotion, step],
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn(
        isEmbedded
          ? "relative w-full px-3 pb-28 pt-4 sm:px-5 sm:pb-32"
          : "fixed inset-0 z-50 flex items-center justify-center bg-background/90 p-3 backdrop-blur-md sm:p-5",
      )}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 26 }}
        className={cn(
          "relative w-full max-w-6xl overflow-hidden rounded-2xl border border-border/60 bg-card/95 shadow-[0_0_70px_hsl(265_90%_62%/0.28)]",
          isEmbedded ? "mx-auto h-[min(760px,calc(100vh-7rem))] min-h-[640px]" : "h-[92vh]",
        )}
      >
        <div className="relative h-full bg-cosmic">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,hsl(265_90%_62%/0.12),transparent_42%)]" />
            <div className="absolute bottom-8 right-10 h-48 w-48 rounded-full bg-accent/10 blur-3xl" />
          </div>

          <div className="absolute left-4 top-4 z-30 flex items-center gap-2 sm:left-6 sm:top-5">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Founder Origin
            </span>
          </div>

          <div className="absolute inset-x-0 bottom-[13.5rem] top-14 sm:bottom-36 sm:top-16">
            <svg className="absolute inset-0 h-full w-full pointer-events-none" style={{ zIndex: 0 }}>
              <defs>
                <filter id="origin-map-gold-glow">
                  <feGaussianBlur stdDeviation="2.5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <linearGradient id="origin-map-gold-stroke" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="hsl(45 100% 65%)" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="hsl(35 100% 55%)" stopOpacity="0.95" />
                </linearGradient>
              </defs>
              {visibleConnections
                .filter(([, toId]) => toId !== CENTER_PROJECT.id)
                .map(([fromId, toId], index) => {
                const from = getPosition(fromId);
                const to = getPosition(toId);
                if (!from || !to) return null;
                return (
                  <motion.line
                    key={`${fromId}-${toId}-${index}`}
                    x1={`${from.x}%`}
                    y1={`${from.y}%`}
                    x2={`${to.x}%`}
                    y2={`${to.y}%`}
                    stroke="url(#origin-map-gold-stroke)"
                    strokeWidth={toId === CENTER_PROJECT.id ? 2 : 1.5}
                    filter="url(#origin-map-gold-glow)"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 0.84 }}
                    transition={{ duration: shouldReduceMotion ? 0 : 0.9, delay: 0.1 }}
                  />
                );
              })}
            </svg>

            {displayClusters.map((cluster, index) => {
              const fullCluster = clusterById[cluster.id];
              const fullDotCount = Math.max(fullCluster?.dots.length || cluster.dots.length || 1, 1);
              const dotRatio = cluster.dots.length / fullDotCount;
              const nodeScale = 0.38 + dotRatio * 0.34;
              const pos = getPosition(cluster.id) || cluster.position;
              return (
              <div
                key={cluster.id}
                className="absolute"
                style={{
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <FoundersClusterNode
                  cluster={cluster}
                  index={index}
                  scale={complete || shouldReduceMotion ? 0.72 : nodeScale}
                  onTap={() => undefined}
                />
              </div>
            )})}

            {(step >= BECOMING_REVEAL_STEP || shouldReduceMotion) && (
              <svg className="absolute inset-0 h-full w-full pointer-events-none" style={{ zIndex: 18 }}>
                {BECOMING_CONNECTIONS.slice(
                  0,
                  complete || shouldReduceMotion
                    ? BECOMING_CONNECTIONS.length
                    : Math.min(BECOMING_CONNECTIONS.length, (step - BECOMING_REVEAL_STEP + 1) * 3),
                ).map(([fromId, toId], index) => {
                  const from = getPosition(fromId);
                  const to = getPosition(toId);
                  if (!from || !to) return null;
                  return (
                    <motion.line
                      key={`becoming-overlay-${fromId}-${toId}-${index}`}
                      x1={`${from.x}%`}
                      y1={`${from.y}%`}
                      x2={`${to.x}%`}
                      y2={`${to.y}%`}
                      stroke="hsl(45 100% 65%)"
                      strokeWidth={3}
                      strokeLinecap="round"
                      filter="url(#origin-map-gold-glow)"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: complete || shouldReduceMotion ? 0.9 : 0.68 }}
                      transition={{ duration: shouldReduceMotion ? 0 : 0.8, delay: index * 0.025 }}
                    />
                  );
                })}
              </svg>
            )}

            {(step >= BECOMING_REVEAL_STEP || shouldReduceMotion) && (
              <div
                className="absolute z-20 flex flex-col items-center"
                style={{
                  left: `${CENTER_PROJECT.position.x}%`,
                  top: `${CENTER_PROJECT.position.y}%`,
                  transform: "translate(-50%, -50%)",
                }}
              >
              <motion.div
                className="flex flex-col items-center"
                initial={{ opacity: 0, scale: 0.28 }}
                animate={{
                  opacity: complete || shouldReduceMotion ? 1 : 0.58 + projectProgress * 0.28,
                  scale: complete || shouldReduceMotion ? 1 : 0.36 + projectProgress * 0.42,
                }}
                transition={{ type: "spring", stiffness: 210, damping: 20 }}
                >
                <div
                  className="relative flex h-24 w-24 items-center justify-center rounded-full border backdrop-blur-md"
                  style={{
                    borderColor: complete || shouldReduceMotion ? "hsl(38 92% 58% / 0.9)" : `hsl(38 92% 58% / ${0.12 + projectProgress * 0.52})`,
                    background: complete || shouldReduceMotion
                      ? "radial-gradient(circle, hsl(38 92% 58% / 0.26), hsl(262 55% 8% / 0.88))"
                      : "radial-gradient(circle, hsl(0 0% 0% / 0.92), hsl(262 55% 8% / 0.82))",
                    boxShadow: complete || shouldReduceMotion
                      ? "0 0 64px hsl(38 92% 58% / 0.62), inset 0 1px 0 hsl(0 0% 100% / 0.18)"
                      : `0 0 ${16 + projectProgress * 38}px hsl(38 92% 58% / ${0.08 + projectProgress * 0.34}), inset 0 1px 0 hsl(0 0% 100% / 0.08)`,
                  }}
                >
                  <motion.span
                    className="absolute h-36 w-36 rounded-full border border-accent/25"
                    animate={{ scale: [0.86, 1.08, 0.86], opacity: [0.32, 0.72, 0.32] }}
                    transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <span className="absolute -right-1 top-5 h-3 w-3 rounded-full bg-accent shadow-[0_0_14px_hsl(38_92%_58%/0.9)]" />
                  <span className="absolute bottom-4 left-1 h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_14px_hsl(265_90%_62%/0.9)]" />
                  {(complete || shouldReduceMotion) && <span className="text-sm font-bold text-foreground">Bcoming</span>}
                </div>
              </motion.div>
              </div>
            )}
          </div>

          <div className="absolute inset-x-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-30 sm:inset-x-6">
            <motion.div
              key={`${activeMoment.tag}-${activeMoment.title}`}
              className="mx-auto max-w-3xl rounded-xl border border-border/60 bg-card/75 p-4 shadow-[0_0_35px_hsl(265_90%_62%/0.18)] backdrop-blur-md"
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 240, damping: 24 }}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-xs font-mono text-muted-foreground">{activeMoment.year}</span>
                <span
                  className={cn(
                    "rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider",
                    TAG_STYLES[activeMoment.tag],
                  )}
                >
                  {activeMoment.tag}
                </span>
              </div>
              <h2 className="text-sm font-semibold leading-snug text-foreground sm:text-base">
                {activeMoment.title}
              </h2>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                {activeMoment.context}
              </p>

              {(complete || shouldReduceMotion) && (
                <motion.div
                  className="mt-4 flex gap-2 rounded-full border border-border/50 bg-background/55 p-2 backdrop-blur-md"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Button onClick={onNext} size="lg" className="h-11 flex-1 rounded-full gap-2">
                    Start my map
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
      </motion.div>
    </motion.div>
  );
};
