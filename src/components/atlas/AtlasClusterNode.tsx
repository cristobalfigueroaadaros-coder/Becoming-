import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import type { ClusterWithState } from "@/hooks/useAtlas";
import { DOMAIN_COLORS, getDotColor } from "@/hooks/useAtlas";

interface AtlasClusterNodeProps {
  cluster: ClusterWithState;
  index: number;
  onTap: () => void;
  isHighlighted?: boolean;
  miniDotCounts?: Record<string, number>;
  isFocused?: boolean;
  isFaded?: boolean;
}

// Compute positions for dots in concentric orbits OUTSIDE the cluster center
function getOrbitPositions(dotCount: number, baseRadius: number): { x: number; y: number }[] {
  const orbits = [
    { radius: baseRadius + 12, maxDots: 6 },
    { radius: baseRadius + 24, maxDots: 8 },
    { radius: baseRadius + 36, maxDots: 12 },
  ];
  const positions: { x: number; y: number }[] = [];
  let remaining = dotCount;
  for (const orbit of orbits) {
    if (remaining <= 0) break;
    const count = Math.min(remaining, orbit.maxDots);
    for (let i = 0; i < count; i++) {
      const angle = (2 * Math.PI * i) / count - Math.PI / 2;
      positions.push({
        x: Math.cos(angle) * orbit.radius,
        y: Math.sin(angle) * orbit.radius,
      });
    }
    remaining -= count;
  }
  return positions;
}

const GROWTH_STYLES: Record<string, { size: number; opacity: string; glowSize: number; pulse: boolean }> = {
  locked:    { size: 64, opacity: "opacity-30", glowSize: 0, pulse: false },
  dormant:   { size: 72, opacity: "opacity-50", glowSize: 0, pulse: false },
  activated: { size: 80, opacity: "opacity-75", glowSize: 8, pulse: true },
  growing:   { size: 88, opacity: "opacity-85", glowSize: 14, pulse: true },
  resonant:  { size: 96, opacity: "opacity-95", glowSize: 20, pulse: true },
  mature:    { size: 108, opacity: "opacity-100", glowSize: 28, pulse: true },
};

export const AtlasClusterNode = ({ cluster, index, onTap, isHighlighted, miniDotCounts = {}, isFocused, isFaded }: AtlasClusterNodeProps) => {
  const domainName = cluster.meta_domain?.name || "Person";
  const isGolden = cluster.slug === "golden-moments";
  const isProject = cluster.cluster_category === "project";
  const colors = isProject
    ? { bg: "hsl(0, 75%, 55%)", glow: "hsl(0, 75%, 55%, 0.3)", border: "hsl(0, 75%, 45%)" }
    : isGolden
    ? { bg: "hsl(40, 80%, 55%)", glow: "hsl(40, 80%, 55%, 0.3)", border: "hsl(40, 80%, 55%, 0.6)" }
    : DOMAIN_COLORS[domainName] || DOMAIN_COLORS.Person;
  const state = cluster.computedState;
  const style = GROWTH_STYLES[state] || GROWTH_STYLES.dormant;
  const baseRadius = style.size / 2;
  const orbitPositions = getOrbitPositions(cluster.dots.length, baseRadius);

  // Count total mini-dots in this cluster
  const clusterMiniDotTotal = cluster.dots.reduce((sum, d) => sum + (miniDotCounts[d.id] || 0), 0);
  const hasDepth = clusterMiniDotTotal > 0;

  // Container must be large enough for dots outside the circle
  const containerSize = style.size + 90;

  // Fade/focus opacity
  const fadeClass = isFaded ? "opacity-20 pointer-events-none" : "";

  return (
    <motion.button
      onClick={state !== "locked" ? onTap : undefined}
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05, type: "spring", stiffness: 200, damping: 20 }}
      className={`relative flex items-center justify-center ${style.opacity} ${fadeClass} ${state === "locked" ? "cursor-not-allowed" : ""} transition-opacity duration-300`}
      style={{ width: containerSize, height: containerSize }}
    >
      {/* Highlight pulse for newly created dot */}
      {isHighlighted && (
        <motion.div
          className="absolute rounded-full"
          style={{
            width: style.size + 16,
            height: style.size + 16,
            boxShadow: `0 0 24px ${colors.glow}`,
            border: `2px solid ${colors.border}`,
          }}
          animate={{ opacity: [0.3, 1, 0.3], scale: [1, 1.1, 1] }}
          transition={{ duration: 1.5, repeat: 2 }}
        />
      )}

      {/* Glow ring for activated+ */}
      {style.pulse && (
        <motion.div
          className="absolute rounded-full"
          style={{
            width: style.size + 8,
            height: style.size + 8,
            boxShadow: `0 0 ${style.glowSize}px ${colors.glow}`,
            border: `1.5px solid ${colors.border}`,
          }}
          animate={{ opacity: [0.4, 0.9, 0.4] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
      )}

      {/* Main circle */}
      <div
        className="absolute rounded-full"
        style={{
          width: style.size,
          height: style.size,
          background: state === "locked"
            ? "hsl(var(--muted))"
            : `radial-gradient(circle at 40% 35%, ${colors.glow}, transparent 70%)`,
          border: `1px solid ${state === "locked" || state === "dormant" ? "hsl(var(--border))" : colors.border}`,
        }}
      />

      {/* Orbit dots — rendered OUTSIDE the main circle, pointer-events-none so they don't block clicks */}
      <div className="absolute inset-0 pointer-events-none">
        {cluster.dots.map((dot, i) => {
          const pos = orbitPositions[i];
          if (!pos) return null;
          return (
            <motion.span
              key={dot.id}
              className="absolute w-2.5 h-2.5 rounded-full"
              style={{
                backgroundColor: getDotColor(dot),
                left: `calc(50% + ${pos.x}px - 5px)`,
                top: `calc(50% + ${pos.y}px - 5px)`,
                boxShadow: `0 0 4px ${getDotColor(dot)}60`,
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 + i * 0.03 }}
            />
          );
        })}
      </div>

      {/* Content — z-20 to stay above orbit dots */}
      <div className="relative z-20 flex flex-col items-center px-1">
        {state === "locked" ? (
          <Lock className="w-4 h-4 text-muted-foreground" />
        ) : (
          <>
            <span
              className="text-[10px] font-semibold leading-tight text-center max-w-[60px] px-1.5 py-0.5 rounded"
              style={{
                color: "#000000",
                backgroundColor: "hsl(var(--background) / 0.85)",
              }}
            >
              {cluster.name}
            </span>
            {cluster.dotCount > 0 && (
              <span className="text-[9px] mt-0.5 font-medium" style={{ color: "#000000" }}>
                {cluster.dotCount}
              </span>
            )}
          </>
        )}
      </div>
    </motion.button>
  );
};
