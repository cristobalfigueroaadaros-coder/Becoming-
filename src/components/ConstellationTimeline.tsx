import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, SkipBack, SkipForward, Gauge } from "lucide-react";
import { cn } from "@/lib/utils";

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

interface ConstellationTimelineProps {
  dots: InsightDot[];
  connections: DotConnection[];
  onDotClick: (dot: InsightDot) => void;
  selectedDot: InsightDot | null;
  userPurpose?: string | null;
}

const sourceColors: Record<string, string> = {
  council_meeting: "hsl(220 90% 60%)",
  mentor_chat: "hsl(140 70% 50%)",
  journal: "hsl(270 70% 60%)",
  ritual: "hsl(30 90% 60%)",
  shadow_work: "hsl(0 80% 60%)",
  constellation: "hsl(50 90% 60%)",
  quest: "hsl(320 80% 60%)",
  goal_achievement: "hsl(160 80% 55%)",
  shadow_integration: "hsl(340 70% 60%)",
  journal_breakthrough: "hsl(280 75% 65%)",
  domain_milestone: "hsl(200 85% 60%)",
  quest_completion: "hsl(300 80% 60%)",
};

const sourceLabels: Record<string, string> = {
  council_meeting: "Council",
  mentor_chat: "1:1 Chat",
  journal: "Journal",
  ritual: "Ritual",
  shadow_work: "Shadow",
  constellation: "Constellation",
  quest: "Quest",
  goal_achievement: "Goal Win",
  shadow_integration: "Integration",
  journal_breakthrough: "Breakthrough",
  domain_milestone: "Milestone",
  quest_completion: "Quest Win",
};

export const ConstellationTimeline = ({
  dots,
  connections,
  onDotClick,
  selectedDot,
  userPurpose,
}: ConstellationTimelineProps) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [dotPositions, setDotPositions] = useState<Record<string, { x: number; y: number }>>({});

  // Sort dots chronologically
  const sortedDots = [...dots].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  // Get visible dots up to current index
  const visibleDots = sortedDots.slice(0, currentIndex + 1);
  const visibleDotIds = new Set(visibleDots.map((d) => d.id));
  const visibleConnections = connections.filter(
    (c) => visibleDotIds.has(c.dot_id_1) && visibleDotIds.has(c.dot_id_2)
  );

  // Update canvas dimensions
  useEffect(() => {
    const updateDimensions = () => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // Generate dot positions (spiral layout from center)
  useEffect(() => {
    if (sortedDots.length === 0) return;

    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;
    const positions: Record<string, { x: number; y: number }> = {};

    if (userPurpose) {
      // Purpose at center
      positions["purpose"] = { x: centerX, y: centerY };
    }

    sortedDots.forEach((dot, index) => {
      const angle = (index / sortedDots.length) * Math.PI * 2;
      const radius = 150 + (index % 3) * 80;
      positions[dot.id] = {
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
      };
    });

    setDotPositions(positions);
  }, [dimensions, sortedDots, userPurpose]);

  // Autoplay
  useEffect(() => {
    if (!isPlaying || currentIndex >= sortedDots.length - 1) {
      setIsPlaying(false);
      return;
    }

    const interval = setInterval(() => {
      setCurrentIndex((prev) => Math.min(prev + 1, sortedDots.length - 1));
    }, 1000 / playbackSpeed);

    return () => clearInterval(interval);
  }, [isPlaying, currentIndex, sortedDots.length, playbackSpeed]);

  const handlePlayPause = () => {
    if (currentIndex >= sortedDots.length - 1) {
      setCurrentIndex(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setIsPlaying(false);
  };

  const handleSkipForward = () => {
    setCurrentIndex((prev) => Math.min(prev + 5, sortedDots.length - 1));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (sortedDots.length === 0) {
    return (
      <Card className="w-full h-[600px] flex items-center justify-center">
        <CardContent>
          <p className="text-muted-foreground">No insights yet. Start your journey to see your constellation grow!</p>
        </CardContent>
      </Card>
    );
  }

  const currentDot = sortedDots[currentIndex];

  return (
    <div className="space-y-4">
      {/* Timeline Canvas */}
      <Card className="relative overflow-hidden">
        <div ref={canvasRef} className="relative w-full h-[600px] bg-gradient-to-br from-background via-primary/5 to-accent/10">
          <svg className="absolute inset-0 w-full h-full">
            <defs>
              <filter id="timeline-glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <radialGradient id="timeline-dot-gradient">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.8" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0.3" />
              </radialGradient>
            </defs>

            {/* Purpose Node */}
            {userPurpose && dotPositions["purpose"] && (
              <g>
                <AnimatePresence>
                  <motion.circle
                    initial={{ r: 0, opacity: 0 }}
                    animate={{ r: 40, opacity: 0.2 }}
                    cx={dotPositions["purpose"].x}
                    cy={dotPositions["purpose"].y}
                    fill="hsl(var(--primary))"
                    className="animate-pulse"
                  />
                </AnimatePresence>
                <circle
                  cx={dotPositions["purpose"].x}
                  cy={dotPositions["purpose"].y}
                  r={30}
                  fill="hsl(var(--primary))"
                  filter="url(#timeline-glow)"
                />
                <text
                  x={dotPositions["purpose"].x}
                  y={dotPositions["purpose"].y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-2xl"
                >
                  ⭐
                </text>
              </g>
            )}

            {/* Connections */}
            {visibleConnections.map((connection) => {
              const pos1 = dotPositions[connection.dot_id_1];
              const pos2 = dotPositions[connection.dot_id_2];
              if (!pos1 || !pos2) return null;

              return (
                <motion.line
                  key={connection.id}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.3 }}
                  transition={{ duration: 0.5 }}
                  x1={pos1.x}
                  y1={pos1.y}
                  x2={pos2.x}
                  y2={pos2.y}
                  stroke="hsl(var(--primary))"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
              );
            })}

            {/* Dots */}
            {visibleDots.map((dot, index) => {
              const pos = dotPositions[dot.id];
              if (!pos) return null;

              const connectionCount = connections.filter(
                (c) => c.dot_id_1 === dot.id || c.dot_id_2 === dot.id
              ).length;
              const dotSize = 6 + connectionCount * 2;
              const isSelected = selectedDot?.id === dot.id;
              const isCurrent = index === currentIndex;

              return (
                <motion.g
                  key={dot.id}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  onClick={() => onDotClick(dot)}
                  style={{ cursor: "pointer" }}
                >
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={dotSize + (isSelected ? 8 : 0) + (isCurrent ? 6 : 0)}
                    fill={sourceColors[dot.source_type] || "hsl(var(--muted))"}
                    fillOpacity={isCurrent ? 1 : 0.8}
                    filter="url(#timeline-glow)"
                    className={cn(
                      "transition-all duration-200",
                      isCurrent && "animate-pulse"
                    )}
                  />
                  {isSelected && (
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={dotSize + 12}
                      fill="none"
                      stroke="hsl(var(--primary))"
                      strokeWidth="2"
                    />
                  )}
                </motion.g>
              );
            })}
          </svg>

          {/* Current Dot Info Overlay */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentDot.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-4 left-4 right-4"
            >
              <Card className="bg-background/95 backdrop-blur-sm border-primary/20">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Badge className="shrink-0" style={{ backgroundColor: sourceColors[currentDot.source_type] }}>
                      {sourceLabels[currentDot.source_type]}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground mb-1">{currentDot.insight_text}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatDate(currentDot.created_at)}</span>
                        <span>•</span>
                        <span>Dot {currentIndex + 1} of {sortedDots.length}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        </div>
      </Card>

      {/* Playback Controls */}
      <Card>
        <CardContent className="p-4 space-y-4">
          {/* Timeline Scrubber */}
          <div className="space-y-2">
            <Slider
              value={[currentIndex]}
              onValueChange={([value]) => setCurrentIndex(value)}
              max={sortedDots.length - 1}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{sortedDots[0] ? formatDate(sortedDots[0].created_at) : ""}</span>
              <span>{sortedDots[sortedDots.length - 1] ? formatDate(sortedDots[sortedDots.length - 1].created_at) : ""}</span>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-center gap-2">
            <Button variant="outline" size="icon" onClick={handleReset}>
              <SkipBack className="w-4 h-4" />
            </Button>
            <Button variant="default" size="icon" onClick={handlePlayPause}>
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            <Button variant="outline" size="icon" onClick={handleSkipForward}>
              <SkipForward className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-2 ml-4">
              <Gauge className="w-4 h-4 text-muted-foreground" />
              <div className="flex gap-1">
                {[0.5, 1, 2, 4].map((speed) => (
                  <Button
                    key={speed}
                    variant={playbackSpeed === speed ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPlaybackSpeed(speed)}
                    className="text-xs px-2"
                  >
                    {speed}x
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
