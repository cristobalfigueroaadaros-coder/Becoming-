import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import type { ClusterWithState } from "@/hooks/useAtlas";
import { DOMAIN_COLORS } from "@/hooks/useAtlas";

interface AtlasClusterNodeProps {
  cluster: ClusterWithState;
  index: number;
  onTap: () => void;
}

export const AtlasClusterNode = ({ cluster, index, onTap }: AtlasClusterNodeProps) => {
  const domainName = cluster.meta_domain?.name || "Person";
  const colors = DOMAIN_COLORS[domainName] || DOMAIN_COLORS.Person;
  const state = cluster.computedState;

  const stateStyles: Record<string, string> = {
    locked: "opacity-40 cursor-not-allowed",
    available: "opacity-70",
    activated: "opacity-90",
    growing: "opacity-100",
    rich: "opacity-100",
  };

  const sizeMap: Record<string, number> = {
    locked: 72,
    available: 76,
    activated: 84,
    growing: 92,
    rich: 100,
  };

  const size = sizeMap[state];

  return (
    <motion.button
      onClick={state !== "locked" ? onTap : undefined}
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05, type: "spring", stiffness: 200, damping: 20 }}
      className={`relative flex flex-col items-center justify-center rounded-full transition-all ${stateStyles[state]}`}
      style={{ width: size, height: size }}
    >
      {/* Glow ring */}
      {(state === "growing" || state === "rich") && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            boxShadow: `0 0 ${state === "rich" ? 20 : 12}px ${colors.glow}`,
            border: `1.5px solid ${colors.border}`,
          }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
      )}

      {/* Main circle */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle at 40% 35%, ${colors.glow}, transparent 70%)`,
          border: `1px solid ${state === "available" ? "hsl(var(--border))" : colors.border}`,
        }}
      />

      {/* Dot indicators */}
      {cluster.dotCount > 0 && (
        <div className="absolute -top-0.5 -right-0.5 flex gap-0.5">
          {Array.from({ length: Math.min(cluster.dotCount, 4) }).map((_, i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: colors.bg }}
            />
          ))}
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center px-1">
        {state === "locked" ? (
          <Lock className="w-4 h-4 text-muted-foreground" />
        ) : (
          <>
            <span
              className="text-[10px] font-semibold leading-tight text-center max-w-[60px]"
              style={{ color: state === "available" ? "hsl(var(--muted-foreground))" : colors.text }}
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
