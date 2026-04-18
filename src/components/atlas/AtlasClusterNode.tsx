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
  scale?: number;
}

function getOrbitPositions(dotCount: number, baseRadius: number, scale = 1): { x: number; y: number }[] {
  const orbits = [
    { radius: baseRadius + Math.round(14 * scale), maxDots: 6 },
    { radius: baseRadius + Math.round(28 * scale), maxDots: 8 },
    { radius: baseRadius + Math.round(40 * scale), maxDots: 12 },
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
  activated: { size: 80, opacity: "opacity-80", glowSize: 10, pulse: true },
  growing:   { size: 88, opacity: "opacity-90", glowSize: 16, pulse: true },
  resonant:  { size: 96, opacity: "opacity-95", glowSize: 22, pulse: true },
  mature:    { size: 108, opacity: "opacity-100", glowSize: 30, pulse: true },
};

export const AtlasClusterNode = ({ cluster, index, onTap, isHighlighted, miniDotCounts = {}, isFocused, isFaded, scale = 1 }: AtlasClusterNodeProps) => {
  const domainName = cluster.meta_domain?.name || "Person";
  const isGolden = cluster.slug === "golden-moments";
  const isProject = cluster.cluster_category === "project";
  const colors = isProject
    ? { bg: "hsl(0, 75%, 55%)", glow: "hsl(0, 75%, 55%, 0.35)", border: "hsl(0, 75%, 45%)", gradient: "linear-gradient(135deg, hsl(0, 75%, 55%), hsl(350, 80%, 45%))" }
    : isGolden
    ? { bg: "hsl(40, 85%, 55%)", glow: "hsl(40, 85%, 55%, 0.35)", border: "hsl(40, 85%, 55%, 0.6)", gradient: "linear-gradient(135deg, hsl(40, 85%, 55%), hsl(30, 90%, 50%))" }
    : {
        bg: DOMAIN_COLORS[domainName]?.bg || DOMAIN_COLORS.Person.bg,
        glow: DOMAIN_COLORS[domainName]?.glow || DOMAIN_COLORS.Person.glow,
        border: DOMAIN_COLORS[domainName]?.border || DOMAIN_COLORS.Person.border,
        gradient: `linear-gradient(135deg, ${DOMAIN_COLORS[domainName]?.bg || "hsl(265, 90%, 62%)"}, ${DOMAIN_COLORS[domainName]?.border || "hsl(265, 80%, 50%)"})`,
      };
  const state = cluster.computedState;
  const rawStyle = GROWTH_STYLES[state] || GROWTH_STYLES.dormant;
  // Apply scale for mobile — all pixel values shrink proportionally
  const style = {
    ...rawStyle,
    size: Math.round(rawStyle.size * scale),
    glowSize: Math.round(rawStyle.glowSize * scale),
  };
  const baseRadius = style.size / 2;
  const orbitPositions = getOrbitPositions(cluster.dots.length, baseRadius, scale);

  const clusterMiniDotTotal = cluster.dots.reduce((sum, d) => sum + (miniDotCounts[d.id] || 0), 0);
  const hasDepth = clusterMiniDotTotal > 0;
  const containerSize = style.size + 100;
  const fadeClass = isFaded ? "opacity-20 pointer-events-none" : "";

  return (
    <motion.button
      onClick={state !== "locked" ? onTap : undefined}
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        y: state !== "locked" ? [0, -3, 0] : 0,
      }}
      transition={{ 
        delay: index * 0.05, 
        type: "spring", 
        stiffness: 200, 
        damping: 20,
        y: { duration: 4 + index * 0.5, repeat: Infinity, ease: "easeInOut" }
      }}
      whileHover={state !== "locked" ? { scale: 1.08 } : undefined}
      className={`relative flex items-center justify-center ${style.opacity} ${fadeClass} ${state === "locked" ? "cursor-not-allowed" : "cursor-pointer"} transition-opacity duration-300`}
      style={{ width: containerSize, height: containerSize }}
    >
      {/* Highlight pulse for newly created dot */}
      {isHighlighted && (
        <motion.div
          className="absolute rounded-full"
          style={{
            width: style.size + 20,
            height: style.size + 20,
            boxShadow: `0 0 30px ${colors.glow}, 0 0 60px ${colors.glow}`,
            border: `2px solid ${colors.border}`,
          }}
          animate={{ opacity: [0.3, 1, 0.3], scale: [1, 1.15, 1] }}
          transition={{ duration: 1.5, repeat: 2 }}
        />
      )}

      {/* Outer glow ring */}
      {style.pulse && (
        <motion.div
          className="absolute rounded-full"
          style={{
            width: style.size + 10,
            height: style.size + 10,
            boxShadow: `0 0 ${style.glowSize}px ${colors.glow}, 0 0 ${style.glowSize * 2}px ${colors.glow}`,
            border: `1px solid ${colors.border}`,
          }}
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
      )}

      {/* Main circle — gradient fill */}
      <div
        className="absolute rounded-full transition-all duration-300"
        style={{
          width: style.size,
          height: style.size,
          background: state === "locked"
            ? "hsl(232, 30%, 15%)"
            : colors.gradient,
          border: `1.5px solid ${state === "locked" || state === "dormant" ? "hsl(232, 25%, 22%)" : colors.border}`,
          boxShadow: hasDepth && state !== "locked"
            ? `0 0 ${style.glowSize + 10 + clusterMiniDotTotal * 2}px ${colors.glow}, inset 0 0 20px hsla(0, 0%, 100%, 0.05)`
            : state !== "locked" ? `inset 0 0 20px hsla(0, 0%, 100%, 0.05)` : undefined,
        }}
      />

      {/* Orbit dots */}
      <div className="absolute inset-0 pointer-events-none">
        {cluster.dots.map((dot, i) => {
          const pos = orbitPositions[i];
          if (!pos) return null;
          const dotMiniCount = miniDotCounts[dot.id] || 0;
          const hasMinis = dotMiniCount > 0;
          return (
            <div key={dot.id}>
              <motion.span
                className="absolute rounded-full"
                style={{
                  backgroundColor: getDotColor(dot),
                  left: `calc(50% + ${pos.x}px - ${Math.round(5 * scale)}px)`,
                  top: `calc(50% + ${pos.y}px - ${Math.round(5 * scale)}px)`,
                  boxShadow: `0 0 ${Math.round((hasMinis ? 8 + dotMiniCount * 2 : 6) * scale)}px ${getDotColor(dot)}80`,
                  width: Math.round((hasMinis ? 12 : 10) * scale),
                  height: Math.round((hasMinis ? 12 : 10) * scale),
                }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 + i * 0.03 }}
              />
              {hasMinis && Array.from({ length: Math.min(dotMiniCount, 4) }).map((_, mi) => {
                const miniAngle = (2 * Math.PI * mi) / Math.min(dotMiniCount, 4);
                const miniRadius = 8;
                const mx = pos.x + Math.cos(miniAngle) * miniRadius;
                const my = pos.y + Math.sin(miniAngle) * miniRadius;
                return (
                  <motion.span
                    key={`mini-${dot.id}-${mi}`}
                    className="absolute rounded-full"
                    style={{
                      backgroundColor: getDotColor(dot),
                      left: `calc(50% + ${mx}px - 2px)`,
                      top: `calc(50% + ${my}px - 2px)`,
                      width: 4,
                      height: 4,
                      opacity: 0.7,
                    }}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: [0.4, 0.9, 0.4], scale: 1 }}
                    transition={{ delay: index * 0.05 + i * 0.03 + mi * 0.05, duration: 2, repeat: Infinity }}
                  />
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Content */}
      <div className="relative z-20 flex flex-col items-center px-1">
        {state === "locked" ? (
          <Lock className="w-4 h-4 text-muted-foreground/50" />
        ) : (
          <>
            <span
              className="text-[10px] font-semibold leading-tight text-center max-w-[60px] px-1.5 py-0.5 rounded-md"
              style={{
                color: "hsl(220, 20%, 95%)",
                backgroundColor: "hsl(232, 45%, 7% / 0.8)",
                textShadow: "0 0 10px hsla(0, 0%, 100%, 0.2)",
              }}
            >
              {cluster.name}
            </span>
            {cluster.dotCount > 0 && (
              <span 
                className="text-[9px] mt-0.5 font-medium"
                style={{ color: "hsl(220, 20%, 80%)" }}
              >
                {cluster.dotCount}
              </span>
            )}
          </>
        )}
      </div>
    </motion.button>
  );
};
