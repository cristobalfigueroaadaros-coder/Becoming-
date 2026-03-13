import { useState } from "react";
import { motion } from "framer-motion";
import { Compass } from "lucide-react";
import { useAtlas, ClusterWithState, DOMAIN_COLORS } from "@/hooks/useAtlas";
import { AtlasClusterNode, AtlasClusterDetail } from "@/components/atlas";

// Organic scatter positions for 13 clusters (percentage-based)
const CLUSTER_POSITIONS: { x: number; y: number }[] = [
  { x: 18, y: 12 }, // Life Events
  { x: 55, y: 8 },  // Passions
  { x: 82, y: 15 }, // Values
  { x: 10, y: 32 }, // Natural Talents
  { x: 42, y: 28 }, // Childhood Signals
  { x: 75, y: 30 }, // Skills
  { x: 25, y: 50 }, // Aha Moments
  { x: 60, y: 48 }, // Experiments
  { x: 88, y: 50 }, // Vision
  { x: 15, y: 70 }, // Ideal Life
  { x: 50, y: 68 }, // Personal Frustrations
  { x: 80, y: 72 }, // Inspirations
  { x: 40, y: 88 }, // External Reflections
];

const AtlasPage = () => {
  const { clusters, domains, isLoading } = useAtlas();
  const [selectedCluster, setSelectedCluster] = useState<ClusterWithState | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Compass className="w-8 h-8 text-primary" />
        </motion.div>
      </div>
    );
  }

  const totalDots = clusters.reduce((sum, c) => sum + c.dotCount, 0);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Radial gradient background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 50% 40%, hsl(var(--primary) / 0.06) 0%, transparent 70%)",
        }}
      />

      {/* Header */}
      <div className="relative z-10 px-5 pt-6 pb-2">
        <div className="flex items-center gap-2">
          <Compass className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-bold text-foreground">Atlas</h1>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {totalDots} {totalDots === 1 ? "discovery" : "discoveries"} across {clusters.filter(c => c.dotCount > 0).length} areas
        </p>

        {/* Domain legend */}
        <div className="flex flex-wrap gap-3 mt-3">
          {domains.map((d) => (
            <div key={d.id} className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: DOMAIN_COLORS[d.name]?.bg || "hsl(var(--muted-foreground))" }}
              />
              <span className="text-[10px] text-muted-foreground">{d.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Cluster map */}
      <div className="relative z-10 w-full" style={{ height: "calc(100vh - 200px)" }}>
        {clusters.map((cluster, i) => {
          const pos = CLUSTER_POSITIONS[i] || { x: 50, y: 50 };
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
              <AtlasClusterNode
                cluster={cluster}
                index={i}
                onTap={() => setSelectedCluster(cluster)}
              />
            </div>
          );
        })}

        {/* Subtle connection lines between same-domain clusters */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
          {domains.map((domain) => {
            const domainClusters = clusters
              .map((c, i) => ({ ...c, pos: CLUSTER_POSITIONS[i] }))
              .filter((c) => c.meta_domain_id === domain.id);
            const color = DOMAIN_COLORS[domain.name]?.glow || "transparent";
            const lines: JSX.Element[] = [];
            for (let i = 0; i < domainClusters.length - 1; i++) {
              const a = domainClusters[i].pos;
              const b = domainClusters[i + 1].pos;
              lines.push(
                <line
                  key={`${domain.id}-${i}`}
                  x1={`${a.x}%`} y1={`${a.y}%`}
                  x2={`${b.x}%`} y2={`${b.y}%`}
                  stroke={color}
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
              );
            }
            return lines;
          })}
        </svg>
      </div>

      {/* Cluster detail sheet */}
      <AtlasClusterDetail
        cluster={selectedCluster}
        open={!!selectedCluster}
        onOpenChange={(open) => !open && setSelectedCluster(null)}
      />
    </div>
  );
};

export default AtlasPage;
