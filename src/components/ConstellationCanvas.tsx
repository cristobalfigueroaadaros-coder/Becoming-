import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Target } from "lucide-react";

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

interface PurposeAlignment {
  id: string;
  alignmentScore: number;
  reason: string;
}

interface ConstellationCanvasProps {
  dots: InsightDot[];
  connections: DotConnection[];
  onDotClick: (dot: InsightDot) => void;
  onDotDoubleClick?: (dot: InsightDot) => void;
  selectedDot: InsightDot | null;
  userPurpose?: string | null;
  purposeAlignments?: PurposeAlignment[];
  showPurposeView?: boolean;
}

const sourceColors: Record<string, string> = {
  book: "hsl(220 80% 60%)",
  idea: "hsl(45 90% 60%)",
  insight: "hsl(270 75% 65%)",
  milestone: "hsl(140 75% 55%)",
  memory: "hsl(190 80% 60%)",
  emotion: "hsl(330 80% 65%)",
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
  human_design_type: "hsl(240 80% 65%)",
  human_design_strategy: "hsl(200 80% 60%)",
  human_design_authority: "hsl(40 90% 60%)",
  human_design_profile: "hsl(320 75% 65%)",
  human_design_centers: "hsl(160 75% 55%)",
  human_design_gate: "hsl(270 80% 65%)",
  human_design_incarnation_cross: "hsl(280 85% 70%)",
  human_design_communication: "hsl(180 75% 60%)",
  human_design_decision_making: "hsl(30 85% 65%)",
  human_design_workflow: "hsl(140 80% 60%)",
};

const sourceLabels: Record<string, string> = {
  book: "📚 Book",
  idea: "💡 Idea",
  insight: "✨ Insight",
  milestone: "🎯 Milestone",
  memory: "🧠 Memory",
  emotion: "😌 Emotion",
  council_meeting: "Council",
  mentor_chat: "Chat",
  journal: "Journal",
  ritual: "Ritual",
  shadow_work: "Shadow",
  constellation: "Idea",
  quest: "Quest",
  goal_achievement: "Goal",
  shadow_integration: "Integration",
  journal_breakthrough: "Breakthrough",
  domain_milestone: "Milestone",
  quest_completion: "Quest Win",
  human_design_type: "HD Type",
  human_design_strategy: "HD Strategy",
  human_design_authority: "HD Authority",
  human_design_profile: "HD Profile",
  human_design_centers: "HD Centers",
  human_design_gate: "HD Gate",
  human_design_incarnation_cross: "🌟 HD Cross",
  human_design_communication: "💬 HD Communication",
  human_design_decision_making: "🎯 HD Decisions",
  human_design_workflow: "⚡ HD Work Flow",
};

// Emotional tone colors for enhanced visualization
const emotionalToneColors: Record<string, string> = {
  breakthrough: "hsl(280 90% 65%)", // bright purple
  transformative: "hsl(320 85% 60%)", // magenta
  profound: "hsl(240 80% 65%)", // deep blue
  excited: "hsl(30 95% 55%)", // orange
  inspired: "hsl(50 90% 60%)", // bright yellow
  accomplished: "hsl(140 80% 55%)", // green
  peaceful: "hsl(200 70% 65%)", // light blue
  reflective: "hsl(270 60% 60%)", // soft purple
  curious: "hsl(180 70% 55%)", // cyan
  challenged: "hsl(0 75% 60%)", // red
  uncertain: "hsl(220 40% 55%)", // gray-blue
  grateful: "hsl(340 80% 65%)", // pink
};

// Get emotional intensity multiplier
const getEmotionalIntensity = (tone: string | null): number => {
  if (!tone) return 1;
  const highIntensity = ["breakthrough", "transformative", "profound"];
  const mediumIntensity = ["excited", "inspired", "accomplished", "challenged", "grateful"];
  
  if (highIntensity.includes(tone)) return 1.5;
  if (mediumIntensity.includes(tone)) return 1.2;
  return 1;
};

export const ConstellationCanvas = ({ 
  dots, 
  connections, 
  onDotClick,
  onDotDoubleClick,
  selectedDot,
  userPurpose,
  purposeAlignments = [],
  showPurposeView = false
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
    // Generate constellation layout with central purpose node
    if (dots.length === 0 && !userPurpose) return;

    const newPositions = new Map<string, { x: number; y: number }>();
    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;

    // Always place purpose node at center if it exists
    if (userPurpose) {
      newPositions.set('purpose-node', { x: centerX, y: centerY });
    }

    if (dots.length === 0) {
      setPositions(newPositions);
      return;
    }

    if (dots.length === 1 && !userPurpose) {
      newPositions.set(dots[0].id, { x: centerX, y: centerY });
    } else {
      // Create dots radiating outward from center (purpose node)
      dots.forEach((dot, index) => {
        const totalDots = dots.length;
        const angle = (index / totalDots) * Math.PI * 2;
        
        // Create layers radiating from center
        const layer = Math.floor(index / 8) + 1;
        const baseRadius = Math.min(dimensions.width, dimensions.height) * 0.2;
        const radius = baseRadius * layer;
        
        // Add organic randomness
        const randomOffset = (Math.random() - 0.5) * 50;
        const randomAngle = (Math.random() - 0.5) * 0.4;
        
        const x = centerX + Math.cos(angle + randomAngle) * (radius + randomOffset);
        const y = centerY + Math.sin(angle + randomAngle) * (radius + randomOffset);
        
        newPositions.set(dot.id, { 
          x: Math.max(30, Math.min(dimensions.width - 30, x)),
          y: Math.max(30, Math.min(dimensions.height - 30, y))
        });
      });
    }

    setPositions(newPositions);
  }, [dots, dimensions, userPurpose]);

  const getConnectedDots = (dotId: string) => {
    return connections.filter(c => c.dot_id_1 === dotId || c.dot_id_2 === dotId);
  };

  const getDotSize = (dot: InsightDot) => {
    const connectionCount = getConnectedDots(dot.id).length;
    const emotionalMultiplier = getEmotionalIntensity(dot.emotional_tone);
    const baseSize = 12;
    const connectionBonus = Math.min(connectionCount * 3, 20);
    return (baseSize + connectionBonus) * emotionalMultiplier;
  };

  const getDotColor = (dot: InsightDot) => {
    // In purpose view, color by alignment strength
    if (showPurposeView && purposeAlignments.length > 0) {
      const alignment = purposeAlignments.find(a => a.id === dot.id);
      if (alignment) {
        if (alignment.alignmentScore >= 61) return "hsl(280 90% 65%)"; // High: vibrant purple
        if (alignment.alignmentScore >= 31) return "hsl(200 80% 60%)"; // Medium: blue
        return "hsl(220 40% 55%)"; // Low: muted gray-blue
      }
    }
    
    // Prioritize emotional tone color if available
    if (dot.emotional_tone && emotionalToneColors[dot.emotional_tone]) {
      return emotionalToneColors[dot.emotional_tone];
    }
    // Fall back to source type color
    return sourceColors[dot.source_type] || "hsl(var(--primary))";
  };

  const getPurposeAlignment = (dotId: string): number => {
    const alignment = purposeAlignments.find(a => a.id === dotId);
    return alignment?.alignmentScore || 0;
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

                // Find the dots for this connection
                const dot1 = dots.find(d => d.id === connection.dot_id_1);
                const dot2 = dots.find(d => d.id === connection.dot_id_2);
                
                // Calculate connection strength based on emotional intensity
                const intensity1 = dot1 ? getEmotionalIntensity(dot1.emotional_tone) : 1;
                const intensity2 = dot2 ? getEmotionalIntensity(dot2.emotional_tone) : 1;
                const connectionStrength = (intensity1 + intensity2) / 2;

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
                    strokeWidth={isHighlighted ? 2 * connectionStrength : 1 * connectionStrength}
                    strokeOpacity={isHighlighted ? 0.8 : 0.3 * connectionStrength}
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1, ease: "easeInOut" }}
                  />
                );
              })}
            </g>

            {/* Purpose connection lines - connect each dot to the central purpose node */}
            {userPurpose && positions.has('purpose-node') && showPurposeView && (
              <g>
                {dots.map((dot) => {
                  const dotPos = positions.get(dot.id);
                  const purposePos = positions.get('purpose-node');
                  if (!dotPos || !purposePos) return null;

                  const alignment = getPurposeAlignment(dot.id);
                  const isHighAlignment = alignment >= 61;
                  const isMediumAlignment = alignment >= 31 && alignment < 61;
                  
                  const isHighlighted = 
                    selectedDot?.id === dot.id || 
                    hoveredDot === dot.id;

                  // Only show connections for medium and high alignment
                  if (alignment < 31 && !isHighlighted) return null;

                  // Determine connection styling based on alignment
                  const strokeColor = isHighAlignment 
                    ? "hsl(280 90% 65%)" 
                    : isMediumAlignment 
                      ? "hsl(200 80% 60%)" 
                      : "hsl(220 40% 55%)";
                  
                  const strokeWidth = isHighAlignment ? 2.5 : isMediumAlignment ? 1.5 : 1;
                  const strokeOpacity = isHighAlignment ? 0.7 : isMediumAlignment ? 0.5 : 0.3;

                  return (
                    <motion.line
                      key={`purpose-${dot.id}`}
                      x1={dotPos.x}
                      y1={dotPos.y}
                      x2={purposePos.x}
                      y2={purposePos.y}
                      stroke={isHighlighted ? "hsl(var(--primary))" : strokeColor}
                      strokeWidth={isHighlighted ? 3 : strokeWidth}
                      strokeOpacity={isHighlighted ? 0.9 : strokeOpacity}
                      strokeDasharray={isHighAlignment ? "0" : "4 4"}
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      transition={{ 
                        duration: 1.5, 
                        ease: "easeInOut",
                        delay: 0.3 + (alignment / 300) // Stagger based on alignment
                      }}
                    />
                  );
                })}
              </g>
            )}

            {/* Purpose Node - Central Glowing Node */}
            {userPurpose && positions.has('purpose-node') && (
              <g>
                {/* Outer pulse rings */}
                <motion.circle
                  cx={positions.get('purpose-node')!.x}
                  cy={positions.get('purpose-node')!.y}
                  r="50"
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="2"
                  strokeOpacity="0.3"
                  initial={{ r: 30, opacity: 0 }}
                  animate={{ r: 60, opacity: 0 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                />
                <motion.circle
                  cx={positions.get('purpose-node')!.x}
                  cy={positions.get('purpose-node')!.y}
                  r="40"
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="2"
                  strokeOpacity="0.5"
                  initial={{ r: 30, opacity: 0 }}
                  animate={{ r: 50, opacity: 0 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
                />
                
                {/* Glow effect */}
                <circle
                  cx={positions.get('purpose-node')!.x}
                  cy={positions.get('purpose-node')!.y}
                  r="35"
                  fill="hsl(var(--primary))"
                  opacity="0.15"
                  filter="url(#glow)"
                />
                
                {/* Main purpose node */}
                <motion.circle
                  cx={positions.get('purpose-node')!.x}
                  cy={positions.get('purpose-node')!.y}
                  r="28"
                  fill="url(#dotGradient)"
                  stroke="hsl(var(--primary))"
                  strokeWidth="4"
                  className="cursor-pointer"
                  style={{ color: "hsl(var(--primary))" }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                  whileHover={{ scale: 1.1 }}
                  onMouseEnter={() => setHoveredDot('purpose-node')}
                  onMouseLeave={() => setHoveredDot(null)}
                />
                
                {/* Purpose icon */}
                <text
                  x={positions.get('purpose-node')!.x}
                  y={positions.get('purpose-node')!.y + 8}
                  textAnchor="middle"
                  fill="white"
                  fontSize="24"
                  fontWeight="bold"
                  pointerEvents="none"
                >
                  ⭐
                </text>
              </g>
            )}

            {/* Dots */}
            {dots.map((dot, index) => {
              const pos = positions.get(dot.id);
              if (!pos) return null;

              const size = getDotSize(dot);
              const isSelected = selectedDot?.id === dot.id;
              const isHovered = hoveredDot === dot.id;
              const color = getDotColor(dot);
              const hasEmotionalTone = !!dot.emotional_tone;
              const alignment = getPurposeAlignment(dot.id);
              const isPurposeAligned = showPurposeView && alignment >= 61;

              return (
                <g key={dot.id}>
                  {/* Enhanced glow for emotional tone dots and purpose-aligned dots */}
                  {(isSelected || isHovered || isPurposeAligned) && (
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={size + (isPurposeAligned ? 15 : 10)}
                      fill={color}
                      opacity={isPurposeAligned ? 0.4 : hasEmotionalTone ? 0.3 : 0.2}
                      filter="url(#glow)"
                    />
                  )}
                  
                  {/* Extra glow ring for high-purpose alignment */}
                  {isPurposeAligned && !isSelected && !isHovered && (
                    <motion.circle
                      cx={pos.x}
                      cy={pos.y}
                      r={size + 20}
                      fill="none"
                      stroke={color}
                      strokeWidth="2"
                      strokeOpacity="0.3"
                      initial={{ r: size + 15, opacity: 0 }}
                      animate={{ r: size + 25, opacity: 0 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                    />
                  )}
                  
                  {/* Main dot */}
                  <motion.circle
                    cx={pos.x}
                    cy={pos.y}
                    r={size * (isPurposeAligned ? 1.2 : 1)}
                    fill="url(#dotGradient)"
                    stroke={isSelected ? "white" : color}
                    strokeWidth={isSelected ? 3 : isPurposeAligned ? 3 : (hasEmotionalTone ? 2.5 : 2)}
                    className="cursor-pointer transition-all"
                    onClick={() => onDotClick(dot)}
                    onDoubleClick={() => onDotDoubleClick?.(dot)}
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
                top: (positions.get(hoveredDot)?.y || 0) - 70,
                transform: 'translateX(-50%)'
              }}
            >
              <Card className="shadow-lg border-primary/50">
                <CardContent className="p-3 space-y-1">
                  {hoveredDot === 'purpose-node' ? (
                    <>
                      <Badge variant="secondary" className="text-xs bg-primary/20">
                        Your Purpose
                      </Badge>
                      <p className="text-xs font-medium max-w-[250px]">
                        {userPurpose}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        All insights connect to your purpose
                      </p>
                    </>
                  ) : (() => {
                    const dot = dots.find(d => d.id === hoveredDot);
                    if (!dot) return null;
                    const alignment = getPurposeAlignment(dot.id);
                    const alignmentData = purposeAlignments.find(a => a.id === dot.id);
                    return (
                      <>
                        <Badge 
                          variant="secondary" 
                          className="text-xs"
                          style={{ backgroundColor: `${getDotColor(dot)}20` }}
                        >
                          {sourceLabels[dot.source_type]}
                        </Badge>
                        {dot.emotional_tone && (
                          <Badge 
                            variant="outline" 
                            className="text-xs border-pink-500/50"
                          >
                            💫 {dot.emotional_tone}
                          </Badge>
                        )}
                        {showPurposeView && alignment > 0 && (
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-xs",
                              alignment >= 61 ? "border-purple-500 bg-purple-500/10" :
                              alignment >= 31 ? "border-blue-500 bg-blue-500/10" :
                              "border-gray-500 bg-gray-500/10"
                            )}
                          >
                            {alignment >= 61 ? "🎯 High" : alignment >= 31 ? "→ Medium" : "~ Low"} Purpose Alignment
                          </Badge>
                        )}
                        <p className="text-xs font-medium max-w-[200px] line-clamp-2">
                          {dot.insight_text}
                        </p>
                        {showPurposeView && alignmentData && (
                          <p className="text-xs text-muted-foreground italic">
                            {alignmentData.reason}
                          </p>
                        )}
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

      {/* Legend - Sources & Emotional Tones */}
      <div className="absolute bottom-4 left-4 bg-card/80 backdrop-blur-sm border border-border/50 rounded-lg p-3 space-y-3 max-w-xs">
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2">Sources</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {Object.entries(sourceLabels).slice(0, 8).map(([key, label]) => (
              <div key={key} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: sourceColors[key] }}
                />
                <span className="text-xs text-muted-foreground truncate">{label}</span>
              </div>
            ))}
          </div>
        </div>
        
        {dots.some(d => d.emotional_tone) && (
          <div className="pt-2 border-t border-border/30">
            <p className="text-xs font-semibold text-muted-foreground mb-2">
              💫 Emotional Intensity
            </p>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex-shrink-0" />
                <span>High (Breakthrough)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-yellow-500 to-green-500 flex-shrink-0" />
                <span>Medium (Inspired)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400 flex-shrink-0" />
                <span>Low (Peaceful)</span>
              </div>
            </div>
          </div>
        )}
        
        {showPurposeView && purposeAlignments.length > 0 && (
          <div className="pt-2 border-t border-border/30">
            <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
              <Target className="w-3 h-3" />
              Purpose Alignment
            </p>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-purple-500 flex-shrink-0" />
                <span>High (61-100)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500 flex-shrink-0" />
                <span>Medium (31-60)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gray-500 flex-shrink-0" />
                <span>Low (0-30)</span>
              </div>
            </div>
          </div>
        )}
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
