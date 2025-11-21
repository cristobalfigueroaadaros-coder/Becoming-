import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface InsightDot {
  id: string;
  source_type: string;
  source_mentor: string | null;
  insight_text: string;
  core_theme: string;
  skill_tags: string[];
  emotional_tone: string | null;
  created_at: string;
  reviewed_at: string | null;
  user_reflection: string | null;
  connection_ids: string[];
}

interface DotConnection {
  id: string;
  dot_id_1: string;
  dot_id_2: string;
  connection_type: string;
  connection_insight: string;
  ai_generated: boolean;
}

interface ConstellationCanvasProps {
  dots: InsightDot[];
  connections: DotConnection[];
  onDotClick: (dot: InsightDot) => void;
  selectedDot: InsightDot | null;
}

const sourceColors: Record<string, string> = {
  council_meeting: "hsl(220 90% 60%)",
  mentor_chat: "hsl(140 70% 50%)",
  journal: "hsl(270 70% 60%)",
  ritual: "hsl(30 90% 60%)",
  shadow_work: "hsl(0 80% 60%)",
  constellation: "hsl(50 90% 60%)",
  quest: "hsl(320 80% 60%)",
};

const sourceLabels: Record<string, string> = {
  council_meeting: "Council",
  mentor_chat: "Chat",
  journal: "Journal",
  ritual: "Ritual",
  shadow_work: "Shadow",
  constellation: "Idea",
  quest: "Quest",
};

export const ConstellationCanvas = ({ 
  dots, 
  connections, 
  onDotClick,
  selectedDot 
}: ConstellationCanvasProps) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [hoveredDot, setHoveredDot] = useState<string | null>(null);
  const [positions, setPositions] = useState<Map<string, { x: number; y: number }>>(new Map());

  useEffect(() => {
    const updateDimensions = () => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };
    
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    // Generate constellation layout
    if (dots.length === 0) return;

    const newPositions = new Map<string, { x: number; y: number }>();
    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;

    if (dots.length === 1) {
      newPositions.set(dots[0].id, { x: centerX, y: centerY });
    } else {
      // Create a central focal point with dots radiating outward
      const focalX = dimensions.width * 0.75;
      const focalY = centerY;

      dots.forEach((dot, index) => {
        const totalDots = dots.length;
        const angle = (index / totalDots) * Math.PI * 2;
        
        // Create clusters with varying distances
        const clusterDepth = Math.floor(index / 8) + 1;
        const baseRadius = Math.min(dimensions.width, dimensions.height) * 0.15;
        const radius = baseRadius * clusterDepth;
        
        // Add some randomness for organic feel
        const randomOffset = (Math.random() - 0.5) * 40;
        const randomAngle = (Math.random() - 0.5) * 0.3;
        
        const x = focalX - Math.cos(angle + randomAngle) * (radius + randomOffset);
        const y = focalY + Math.sin(angle + randomAngle) * (radius + randomOffset);
        
        newPositions.set(dot.id, { 
          x: Math.max(30, Math.min(dimensions.width - 30, x)),
          y: Math.max(30, Math.min(dimensions.height - 30, y))
        });
      });
    }

    setPositions(newPositions);
  }, [dots, dimensions]);

  const getConnectedDots = (dotId: string) => {
    return connections.filter(c => c.dot_id_1 === dotId || c.dot_id_2 === dotId);
  };

  const getDotSize = (dot: InsightDot) => {
    const connectionCount = getConnectedDots(dot.id).length;
    const baseSize = 12;
    return baseSize + Math.min(connectionCount * 3, 20);
  };

  return (
    <div className="relative w-full h-full">
      <div 
        ref={canvasRef} 
        className="w-full h-[700px] bg-gradient-to-br from-background via-primary/5 to-accent/10 rounded-xl overflow-hidden relative border border-border/50"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 50%, hsl(var(--primary) / 0.1) 0%, transparent 50%),
                           radial-gradient(circle at 80% 50%, hsl(var(--accent) / 0.1) 0%, transparent 50%)`
        }}
      >
        {dots.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-3">
              <div className="w-24 h-24 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-4xl">✨</span>
              </div>
              <p className="text-muted-foreground text-lg">Your constellation awaits</p>
              <p className="text-sm text-muted-foreground">Start your journey to discover patterns</p>
            </div>
          </div>
        ) : (
          <svg className="w-full h-full">
            <defs>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
              <radialGradient id="dotGradient" cx="30%" cy="30%">
                <stop offset="0%" stopColor="currentColor" stopOpacity="1"/>
                <stop offset="100%" stopColor="currentColor" stopOpacity="0.6"/>
              </radialGradient>
            </defs>

            {/* Connection lines */}
            <g opacity="0.4">
              {connections.map((connection) => {
                const pos1 = positions.get(connection.dot_id_1);
                const pos2 = positions.get(connection.dot_id_2);
                if (!pos1 || !pos2) return null;

                const isHighlighted = 
                  selectedDot?.id === connection.dot_id_1 || 
                  selectedDot?.id === connection.dot_id_2 ||
                  hoveredDot === connection.dot_id_1 ||
                  hoveredDot === connection.dot_id_2;

                return (
                  <motion.line
                    key={connection.id}
                    x1={pos1.x}
                    y1={pos1.y}
                    x2={pos2.x}
                    y2={pos2.y}
                    stroke={isHighlighted ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))"}
                    strokeWidth={isHighlighted ? 2 : 1}
                    strokeOpacity={isHighlighted ? 0.8 : 0.3}
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1, ease: "easeInOut" }}
                  />
                );
              })}
            </g>

            {/* Dots */}
            {dots.map((dot, index) => {
              const pos = positions.get(dot.id);
              if (!pos) return null;

              const size = getDotSize(dot);
              const isSelected = selectedDot?.id === dot.id;
              const isHovered = hoveredDot === dot.id;
              const color = sourceColors[dot.source_type] || "hsl(var(--primary))";

              return (
                <g key={dot.id}>
                  {/* Glow effect for selected/hovered */}
                  {(isSelected || isHovered) && (
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={size + 8}
                      fill={color}
                      opacity="0.2"
                      filter="url(#glow)"
                    />
                  )}
                  
                  {/* Main dot */}
                  <motion.circle
                    cx={pos.x}
                    cy={pos.y}
                    r={size}
                    fill="url(#dotGradient)"
                    stroke={isSelected ? "white" : color}
                    strokeWidth={isSelected ? 3 : 2}
                    className="cursor-pointer transition-all"
                    onClick={() => onDotClick(dot)}
                    onMouseEnter={() => setHoveredDot(dot.id)}
                    onMouseLeave={() => setHoveredDot(null)}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ 
                      delay: index * 0.03,
                      type: "spring",
                      stiffness: 200
                    }}
                    whileHover={{ scale: 1.2 }}
                    style={{ color }}
                  />

                  {/* Small particles around main dots */}
                  {index % 3 === 0 && (
                    <>
                      <circle
                        cx={pos.x - size - 10}
                        cy={pos.y - 5}
                        r="2"
                        fill={color}
                        opacity="0.5"
                      />
                      <circle
                        cx={pos.x + size + 8}
                        cy={pos.y + 8}
                        r="1.5"
                        fill={color}
                        opacity="0.4"
                      />
                    </>
                  )}
                </g>
              );
            })}
          </svg>
        )}

        {/* Hover tooltip */}
        <AnimatePresence>
          {hoveredDot && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute pointer-events-none z-50"
              style={{
                left: positions.get(hoveredDot)?.x || 0,
                top: (positions.get(hoveredDot)?.y || 0) - 60,
                transform: 'translateX(-50%)'
              }}
            >
              <Card className="shadow-lg border-primary/50">
                <CardContent className="p-3 space-y-1">
                  {(() => {
                    const dot = dots.find(d => d.id === hoveredDot);
                    if (!dot) return null;
                    return (
                      <>
                        <Badge 
                          variant="secondary" 
                          className="text-xs"
                          style={{ backgroundColor: `${sourceColors[dot.source_type]}20` }}
                        >
                          {sourceLabels[dot.source_type]}
                        </Badge>
                        <p className="text-xs font-medium max-w-[200px] line-clamp-2">
                          {dot.insight_text}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {getConnectedDots(dot.id).length} connections
                        </p>
                      </>
                    );
                  })()}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-card/80 backdrop-blur-sm border border-border/50 rounded-lg p-3 space-y-2">
        <p className="text-xs font-semibold text-muted-foreground mb-2">Sources</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          {Object.entries(sourceLabels).map(([key, label]) => (
            <div key={key} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: sourceColors[key] }}
              />
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="absolute top-4 right-4 bg-card/80 backdrop-blur-sm border border-border/50 rounded-lg p-3 space-y-1">
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs text-muted-foreground">Insights</span>
          <span className="text-sm font-bold">{dots.length}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs text-muted-foreground">Connections</span>
          <span className="text-sm font-bold">{connections.length}</span>
        </div>
      </div>
    </div>
  );
};
