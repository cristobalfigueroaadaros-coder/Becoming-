import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { Dna, Sparkles, ArrowRight } from "lucide-react";

interface NumerologyProfile {
  lifePath: number;
  expression: number;
  soulUrge: number;
  personality: number;
  challenge: number;
  element: string;
  archetype: string;
}

interface HumanDesignData {
  type: string;
  strategy: string;
  authority: string;
  profile?: string;
}

interface UserInsights {
  coreTendency?: string;
}

const elementColors: Record<string, string> = {
  Fire: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  Water: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Air: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  Earth: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  Ether: "bg-violet-500/20 text-violet-400 border-violet-500/30",
};

const archetypeColors: Record<string, string> = {
  Leader: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  Healer: "bg-rose-500/20 text-rose-400 border-rose-500/30",
  Teacher: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
  Builder: "bg-teal-500/20 text-teal-400 border-teal-500/30",
  Creator: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  Seeker: "bg-sky-500/20 text-sky-400 border-sky-500/30",
  Visionary: "bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/30",
  Achiever: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  Humanitarian: "bg-pink-500/20 text-pink-400 border-pink-500/30",
};

export const ActualSelfSummaryCard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [numerologyProfile, setNumerologyProfile] = useState<NumerologyProfile | null>(null);
  const [humanDesignData, setHumanDesignData] = useState<HumanDesignData | null>(null);
  const [userInsights, setUserInsights] = useState<UserInsights | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("numerology_profile, human_design_data")
        .eq("id", user.id)
        .single();

      if (profile) {
        if (profile.numerology_profile) {
          const numProfile = profile.numerology_profile as any;
          setNumerologyProfile({
            lifePath: numProfile.lifePath,
            expression: numProfile.expression,
            soulUrge: numProfile.soulUrge,
            personality: numProfile.personality,
            challenge: numProfile.challenge,
            element: numProfile.element,
            archetype: numProfile.archetype,
          });
          if (numProfile.userInsights) {
            setUserInsights(numProfile.userInsights);
          }
        }
        if (profile.human_design_data) {
          const hdData = profile.human_design_data as any;
          setHumanDesignData({
            type: hdData.type,
            strategy: hdData.strategy,
            authority: hdData.authority,
            profile: hdData.profile,
          });
        }
      }
    } catch (error) {
      console.error("Error loading pattern profile:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-background">
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-9 w-full" />
        </CardContent>
      </Card>
    );
  }

  const hasData = numerologyProfile || humanDesignData;

  if (!hasData) {
    return (
      <Card className="border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-background">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Dna className="w-5 h-5 text-violet-500" />
            Your Pattern Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Your pattern profile hasn't been generated yet. Complete onboarding to unlock your personalized insights.
          </p>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => navigate("/onboarding-step-1")}
          >
            Complete Setup
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-background">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Dna className="w-5 h-5 text-violet-500" />
          Your Pattern Profile
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Badges and Life Path */}
        {numerologyProfile && (
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {numerologyProfile.element && (
                <Badge 
                  variant="outline" 
                  className={elementColors[numerologyProfile.element] || "bg-muted"}
                >
                  {numerologyProfile.element}
                </Badge>
              )}
              {numerologyProfile.archetype && (
                <Badge 
                  variant="outline" 
                  className={archetypeColors[numerologyProfile.archetype] || "bg-muted"}
                >
                  {numerologyProfile.archetype}
                </Badge>
              )}
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Life Path</div>
              <div className="text-2xl font-bold text-violet-400">
                {numerologyProfile.lifePath}
              </div>
            </div>
          </div>
        )}

        {/* Human Design Type */}
        {humanDesignData && (
          <div className="p-3 rounded-lg bg-background/50 border border-border/50">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-medium">{humanDesignData.type}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Strategy: {humanDesignData.strategy}
            </p>
          </div>
        )}

        {/* Core Tendency */}
        {userInsights?.coreTendency && (
          <p className="text-sm text-muted-foreground italic line-clamp-2">
            "{userInsights.coreTendency}"
          </p>
        )}

        {/* View Full Profile Button */}
        <Button 
          variant="ghost" 
          className="w-full justify-between text-violet-400 hover:text-violet-300 hover:bg-violet-500/10"
          onClick={() => navigate("/future-self/actual-self")}
        >
          View Full Profile
          <ArrowRight className="w-4 h-4" />
        </Button>
      </CardContent>
    </Card>
  );
};
