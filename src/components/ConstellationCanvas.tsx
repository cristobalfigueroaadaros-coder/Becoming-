import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  ConnectionLineType,
  Panel,
  MiniMap,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { BookOpen, Lightbulb, Target, Heart, Sparkles, Star, BookMarked, Brain, Smile, Edit, Save, X, User, Rocket } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { YinYangCore } from './constellation/YinYangCore';
import { classifyAnchorType, getAnchorAngleRange, getAnchorColor, type AnchorType } from '@/lib/anchorClassification';

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

const entryTypeConfig: Record<string, { icon: any; color: string; bgColor: string }> = {
  book: { icon: BookOpen, color: 'hsl(220 80% 60%)', bgColor: 'hsl(220 80% 60% / 0.1)' },
  idea: { icon: Lightbulb, color: 'hsl(45 90% 60%)', bgColor: 'hsl(45 90% 60% / 0.1)' },
  insight: { icon: Sparkles, color: 'hsl(270 75% 65%)', bgColor: 'hsl(270 75% 65% / 0.1)' },
  milestone: { icon: Target, color: 'hsl(140 75% 55%)', bgColor: 'hsl(140 75% 55% / 0.1)' },
  memory: { icon: Brain, color: 'hsl(190 80% 60%)', bgColor: 'hsl(190 80% 60% / 0.1)' },
  emotion: { icon: Heart, color: 'hsl(330 80% 65%)', bgColor: 'hsl(330 80% 65% / 0.1)' },
  custom: { icon: Star, color: 'hsl(var(--muted-foreground))', bgColor: 'hsl(var(--muted) / 0.5)' },
  council_meeting: { icon: BookMarked, color: 'hsl(220 90% 60%)', bgColor: 'hsl(220 90% 60% / 0.1)' },
  mentor_chat: { icon: Sparkles, color: 'hsl(140 70% 50%)', bgColor: 'hsl(140 70% 50% / 0.1)' },
  journal: { icon: BookOpen, color: 'hsl(270 70% 60%)', bgColor: 'hsl(270 70% 60% / 0.1)' },
  shadow_work: { icon: Smile, color: 'hsl(0 80% 60%)', bgColor: 'hsl(0 80% 60% / 0.1)' },
  // Becoming types
  core_values: { icon: Heart, color: 'hsl(280 75% 60%)', bgColor: 'hsl(280 75% 60% / 0.1)' },
  strengths: { icon: Star, color: 'hsl(270 70% 55%)', bgColor: 'hsl(270 70% 55% / 0.1)' },
  ikigai: { icon: Target, color: 'hsl(290 80% 60%)', bgColor: 'hsl(290 80% 60% / 0.1)' },
  // Creating types
  integrator_step: { icon: Target, color: 'hsl(45 85% 55%)', bgColor: 'hsl(45 85% 55% / 0.1)' },
  focus_mode: { icon: Lightbulb, color: 'hsl(40 90% 50%)', bgColor: 'hsl(40 90% 50% / 0.1)' },
};

const CustomNode = ({ data }: { data: any }) => {
  const config = entryTypeConfig[data.source_type] || entryTypeConfig.custom;
  const Icon = config.icon;
  const isHighAlignment = data.alignmentScore >= 61;
  const isMediumAlignment = data.alignmentScore >= 31 && data.alignmentScore < 61;
  const anchorColor = data.anchorColor;

  return (
    <Card 
      className="p-3 min-w-[180px] max-w-[220px] border-2 cursor-pointer hover:shadow-lg transition-all relative"
      style={{ 
        borderColor: anchorColor || config.color,
        backgroundColor: config.bgColor,
        boxShadow: anchorColor ? `0 0 15px ${anchorColor}40` : undefined,
      }}
    >
      {data.anchorLabel && (
        <div className="absolute -top-2 -right-2">
          <Badge 
            variant="secondary" 
            className="h-5 px-1.5 text-xs"
            style={{ backgroundColor: anchorColor, color: 'white' }}
          >
            {data.anchorLabel === 'Identity' ? <User className="h-3 w-3" /> : 
             data.anchorLabel === 'Action' ? <Rocket className="h-3 w-3" /> : 
             <Sparkles className="h-3 w-3" />}
          </Badge>
        </div>
      )}
      <div className="flex items-start gap-2 mb-2">
        <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: config.color }} />
        <div className="flex-1">
          <h4 className="font-semibold text-sm leading-tight line-clamp-2">{data.title}</h4>
          {data.alignmentScore > 0 && (
            <Badge 
              variant={isHighAlignment ? "default" : isMediumAlignment ? "secondary" : "outline"} 
              className="text-xs mt-1"
            >
              {data.alignmentScore}% aligned
            </Badge>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 flex-wrap">
        {data.core_theme && (
          <Badge variant="outline" className="text-xs">
            {data.core_theme}
          </Badge>
        )}
      </div>
    </Card>
  );
};

const nodeTypes = {
  constellationNode: CustomNode,
};

const patternTypeColors: Record<string, string> = {
  theme: 'hsl(270 75% 65%)',
  strength: 'hsl(140 75% 55%)',
  purpose: 'hsl(280 90% 65%)',
  trend: 'hsl(200 80% 60%)',
  opportunity: 'hsl(45 90% 60%)',
  synergy: 'hsl(330 80% 65%)',
  growth: 'hsl(160 80% 55%)',
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
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedConnection, setSelectedConnection] = useState<DotConnection | null>(null);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [userNotes, setUserNotes] = useState('');
  const { toast } = useToast();

  // Center position for the Yin-Yang core
  const centerX = 500;
  const centerY = 400;
  const coreSize = 200;

  // Classify dots and count by anchor type
  const classifiedDots = useMemo(() => {
    return dots.map(dot => {
      const anchorType = dot.anchor_type || classifyAnchorType(dot.source_type, dot.insight_text);
      return { ...dot, anchor_type: anchorType };
    });
  }, [dots]);

  const anchorCounts = useMemo(() => {
    const counts = { becoming: 0, creating: 0, both: 0 };
    classifiedDots.forEach(dot => {
      const type = dot.anchor_type || 'both';
      counts[type]++;
    });
    return counts;
  }, [classifiedDots]);

  // Create nodes from dots with radial positioning around the core
  const initialNodes = useMemo((): Node[] => {
    if (classifiedDots.length === 0) return [];
    
    // Group dots by anchor type
    const becomingDots = classifiedDots.filter(d => d.anchor_type === 'becoming');
    const creatingDots = classifiedDots.filter(d => d.anchor_type === 'creating');
    const bridgeDots = classifiedDots.filter(d => d.anchor_type === 'both');

    const allNodes: Node[] = [];
    const baseRadius = coreSize / 2 + 80; // Start from edge of core

    // Position becoming dots (left side: 135-225 degrees)
    becomingDots.forEach((dot, index) => {
      const angleRange = { min: 135, max: 225 };
      const angleStep = (angleRange.max - angleRange.min) / Math.max(1, becomingDots.length - 1);
      const angle = becomingDots.length === 1 
        ? (angleRange.min + angleRange.max) / 2 
        : angleRange.min + index * angleStep;
      const radiusOffset = 50 + (index % 3) * 40; // Varied distances
      const radius = baseRadius + radiusOffset;
      const rad = (angle * Math.PI) / 180;
      
      const x = centerX + radius * Math.cos(rad);
      const y = centerY + radius * Math.sin(rad);

      const alignment = purposeAlignments.find(a => a.id === dot.id);
      const anchorColor = getAnchorColor('becoming');

      allNodes.push({
        id: dot.id,
        type: 'constellationNode',
        position: { x, y },
        data: {
          title: dot.insight_text.length > 60 ? dot.insight_text.substring(0, 60) + '...' : dot.insight_text,
          source_type: dot.source_type,
          core_theme: dot.core_theme,
          alignmentScore: alignment?.alignmentScore || 0,
          anchorColor,
          anchorLabel: 'Identity',
        },
      });
    });

    // Position creating dots (right side: -45 to 45 degrees)
    creatingDots.forEach((dot, index) => {
      const angleRange = { min: -45, max: 45 };
      const angleStep = (angleRange.max - angleRange.min) / Math.max(1, creatingDots.length - 1);
      const angle = creatingDots.length === 1 
        ? (angleRange.min + angleRange.max) / 2 
        : angleRange.min + index * angleStep;
      const radiusOffset = 50 + (index % 3) * 40;
      const radius = baseRadius + radiusOffset;
      const rad = (angle * Math.PI) / 180;
      
      const x = centerX + radius * Math.cos(rad);
      const y = centerY + radius * Math.sin(rad);

      const alignment = purposeAlignments.find(a => a.id === dot.id);
      const anchorColor = getAnchorColor('creating');

      allNodes.push({
        id: dot.id,
        type: 'constellationNode',
        position: { x, y },
        data: {
          title: dot.insight_text.length > 60 ? dot.insight_text.substring(0, 60) + '...' : dot.insight_text,
          source_type: dot.source_type,
          core_theme: dot.core_theme,
          alignmentScore: alignment?.alignmentScore || 0,
          anchorColor,
          anchorLabel: 'Action',
        },
      });
    });

    // Position bridge dots (top and bottom: around 90 and 270 degrees)
    bridgeDots.forEach((dot, index) => {
      const isTop = index % 2 === 0;
      const baseAngle = isTop ? 270 : 90;
      const offset = (Math.floor(index / 2)) * 20 - ((bridgeDots.length / 4) * 20);
      const angle = baseAngle + offset;
      const radiusOffset = 60 + (index % 3) * 35;
      const radius = baseRadius + radiusOffset;
      const rad = (angle * Math.PI) / 180;
      
      const x = centerX + radius * Math.cos(rad);
      const y = centerY + radius * Math.sin(rad);

      const alignment = purposeAlignments.find(a => a.id === dot.id);
      const anchorColor = getAnchorColor('both');

      allNodes.push({
        id: dot.id,
        type: 'constellationNode',
        position: { x, y },
        data: {
          title: dot.insight_text.length > 60 ? dot.insight_text.substring(0, 60) + '...' : dot.insight_text,
          source_type: dot.source_type,
          core_theme: dot.core_theme,
          alignmentScore: alignment?.alignmentScore || 0,
          anchorColor,
          anchorLabel: 'Bridge',
        },
      });
    });

    return allNodes;
  }, [classifiedDots, purposeAlignments, centerX, centerY, coreSize]);

  // Create edges from connections
  const initialEdges = useMemo((): Edge[] => {
    const edgesMap = new Map<string, Edge>();

    connections.forEach((connection) => {
      const source = connection.dot_id_1;
      const target = connection.dot_id_2;
      const edgeId = `${source}-${target}`;
      
      if (!edgesMap.has(edgeId)) {
        const patternColor = patternTypeColors[connection.connection_type] || 'hsl(var(--muted-foreground))';
        
        // Check if this is a bridge connection (crosses anchor types)
        const sourceDot = classifiedDots.find(d => d.id === source);
        const targetDot = classifiedDots.find(d => d.id === target);
        const isBridgeConnection = sourceDot?.anchor_type !== targetDot?.anchor_type;
        
        edgesMap.set(edgeId, {
          id: edgeId,
          source,
          target,
          type: ConnectionLineType.Bezier,
          animated: connection.ai_generated,
          style: { 
            stroke: isBridgeConnection ? 'url(#bridgeGradient)' : patternColor,
            strokeWidth: isBridgeConnection ? 3 : 2,
          },
          label: connection.connection_type,
          labelStyle: { 
            fill: 'hsl(var(--foreground))', 
            fontSize: 10,
            fontWeight: 500,
          },
          labelBgStyle: { 
            fill: 'hsl(var(--background))', 
            fillOpacity: 0.8,
          },
        });
      }
    });

    return Array.from(edgesMap.values());
  }, [connections, classifiedDots]);

  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    const dot = dots.find(d => d.id === node.id);
    if (dot) {
      onDotClick(dot);
    }
  }, [dots, onDotClick]);

  const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    const connection = connections.find(c => 
      `${c.dot_id_1}-${c.dot_id_2}` === edge.id
    );
    if (connection) {
      setSelectedConnection(connection);
      setUserNotes(connection.user_notes || '');
      setIsEditingNotes(false);
    }
  }, [connections]);

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

  if (dots.length === 0) {
    return (
      <Card className="p-8 text-center relative overflow-hidden min-h-[500px] flex items-center justify-center">
        <div className="absolute inset-0 flex items-center justify-center opacity-30">
          <YinYangCore userName={userName} projectName={projectName} size={300} />
        </div>
        <div className="relative z-10 space-y-3">
          <p className="text-muted-foreground text-lg">Your constellation awaits</p>
          <p className="text-sm text-muted-foreground">Add insights to see them orbit around your core</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-full h-[700px] overflow-hidden relative">
      {/* SVG Gradient definition for bridge connections */}
      <svg width="0" height="0" className="absolute">
        <defs>
          <linearGradient id="bridgeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(270 75% 60%)" />
            <stop offset="50%" stopColor="hsl(200 70% 55%)" />
            <stop offset="100%" stopColor="hsl(45 90% 55%)" />
          </linearGradient>
        </defs>
      </svg>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        nodeTypes={nodeTypes}
        connectionLineType={ConnectionLineType.Bezier}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
        defaultEdgeOptions={{
          animated: true,
        }}
      >
        <Background />
        <Controls />
        <MiniMap 
          nodeColor={(node) => {
            const data = node.data as any;
            return data?.anchorColor || 'hsl(var(--primary))';
          }}
          maskColor="hsl(var(--background) / 0.8)"
        />

        {/* Yin-Yang Core at center */}
        <Panel position="top-left" className="!left-1/2 !top-1/2 !-translate-x-1/2 !-translate-y-1/2 !m-0 pointer-events-none">
          <YinYangCore userName={userName} projectName={projectName} size={coreSize} />
        </Panel>

        {/* Anchor Type Legend */}
        <Panel position="top-left" className="bg-background/90 backdrop-blur-sm p-3 rounded-lg border border-border m-2">
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Living Constellation</h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(270 75% 60%)' }} />
                <User className="w-3 h-3 text-violet-400" />
                <span>Becoming ({anchorCounts.becoming})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(45 90% 55%)' }} />
                <Rocket className="w-3 h-3 text-amber-400" />
                <span>Creating ({anchorCounts.creating})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(200 70% 55%)' }} />
                <Sparkles className="w-3 h-3 text-cyan-400" />
                <span>Bridge ({anchorCounts.both})</span>
              </div>
            </div>
          </div>
        </Panel>

        {showPurposeView && purposeAlignments.length > 0 && (
          <Panel position="top-right" className="bg-background/90 backdrop-blur-sm p-3 rounded-lg border border-border m-2">
            <div className="space-y-2">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Target className="w-4 h-4" />
                Purpose Alignment
              </h3>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: 'hsl(280 90% 65%)' }} />
                  <span>High (61-100%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: 'hsl(200 80% 60%)' }} />
                  <span>Medium (31-60%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: 'hsl(220 40% 55%)' }} />
                  <span>Low (0-30%)</span>
                </div>
              </div>
            </div>
          </Panel>
        )}
      </ReactFlow>

      <Dialog open={!!selectedConnection} onOpenChange={(open) => !open && handleCloseDialog()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Connection Insight
              {selectedConnection && (
                <Badge 
                  variant="outline" 
                  style={{ 
                    borderColor: patternTypeColors[selectedConnection.connection_type],
                    color: patternTypeColors[selectedConnection.connection_type]
                  }}
                >
                  {selectedConnection.connection_type}
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              AI-detected relationship between insights
            </DialogDescription>
          </DialogHeader>
          {selectedConnection && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    {selectedConnection.ai_generated ? '✨ AI Analysis' : '👤 User Connection'}
                  </span>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm leading-relaxed">{selectedConnection.connection_insight}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Your Perspective</span>
                  {!isEditingNotes && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditingNotes(true)}
                      className="h-7 px-2"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      {selectedConnection.user_notes ? 'Edit' : 'Add Notes'}
                    </Button>
                  )}
                </div>

                {isEditingNotes ? (
                  <div className="space-y-2">
                    <Textarea
                      value={userNotes}
                      onChange={(e) => setUserNotes(e.target.value)}
                      placeholder="Add your own insights, observations, or refinements to the AI's analysis..."
                      className="min-h-[100px] resize-none"
                    />
                    <div className="flex items-center gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setIsEditingNotes(false);
                          setUserNotes(selectedConnection.user_notes || '');
                        }}
                      >
                        <X className="h-3 w-3 mr-1" />
                        Cancel
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={handleSaveNotes}
                      >
                        <Save className="h-3 w-3 mr-1" />
                        Save Notes
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-lg bg-background border border-border min-h-[60px]">
                    {selectedConnection.user_notes ? (
                      <p className="text-sm leading-relaxed">{selectedConnection.user_notes}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">
                        No notes yet. Add your perspective to refine the AI's understanding.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default ConstellationCanvas;
