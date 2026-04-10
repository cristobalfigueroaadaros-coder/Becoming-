import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw } from "lucide-react";
import FutureSelfBackground from "@/components/FutureSelfBackground";
import { Card } from "@/components/ui/card";
import { HumanDesignCard } from "@/components/human-design/HumanDesignCard";
import { BodygraphChart } from "@/components/human-design/BodygraphChart";
import { supabase } from "@/integrations/supabase/client";
import { generateMockHumanDesignData } from "@/lib/humanDesignDots";
import { toast } from "sonner";
import { NumerologyInsights } from "@/components/NumerologyInsights";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface NumerologyProfile {
  lifePath: number;
  expressionNumber: number;
  soulUrge: number;
  personalityNumber: number;
  challengeNumber: number;
  element: string;
  archetype: string;
}

interface NumerologyUserInsights {
  coreTendency: string;
  naturalStrengths: string[];
  shadowPatterns: string;
  growthEdge: string;
  actionTranslation: string;
  idealActionCadence: string;
}

const ActualSelfPage = () => {
  const navigate = useNavigate();
  const [humanDesignData, setHumanDesignData] = useState<any>(null);
  const [numerologyProfile, setNumerologyProfile] = useState<NumerologyProfile | null>(null);
  const [numerologyInsights, setNumerologyInsights] = useState<NumerologyUserInsights | null>(null);
  const [birthName, setBirthName] = useState<string | null>(null);
  const [birthDate, setBirthDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
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
        .select("birth_date, birth_name, display_name, human_design_data, numerology_profile, numerology_signals")
        .eq("id", user.id)
        .single();

      if (!profile) {
        setLoading(false);
        return;
      }

      setBirthDate(profile.birth_date);
      setBirthName(profile.birth_name || profile.display_name);

      // Load numerology data from profile (stored during onboarding)
      if (profile.numerology_profile) {
        const numProfile = profile.numerology_profile as any;
        setNumerologyProfile({
          lifePath: numProfile.lifePath,
          expressionNumber: numProfile.expressionNumber,
          soulUrge: numProfile.soulUrge,
          personalityNumber: numProfile.personalityNumber,
          challengeNumber: numProfile.challengeNumber,
          element: numProfile.element,
          archetype: numProfile.archetype,
        });
        
        // User insights are stored with the profile
        if (numProfile.userInsights) {
          setNumerologyInsights(numProfile.userInsights);
        }
      }

      // Load Human Design data
      if (profile.human_design_data && Object.keys(profile.human_design_data).length > 0) {
        setHumanDesignData(profile.human_design_data);
      } else if (profile.birth_date) {
        const hdData = generateMockHumanDesignData(profile.birth_date, null, true);
        setHumanDesignData(hdData);

        await supabase
          .from("profiles")
          .update({ human_design_data: hdData as any })
          .eq("id", user.id);

      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async () => {
    if (!birthName || !birthDate) {
      toast.error("Missing birth data. Please update your profile.");
      return;
    }

    setRegenerating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const response = await supabase.functions.invoke("analyze-numerology", {
        body: { birthName, birthDate }
      });

      if (response.error) throw response.error;

      const result = response.data;
      
      // Update profile with new numerology data
      await supabase
        .from("profiles")
        .update({
          numerology_profile: result.profile,
          numerology_signals: result.systemIntelligence,
        })
        .eq("id", user.id);

      // Update local state
      setNumerologyProfile(result.profile);
      if (result.userInsights) {
        setNumerologyInsights(result.userInsights);
      }

      toast.success("Profile regenerated!");
    } catch (error: any) {
      console.error("Error regenerating:", error);
      toast.error("Failed to regenerate profile");
    } finally {
      setRegenerating(false);
    }
  };

  const hasNumerologyData = numerologyProfile && numerologyInsights;

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
        ) : !hasNumerologyData ? (
          <Card className="p-8 bg-card/30 backdrop-blur-sm border-border/30">
            <div className="text-center space-y-4">
              <h2 className="text-xl font-semibold">Pattern Profile Not Available</h2>
              <p className="text-muted-foreground">
                Your pattern profile is generated during onboarding. If you skipped this step, 
                you can regenerate it now.
              </p>
              {birthName && birthDate ? (
                <Button onClick={handleRegenerate} disabled={regenerating}>
                  <RefreshCw className={`w-4 h-4 mr-2 ${regenerating ? 'animate-spin' : ''}`} />
                  {regenerating ? "Generating..." : "Generate Pattern Profile"}
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Please update your profile with your birth name and date first.
                </p>
              )}
            </div>
          </Card>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
              <TabsTrigger value="numerology">Pattern Profile</TabsTrigger>
              <TabsTrigger value="human-design">Human Design</TabsTrigger>
            </TabsList>

            <TabsContent value="numerology" className="space-y-6">
              <NumerologyInsights 
                profile={numerologyProfile}
                insights={numerologyInsights}
              />
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  onClick={handleRegenerate}
                  disabled={regenerating}
                  className="gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${regenerating ? 'animate-spin' : ''}`} />
                  {regenerating ? "Regenerating..." : "Regenerate Profile"}
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
