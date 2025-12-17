import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Network, Clock, FileText, Filter, X, Sparkles, Loader2, Target, Eye } from "lucide-react";
import { ConstellationCanvas } from "@/components/ConstellationCanvas";
import { ConstellationTimeline } from "@/components/ConstellationTimeline";
import { ConstellationSystem } from "@/components/ConstellationSystem";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { InsightDot, DotConnection } from "@/hooks/useCreationLabData";

interface LivingConstellationProps {
  dots: InsightDot[];
  connections: DotConnection[];
  userPurpose: string | null;
  onDataChange: () => void;
  onEditPurpose: () => void;
}

const sourceLabels: Record<string, string> = {
  book: "📚 Book",
  idea: "💡 Idea",
  insight: "✨ Insight",
  milestone: "🎯 Milestone",
  memory: "🧠 Memory",
  emotion: "😌 Emotion",
  council_meeting: "Council Meeting",
  mentor_chat: "Mentor Chat",
  journal: "Journal",
  shadow_work: "Shadow Work",
  goal_achievement: "Goal Achievement",
  shadow_integration: "Shadow Integration",
  journal_breakthrough: "Journal Breakthrough",
  domain_milestone: "Domain Milestone",
  quest_completion: "Quest Completion",
  integrator_step: "🎯 Focus Mode",
  focus_mode: "🎯 Focus Mode",
};

export const LivingConstellation = ({
  dots,
  connections,
  userPurpose,
  onDataChange,
  onEditPurpose,
}: LivingConstellationProps) => {
  const [activeTab, setActiveTab] = useState("canvas");
  const [selectedDot, setSelectedDot] = useState<InsightDot | null>(null);
  const [filterSource, setFilterSource] = useState<string>("all");
  const [filterTheme, setFilterTheme] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [analyzingConnections, setAnalyzingConnections] = useState(false);
  const [showPurposeView, setShowPurposeView] = useState(false);
  const [purposeAlignments, setPurposeAlignments] = useState<any[]>([]);
  const [analyzingPurpose, setAnalyzingPurpose] = useState(false);

  // Filter dots
  const filteredDots = dots.filter((dot) => {
    if (filterSource !== "all" && dot.source_type !== filterSource) return false;
    if (filterTheme !== "all" && dot.core_theme !== filterTheme) return false;
    return true;
  });

  const uniqueThemes = [...new Set(dots.map((d) => d.core_theme))].sort();
  const uniqueSources = [...new Set(dots.map((d) => d.source_type))].sort();

  const clearFilters = () => {
    setFilterSource("all");
    setFilterTheme("all");
  };

  const activeFiltersCount = (filterSource !== "all" ? 1 : 0) + (filterTheme !== "all" ? 1 : 0);

  const analyzeConnections = async () => {
    if (filteredDots.length < 3) {
      toast.error("Need at least 3 insights to find connections");
      return;
    }

    setAnalyzingConnections(true);
    try {
      const { data, error } = await supabase.functions.invoke("connect-all-dots", {
        body: { dots: filteredDots.slice(0, 30) }
      });

      if (error) throw error;

      if (data?.connections && data.connections.length > 0) {
        toast.success(`Discovered ${data.connections.length} new connections!`);
        onDataChange();
      } else {
        toast.info("No new connections found");
      }
    } catch (error: any) {
      console.error("Error analyzing connections:", error);
      toast.error("Failed to analyze connections");
    } finally {
      setAnalyzingConnections(false);
    }
  };

  const analyzePurposeAlignment = async () => {
    if (!userPurpose || filteredDots.length === 0) {
      toast.error("Need purpose and insights to analyze alignment");
      return;
    }

    setAnalyzingPurpose(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.functions.invoke("analyze-purpose-alignment", {
        body: { 
          dots: filteredDots.slice(0, 50),
          userPurpose,
          userId: user.id
        }
      });

      if (error) throw error;

      if (data?.alignments) {
        setPurposeAlignments(data.alignments);
        setShowPurposeView(true);
        toast.success("Purpose alignment analyzed!");
      }
    } catch (error: any) {
      console.error("Error analyzing purpose alignment:", error);
      toast.error("Failed to analyze purpose alignment");
    } finally {
      setAnalyzingPurpose(false);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <TabsList className="grid grid-cols-4">
            <TabsTrigger value="add">Add Entries</TabsTrigger>
            <TabsTrigger value="canvas">
              <Network className="w-4 h-4 mr-2" />
              Canvas
            </TabsTrigger>
            <TabsTrigger value="timeline">
              <Clock className="w-4 h-4 mr-2" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="list">
              <FileText className="w-4 h-4 mr-2" />
              List
            </TabsTrigger>
          </TabsList>

          {(activeTab === "canvas" || activeTab === "timeline" || activeTab === "list") && (
            <div className="flex items-center gap-2 flex-wrap">
              {userPurpose && (
                <Button
                  variant={showPurposeView ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    if (showPurposeView) {
                      setShowPurposeView(false);
                    } else if (purposeAlignments.length > 0) {
                      setShowPurposeView(true);
                    } else {
                      analyzePurposeAlignment();
                    }
                  }}
                  disabled={analyzingPurpose}
                >
                  {analyzingPurpose ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : showPurposeView ? (
                    <>
                      <Eye className="w-4 h-4 mr-2" />
                      Purpose View
                    </>
                  ) : (
                    <>
                      <Target className="w-4 h-4 mr-2" />
                      {purposeAlignments.length > 0 ? "Show Purpose" : "Analyze Purpose"}
                    </>
                  )}
                </Button>
              )}
              <Button
                variant="default"
                size="sm"
                onClick={analyzeConnections}
                disabled={analyzingConnections || filteredDots.length < 3}
              >
                {analyzingConnections ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    AI Connect Dots
                  </>
                )}
              </Button>
              <Button
                variant={showFilters ? "default" : "outline"}
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="relative"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
                {activeFiltersCount > 0 && (
                  <Badge 
                    variant="secondary" 
                    className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                  >
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
              {activeFiltersCount > 0 && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="w-4 h-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Filters Panel */}
        {showFilters && (activeTab === "canvas" || activeTab === "timeline" || activeTab === "list") && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6"
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Source</label>
                    <Select value={filterSource} onValueChange={setFilterSource}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="All sources" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All sources</SelectItem>
                        {uniqueSources.map((source) => (
                          <SelectItem key={source} value={source}>
                            {sourceLabels[source] || source}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Theme</label>
                    <Select value={filterTheme} onValueChange={setFilterTheme}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="All themes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All themes</SelectItem>
                        {uniqueThemes.map((theme) => (
                          <SelectItem key={theme} value={theme}>
                            {theme}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Tab Contents */}
        <TabsContent value="add">
          <ConstellationSystem onDataChange={onDataChange} />
        </TabsContent>

        <TabsContent value="canvas">
          {filteredDots.length > 0 ? (
            <ConstellationCanvas
              dots={filteredDots}
              connections={connections}
              onDotClick={setSelectedDot}
              selectedDot={selectedDot}
              userPurpose={userPurpose}
              purposeAlignments={purposeAlignments}
              showPurposeView={showPurposeView}
            />
          ) : (
            <Card className="border-dashed border-2">
              <CardContent className="py-16 text-center">
                <Network className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Insights Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Add entries to see your constellation come to life
                </p>
                <Button onClick={() => setActiveTab("add")}>Add Your First Entry</Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="timeline">
          <ConstellationTimeline
            dots={filteredDots}
            connections={connections}
            onDotClick={setSelectedDot}
            selectedDot={selectedDot}
            userPurpose={userPurpose}
          />
        </TabsContent>

        <TabsContent value="list">
          <div className="space-y-4">
            {filteredDots.length === 0 ? (
              <Card className="border-dashed border-2">
                <CardContent className="py-16 text-center">
                  <FileText className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground">No insights match your filters</p>
                </CardContent>
              </Card>
            ) : (
              filteredDots.map((dot) => (
                <Card 
                  key={dot.id}
                  className={cn(
                    "cursor-pointer hover:border-primary/50 transition-colors",
                    selectedDot?.id === dot.id && "border-primary"
                  )}
                  onClick={() => setSelectedDot(dot)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm leading-relaxed line-clamp-2">
                          {dot.insight_text}
                        </p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <Badge variant="outline" className="text-xs">
                            {sourceLabels[dot.source_type] || dot.source_type}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {dot.core_theme}
                          </Badge>
                          {dot.emotional_tone && (
                            <Badge variant="outline" className="text-xs">
                              {dot.emotional_tone}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(dot.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
