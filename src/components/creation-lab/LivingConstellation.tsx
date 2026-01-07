import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Network, Clock, FileText, Filter, X, Sparkles, Loader2, Target, Eye, Tag, User, Rocket } from "lucide-react";
import { ConstellationCanvas } from "@/components/ConstellationCanvas";
import { ConstellationTimeline } from "@/components/ConstellationTimeline";
import { ConstellationSystem } from "@/components/ConstellationSystem";
import { FutureConstellationView } from "@/components/constellation/FutureConstellationView";
import { KeywordBadges } from "@/components/KeywordHighlighter";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { InsightDot, DotConnection } from "@/hooks/useCreationLabData";

interface LivingConstellationProps {
  dots: InsightDot[];
  connections: DotConnection[];
  userPurpose: string | null;
  onDataChange: () => void;
  onEditPurpose: () => void;
}

interface UserKeyword {
  id: string;
  keyword: string;
  keyword_type: string;
  source: string;
  frequency_count: number;
  created_at: string;
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
  const [constellationView, setConstellationView] = useState<"actual" | "future">("actual");
  
  // User keywords state
  const [userKeywords, setUserKeywords] = useState<UserKeyword[]>([]);
  const [showKeywords, setShowKeywords] = useState(false);

  // Load user keywords
  useEffect(() => {
    const loadKeywords = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("user_keywords")
        .select("*")
        .eq("user_id", user.id)
        .order("frequency_count", { ascending: false })
        .limit(50);

      if (!error && data) {
        setUserKeywords(data as UserKeyword[]);
      }
    };

    loadKeywords();
  }, []);

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
              {/* Keywords Toggle Button */}
              <Button
                variant={showKeywords ? "default" : "outline"}
                size="sm"
                onClick={() => setShowKeywords(!showKeywords)}
                className="relative"
              >
                <Tag className="w-4 h-4 mr-2" />
                Keywords
                {userKeywords.length > 0 && (
                  <Badge 
                    variant="secondary" 
                    className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                  >
                    {userKeywords.length}
                  </Badge>
                )}
              </Button>
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

        {/* Keywords Panel */}
        {showKeywords && userKeywords.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6"
          >
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Your Saved Keywords
                  <span className="text-xs text-muted-foreground font-normal">
                    (extracted from your conversations)
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <KeywordBadges 
                  keywords={userKeywords.map(kw => ({
                    keyword: kw.keyword,
                    frequency_count: kw.frequency_count,
                    source: kw.source
                  }))}
                  onKeywordClick={(keyword) => {
                    // Filter dots by keyword
                    const matchingDots = dots.filter(d => 
                      d.insight_text.toLowerCase().includes(keyword.toLowerCase()) ||
                      d.core_theme.toLowerCase().includes(keyword.toLowerCase())
                    );
                    if (matchingDots.length > 0) {
                      toast.info(`Found ${matchingDots.length} insights related to "${keyword}"`);
                    } else {
                      toast.info(`No insights found for "${keyword}" yet`);
                    }
                  }}
                />
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Tab Contents */}
        <TabsContent value="add">
          <ConstellationSystem onDataChange={onDataChange} />
        </TabsContent>

        <TabsContent value="canvas">
          {/* Actual Self / Future Self Toggle */}
          <div className="flex justify-center mb-4">
            <ToggleGroup 
              type="single" 
              value={constellationView} 
              onValueChange={(v) => v && setConstellationView(v as "actual" | "future")}
              className="bg-background/30 backdrop-blur-sm border border-white/10 p-1 rounded-lg"
            >
              <ToggleGroupItem 
                value="actual" 
                className="gap-2 px-4 py-2 rounded-md data-[state=on]:bg-primary/20 data-[state=on]:text-primary-foreground data-[state=off]:bg-transparent data-[state=off]:text-muted-foreground hover:bg-white/10 transition-colors"
              >
                <User className="w-4 h-4" />
                Actual Self
              </ToggleGroupItem>
              <ToggleGroupItem 
                value="future" 
                className="gap-2 px-4 py-2 rounded-md data-[state=on]:bg-accent/20 data-[state=on]:text-accent-foreground data-[state=off]:bg-transparent data-[state=off]:text-muted-foreground hover:bg-white/10 transition-colors"
              >
                <Rocket className="w-4 h-4" />
                Future Self
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {constellationView === "future" ? (
            <FutureConstellationView userName="Future You" />
          ) : filteredDots.length > 0 ? (
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
