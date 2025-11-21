import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Network, Clock, FileText, Filter, X, Sparkles, Loader2, Target, ChevronDown, ChevronUp } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import FutureSelfBackground from "@/components/FutureSelfBackground";
import { ConstellationSystem } from "@/components/ConstellationSystem";
import { ConstellationCanvas } from "@/components/ConstellationCanvas";
import { ConstellationTimeline } from "@/components/ConstellationTimeline";
import { PurposeOnboardingModal } from "@/components/PurposeOnboardingModal";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

interface ConstellationEntry {
  id: string;
  entry_type: string;
  title: string;
  description: string;
  key_takeaway?: string;
  related_domains?: string[];
  emotional_tone?: string;
  created_at: string;
}

const sourceColors: Record<string, string> = {
  book: "bg-blue-500",
  idea: "bg-yellow-500",
  insight: "bg-purple-500",
  milestone: "bg-green-500",
  council_meeting: "bg-blue-500",
  mentor_chat: "bg-green-500",
  journal: "bg-purple-500",
  shadow_work: "bg-red-500",
  goal_achievement: "bg-teal-500",
  shadow_integration: "bg-rose-500",
  journal_breakthrough: "bg-violet-500",
  domain_milestone: "bg-cyan-500",
  quest_completion: "bg-fuchsia-500",
  human_design_type: "bg-indigo-500",
  human_design_strategy: "bg-sky-500",
  human_design_authority: "bg-amber-500",
  human_design_profile: "bg-pink-500",
  human_design_centers: "bg-emerald-500",
  human_design_gate: "bg-purple-500",
};

const sourceLabels: Record<string, string> = {
  book: "📚 Book",
  idea: "💡 Idea",
  insight: "✨ Insight",
  milestone: "🎯 Milestone",
  council_meeting: "Council Meeting",
  mentor_chat: "Mentor Chat",
  journal: "Journal",
  shadow_work: "Shadow Work",
  goal_achievement: "Goal Achievement",
  shadow_integration: "Shadow Integration",
  journal_breakthrough: "Journal Breakthrough",
  domain_milestone: "Domain Milestone",
  quest_completion: "Quest Completion",
  human_design_type: "⭐ HD Type",
  human_design_strategy: "⚡ HD Strategy",
  human_design_authority: "🧭 HD Authority",
  human_design_profile: "👤 HD Profile",
  human_design_centers: "🔮 HD Centers",
  human_design_gate: "🚪 HD Gate",
};

const ConstellationPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("add");
  const [dots, setDots] = useState<InsightDot[]>([]);
  const [connections, setConnections] = useState<DotConnection[]>([]);
  const [selectedDot, setSelectedDot] = useState<InsightDot | null>(null);
  const [userPurpose, setUserPurpose] = useState<string | null>(null);
  const [filterSource, setFilterSource] = useState<string>("all");
  const [filterTheme, setFilterTheme] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [analyzingConnections, setAnalyzingConnections] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [purposeExpanded, setPurposeExpanded] = useState(true);

  useEffect(() => {
    loadAllData();
    
    // Check if user has completed onboarding
    const onboardingCompleted = localStorage.getItem("mapping-onboarding-completed");
    if (!onboardingCompleted) {
      setShowOnboarding(true);
    }
  }, []);

  const handleCloseOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem("mapping-onboarding-completed", "true");
    loadAllData(); // Reload to get updated purpose
  };

  // Filter dots based on selected filters
  const filteredDots = dots.filter((dot) => {
    if (filterSource !== "all" && dot.source_type !== filterSource) return false;
    if (filterTheme !== "all" && dot.core_theme !== filterTheme) return false;
    return true;
  });

  // Get unique themes and sources
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
        body: { dots: filteredDots.slice(0, 30) } // Limit to 30 for performance
      });

      if (error) throw error;

      if (data?.connections && data.connections.length > 0) {
        toast.success(`Discovered ${data.connections.length} new connections!`, {
          description: "AI found meaningful patterns in your journey"
        });
        loadAllData(); // Reload to show new connections
      } else {
        toast.info("No new connections found", {
          description: "Keep adding insights to discover more patterns"
        });
      }
    } catch (error: any) {
      console.error("Error analyzing connections:", error);
      if (error.message?.includes("Rate limit")) {
        toast.error("Rate limit reached", {
          description: "Please try again in a moment"
        });
      } else if (error.message?.includes("credits")) {
        toast.error("AI credits depleted", {
          description: "Please add credits to continue"
        });
      } else {
        toast.error("Failed to analyze connections", {
          description: error.message
        });
      }
    } finally {
      setAnalyzingConnections(false);
    }
  };

  const loadAllData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load insight dots
      const { data: dotsData, error: dotsError } = await supabase
        .from("insight_dots")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (dotsError) throw dotsError;

      // Load constellation entries and transform to dots
      const { data: entriesData, error: entriesError } = await supabase
        .from("constellation_entries")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (entriesError) throw entriesError;

      // Transform entries to dots format
      const transformedEntries: InsightDot[] = (entriesData || []).map((entry: ConstellationEntry) => ({
        id: entry.id,
        source_type: entry.entry_type,
        source_mentor: null,
        insight_text: `${entry.title}: ${entry.description}`,
        core_theme: entry.related_domains?.[0] || "General",
        skill_tags: entry.related_domains || [],
        emotional_tone: entry.emotional_tone || null,
        created_at: entry.created_at,
        reviewed_at: null,
        user_reflection: entry.key_takeaway || null,
        connection_ids: [],
      }));

      // Combine both sources
      const allDots = [...(dotsData || []), ...transformedEntries];
      setDots(allDots);

      // Load connections
      const { data: connectionsData, error: connectionsError } = await supabase
        .from("dot_connections")
        .select("*")
        .eq("user_id", user.id);

      if (connectionsError) throw connectionsError;
      setConnections(connectionsData || []);

      // Load user purpose
      const { data: profileData } = await supabase
        .from("profiles")
        .select("main_mission")
        .eq("id", user.id)
        .single();

      setUserPurpose(profileData?.main_mission || null);
    } catch (error: any) {
      toast.error("Failed to load data");
      console.error(error);
    }
  };

  return (
    <motion.div 
      className="min-h-screen relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <FutureSelfBackground />
      
      <PurposeOnboardingModal 
        open={showOnboarding}
        onClose={handleCloseOnboarding}
        existingPurpose={userPurpose}
      />
      
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card/50 backdrop-blur-lg border-b border-border/30">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate("/future-self")}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowOnboarding(true)}
            className="gap-2"
          >
            <Target className="w-4 h-4" />
            {userPurpose ? "Edit Purpose" : "Set Purpose"}
          </Button>
        </div>
      </div>

      {/* Content */}
      <motion.div 
        className="max-w-7xl mx-auto px-4 py-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <h1 className="text-5xl md:text-6xl font-bold text-center text-foreground mb-4">
          Mapping Ideas & Dots
        </h1>
        <p className="text-center text-muted-foreground mb-12 text-lg">
          Capture your journey and discover patterns across all your insights
        </p>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex items-center justify-between mb-6">
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
              <div className="flex items-center gap-2">
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
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                  >
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
              transition={{ duration: 0.2 }}
              className="mb-6"
            >
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    Filter Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Source Type
                    </label>
                    <Select value={filterSource} onValueChange={setFilterSource}>
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="All Sources" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover z-50">
                        <SelectItem value="all">All Sources ({dots.length})</SelectItem>
                        {uniqueSources.map((source) => {
                          const count = dots.filter(d => d.source_type === source).length;
                          return (
                            <SelectItem key={source} value={source}>
                              {sourceLabels[source] || source} ({count})
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Theme
                    </label>
                    <Select value={filterTheme} onValueChange={setFilterTheme}>
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="All Themes" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover z-50">
                        <SelectItem value="all">All Themes ({dots.length})</SelectItem>
                        {uniqueThemes.map((theme) => {
                          const count = dots.filter(d => d.core_theme === theme).length;
                          return (
                            <SelectItem key={theme} value={theme}>
                              {theme} ({count})
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          <TabsContent value="add" className="mt-0">
            <ConstellationSystem onDataChange={loadAllData} />
          </TabsContent>

          <TabsContent value="canvas" className="mt-0">
            {userPurpose && (
              <Collapsible
                open={purposeExpanded}
                onOpenChange={setPurposeExpanded}
                className="mb-6"
              >
                <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
                  <CardContent className="p-6">
                    <CollapsibleTrigger className="flex items-center justify-between w-full group">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <Target className="w-5 h-5 text-primary" />
                        </div>
                        <div className="text-left">
                          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                            Your Purpose
                          </h3>
                          {!purposeExpanded && (
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {userPurpose}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        {purposeExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent className="mt-4">
                      <p className="text-foreground leading-relaxed">
                        {userPurpose}
                      </p>
                      <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          Every insight in your constellation connects to this purpose
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowOnboarding(true)}
                          className="text-xs h-7"
                        >
                          Edit Purpose
                        </Button>
                      </div>
                    </CollapsibleContent>
                  </CardContent>
                </Card>
              </Collapsible>
            )}
            
            {filteredDots.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Network className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No insights match your filters</p>
                  <Button variant="outline" onClick={clearFilters} className="mt-4">
                    Clear Filters
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <ConstellationCanvas
                dots={filteredDots}
                connections={connections}
                onDotClick={(dot) => setSelectedDot(dot)}
                selectedDot={selectedDot}
                userPurpose={userPurpose}
              />
            )}
          </TabsContent>

          <TabsContent value="timeline" className="mt-0">
            {userPurpose && (
              <Collapsible
                open={purposeExpanded}
                onOpenChange={setPurposeExpanded}
                className="mb-6"
              >
                <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
                  <CardContent className="p-6">
                    <CollapsibleTrigger className="flex items-center justify-between w-full group">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <Target className="w-5 h-5 text-primary" />
                        </div>
                        <div className="text-left">
                          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                            Your Purpose
                          </h3>
                          {!purposeExpanded && (
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {userPurpose}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        {purposeExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent className="mt-4">
                      <p className="text-foreground leading-relaxed">
                        {userPurpose}
                      </p>
                      <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          Every insight in your constellation connects to this purpose
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowOnboarding(true)}
                          className="text-xs h-7"
                        >
                          Edit Purpose
                        </Button>
                      </div>
                    </CollapsibleContent>
                  </CardContent>
                </Card>
              </Collapsible>
            )}
            
            {filteredDots.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No insights match your filters</p>
                  <Button variant="outline" onClick={clearFilters} className="mt-4">
                    Clear Filters
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <ConstellationTimeline
                dots={filteredDots}
                connections={connections}
                onDotClick={(dot) => setSelectedDot(dot)}
                selectedDot={selectedDot}
                userPurpose={userPurpose}
              />
            )}
          </TabsContent>

          <TabsContent value="list" className="mt-0">
            {userPurpose && (
              <Collapsible
                open={purposeExpanded}
                onOpenChange={setPurposeExpanded}
                className="mb-6"
              >
                <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
                  <CardContent className="p-6">
                    <CollapsibleTrigger className="flex items-center justify-between w-full group">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <Target className="w-5 h-5 text-primary" />
                        </div>
                        <div className="text-left">
                          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                            Your Purpose
                          </h3>
                          {!purposeExpanded && (
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {userPurpose}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        {purposeExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent className="mt-4">
                      <p className="text-foreground leading-relaxed">
                        {userPurpose}
                      </p>
                      <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          Every insight in your constellation connects to this purpose
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowOnboarding(true)}
                          className="text-xs h-7"
                        >
                          Edit Purpose
                        </Button>
                      </div>
                    </CollapsibleContent>
                  </CardContent>
                </Card>
              </Collapsible>
            )}
            
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">
                  All Insights ({filteredDots.length}{filteredDots.length !== dots.length ? ` of ${dots.length}` : ''})
                </h3>
                {filteredDots.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No insights match your filters</p>
                    <Button variant="outline" onClick={clearFilters} className="mt-4">
                      Clear Filters
                    </Button>
                  </div>
                ) : (
                  <ScrollArea className="h-[600px] pr-4">
                    <div className="space-y-3">
                      {filteredDots.map((dot) => (
                      <Card
                        key={dot.id}
                        className={cn(
                          "cursor-pointer transition-all hover:border-primary/50",
                          selectedDot?.id === dot.id && "border-primary ring-2 ring-primary/20"
                        )}
                        onClick={() => setSelectedDot(dot)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div
                              className={cn(
                                "w-3 h-3 rounded-full flex-shrink-0 mt-1.5",
                                sourceColors[dot.source_type] || "bg-gray-500"
                              )}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium mb-1">
                                {dot.source_mentor || dot.source_type}
                              </p>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {dot.insight_text}
                              </p>
                              <div className="flex gap-2 mt-2">
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
                          </div>
                        </CardContent>
                      </Card>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
};

export default ConstellationPage;
