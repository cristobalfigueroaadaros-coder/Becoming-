import { motion, useReducedMotion } from "framer-motion";
import { DOMAIN_COLORS } from "@/hooks/useAtlas";
import type { FounderCluster } from "@/data/foundersMap";

interface FoundersClusterNodeProps {
  cluster: FounderCluster;
  index: number;
  scale?: number;
  onTap: () => void;
  isFocused?: boolean;
  isFaded?: boolean;
}

function getOrbitPositions(dotCount: number, baseRadius: number, scale = 1) {
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

export const FoundersClusterNode = ({
  cluster,
  index,
  scale = 1,
  onTap,
  isFocused,
  isFaded,
}: FoundersClusterNodeProps) => {
  const shouldReduceMotion = useReducedMotion();
  const colors =
    DOMAIN_COLORS[cluster.domain] || DOMAIN_COLORS.Person;
  const gradient = `linear-gradient(135deg, rgba(255,255,255,0.15) 0%, ${colors.bg.replace(
    ")",
    " / 0.60)",
  )} 100%)`;

  // "Mature-ish" sizing — Cris's map is fully grown
  const size = Math.round(96 * scale);
  const glowSize = Math.round(22 * scale);
  const baseRadius = size / 2;
  const orbitPositions = getOrbitPositions(cluster.dots.length, baseRadius, scale);
  const containerSize = size + 100;
  const fadeClass = isFaded ? "opacity-20 pointer-events-none" : "";

  const totalMinis = cluster.dots.reduce(
    (sum, d) => sum + (d.miniDots?.length || 0),
    0,
  );

  return (
    <motion.button
      onClick={onTap}
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{
        opacity: 1,
        scale: 1,
        y: shouldReduceMotion ? 0 : [0, -3, 0],
      }}
      transition={{
        delay: index * 0.05,
        type: "spring",
        stiffness: 200,
        damping: 20,
        y: {
          duration: 4 + index * 0.5,
          repeat: shouldReduceMotion ? 0 : Infinity,
          ease: "easeInOut",
        },
      }}
      whileHover={{ scale: 1.06 }}
      className={`relative flex items-center justify-center cursor-pointer transition-opacity duration-300 ${fadeClass}`}
      style={{ width: containerSize, height: containerSize }}
      aria-label={`Open cluster ${cluster.name}`}
    >
      {/* Outer glow ring */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: size + 10,
          height: size + 10,
          boxShadow: `0 0 ${glowSize}px ${colors.glow}, 0 0 ${glowSize * 2}px ${colors.glow}`,
          border: `1px solid ${colors.border}`,
        }}
        animate={
          shouldReduceMotion
            ? { opacity: 0.5 }
            : { opacity: [0.3, 0.7, 0.3] }
        }
        transition={{ duration: 3, repeat: shouldReduceMotion ? 0 : Infinity }}
      />

      {/* Main circle */}
      <div
        className="absolute rounded-full"
        style={{
          width: size,
          height: size,
          background: gradient,
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          border: `1.5px solid ${colors.border}`,
          boxShadow: `0 0 ${glowSize + 10 + totalMinis * 2}px ${colors.glow}, inset 0 1px 0 rgba(255,255,255,0.22)`,
          opacity: isFocused ? 1 : 0.95,
        }}
      />

      {/* Orbit dots */}
      <div className="absolute inset-0 pointer-events-none">
        {cluster.dots.map((dot, i) => {
          const pos = orbitPositions[i];
          if (!pos) return null;
          const miniCount = dot.miniDots?.length || 0;
          const hasMinis = miniCount > 0;
          const dotColor = colors.bg;
          return (
            <div key={dot.id}>
              <motion.span
                className="absolute rounded-full"
                style={{
                  backgroundColor: dotColor,
                  left: `calc(50% + ${pos.x}px - ${Math.round(5 * scale)}px)`,
                  top: `calc(50% + ${pos.y}px - ${Math.round(5 * scale)}px)`,
                  boxShadow: `0 0 ${Math.round((hasMinis ? 8 + miniCount * 2 : 6) * scale)}px ${colors.glow}`,
                  width: Math.round((hasMinis ? 12 : 10) * scale),
                  height: Math.round((hasMinis ? 12 : 10) * scale),
                }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 + i * 0.03 }}
              />
              {hasMinis &&
                Array.from({ length: Math.min(miniCount, 4) }).map((_, mi) => {
                  const miniAngle =
                    (2 * Math.PI * mi) / Math.min(miniCount, 4);
                  const miniRadius = 8;
                  const mx = pos.x + Math.cos(miniAngle) * miniRadius;
                  const my = pos.y + Math.sin(miniAngle) * miniRadius;
                  return (
                    <motion.span
                      key={`mini-${dot.id}-${mi}`}
                      className="absolute rounded-full"
                      style={{
                        backgroundColor: dotColor,
                        left: `calc(50% + ${mx}px - 2px)`,
                        top: `calc(50% + ${my}px - 2px)`,
                        width: 4,
                        height: 4,
                        opacity: 0.7,
                      }}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={
                        shouldReduceMotion
                          ? { opacity: 0.6, scale: 1 }
                          : { opacity: [0.4, 0.9, 0.4], scale: 1 }
                      }
                      transition={{
                        delay: index * 0.05 + i * 0.03 + mi * 0.05,
                        duration: 2,
                        repeat: shouldReduceMotion ? 0 : Infinity,
                      }}
                    />
                  );
                })}
            </div>
          );
        })}
      </div>

      {/* Label */}
      <div className="relative z-20 flex flex-col items-center px-1">
        <span
          className="text-[10px] font-semibold leading-tight text-center max-w-[72px] px-1.5 py-0.5 rounded-md"
          style={{
            color: "hsl(220, 20%, 95%)",
            backgroundColor: "hsl(232, 45%, 7% / 0.8)",
            textShadow: "0 0 10px hsla(0, 0%, 100%, 0.2)",
          }}
        >
          {cluster.name}
        </span>
        <span
          className="text-[9px] mt-0.5 font-medium"
          style={{ color: "hsl(220, 20%, 80%)" }}
        >
          {cluster.dots.length}
        </span>
      </div>
    </motion.button>
  );
};