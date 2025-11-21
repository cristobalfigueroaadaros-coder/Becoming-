import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Network, Clock, FileText } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FutureSelfBackground from "@/components/FutureSelfBackground";
import { ConstellationSystem } from "@/components/ConstellationSystem";
import { ConstellationCanvas } from "@/components/ConstellationCanvas";
import { ConstellationTimeline } from "@/components/ConstellationTimeline";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
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
};

const ConstellationPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("add");
  const [dots, setDots] = useState<InsightDot[]>([]);
  const [connections, setConnections] = useState<DotConnection[]>([]);
  const [selectedDot, setSelectedDot] = useState<InsightDot | null>(null);
  const [userPurpose, setUserPurpose] = useState<string | null>(null);

  useEffect(() => {
    loadAllData();
  }, []);

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
      
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card/50 backdrop-blur-lg border-b border-border/30">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/future-self")}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
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
          <TabsList className="grid w-full grid-cols-4 mb-8">
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

          <TabsContent value="add" className="mt-0">
            <ConstellationSystem />
          </TabsContent>

          <TabsContent value="canvas" className="mt-0">
            <ConstellationCanvas
              dots={dots}
              connections={connections}
              onDotClick={(dot) => setSelectedDot(dot)}
              selectedDot={selectedDot}
              userPurpose={userPurpose}
            />
          </TabsContent>

          <TabsContent value="timeline" className="mt-0">
            <ConstellationTimeline
              dots={dots}
              connections={connections}
              onDotClick={(dot) => setSelectedDot(dot)}
              selectedDot={selectedDot}
              userPurpose={userPurpose}
            />
          </TabsContent>

          <TabsContent value="list" className="mt-0">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">All Insights ({dots.length})</h3>
                <ScrollArea className="h-[600px] pr-4">
                  <div className="space-y-3">
                    {dots.map((dot) => (
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
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
};

export default ConstellationPage;
