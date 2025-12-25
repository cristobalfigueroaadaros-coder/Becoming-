import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Star } from "lucide-react";
import FutureSelfBackground from "@/components/FutureSelfBackground";
import { Card } from "@/components/ui/card";
import { HumanDesignCard } from "@/components/human-design/HumanDesignCard";
import { BodygraphChart } from "@/components/human-design/BodygraphChart";
import { supabase } from "@/integrations/supabase/client";
import { generateMockHumanDesignData, generateHumanDesignDots } from "@/lib/humanDesignDots";
import { toast } from "sonner";
import { BirthDataCollector } from "@/components/BirthDataCollector";
import { NumerologyInsights } from "@/components/NumerologyInsights";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface NumerologyData {
  profile: {
    lifePath: number;
    expressionNumber: number;
    soulUrge: number;
    personalityNumber: number;
    challengeNumber: number;
    element: string;
    archetype: string;
  };
  userInsights: {
    coreTendency: string;
    naturalStrengths: string[];
    shadowPatterns: string;
    growthEdge: string;
    actionTranslation: string;
    idealActionCadence: string;
  };
  systemIntelligence: {
    executionRhythm: string;
    avoidancePattern: string;
    idealFirstWinStyle: string;
    pressureTolerance: string;
    structurePreference: string;
    preferredMentorFirst: string;
    antiOverthinkingRule: string;
  };
}

const ActualSelfPage = () => {
  const navigate = useNavigate();
  const [humanDesignData, setHumanDesignData] = useState<any>(null);
  const [numerologyData, setNumerologyData] = useState<NumerologyData | null>(null);
  const [hasBirthData, setHasBirthData] = useState(false);
  const [birthDate, setBirthDate] = useState<string | null>(null);
  const [birthName, setBirthName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingDots, setGeneratingDots] = useState(false);
  const [analyzingNumerology, setAnalyzingNumerology] = useState(false);
  const [activeTab, setActiveTab] = useState("numerology");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("birth_date, birth_time, birth_time_unknown, human_design_data, display_name")
        .eq("id", user.id)
        .single();

      if (!profile?.birth_date) {
        setLoading(false);
        return;
      }

      setHasBirthData(true);
      setBirthDate(profile.birth_date);
      setBirthName(profile.display_name);

      // Load Human Design data
      if (profile.human_design_data && Object.keys(profile.human_design_data).length > 0) {
        setHumanDesignData(profile.human_design_data);
      } else {
        const hdData = generateMockHumanDesignData(
          profile.birth_date,
          profile.birth_time,
          profile.birth_time_unknown
        );
        setHumanDesignData(hdData);

        await supabase
          .from("profiles")
          .update({ human_design_data: hdData as any })
          .eq("id", user.id);

        await handleGenerateDots(hdData, user.id);
      }

      // Check for existing numerology data in localStorage (temporary storage)
      const storedNumerology = localStorage.getItem(`numerology_${user.id}`);
      if (storedNumerology) {
        try {
          setNumerologyData(JSON.parse(storedNumerology));
        } catch (e) {
          console.error("Failed to parse stored numerology:", e);
        }
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateDots = async (hdData?: any, userId?: string) => {
    setGeneratingDots(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const dataToUse = hdData || humanDesignData;
      const userIdToUse = userId || user.id;

      if (!dataToUse) {
        toast.error("No Human Design data available");
        return;
      }

      const { data: existingDots } = await supabase
        .from("insight_dots")
        .select("id")
        .eq("user_id", userIdToUse)
        .like("source_type", "human_design%")
        .limit(1);

      if (existingDots && existingDots.length > 0) {
        toast.info("Human Design insights already added to your constellation");
        return;
      }

      await generateHumanDesignDots(userIdToUse, dataToUse);
      toast.success("Human Design insights added to your constellation!", {
        description: "Check the Mapping page to see your new dots"
      });
    } catch (error: any) {
      console.error("Error generating dots:", error);
      toast.error("Failed to generate constellation dots");
    } finally {
      setGeneratingDots(false);
    }
  };

  const handleNumerologySubmit = async (data: { birthName: string; birthDate: string }) => {
    setAnalyzingNumerology(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Save birth name to profile
      await supabase
        .from("profiles")
        .update({ 
          display_name: data.birthName,
          birth_date: data.birthDate
        })
        .eq("id", user.id);

      // Call numerology analysis
      const response = await supabase.functions.invoke("analyze-numerology", {
        body: { birthName: data.birthName, birthDate: data.birthDate }
      });

      if (response.error) throw response.error;

      const numerologyResult = response.data as NumerologyData;
      setNumerologyData(numerologyResult);
      setBirthName(data.birthName);
      setBirthDate(data.birthDate);
      setHasBirthData(true);

      // Store in localStorage for persistence
      localStorage.setItem(`numerology_${user.id}`, JSON.stringify(numerologyResult));

      // Store system intelligence for mentor routing (not shown to user)
      if (numerologyResult.systemIntelligence) {
        localStorage.setItem(`numerology_signals_${user.id}`, JSON.stringify(numerologyResult.systemIntelligence));
      }

      // Generate Human Design if not already done
      if (!humanDesignData) {
        const hdData = generateMockHumanDesignData(data.birthDate, null, true);
        setHumanDesignData(hdData);
        
        await supabase
          .from("profiles")
          .update({ human_design_data: hdData as any })
          .eq("id", user.id);

        await handleGenerateDots(hdData, user.id);
      }

      toast.success("Pattern profile generated!", {
        description: "Your personalized insights are ready"
      });
    } catch (error: any) {
      console.error("Error analyzing numerology:", error);
      toast.error("Failed to analyze patterns", {
        description: error.message || "Please try again"
      });
    } finally {
      setAnalyzingNumerology(false);
    }
  };

  const handleRegenerate = async () => {
    if (!birthName || !birthDate) {
      toast.error("Missing birth data");
      return;
    }
    await handleNumerologySubmit({ birthName, birthDate });
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
        className="max-w-4xl mx-auto px-4 py-12 space-y-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <h1 className="text-5xl md:text-6xl font-bold text-center text-foreground mb-4">
          Actual Self
        </h1>
        <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-8">
          Understand your natural patterns to accelerate action. These are signals, not destiny.
        </p>

        {loading ? (
          <Card className="p-8 bg-card/30 backdrop-blur-sm border-border/30">
            <div className="text-center">
              <p className="text-muted-foreground">Loading your profile...</p>
            </div>
          </Card>
        ) : !hasBirthData || !numerologyData ? (
          <BirthDataCollector 
            onSubmit={handleNumerologySubmit}
            isLoading={analyzingNumerology}
            existingBirthDate={birthDate}
          />
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
              <TabsTrigger value="numerology">Pattern Profile</TabsTrigger>
              <TabsTrigger value="human-design">Human Design</TabsTrigger>
            </TabsList>

            <TabsContent value="numerology" className="space-y-6">
              <NumerologyInsights 
                profile={numerologyData.profile}
                insights={numerologyData.userInsights}
              />
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  onClick={handleRegenerate}
                  disabled={analyzingNumerology}
                >
                  {analyzingNumerology ? "Regenerating..." : "Regenerate Profile"}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="human-design" className="space-y-6">
              {humanDesignData && humanDesignData.defined_centers && humanDesignData.defined_centers.length > 0 ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <HumanDesignCard data={humanDesignData} />
                    <BodygraphChart data={humanDesignData} />
                  </div>
                  <div className="flex justify-center">
                    <Button
                      onClick={() => handleGenerateDots()}
                      disabled={generatingDots}
                      className="gap-2"
                    >
                      <Star className="w-4 h-4" />
                      {generatingDots ? "Adding to Constellation..." : "View in Constellation Map"}
                    </Button>
                  </div>
                </div>
              ) : (
                <Card className="p-8 bg-card/30 backdrop-blur-sm border-border/30">
                  <div className="text-center text-muted-foreground">
                    Human Design data not available
                  </div>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        )}
        
        {/* Meditation visual */}
        <Card className="p-8 bg-card/30 backdrop-blur-sm border-border/30 mt-12">
          <div className="flex flex-col items-center gap-8">
            <svg viewBox="0 0 200 240" className="w-full max-w-[250px]">
              {/* Head */}
              <circle cx="100" cy="50" r="25" fill="hsl(30 50% 65%)" />
              
              {/* Hair */}
              <path
                d="M 75 45 Q 75 25 100 25 Q 125 25 125 45"
                fill="hsl(0 0% 20%)"
              />
              
              {/* Eyes (closed) */}
              <line x1="88" y1="48" x2="96" y2="48" stroke="hsl(0 0% 20%)" strokeWidth="2" strokeLinecap="round" />
              <line x1="104" y1="48" x2="112" y2="48" stroke="hsl(0 0% 20%)" strokeWidth="2" strokeLinecap="round" />
              
              {/* Smile */}
              <path
                d="M 88 58 Q 100 62 112 58"
                fill="none"
                stroke="hsl(0 0% 20%)"
                strokeWidth="2"
                strokeLinecap="round"
              />

              {/* Torso */}
              <path
                d="M 75 75 L 75 140 Q 75 150 85 150 L 115 150 Q 125 150 125 140 L 125 75"
                fill="hsl(180 50% 40%)"
              />

              {/* Arms */}
              <path
                d="M 75 90 Q 50 110 40 140"
                stroke="hsl(30 50% 65%)"
                strokeWidth="12"
                fill="none"
                strokeLinecap="round"
              />
              <path
                d="M 125 90 Q 150 110 160 140"
                stroke="hsl(30 50% 65%)"
                strokeWidth="12"
                fill="none"
                strokeLinecap="round"
              />

              {/* Meditation hands */}
              <circle cx="40" cy="140" r="8" fill="hsl(30 50% 65%)" />
              <circle cx="160" cy="140" r="8" fill="hsl(30 50% 65%)" />

              {/* Legs */}
              <ellipse cx="100" cy="180" rx="60" ry="30" fill="hsl(200 30% 25%)" />
            </svg>

            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold text-foreground">Present Moment Awareness</h2>
              <p className="text-muted-foreground max-w-xl">
                Your Actual Self represents your current state. Purpose emerges through action, 
                not analysis. Move first, refine later.
              </p>
            </div>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default ActualSelfPage;
