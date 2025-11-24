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
import { BookOpen, Lightbulb, Target, Heart, Sparkles, Star, BookMarked, Brain, Smile, Layers, TrendingUp, Edit, Save, X } from 'lucide-react';
import { detectClusters, getClusterForNode, type Cluster } from '@/lib/clusterDetection';
import { ScrollArea } from './ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
};

const CustomNode = ({ data }: { data: any }) => {
  const config = entryTypeConfig[data.source_type] || entryTypeConfig.custom;
  const Icon = config.icon;
  const isHighAlignment = data.alignmentScore >= 61;
  const isMediumAlignment = data.alignmentScore >= 31 && data.alignmentScore < 61;
  const hasCluster = data.clusterColor;

  return (
    <Card 
      className="p-3 min-w-[180px] max-w-[220px] border-2 cursor-pointer hover:shadow-lg transition-all relative"
      style={{ 
        borderColor: hasCluster ? data.clusterColor : config.color,
        backgroundColor: config.bgColor,
        boxShadow: hasCluster ? `0 0 20px ${data.clusterColor}40` : undefined,
      }}
    >
      {hasCluster && data.clusterStrength === 'high' && (
        <div className="absolute -top-1 -right-1">
          <Badge variant="default" className="h-5 px-1.5 text-xs" style={{ backgroundColor: data.clusterColor }}>
            <Layers className="h-3 w-3" />
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
        {hasCluster && (
          <Badge 
            variant="secondary" 
            className="text-xs"
            style={{ 
              backgroundColor: `${data.clusterColor}20`,
              borderColor: data.clusterColor,
              color: data.clusterColor
            }}
          >
            Cluster
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
  showPurposeView = false
}: ConstellationCanvasProps) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null);
  const [selectedConnection, setSelectedConnection] = useState<DotConnection | null>(null);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [userNotes, setUserNotes] = useState('');
  const { toast } = useToast();

  // Detect clusters from connections
  const clusters = useMemo(() => {
    return detectClusters(dots, connections, 3);
  }, [dots, connections]);

  // Create nodes from dots with circular layout and cluster highlighting
  const initialNodes = useMemo((): Node[] => {
    if (dots.length === 0) return [];
    
    const angleStep = (2 * Math.PI) / dots.length;
    const radius = Math.min(400, 150 + dots.length * 20);

    return dots.map((dot, index) => {
      const angle = index * angleStep;
      const x = 500 + radius * Math.cos(angle);
      const y = 400 + radius * Math.sin(angle);

      const alignment = purposeAlignments.find(a => a.id === dot.id);
      const alignmentScore = alignment?.alignmentScore || 0;

      // Find cluster for this node
      const cluster = getClusterForNode(dot.id, clusters);

      return {
        id: dot.id,
        type: 'constellationNode',
        position: { x, y },
        data: {
          title: dot.insight_text.length > 60 ? dot.insight_text.substring(0, 60) + '...' : dot.insight_text,
          source_type: dot.source_type,
          core_theme: dot.core_theme,
          alignmentScore,
          clusterColor: cluster?.color,
          clusterStrength: cluster?.strength,
        },
        className: selectedCluster === cluster?.id ? 'ring-2 ring-offset-2' : undefined,
        style: selectedCluster === cluster?.id ? { 
          zIndex: 1000,
        } : undefined,
      };
    });
  }, [dots, purposeAlignments, clusters, selectedCluster]);

  // Create edges from connections
  const initialEdges = useMemo((): Edge[] => {
    const edgesMap = new Map<string, Edge>();

    connections.forEach((connection) => {
      const source = connection.dot_id_1;
      const target = connection.dot_id_2;
      const edgeId = `${source}-${target}`;
      
      if (!edgesMap.has(edgeId)) {
        const patternColor = patternTypeColors[connection.connection_type] || 'hsl(var(--muted-foreground))';
        
        edgesMap.set(edgeId, {
          id: edgeId,
          source,
          target,
          type: ConnectionLineType.Bezier,
          animated: connection.ai_generated,
          style: { 
            stroke: patternColor,
            strokeWidth: 2,
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
  }, [connections]);

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

    // Update the local state
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
      <Card className="p-8 text-center">
        <div className="space-y-3">
          <div className="w-24 h-24 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-4xl">✨</span>
          </div>
          <p className="text-muted-foreground text-lg">Your constellation awaits</p>
          <p className="text-sm text-muted-foreground">Add insights to see them visualized here</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-full h-[700px] overflow-hidden">
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
            const alignment = purposeAlignments.find(a => a.id === node.id);
            if (alignment) {
              if (alignment.alignmentScore >= 61) return 'hsl(280 90% 65%)';
              if (alignment.alignmentScore >= 31) return 'hsl(200 80% 60%)';
              return 'hsl(220 40% 55%)';
            }
            return 'hsl(var(--primary))';
          }}
          maskColor="hsl(var(--background) / 0.8)"
        />
        <Panel position="top-left" className="bg-background/80 backdrop-blur-sm p-3 rounded-lg border border-border m-2">
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Connection Types</h3>
            <div className="space-y-1 text-xs">
              {Object.entries(patternTypeColors).map(([type, color]) => (
                <div key={type} className="flex items-center gap-2">
                  <div className="w-4 h-0.5" style={{ backgroundColor: color }} />
                  <span className="capitalize">{type}</span>
                </div>
              ))}
            </div>
          </div>
        </Panel>
        {showPurposeView && purposeAlignments.length > 0 && (
          <Panel position="top-right" className="bg-background/80 backdrop-blur-sm p-3 rounded-lg border border-border m-2">
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
        {clusters.length > 0 && (
          <Panel position="bottom-left" className="bg-background/95 backdrop-blur-sm rounded-lg border border-border m-2 w-[280px]">
            <div className="p-3 space-y-2">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  Focus Clusters
                </h3>
                <Badge variant="secondary" className="text-xs">
                  {clusters.length}
                </Badge>
              </div>
              <ScrollArea className="h-[200px]">
                <div className="space-y-2 pr-3">
                  {clusters.map((cluster) => (
                    <button
                      key={cluster.id}
                      onClick={() => setSelectedCluster(selectedCluster === cluster.id ? null : cluster.id)}
                      className={`w-full text-left p-2 rounded-lg border transition-all ${
                        selectedCluster === cluster.id 
                          ? 'border-2 shadow-md' 
                          : 'border hover:border-2 hover:shadow-sm'
                      }`}
                      style={{ 
                        borderColor: cluster.color,
                        backgroundColor: `${cluster.color}10`,
                      }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-xs" style={{ color: cluster.color }}>
                          {cluster.dominantTheme}
                        </span>
                        <div className="flex items-center gap-1">
                          {cluster.strength === 'high' && (
                            <Badge variant="default" className="h-4 px-1 text-xs" style={{ backgroundColor: cluster.color }}>
                              <TrendingUp className="h-3 w-3" />
                            </Badge>
                          )}
                          <Badge variant="outline" className="h-4 px-1 text-xs">
                            {cluster.size}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {Math.round(cluster.density * 100)}% connected · {cluster.strength} strength
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
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
