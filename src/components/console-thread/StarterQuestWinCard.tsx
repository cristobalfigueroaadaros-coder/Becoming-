import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Target, Eye, Brain, Sparkles, Shield, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";

const CATEGORY_ICONS: Record<string, typeof Target> = {
  execution: Target,
  reflection: Eye,
  strategy: Brain,
  creativity: Sparkles,
  identity: Shield,
};

const CATEGORY_COLORS: Record<string, string> = {
  execution: "text-orange-500",
  reflection: "text-blue-500",
  strategy: "text-emerald-500",
  creativity: "text-purple-500",
  identity: "text-amber-500",
};

interface StarterQuestWinCardProps {
  capabilities: { capability_name: string; category: string; description?: string }[];
  onContinue: () => void;
}

const StarterQuestWinCard = ({ capabilities, onContinue }: StarterQuestWinCardProps) => {
  const navigate = useNavigate();

  return (
    <Card className="border-primary/30 bg-primary/5 mx-4 my-2">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Your first capabilities unlocked</h3>
        </div>

        <div className="space-y-3">
          {capabilities.map((cap, i) => {
            const Icon = CATEGORY_ICONS[cap.category] || Sparkles;
            const color = CATEGORY_COLORS[cap.category] || "text-primary";
            return (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-background/60 border border-border/50">
                <div className={`mt-0.5 ${color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-medium text-sm text-foreground">{cap.capability_name}</p>
                  {cap.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{cap.description}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/momentum", { state: { tab: "capabilities" } })}
            className="w-full"
          >
            See Your Capabilities
          </Button>
          <Button
            size="sm"
            onClick={onContinue}
            className="w-full"
          >
            Continue Your Journey
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default StarterQuestWinCard;
