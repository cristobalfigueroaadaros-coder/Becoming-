import { useMemo } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Eye } from "lucide-react";
import { 
  FUTURE_DOTS, 
  FUTURE_CONNECTIONS, 
  CLUSTER_CONFIG, 
  getDotSize, 
  getDotPosition,
  type FutureDot 
} from "@/lib/futureConstellationData";
import { NeuralDot, NeuralConnection } from "./NeuralDot";
import { ClusterLabel } from "./ClusterLabel";
import { CosmicYinYangCore } from "./CosmicYinYangCore";

interface FutureConstellationViewProps {
  userName?: string;
}

export const FutureConstellationView = ({ userName = "Future You" }: FutureConstellationViewProps) => {
  const width = 900;
  const height = 700;
  const centerX = width / 2;
  const centerY = height / 2;
  const baseRadius = 200;

  // Group dots by cluster
  const dotsByCluster = useMemo(() => {
    const grouped: Record<string, FutureDot[]> = {};
    FUTURE_DOTS.forEach(dot => {
      if (!grouped[dot.cluster]) grouped[dot.cluster] = [];
      grouped[dot.cluster].push(dot);
    });
    return grouped;
  }, []);

  // Calculate positions for all dots
  const dotPositions = useMemo(() => {
    const positions: Record<string, { x: number; y: number; size: number; color: string; label: string }> = {};
    
    Object.entries(dotsByCluster).forEach(([cluster, dots]) => {
      dots.forEach((dot, index) => {
        const pos = getDotPosition(dot, index, dots.length, centerX, centerY, baseRadius);
        positions[dot.id] = {
          ...pos,
          size: getDotSize(dot.connections),
          color: CLUSTER_CONFIG[dot.cluster as keyof typeof CLUSTER_CONFIG].color,
          label: dot.label,
        };
      });
    });
    
    return positions;
  }, [dotsByCluster, centerX, centerY, baseRadius]);

  // Calculate cluster label positions
  const clusterLabelPositions = useMemo(() => {
    return Object.entries(CLUSTER_CONFIG).map(([key, config]) => {
      const angle = config.position.angle;
      const radius = baseRadius * config.position.radiusMultiplier + 80;
      const rad = (angle * Math.PI) / 180;
      return {
        key,
        label: config.label,
        x: centerX + radius * Math.cos(rad),
        y: centerY + radius * Math.sin(rad),
        color: config.color,
      };
    });
  }, [centerX, centerY, baseRadius]);

  return (
    <Card className="w-full h-[700px] overflow-hidden relative bg-gradient-to-br from-background via-background to-muted/30">
      {/* Dreamy overlay to indicate this is aspirational */}
      <div className="absolute inset-0 bg-gradient-to-t from-primary/5 via-transparent to-accent/5 pointer-events-none z-10" />
      
      {/* Header badge */}
      <div className="absolute top-4 left-4 z-20">
        <Badge variant="secondary" className="gap-2 bg-primary/10 border-primary/20">
          <Eye className="w-3 h-3" />
          Future Vision
        </Badge>
      </div>

      {/* Info text */}
      <div className="absolute top-4 right-4 z-20 max-w-[200px] text-right">
        <p className="text-xs text-muted-foreground">
          This is what your constellation could look like after discovering your purpose
        </p>
      </div>

      <svg width={width} height={height} className="absolute inset-0">
        <defs>
          {/* Gradient for bridge connections */}
          <linearGradient id="futureBridgeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(30 85% 55%)" />
            <stop offset="50%" stopColor="hsl(270 70% 60%)" />
            <stop offset="100%" stopColor="hsl(200 80% 55%)" />
          </linearGradient>
          
          {/* Glow filter */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Region labels */}
        <text
          x={centerX - baseRadius * 1.5}
          y={centerY}
          fill="hsl(45 90% 55%)"
          opacity={0.4}
          fontSize={14}
          fontWeight="bold"
          textAnchor="middle"
          transform={`rotate(-90, ${centerX - baseRadius * 1.5}, ${centerY})`}
        >
          CREATION
        </text>
        <text
          x={centerX + baseRadius * 1.5}
          y={centerY}
          fill="hsl(200 80% 55%)"
          opacity={0.4}
          fontSize={14}
          fontWeight="bold"
          textAnchor="middle"
          transform={`rotate(90, ${centerX + baseRadius * 1.5}, ${centerY})`}
        >
          BECOMING
        </text>

        {/* Draw connections first (behind dots) */}
        {FUTURE_CONNECTIONS.map((conn, index) => {
          const from = dotPositions[conn.from];
          const to = dotPositions[conn.to];
          if (!from || !to) return null;

          const color = conn.type === 'bridge' 
            ? "url(#futureBridgeGradient)" 
            : conn.type === 'cluster'
            ? CLUSTER_CONFIG[FUTURE_DOTS.find(d => d.id === conn.from)?.cluster || 'bridge'].color
            : 'hsl(var(--muted-foreground))';

          return (
            <NeuralConnection
              key={`${conn.from}-${conn.to}`}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              color={color}
              type={conn.type}
              delay={index * 0.02}
            />
          );
        })}

        {/* Draw dots */}
        {Object.entries(dotPositions).map(([id, pos], index) => (
          <NeuralDot
            key={id}
            id={id}
            x={pos.x}
            y={pos.y}
            size={pos.size}
            color={pos.color}
            label={pos.label}
            isInteractive={false}
            delay={index * 0.03}
          />
        ))}
      </svg>

      {/* Cluster labels */}
      {clusterLabelPositions.map(({ key, label, x, y, color }) => (
        <ClusterLabel
          key={key}
          label={label}
          x={x}
          y={y}
          color={color}
          size="sm"
        />
      ))}

      {/* Cosmic Yin-Yang Core at center */}
      <div 
        className="absolute z-10 pointer-events-none"
        style={{
          left: centerX,
          top: centerY,
          transform: 'translate(-50%, -50%)',
        }}
      >
        <CosmicYinYangCore userName={userName} size={160} />
      </div>

      {/* Bottom insight */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5 }}
          className="flex items-center gap-2 text-sm text-muted-foreground"
        >
          <Sparkles className="w-4 h-4 text-primary" />
          <span>Your insights become your neural map of growth</span>
        </motion.div>
      </div>
    </Card>
  );
};
