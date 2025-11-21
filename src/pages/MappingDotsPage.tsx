import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Network, Filter, Sparkles, Link2, Calendar, Tag, FileText, Plus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ConstellationCanvas } from "@/components/ConstellationCanvas";

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

const sourceColors: Record<string, string> = {
  council_meeting: "bg-blue-500",
  mentor_chat: "bg-green-500",
  journal: "bg-purple-500",
  ritual: "bg-orange-500",
  shadow_work: "bg-red-500",
  constellation: "bg-yellow-500",
  quest: "bg-pink-500",
};

const sourceLabels: Record<string, string> = {
  council_meeting: "Council",
  mentor_chat: "1:1 Chat",
  journal: "Journal",
  ritual: "Ritual",
  shadow_work: "Shadow",
  constellation: "Constellation",
  quest: "Quest",
};

const MappingDotsPage = () => {
  const navigate = useNavigate();
  const [dots, setDots] = useState<InsightDot[]>([]);
  const [connections, setConnections] = useState<DotConnection[]>([]);
  const [selectedDot, setSelectedDot] = useState<InsightDot | null>(null);
  const [filterSource, setFilterSource] = useState<string>("all");
  const [filterTheme, setFilterTheme] = useState<string>("all");
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [userReflection, setUserReflection] = useState("");
  const [suggestingConnections, setSuggestingConnections] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDots();
    loadConnections();
  }, []);

  const loadDots = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("insight_dots")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDots(data || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadConnections = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("dot_connections")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;
      setConnections(data || []);
    } catch (error: any) {
      console.error("Error loading connections:", error);
    }
  };

  const suggestConnections = async () => {
    setSuggestingConnections(true);
    try {
      const recentDots = filteredDots.slice(0, 20);
      
      const { data, error } = await supabase.functions.invoke("analyze-dot-connections", {
        body: { dots: recentDots },
      });

      if (error) throw error;

      if (data.connections && data.connections.length > 0) {
        toast.success(`Found ${data.connections.length} potential connections!`);
        loadConnections();
      } else {
        toast.info("No new connections found. Keep adding insights!");
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSuggestingConnections(false);
    }
  };

  const saveReflection = async () => {
    if (!selectedDot || !userReflection.trim()) return;

    try {
      const { error } = await supabase
        .from("insight_dots")
        .update({
          user_reflection: userReflection,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", selectedDot.id);

      if (error) throw error;

      toast.success("Reflection saved!");
      setUserReflection("");
      loadDots();
      setSelectedDot(null);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const createManualConnection = async (dot1Id: string, dot2Id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const connectionInsight = prompt("Describe how these insights connect:");
      if (!connectionInsight) return;

      const { error } = await supabase.from("dot_connections").insert({
        user_id: user.id,
        dot_id_1: dot1Id,
        dot_id_2: dot2Id,
        connection_type: "manual",
        connection_insight: connectionInsight,
        ai_generated: false,
      });

      if (error) throw error;

      toast.success("Connection created!");
      loadConnections();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const filteredDots = dots.filter((dot) => {
    if (filterSource !== "all" && dot.source_type !== filterSource) return false;
    if (filterTheme !== "all" && dot.core_theme !== filterTheme) return false;
    return true;
  });

  const uniqueThemes = [...new Set(dots.map((d) => d.core_theme))];
  const unreviewedCount = dots.filter((d) => !d.reviewed_at).length;

  // Get connected dots for selected dot
  const getConnectedDots = (dotId: string) => {
    return connections
      .filter((c) => c.dot_id_1 === dotId || c.dot_id_2 === dotId)
      .map((c) => {
        const connectedId = c.dot_id_1 === dotId ? c.dot_id_2 : c.dot_id_1;
        return { connection: c, dot: dots.find((d) => d.id === connectedId) };
      })
      .filter((item) => item.dot);
  };

  const [viewMode, setViewMode] = useState<"constellation" | "list">("constellation");

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4 py-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Network className="w-8 h-8 text-primary" />
                Mapping Ideas & Dots
              </h1>
              <p className="text-muted-foreground mt-1">
                Discover patterns and connections in your journey
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <div className="flex gap-1 bg-muted/50 p-1 rounded-lg">
              <Button
                variant={viewMode === "constellation" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("constellation")}
              >
                <Network className="w-4 h-4 mr-2" />
                Canvas
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                <FileText className="w-4 h-4 mr-2" />
                List
              </Button>
            </div>
            <Button
              variant="outline"
              onClick={suggestConnections}
              disabled={suggestingConnections || dots.length < 2}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {suggestingConnections ? "Analyzing..." : "Connect the Dots"}
            </Button>
          </div>
        </div>

        {/* Constellation Canvas View */}
        {viewMode === "constellation" && (
          <ConstellationCanvas
            dots={filteredDots}
            connections={connections}
            onDotClick={(dot) => {
              setSelectedDot(dot);
              setUserReflection(dot.user_reflection || "");
            }}
            selectedDot={selectedDot}
          />
        )}

        {/* List View */}
        {viewMode === "list" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Filters & List */}
          <div className="lg:col-span-1 space-y-4">
            {/* Filters */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">Source</label>
                  <Select value={filterSource} onValueChange={setFilterSource}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sources</SelectItem>
                      {Object.entries(sourceLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">Theme</label>
                  <Select value={filterTheme} onValueChange={setFilterTheme}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Themes</SelectItem>
                      {uniqueThemes.map((theme) => (
                        <SelectItem key={theme} value={theme}>
                          {theme}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Dots List */}
            <Card className="flex-1">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">
                  Insights ({filteredDots.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[500px]">
                  <div className="space-y-2 p-4 pt-0">
                    {loading ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        Loading insights...
                      </p>
                    ) : filteredDots.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No insights yet. Chat with mentors or complete rituals to add insights!
                      </p>
                    ) : (
                      filteredDots.map((dot) => (
                        <motion.div
                          key={dot.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Card
                            className={cn(
                              "cursor-pointer transition-all hover:border-primary/50",
                              selectedDot?.id === dot.id && "border-primary ring-2 ring-primary/20",
                              !dot.reviewed_at && "border-l-4 border-l-orange-500"
                            )}
                            onClick={() => {
                              setSelectedDot(dot);
                              setUserReflection(dot.user_reflection || "");
                            }}
                          >
                            <CardContent className="p-3 space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium truncate">
                                    {dot.source_mentor || sourceLabels[dot.source_type]}
                                  </p>
                                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                    {dot.insight_text}
                                  </p>
                                </div>
                                <div
                                  className={cn(
                                    "w-3 h-3 rounded-full flex-shrink-0",
                                    sourceColors[dot.source_type]
                                  )}
                                />
                              </div>
                              <div className="flex items-center gap-1 flex-wrap">
                                <Badge variant="secondary" className="text-xs">
                                  {dot.core_theme}
                                </Badge>
                                {getConnectedDots(dot.id).length > 0 && (
                                  <Badge variant="outline" className="text-xs">
                                    <Link2 className="w-3 h-3 mr-1" />
                                    {getConnectedDots(dot.id).length}
                                  </Badge>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Details Panel */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {selectedDot ? (
                <motion.div
                  key={selectedDot.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <Card className="h-full">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-xl">Insight Details</CardTitle>
                            {!selectedDot.reviewed_at && (
                              <Badge variant="outline" className="text-xs">
                                Unreviewed
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(selectedDot.created_at).toLocaleDateString()}
                            </div>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                              <Tag className="w-3 h-3" />
                              {selectedDot.source_mentor || sourceLabels[selectedDot.source_type]}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedDot(null)}
                        >
                          ✕
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Insight Text */}
                      <div className="space-y-2">
                        <h3 className="text-sm font-semibold text-muted-foreground">Insight</h3>
                        <p className="text-base leading-relaxed">{selectedDot.insight_text}</p>
                      </div>

                      {/* Themes & Tags */}
                      <div className="space-y-2">
                        <h3 className="text-sm font-semibold text-muted-foreground">Themes</h3>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="default">{selectedDot.core_theme}</Badge>
                          {selectedDot.skill_tags.map((tag) => (
                            <Badge key={tag} variant="secondary">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Connected Insights */}
                      {getConnectedDots(selectedDot.id).length > 0 && (
                        <div className="space-y-2">
                          <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                            <Link2 className="w-4 h-4" />
                            Connected Insights ({getConnectedDots(selectedDot.id).length})
                          </h3>
                          <div className="space-y-2">
                            {getConnectedDots(selectedDot.id).map(({ connection, dot }) => (
                              <Card
                                key={connection.id}
                                className="cursor-pointer hover:border-primary/50"
                                onClick={() => setSelectedDot(dot!)}
                              >
                                <CardContent className="p-3 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <p className="text-xs font-medium">
                                      {dot?.source_mentor || sourceLabels[dot?.source_type || ""]}
                                    </p>
                                    {connection.ai_generated && (
                                      <Badge variant="outline" className="text-xs">
                                        <Sparkles className="w-3 h-3 mr-1" />
                                        AI
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    {connection.connection_insight}
                                  </p>
                                  <p className="text-xs line-clamp-1">{dot?.insight_text}</p>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* User Reflection */}
                      <div className="space-y-2">
                        <h3 className="text-sm font-semibold text-muted-foreground">
                          Your Reflection
                        </h3>
                        <Textarea
                          placeholder="Add your thoughts about this insight..."
                          value={userReflection}
                          onChange={(e) => setUserReflection(e.target.value)}
                          rows={4}
                          className="resize-none"
                        />
                        <Button
                          onClick={saveReflection}
                          disabled={!userReflection.trim()}
                          size="sm"
                          className="w-full"
                        >
                          Save Reflection
                        </Button>
                      </div>

                      {/* Manual Connection */}
                      {filteredDots.length > 1 && (
                        <div className="space-y-2">
                          <h3 className="text-sm font-semibold text-muted-foreground">
                            Connect to Another Insight
                          </h3>
                          <div className="flex gap-2 flex-wrap">
                            {filteredDots
                              .filter((d) => d.id !== selectedDot.id)
                              .slice(0, 5)
                              .map((dot) => (
                                <Button
                                  key={dot.id}
                                  variant="outline"
                                  size="sm"
                                  onClick={() => createManualConnection(selectedDot.id, dot.id)}
                                  className="text-xs"
                                >
                                  <Plus className="w-3 h-3 mr-1" />
                                  {dot.core_theme}
                                </Button>
                              ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full"
                >
                  <Card className="h-full flex items-center justify-center">
                    <CardContent className="text-center space-y-4 py-20">
                      <Network className="w-16 h-16 mx-auto text-muted-foreground/30" />
                      <div>
                        <p className="text-lg font-medium">Select an insight to view details</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Click any dot on the left to explore connections and add reflections
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        )}

        {/* Selected Dot Details - Always Visible */}
        <AnimatePresence mode="wait">
          {selectedDot && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="mt-6"
            >
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-xl">Insight Details</CardTitle>
                        {!selectedDot.reviewed_at && (
                          <Badge variant="outline" className="text-xs">
                            Unreviewed
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(selectedDot.created_at).toLocaleDateString()}
                        </div>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          {selectedDot.source_mentor || sourceLabels[selectedDot.source_type]}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedDot(null)}
                    >
                      ✕
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-muted-foreground">Insight</h3>
                    <p className="text-base leading-relaxed">{selectedDot.insight_text}</p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-muted-foreground">Themes</h3>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="default">{selectedDot.core_theme}</Badge>
                      {selectedDot.skill_tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {getConnectedDots(selectedDot.id).length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                        <Link2 className="w-4 h-4" />
                        Connected Insights ({getConnectedDots(selectedDot.id).length})
                      </h3>
                      <div className="space-y-2">
                        {getConnectedDots(selectedDot.id).map(({ connection, dot }) => (
                          <Card
                            key={connection.id}
                            className="cursor-pointer hover:border-primary/50"
                            onClick={() => setSelectedDot(dot!)}
                          >
                            <CardContent className="p-3 space-y-2">
                              <div className="flex items-center justify-between">
                                <p className="text-xs font-medium">
                                  {dot?.source_mentor || sourceLabels[dot?.source_type || ""]}
                                </p>
                                {connection.ai_generated && (
                                  <Badge variant="secondary" className="text-xs">
                                    <Sparkles className="w-3 h-3 mr-1" />
                                    AI
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {dot?.insight_text}
                              </p>
                              <p className="text-xs italic text-primary/80">
                                "{connection.connection_insight}"
                              </p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-muted-foreground">Your Reflection</h3>
                    <Textarea
                      placeholder="What does this insight mean to you? How will you apply it?"
                      value={userReflection}
                      onChange={(e) => setUserReflection(e.target.value)}
                      rows={4}
                    />
                    <Button
                      onClick={saveReflection}
                      disabled={!userReflection.trim()}
                      className="w-full"
                    >
                      Save Reflection
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MappingDotsPage;
