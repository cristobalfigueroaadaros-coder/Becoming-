import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import FutureSelfBackground from "@/components/FutureSelfBackground";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { FutureSelfWidget } from "@/components/FutureSelfWidget";

const FutureSelfDetailPage = () => {
  const navigate = useNavigate();
  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(0);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("future_self_progress")
      .select("evolution_level, global_xp")
      .eq("user_id", user.id)
      .single();

    if (data) {
      setLevel(data.evolution_level);
      setXp(data.global_xp);
    }
  };

  return (
    <div className="min-h-screen relative">
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
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-5xl md:text-6xl font-bold text-center text-foreground mb-12">
          Future Self
        </h1>
        
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
              
              {/* Eyes */}
              <circle cx="92" cy="48" r="3" fill="hsl(0 0% 20%)" />
              <circle cx="108" cy="48" r="3" fill="hsl(0 0% 20%)" />
              
              {/* Smile */}
              <path
                d="M 88 58 Q 100 62 112 58"
                fill="none"
                stroke="hsl(0 0% 20%)"
                strokeWidth="2"
                strokeLinecap="round"
              />

              {/* Torso with "Future Self" text */}
              <path
                d="M 75 75 L 75 140 Q 75 150 85 150 L 115 150 Q 125 150 125 140 L 125 75"
                fill="hsl(220 60% 50%)"
              />
              
              <text x="100" y="110" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">
                Future
              </text>
              <text x="100" y="125" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">
                Self
              </text>

              {/* Level badge on shoulder */}
              <circle cx="125" cy="85" r="12" fill="hsl(45 100% 50%)" />
              <text x="125" y="90" textAnchor="middle" fill="hsl(0 0% 20%)" fontSize="12" fontWeight="bold">
                {level}
              </text>

              {/* Arms */}
              <path
                d="M 75 90 L 50 130"
                stroke="hsl(30 50% 65%)"
                strokeWidth="12"
                fill="none"
                strokeLinecap="round"
              />
              <path
                d="M 125 90 L 150 130"
                stroke="hsl(30 50% 65%)"
                strokeWidth="12"
                fill="none"
                strokeLinecap="round"
              />

              {/* Hands */}
              <circle cx="50" cy="130" r="8" fill="hsl(30 50% 65%)" />
              <circle cx="150" cy="130" r="8" fill="hsl(30 50% 65%)" />

              {/* Legs */}
              <rect x="85" y="150" width="12" height="50" rx="6" fill="hsl(200 30% 25%)" />
              <rect x="103" y="150" width="12" height="50" rx="6" fill="hsl(200 30% 25%)" />
              
              {/* Feet */}
              <ellipse cx="91" cy="205" rx="10" ry="6" fill="hsl(0 0% 20%)" />
              <ellipse cx="109" cy="205" rx="10" ry="6" fill="hsl(0 0% 20%)" />
            </svg>

            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold text-foreground">Level {level}</h2>
              <p className="text-xl text-muted-foreground">{xp} XP</p>
              <p className="text-lg text-muted-foreground max-w-2xl">
                Your Future Self represents the person you're evolving into. Through consistent growth, 
                completing challenges, and achieving milestones, you level up and become the best version of yourself.
              </p>
            </div>

            <FutureSelfWidget />
          </div>
        </Card>
      </div>
    </div>
  );
};

export default FutureSelfDetailPage;
