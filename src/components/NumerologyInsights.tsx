import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Target, Shield, Lightbulb, Zap, Clock } from "lucide-react";
import { motion } from "framer-motion";

interface UserInsights {
  coreTendency: string;
  naturalStrengths: string[];
  shadowPatterns: string;
  growthEdge: string;
  actionTranslation: string;
  idealActionCadence: string;
}

interface NumerologyProfile {
  lifePath: number;
  expressionNumber: number;
  soulUrge: number;
  personalityNumber: number;
  challengeNumber: number;
  element: string;
  archetype: string;
}

interface NumerologyInsightsProps {
  profile: NumerologyProfile;
  insights: UserInsights;
}

const elementColors: Record<string, string> = {
  Air: "bg-sky-500/20 text-sky-300 border-sky-500/30",
  Water: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  Fire: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  Earth: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  Ether: "bg-violet-500/20 text-violet-300 border-violet-500/30",
};

export const NumerologyInsights = ({ profile, insights }: NumerologyInsightsProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Profile Overview */}
      <Card className="bg-card/40 backdrop-blur-sm border-border/30">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Sparkles className="w-5 h-5 text-primary" />
              Your Pattern Profile
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={elementColors[profile.element] || "bg-muted"}>
                {profile.element}
              </Badge>
              <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30">
                {profile.archetype}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-3 rounded-lg bg-muted/30">
              <div className="text-2xl font-bold text-primary">{profile.lifePath}</div>
              <div className="text-xs text-muted-foreground">Life Path</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/30">
              <div className="text-2xl font-bold text-foreground">{profile.expressionNumber}</div>
              <div className="text-xs text-muted-foreground">Expression</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/30">
              <div className="text-2xl font-bold text-foreground">{profile.soulUrge}</div>
              <div className="text-xs text-muted-foreground">Soul Urge</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/30">
              <div className="text-2xl font-bold text-foreground">{profile.personalityNumber}</div>
              <div className="text-xs text-muted-foreground">Personality</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/30">
              <div className="text-2xl font-bold text-foreground">{profile.challengeNumber}</div>
              <div className="text-xs text-muted-foreground">Challenge</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Core Tendency */}
      <Card className="bg-card/40 backdrop-blur-sm border-border/30">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-primary/20">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">Core Tendency</h3>
              <p className="text-muted-foreground">{insights.coreTendency}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Natural Strengths */}
      <Card className="bg-card/40 backdrop-blur-sm border-border/30">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-emerald-500/20">
              <Lightbulb className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-3">Natural Strengths</h3>
              <ul className="space-y-2">
                {Array.isArray(insights.naturalStrengths) 
                  ? insights.naturalStrengths.map((strength, index) => (
                      <li key={index} className="flex items-start gap-2 text-muted-foreground">
                        <span className="text-emerald-400 mt-1">•</span>
                        {strength}
                      </li>
                    ))
                  : <li className="text-muted-foreground">{String(insights.naturalStrengths)}</li>
                }
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shadow Patterns */}
      <Card className="bg-card/40 backdrop-blur-sm border-border/30">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-amber-500/20">
              <Shield className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">Under Pressure</h3>
              <p className="text-muted-foreground">{insights.shadowPatterns}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Growth Edge */}
      <Card className="bg-card/40 backdrop-blur-sm border-border/30">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-violet-500/20">
              <Zap className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">Growth Edge</h3>
              <p className="text-muted-foreground">{insights.growthEdge}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Translation */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-primary/20">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">How to Start</h3>
              <p className="text-muted-foreground mb-3">{insights.actionTranslation}</p>
              <div className="inline-block px-3 py-1.5 rounded-full bg-primary/20 text-primary text-sm font-medium">
                {insights.idealActionCadence}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <p className="text-xs text-center text-muted-foreground/60 italic">
        These are patterns and tendencies, not fixed identity. Purpose emerges through action.
      </p>
    </motion.div>
  );
};
