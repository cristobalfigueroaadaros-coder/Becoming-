import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Compass, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  FOUNDERS_CLUSTERS,
  GOLD_CONNECTIONS,
  type FounderCluster,
} from "@/data/foundersMap";
import { FoundersIntroModal } from "./FoundersIntroModal";
import { FoundersClusterNode } from "./FoundersClusterNode";
import { FoundersClusterSheet } from "./FoundersClusterSheet";
import { FoundersTimeline } from "./FoundersTimeline";

interface FoundersMapProps {
  onCtaClick: () => void;
}

const POPUP_FLAG = "founders_popup_seen";

export const FoundersMap = ({ onCtaClick }: FoundersMapProps) => {
  const [isMobile, setIsMobile] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [selected, setSelected] = useState<FounderCluster | null>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    try {
      const seen = localStorage.getItem(POPUP_FLAG);
      if (!seen) setShowPopup(true);
    } catch {
      setShowPopup(true);
    }
  }, []);

  const handleDismissPopup = () => {
    try {
      localStorage.setItem(POPUP_FLAG, "true");
    } catch {
      // ignore
    }
    setShowPopup(false);
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

  return (
    <div className="relative w-full">
      {/* Popup */}
      <AnimatePresence>
        {showPopup && <FoundersIntroModal onNext={handleDismissPopup} />}
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

      {/* CTA */}
      <section className="px-5 pb-16 pt-2">
        <div className="max-w-2xl mx-auto rounded-2xl border border-primary/30 bg-card/70 backdrop-blur-sm p-6 sm:p-8 text-center shadow-[0_0_40px_hsl(265_90%_62%/0.18)]">
          <Compass className="w-6 h-6 text-primary mx-auto mb-3 drop-shadow-[0_0_10px_hsl(265_90%_62%/0.5)]" />
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">
            Your map is waiting.
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            The journey starts the same way mine did — with one dot.
          </p>
          <Button
            onClick={onCtaClick}
            size="lg"
            className="mt-5 gap-2 shadow-[0_0_24px_hsl(265_90%_62%/0.45)]"
          >
            Start building my map
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
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