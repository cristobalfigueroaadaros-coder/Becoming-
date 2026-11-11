import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  FOUNDERS_CLUSTERS,
  GOLD_CONNECTIONS,
  type FounderCluster,
} from "@/data/foundersMap";
import { FounderOriginVideoModal } from "./FounderOriginVideoModal";
import { FoundersClusterNode } from "./FoundersClusterNode";
import { FoundersClusterSheet } from "./FoundersClusterSheet";
import { FoundersTimeline } from "./FoundersTimeline";

interface FoundersMapProps {
  onCtaClick: () => void;
  forceOriginVideo?: boolean;
  originDelayMs?: number;
}

const POPUP_FLAG = "founders_popup_seen";

export const FoundersMap = ({ onCtaClick, forceOriginVideo = false, originDelayMs = 2000 }: FoundersMapProps) => {
  const [isMobile, setIsMobile] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [showBridgeIntro, setShowBridgeIntro] = useState(forceOriginVideo);
  const [selected, setSelected] = useState<FounderCluster | null>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (forceOriginVideo) {
      setShowBridgeIntro(true);
      setShowPopup(false);
      return;
    }

    try {
      const seen = localStorage.getItem(POPUP_FLAG);
      if (!seen) {
        const timer = window.setTimeout(() => setShowPopup(true), originDelayMs);
        return () => window.clearTimeout(timer);
      }
    } catch {
      const timer = window.setTimeout(() => setShowPopup(true), originDelayMs);
      return () => window.clearTimeout(timer);
    }
  }, [forceOriginVideo, originDelayMs]);

  const handleDismissPopup = () => {
    try {
      localStorage.setItem(POPUP_FLAG, "true");
    } catch {
      // ignore
    }
    setShowPopup(false);
  };

  const handlePopupNext = () => {
    handleDismissPopup();
    if (forceOriginVideo) {
      onCtaClick();
    }
  };

  const startBridgeVideo = () => {
    setShowBridgeIntro(false);
    setShowPopup(true);
  };

  const clusterById = useMemo(() => {
    const m: Record<string, FounderCluster> = {};
    FOUNDERS_CLUSTERS.forEach((c) => (m[c.id] = c));
    return m;
  }, []);

  const goldLines = useMemo(
    () =>
      GOLD_CONNECTIONS.map((c) => {
        const from = clusterById[c.fromClusterId];
        const to = clusterById[c.toClusterId];
        if (!from || !to) return null;
        return {
          from: from.position,
          to: to.position,
          insight: c.insight,
        };
      }).filter(Boolean) as { from: { x: number; y: number }; to: { x: number; y: number }; insight: string }[],
    [clusterById],
  );

  const mapHeight = isMobile ? 960 : 720;

  if (showBridgeIntro) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 p-4 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, y: 14, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="w-full max-w-md rounded-2xl border border-border/60 bg-card/95 p-5 text-center shadow-[0_0_70px_hsl(265_90%_62%/0.28)]"
        >
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <Sparkles className="h-5 w-5" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Cris's Map</p>
          <h2 className="mt-2 text-xl font-bold text-foreground">This is an example map.</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            You are about to see how dots, life events, skills, experiments, and questions connected over time into Becoming.
            Your map will not copy this one. It will reveal your own pattern and what wants to be created through you.
          </p>
          <Button onClick={startBridgeVideo} size="lg" className="mt-5 w-full rounded-full gap-2">
            See the example
            <ArrowRight className="h-4 w-4" />
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      {/* Popup */}
      <AnimatePresence>
        {showPopup && <FounderOriginVideoModal onNext={handlePopupNext} ctaLabel="Continue my map" />}
      </AnimatePresence>

      {/* Header strip */}
      <div className="px-5 pt-4 pb-2 relative z-10">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <h2 className="text-base font-bold text-foreground">
            Cris's Map — Founder of Becoming
          </h2>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Tap any cluster to read the dots. Gold lines show how the dots connected.
        </p>
      </div>

      {/* Map */}
      <div
        className="relative w-full"
        style={{ height: mapHeight }}
      >
        {/* Cosmic backdrop */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `
              radial-gradient(ellipse at 30% 20%, hsl(265 90% 62% / 0.08) 0%, transparent 50%),
              radial-gradient(ellipse at 70% 50%, hsl(220 95% 58% / 0.06) 0%, transparent 50%),
              radial-gradient(ellipse at 50% 80%, hsl(40 100% 55% / 0.05) 0%, transparent 40%)
            `,
          }}
        />

        {/* Gold connection lines */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ zIndex: 0 }}
        >
          <defs>
            <filter id="founders-gold-glow">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <linearGradient id="founders-gold-stroke" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(45 100% 65%)" stopOpacity="0.9" />
              <stop offset="100%" stopColor="hsl(35 100% 55%)" stopOpacity="0.9" />
            </linearGradient>
          </defs>
          {goldLines.map((line, i) => (
            <motion.line
              key={i}
              x1={`${line.from.x}%`}
              y1={`${line.from.y}%`}
              x2={`${line.to.x}%`}
              y2={`${line.to.y}%`}
              stroke="url(#founders-gold-stroke)"
              strokeWidth={1.5}
              filter="url(#founders-gold-glow)"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.85 }}
              transition={{ delay: 0.3 + i * 0.1, duration: 1.2 }}
            >
              <title>{line.insight}</title>
            </motion.line>
          ))}
        </svg>

        {/* Clusters */}
        {FOUNDERS_CLUSTERS.map((cluster, i) => (
          <div
            key={cluster.id}
            className="absolute"
            style={{
              left: `${cluster.position.x}%`,
              top: `${cluster.position.y}%`,
              transform: "translate(-50%, -50%)",
            }}
          >
            <FoundersClusterNode
              cluster={cluster}
              index={i}
              scale={isMobile ? 0.78 : 1}
              onTap={() => setSelected(cluster)}
              isFocused={!!selected && selected.id === cluster.id}
              isFaded={!!selected && selected.id !== cluster.id}
            />
          </div>
        ))}
      </div>

      {/* Timeline */}
      <FoundersTimeline />

      {/* Origin video CTA */}
      <section className="pt-2">
        <FounderOriginVideoModal onNext={onCtaClick} variant="embedded" ctaLabel="Continue my map" />
      </section>

      {/* Cluster detail sheet */}
      <FoundersClusterSheet
        cluster={selected}
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
      />
    </div>
  );
};
