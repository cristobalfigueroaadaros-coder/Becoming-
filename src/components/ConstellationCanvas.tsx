import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { BookOpen, Lightbulb, Target, Heart, Sparkles, Star, BookMarked, Brain, Smile, Save, X, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CosmicYinYangCore } from './constellation/CosmicYinYangCore';
import { NeuralDot, NeuralConnection } from './constellation/NeuralDot';
import { ClusterLabel } from './constellation/ClusterLabel';
import { CLUSTER_CONFIG } from '@/lib/futureConstellationData';
import { classifyAnchorType, type AnchorType } from '@/lib/anchorClassification';
import { motion } from 'framer-motion';

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
  anchor_type?: AnchorType;
}

interface DotConnection {
  id: string;
  dot_id_1: string;
  dot_id_2: string;
  connection_type: string;
  connection_insight: string;
  ai_generated: boolean;
  user_notes?: string | null;
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
  userName?: string;
  projectName?: string;
}

// Cluster assignment based on source type
const getClusterForSourceType = (sourceType: string, anchorType: AnchorType): keyof typeof CLUSTER_CONFIG => {
  // Skills & Learning
  if (['integrator_step', 'focus_mode', 'skill', 'learning', 'book'].includes(sourceType)) {
    return 'skills_learning';
  }
  // Outputs & Projects
  if (['milestone', 'project', 'creation', 'output', 'goal_achievement', 'domain_milestone'].includes(sourceType)) {
    return 'outputs_projects';
  }
  // Values & Insights
  if (['core_values', 'ikigai', 'strengths', 'insight', 'idea', 'my_why', 'value_map'].includes(sourceType)) {
    return 'values_insights';
  }
  // Self Discovery
  if (['shadow_work', 'quest_completion', 'emotion', 'journal', 'memory', 'shadow_integration', 'journal_breakthrough'].includes(sourceType)) {
    return 'self_discovery';
  }
  // Bridge (council, mentor insights, concepts)
  if (['council_meeting', 'mentor_insight', 'concept', 'mentor_chat'].includes(sourceType) || anchorType === 'both') {
    return 'bridge';
  }
  // Default to insight seeds for new/uncategorized
  return 'insight_seeds';
};

export const ConstellationCanvas = ({ 
  dots, 
  connections, 
  onDotClick,
  selectedDot,
  purposeAlignments = [],
  showPurposeView = false,
  userName = "You",
  projectName = "Your Journey"
}: ConstellationCanvasProps) => {
  const [selectedConnection, setSelectedConnection] = useState<DotConnection | null>(null);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [userNotes, setUserNotes] = useState('');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const { toast } = useToast();

  const width = 900;
  const height = 700;
  const centerX = width / 2;
  const centerY = height / 2;
  const baseRadius = 180;

  // Classify dots and assign clusters
  const classifiedDots = useMemo(() => {
    return dots.map(dot => {
      const anchorType = dot.anchor_type || classifyAnchorType(dot.source_type, dot.insight_text);
      const cluster = getClusterForSourceType(dot.source_type, anchorType);
      return { ...dot, anchor_type: anchorType, cluster };
    });
  }, [dots]);

  // Group dots by cluster
  const dotsByCluster = useMemo(() => {
    const grouped: Record<string, typeof classifiedDots> = {};
    classifiedDots.forEach(dot => {
      const cluster = (dot as any).cluster;
      if (!grouped[cluster]) grouped[cluster] = [];
      grouped[cluster].push(dot);
    });
    return grouped;
  }, [classifiedDots]);

  // Calculate positions for all dots
  const dotPositions = useMemo(() => {
    const positions: Record<string, { x: number; y: number; size: number; color: string; dot: typeof classifiedDots[0] }> = {};
    
    Object.entries(dotsByCluster).forEach(([cluster, clusterDots]) => {
      const config = CLUSTER_CONFIG[cluster as keyof typeof CLUSTER_CONFIG];
      if (!config) return;
      
      clusterDots.forEach((dot, index) => {
        const baseAngle = config.position.angle;
        const radiusMultiplier = config.position.radiusMultiplier;
        
        // Spread dots within cluster
        const spreadAngle = 45;
        const angleOffset = clusterDots.length === 1 
          ? 0 
          : (index - (clusterDots.length - 1) / 2) * (spreadAngle / Math.max(1, clusterDots.length - 1));
        const angle = baseAngle + angleOffset;
        
        // Vary radius for organic feel
        const radiusVariation = (index % 3) * 20 - 20;
        const radius = (baseRadius * radiusMultiplier) + radiusVariation;
        
        const rad = (angle * Math.PI) / 180;
        
        // Calculate size based on connections
        const connectionCount = connections.filter(c => c.dot_id_1 === dot.id || c.dot_id_2 === dot.id).length;
        const baseSize = 14;
        const sizeBonus = Math.min(connectionCount * 2, 16);
        
        positions[dot.id] = {
          x: centerX + radius * Math.cos(rad),
          y: centerY + radius * Math.sin(rad),
          size: baseSize + sizeBonus,
          color: config.color,
          dot,
        };
      });
    });
    
    return positions;
  }, [dotsByCluster, connections, centerX, centerY, baseRadius]);

  // Cluster label positions
  const clusterLabelPositions = useMemo(() => {
    const usedClusters = Object.keys(dotsByCluster);
    return usedClusters.map(cluster => {
      const config = CLUSTER_CONFIG[cluster as keyof typeof CLUSTER_CONFIG];
      if (!config) return null;
      
      const angle = config.position.angle;
      const radius = baseRadius * config.position.radiusMultiplier + 70;
      const rad = (angle * Math.PI) / 180;
      return {
        key: cluster,
        label: config.label,
        x: centerX + radius * Math.cos(rad),
        y: centerY + radius * Math.sin(rad),
        color: config.color,
      };
    }).filter(Boolean);
  }, [dotsByCluster, centerX, centerY, baseRadius]);

  // Cluster counts
  const clusterCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.entries(dotsByCluster).forEach(([cluster, dots]) => {
      counts[cluster] = dots.length;
    });
    return counts;
  }, [dotsByCluster]);

  const handleSaveNotes = async () => {
    if (!selectedConnection) return;

    const { error } = await supabase
      .from('dot_connections')
      .update({ user_notes: userNotes })
      .eq('id', selectedConnection.id);

    if (error) {
      toast({
        title: "Error saving notes",
        description: error.message,
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Notes saved",
      description: "Your perspective has been added to this connection"
    });

    setSelectedConnection({ ...selectedConnection, user_notes: userNotes });
    setIsEditingNotes(false);
  };

  const handleCloseDialog = () => {
    setSelectedConnection(null);
    setIsEditingNotes(false);
    setUserNotes('');
  };

  const handleDotClick = (dotId: string) => {
    const pos = dotPositions[dotId];
    if (pos) {
      onDotClick(pos.dot);
    }
  };

  const handleConnectionClick = (conn: DotConnection) => {
    setSelectedConnection(conn);
    setUserNotes(conn.user_notes || '');
    setIsEditingNotes(false);
  };

  if (dots.length === 0) {
    return (
      <Card className="p-8 text-center relative overflow-hidden min-h-[500px] flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20">
        <div className="absolute inset-0 flex items-center justify-center opacity-40">
          <CosmicYinYangCore userName={userName} size={280} />
        </div>
        <div className="relative z-10 space-y-3">
          <p className="text-muted-foreground text-lg">Your constellation awaits</p>
          <p className="text-sm text-muted-foreground">Add insights to see them orbit around your core</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-full h-[700px] overflow-hidden relative bg-gradient-to-br from-background via-background to-muted/10">
      {/* Zoom controls */}
      <div className="absolute top-4 right-4 z-20 flex gap-2">
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setZoom(z => Math.min(z + 0.2, 2))}>
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setZoom(z => Math.max(z - 0.2, 0.5))}>
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}>
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Cluster legend */}
      <div className="absolute top-4 left-4 z-20 bg-background/90 backdrop-blur-sm p-3 rounded-lg border border-border">
        <h4 className="text-xs font-semibold mb-2 text-muted-foreground">Neural Clusters</h4>
        <div className="space-y-1.5">
          {Object.entries(CLUSTER_CONFIG).map(([key, config]) => {
            const count = clusterCounts[key] || 0;
            if (count === 0) return null;
            return (
              <div key={key} className="flex items-center gap-2 text-xs">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: config.color }} />
                <span className="text-muted-foreground">{config.label}</span>
                <span className="text-foreground font-medium">({count})</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main SVG canvas */}
      <motion.svg 
        width={width} 
        height={height} 
        className="absolute inset-0"
        style={{ 
          transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
          transformOrigin: 'center center',
        }}
      >
        <defs>
          {/* Bridge gradient */}
          <linearGradient id="actualBridgeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(30 85% 55%)" />
            <stop offset="50%" stopColor="hsl(270 70% 60%)" />
            <stop offset="100%" stopColor="hsl(200 80% 55%)" />
          </linearGradient>
        </defs>

        {/* Region labels */}
        <text
          x={centerX - baseRadius * 1.6}
          y={centerY}
          fill="hsl(45 90% 55%)"
          opacity={0.3}
          fontSize={12}
          fontWeight="bold"
          textAnchor="middle"
          transform={`rotate(-90, ${centerX - baseRadius * 1.6}, ${centerY})`}
        >
          CREATION
        </text>
        <text
          x={centerX + baseRadius * 1.6}
          y={centerY}
          fill="hsl(200 80% 55%)"
          opacity={0.3}
          fontSize={12}
          fontWeight="bold"
          textAnchor="middle"
          transform={`rotate(90, ${centerX + baseRadius * 1.6}, ${centerY})`}
        >
          BECOMING
        </text>

        {/* Draw connections */}
        {connections.map((conn, index) => {
          const from = dotPositions[conn.dot_id_1];
          const to = dotPositions[conn.dot_id_2];
          if (!from || !to) return null;

          // Determine connection type
          const fromCluster = (from.dot as any).cluster;
          const toCluster = (to.dot as any).cluster;
          const isBridge = fromCluster !== toCluster;
          const type = isBridge ? 'bridge' : 'cluster';
          
          const color = isBridge 
            ? "url(#actualBridgeGradient)" 
            : from.color;

          return (
            <g 
              key={conn.id} 
              className="cursor-pointer"
              onClick={() => handleConnectionClick(conn)}
            >
              <NeuralConnection
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                color={color}
                type={type}
                delay={index * 0.01}
              />
            </g>
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
            label={pos.dot.insight_text.substring(0, 30)}
            isInteractive={true}
            onClick={() => handleDotClick(id)}
            delay={index * 0.02}
          />
        ))}
      </motion.svg>

      {/* Cluster labels */}
      {clusterLabelPositions.map((item) => item && (
        <ClusterLabel
          key={item.key}
          label={item.label}
          x={item.x * zoom + (1 - zoom) * centerX}
          y={item.y * zoom + (1 - zoom) * centerY}
          color={item.color}
          size="sm"
        />
      ))}

      {/* Cosmic Yin-Yang Core at center */}
      <div 
        className="absolute z-10 pointer-events-none"
        style={{
          left: '50%',
          top: '50%',
          transform: `translate(-50%, -50%) scale(${zoom})`,
        }}
      >
        <CosmicYinYangCore userName={userName} size={140} />
      </div>

      {/* Selected dot info panel */}
      {selectedDot && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-4 left-4 right-4 z-20"
        >
          <Card className="p-4 bg-background/95 backdrop-blur-sm border-primary/20">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="text-xs">
                    {selectedDot.source_type}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {selectedDot.core_theme}
                  </Badge>
                </div>
                <p className="text-sm leading-relaxed">{selectedDot.insight_text}</p>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => onDotClick(null as any)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Connection dialog */}
      <Dialog open={!!selectedConnection} onOpenChange={handleCloseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connection Insight</DialogTitle>
            <DialogDescription>
              {selectedConnection?.connection_type} connection
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm">{selectedConnection?.connection_insight}</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Your Notes</label>
                {!isEditingNotes ? (
                  <Button variant="ghost" size="sm" onClick={() => setIsEditingNotes(true)}>
                    Edit
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setIsEditingNotes(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                    <Button size="sm" onClick={handleSaveNotes}>
                      <Save className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                  </div>
                )}
              </div>
              {isEditingNotes ? (
                <Textarea
                  value={userNotes}
                  onChange={(e) => setUserNotes(e.target.value)}
                  placeholder="Add your perspective on this connection..."
                  rows={3}
                />
              ) : (
                <p className="text-sm text-muted-foreground p-3 bg-muted/50 rounded">
                  {selectedConnection?.user_notes || "No notes yet. Click edit to add your thoughts."}
                </p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
