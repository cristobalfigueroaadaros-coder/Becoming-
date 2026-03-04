import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Lightbulb, Plus, Maximize2, Minimize2, Inbox, Tag, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { MicroGuide } from "@/components/MicroGuide";
import { useCreativeSpace } from '@/hooks/useCreativeSpace';
import { InsightTile } from './InsightTile';
import { NoteTile } from './NoteTile';
import { ConnectionLine } from './ConnectionLine';
import { PageTabs } from './PageTabs';
import { PatternHint } from './PatternHint';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface CreativeSpaceProps {
  projectId: string;
  projectTitle: string;
}

interface UserKeyword {
  id: string;
  keyword: string;
  frequency_count: number;
}

interface KeywordSuggestion {
  keyword: string;
  reason: string;
  relevance: number;
}

export function CreativeSpace({ projectId, projectTitle }: CreativeSpaceProps) {
  const {
    tiles,
    connections,
    pages,
    patterns,
    currentPage,
    loading,
    unassignedTiles,
    addNoteTile,
    addKeywordTile,
    updateTilePosition,
    updateTileContent,
    updateTileColor,
    deleteTile,
    assignTileToProject,
    addConnection,
    deleteConnection,
    addPage,
    renamePage,
    deletePage,
    setCurrentPage,
    dismissPattern,
    engagePattern
  } = useCreativeSpace(projectId);

  const [isExpanded, setIsExpanded] = useState(false);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [draggedTile, setDraggedTile] = useState<string | null>(null);
  const [quickNote, setQuickNote] = useState('');
  const [keywords, setKeywords] = useState<UserKeyword[]>([]);
  const [showKeywords, setShowKeywords] = useState(true);
  const [suggestedKeywords, setSuggestedKeywords] = useState<KeywordSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Load user keywords
  useEffect(() => {
    const loadKeywords = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data } = await supabase
        .from('user_keywords')
        .select('id, keyword, frequency_count')
        .eq('user_id', user.id)
        .order('frequency_count', { ascending: false })
        .limit(20);
      
      if (data && data.length > 0) {
        setKeywords(data);
        // Call AI suggestion after keywords load
        fetchKeywordSuggestions(data);
      }
    };
    loadKeywords();
  }, []);

  const fetchKeywordSuggestions = async (kws: UserKeyword[]) => {
    if (kws.length === 0) return;
    setLoadingSuggestions(true);
    try {
      const { data, error } = await supabase.functions.invoke("suggest-keyword-connectors", {
        body: {
          projectTitle,
          existingTiles: tiles.map(t => ({ id: t.id, title: t.title })),
          availableKeywords: kws.map(k => k.keyword),
        },
      });
      if (!error && data?.suggestions) {
        setSuggestedKeywords(data.suggestions);
      }
    } catch (e) {
      console.error("Failed to fetch keyword suggestions:", e);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // Check which keywords are already tiles
  const keywordsInSpace = new Set(
    tiles.filter(t => t.source_type === 'keyword').map(t => t.title.toLowerCase())
  );

  const handleQuickNoteSubmit = () => {
    if (quickNote.trim()) {
      addNoteTile(quickNote.trim());
      setQuickNote('');
    }
  };

  const handleKeywordClick = (keyword: string) => {
    if (!keywordsInSpace.has(keyword.toLowerCase())) {
      addKeywordTile(keyword);
    }
  };

  // Filter tiles and connections for current page
  const currentTiles = tiles.filter(t => 
    !currentPage || t.page_id === currentPage.id || t.page_id === null
  );
  const currentConnections = connections.filter(c =>
    !currentPage || c.page_id === currentPage.id || c.page_id === null
  );

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (connectingFrom) {
      setConnectingFrom(null);
    }
  }, [connectingFrom]);

  const handleTileConnect = useCallback((tileId: string) => {
    if (connectingFrom) {
      if (connectingFrom !== tileId) {
        addConnection(connectingFrom, tileId);
      }
      setConnectingFrom(null);
    } else {
      setConnectingFrom(tileId);
    }
  }, [connectingFrom, addConnection]);

  const handleDragStart = useCallback((tileId: string) => {
    setDraggedTile(tileId);
  }, []);

  const handleDragEnd = useCallback((tileId: string, e: React.DragEvent) => {
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    updateTilePosition(tileId, Math.max(0, x - 75), Math.max(0, y - 30));
    setDraggedTile(null);
  }, [updateTilePosition]);

  if (loading) {
    return (
      <Card className="border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="py-12 text-center">
          <div className="animate-pulse text-muted-foreground">Loading Creative Space...</div>
        </CardContent>
      </Card>
    );
  }

  const hasContent = currentTiles.length > 0;

  return (
    <Card className={cn(
      "border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-transparent transition-all duration-300",
      isExpanded && "fixed inset-4 z-50 border-solid"
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lightbulb className="w-5 h-5 text-primary" />
              Creative Space
              <MicroGuide
                guideKey="creative_space"
                title="Creative Space"
                description={"This is where your ideas live.\n\nYou can save insights, connect keywords, and explore new directions.\n\nOver time patterns begin to emerge."}
              />
            </CardTitle>
            <CardDescription className="text-sm">
              Explore your ideas freely — move, connect, and discover
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => addNoteTile()}
              className="h-8 w-8"
            >
              <Plus className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8"
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="relative">
        {/* Inbox section - unassigned tiles */}
        {unassignedTiles.length > 0 && (
          <div className="mb-4 p-3 bg-muted/30 rounded-lg border border-dashed border-muted-foreground/30">
            <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
              <Inbox className="w-4 h-4" />
              <span>Unassigned Insights ({unassignedTiles.length})</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {unassignedTiles.map(tile => (
                <Badge
                  key={tile.id}
                  variant="secondary"
                  className="cursor-pointer hover:bg-primary/20 transition-colors flex items-center gap-1.5 py-1.5 px-3"
                  onClick={() => assignTileToProject(tile.id)}
                >
                  <span className="max-w-[200px] truncate">{tile.title}</span>
                  <Plus className="w-3 h-3 opacity-70" />
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Click to add to this project's Creative Space
            </p>
          </div>
        )}

        {/* Keyword Library */}
        {keywords.length > 0 && (
          <div className="mb-4 p-3 bg-green-500/5 rounded-lg border border-dashed border-green-500/30">
            <div 
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setShowKeywords(!showKeywords)}
            >
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-green-600 dark:text-green-400">Keywords</span>
                <span className="text-xs text-muted-foreground">from your conversations</span>
              </div>
              {showKeywords ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </div>
            {showKeywords && (
              <div className="space-y-2 mt-2">
                {/* AI Suggested keywords */}
                {suggestedKeywords.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Suggested connectors</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {suggestedKeywords.map((s, i) => (
                        <Badge
                          key={`sug-${i}`}
                          variant={keywordsInSpace.has(s.keyword.toLowerCase()) ? "outline" : "default"}
                          className={cn(
                            "cursor-pointer transition-colors",
                            keywordsInSpace.has(s.keyword.toLowerCase())
                              ? "opacity-50 cursor-default"
                              : "hover:bg-amber-500/20 hover:border-amber-500 bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300"
                          )}
                          onClick={() => handleKeywordClick(s.keyword)}
                          title={s.reason}
                        >
                          <Sparkles className="w-3 h-3 mr-1 opacity-70" />
                          {s.keyword}
                          {!keywordsInSpace.has(s.keyword.toLowerCase()) && <Plus className="w-3 h-3 ml-1 opacity-70" />}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {loadingSuggestions && (
                  <p className="text-xs text-muted-foreground animate-pulse">Finding best connectors...</p>
                )}
                {/* All keywords */}
                <div className="flex flex-wrap gap-2">
                  {keywords.map(kw => (
                    <Badge
                      key={kw.id}
                      variant={keywordsInSpace.has(kw.keyword.toLowerCase()) ? "outline" : "secondary"}
                      className={cn(
                        "cursor-pointer transition-colors",
                        keywordsInSpace.has(kw.keyword.toLowerCase()) 
                          ? "opacity-50 cursor-default" 
                          : "hover:bg-green-500/20 hover:border-green-500"
                      )}
                      onClick={() => handleKeywordClick(kw.keyword)}
                    >
                      {kw.keyword}
                      {!keywordsInSpace.has(kw.keyword.toLowerCase()) && <Plus className="w-3 h-3 ml-1 opacity-70" />}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quick note input */}
        <div className="mb-3">
          <Input
            value={quickNote}
            onChange={(e) => setQuickNote(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleQuickNoteSubmit()}
            placeholder="Type a quick thought and press Enter..."
            className="bg-background/50 border-dashed"
          />
        </div>

        {/* Canvas */}
        <div
          ref={canvasRef}
          onClick={handleCanvasClick}
          className={cn(
            "relative rounded-lg border border-dashed border-muted-foreground/20 overflow-hidden",
            "bg-[radial-gradient(circle,hsl(var(--muted-foreground)/0.1)_1px,transparent_1px)]",
            "bg-[size:20px_20px]",
            isExpanded ? "h-[calc(100vh-200px)]" : "h-80",
            connectingFrom && "cursor-crosshair"
          )}
        >
          {/* Connection lines (render behind tiles) */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {currentConnections.map(conn => {
              const fromTile = currentTiles.find(t => t.id === conn.from_tile_id);
              const toTile = currentTiles.find(t => t.id === conn.to_tile_id);
              if (!fromTile || !toTile) return null;
              
              return (
                <ConnectionLine
                  key={conn.id}
                  id={conn.id}
                  x1={fromTile.position_x + 75}
                  y1={fromTile.position_y + 30}
                  x2={toTile.position_x + 75}
                  y2={toTile.position_y + 30}
                  color={conn.connection_color}
                  onDelete={() => deleteConnection(conn.id)}
                />
              );
            })}
          </svg>

          {/* Tiles */}
          {currentTiles.map(tile => (
            tile.tile_type === 'insight' ? (
              <InsightTile
                key={tile.id}
                tile={tile}
                isConnecting={connectingFrom === tile.id}
                onConnect={() => handleTileConnect(tile.id)}
                onDragStart={() => handleDragStart(tile.id)}
                onDragEnd={(e) => handleDragEnd(tile.id, e)}
                onUpdateColor={(color) => updateTileColor(tile.id, color)}
                onDelete={() => deleteTile(tile.id)}
              />
            ) : (
              <NoteTile
                key={tile.id}
                tile={tile}
                isConnecting={connectingFrom === tile.id}
                onConnect={() => handleTileConnect(tile.id)}
                onDragStart={() => handleDragStart(tile.id)}
                onDragEnd={(e) => handleDragEnd(tile.id, e)}
                onUpdateContent={(title, content) => updateTileContent(tile.id, title, content)}
                onUpdateColor={(color) => updateTileColor(tile.id, color)}
                onDelete={() => deleteTile(tile.id)}
              />
            )
          ))}

          {/* Empty state */}
          {!hasContent && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
              <Lightbulb className="w-12 h-12 mb-4 opacity-30" />
              <p className="text-sm">Your creative space awaits</p>
              <p className="text-xs mt-1 opacity-70">
                Save insights from mentors or add notes to begin
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-4"
                onClick={() => addNoteTile()}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add First Note
              </Button>
            </div>
          )}

          {/* Pattern hints */}
          {patterns.map(pattern => (
            <PatternHint
              key={pattern.id}
              pattern={pattern}
              tiles={currentTiles.filter(t => pattern.related_tile_ids.includes(t.id))}
              onDismiss={() => dismissPattern(pattern.id)}
              onEngage={() => engagePattern(pattern.id)}
            />
          ))}

          {/* Connecting mode indicator */}
          {connectingFrom && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1.5 rounded-full text-sm animate-pulse">
              Click another tile to connect, or click anywhere to cancel
            </div>
          )}
        </div>

        {/* Page tabs */}
        {pages.length > 0 && (
          <PageTabs
            pages={pages}
            currentPage={currentPage}
            onSelectPage={setCurrentPage}
            onAddPage={addPage}
            onRenamePage={renamePage}
            onDeletePage={deletePage}
          />
        )}
      </CardContent>
    </Card>
  );
}
