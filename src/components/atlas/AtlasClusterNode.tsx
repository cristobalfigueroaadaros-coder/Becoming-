import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import type { ClusterWithState } from "@/hooks/useAtlas";
import { DOMAIN_COLORS, getDotColor } from "@/hooks/useAtlas";

interface AtlasClusterNodeProps {
  cluster: ClusterWithState;
  index: number;
  onTap: () => void;
}

// Compute positions for dots in concentric orbits around the cluster center
function getOrbitPositions(dotCount: number): { x: number; y: number }[] {
  const orbits = [
    { radius: 20, maxDots: 6 },
    { radius: 34, maxDots: 8 },
    { radius: 48, maxDots: 12 },
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

export const AtlasClusterNode = ({ cluster, index, onTap }: AtlasClusterNodeProps) => {
  const domainName = cluster.meta_domain?.name || "Person";
  const colors = DOMAIN_COLORS[domainName] || DOMAIN_COLORS.Person;
  const state = cluster.computedState;
  const style = GROWTH_STYLES[state] || GROWTH_STYLES.dormant;
  const orbitPositions = getOrbitPositions(cluster.dots.length);

  return (
    <motion.button
      onClick={state !== "locked" ? onTap : undefined}
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05, type: "spring", stiffness: 200, damping: 20 }}
      className={`relative flex items-center justify-center ${style.opacity} ${state === "locked" ? "cursor-not-allowed" : ""}`}
      style={{ width: style.size + 60, height: style.size + 60 }}
    >
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

      {/* Multi-orbit dots */}
      {cluster.dots.map((dot, i) => {
        const pos = orbitPositions[i];
        if (!pos) return null;
        return (
          <motion.span
            key={dot.id}
            className="absolute w-2 h-2 rounded-full"
            style={{
              backgroundColor: getDotColor(dot),
              left: `calc(50% + ${pos.x}px - 4px)`,
              top: `calc(50% + ${pos.y}px - 4px)`,
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 + i * 0.03 }}
          />
        );
      })}

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center px-1">
        {state === "locked" ? (
          <Lock className="w-4 h-4 text-muted-foreground" />
        ) : (
          <>
            <span
              className="text-[10px] font-semibold leading-tight text-center max-w-[60px]"
              style={{ color: state === "dormant" ? "hsl(var(--muted-foreground))" : colors.text }}
            >
              {cluster.name}
            </span>
            {cluster.dotCount > 0 && (
              <span className="text-[9px] mt-0.5" style={{ color: colors.text }}>
                {cluster.dotCount}
              </span>
            )}
          </>
        )}
      </div>
    </motion.button>
  );
};
