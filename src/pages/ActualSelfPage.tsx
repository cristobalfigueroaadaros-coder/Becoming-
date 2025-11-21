import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Star } from "lucide-react";
import FutureSelfBackground from "@/components/FutureSelfBackground";
import { Card } from "@/components/ui/card";
import { HumanDesignCard } from "@/components/human-design/HumanDesignCard";
import { supabase } from "@/integrations/supabase/client";
import { generateMockHumanDesignData, generateHumanDesignDots } from "@/lib/humanDesignDots";
import { toast } from "sonner";

const ActualSelfPage = () => {
  const navigate = useNavigate();
  const [humanDesignData, setHumanDesignData] = useState<any>(null);
  const [hasBirthData, setHasBirthData] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generatingDots, setGeneratingDots] = useState(false);

  useEffect(() => {
    loadHumanDesignData();
  }, []);

  const loadHumanDesignData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("birth_date, birth_time, birth_time_unknown, human_design_data")
        .eq("id", user.id)
        .single();

      if (!profile?.birth_date) {
        setLoading(false);
        return;
      }

      setHasBirthData(true);

      // Check if Human Design data exists
      if (profile.human_design_data && Object.keys(profile.human_design_data).length > 0) {
        setHumanDesignData(profile.human_design_data);
      } else {
        // Generate Human Design data
        const hdData = generateMockHumanDesignData(
          profile.birth_date,
          profile.birth_time,
          profile.birth_time_unknown
        );
        setHumanDesignData(hdData);

        // Save to profile
        await supabase
          .from("profiles")
          .update({ human_design_data: hdData as any })
          .eq("id", user.id);

        // Auto-generate constellation dots
        await handleGenerateDots(hdData, user.id);
      }
    } catch (error) {
      console.error("Error loading Human Design data:", error);
      toast.error("Failed to load Human Design data");
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

      // Check if dots already exist
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
        <h1 className="text-5xl md:text-6xl font-bold text-center text-foreground mb-12">
          Actual Self
        </h1>

        {/* Human Design Section */}
        {loading ? (
          <Card className="p-8 bg-card/30 backdrop-blur-sm border-border/30">
            <div className="text-center">
              <p className="text-muted-foreground">Loading your Human Design...</p>
            </div>
          </Card>
        ) : hasBirthData && humanDesignData ? (
          <>
            <HumanDesignCard data={humanDesignData} />
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
          </>
        ) : (
          <Card className="p-8 bg-card/30 backdrop-blur-sm border-border/30">
            <div className="flex flex-col items-center gap-4 text-center">
              <Star className="w-12 h-12 text-muted-foreground" />
              <h2 className="text-2xl font-bold">Unlock Your Human Design</h2>
              <p className="text-muted-foreground max-w-md">
                Add your birth date to discover your unique energetic blueprint and understand your natural strengths.
              </p>
              <Button onClick={() => navigate("/profile")}>
                Add Birth Info
              </Button>
            </div>
          </Card>
        )}
        
        <Card className="p-8 bg-card/30 backdrop-blur-sm border-border/30">
          <div className="flex flex-col items-center gap-8">
            <svg viewBox="0 0 200 240" className="w-full max-w-[300px]">
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

              {/* Torso (teal shirt) */}
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

              {/* Legs (cross-legged) */}
              <ellipse cx="100" cy="180" rx="60" ry="30" fill="hsl(200 30% 25%)" />
            </svg>

            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold text-foreground">Present Moment Awareness</h2>
              <p className="text-lg text-muted-foreground max-w-2xl">
                Your Actual Self represents your current state of being. Through daily rituals, 
                meditation, and mindful practices, you cultivate awareness and presence in the here and now.
              </p>
            </div>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default ActualSelfPage;
