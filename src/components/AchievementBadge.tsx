import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface AchievementBadgeProps {
  icon: string;
  title: string;
  description: string;
  tier: string;
  unlocked: boolean;
  progress?: number;
  requirementValue?: number;
}

const tierColors = {
  bronze: "from-amber-700 to-amber-900",
  silver: "from-gray-400 to-gray-600",
  gold: "from-yellow-400 to-yellow-600",
  diamond: "from-cyan-400 to-blue-600",
};

const tierBorders = {
  bronze: "border-amber-700/50",
  silver: "border-gray-400/50",
  gold: "border-yellow-400/50",
  diamond: "border-cyan-400/50",
};

export const AchievementBadge = ({
  icon,
  title,
  description,
  tier,
  unlocked,
  progress = 0,
  requirementValue = 0,
}: AchievementBadgeProps) => {
  const progressPercent = requirementValue > 0 ? (progress / requirementValue) * 100 : 0;

  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all duration-300 hover:scale-105",
        unlocked ? "border-2" : "border opacity-60",
        unlocked ? tierBorders[tier as keyof typeof tierBorders] : "border-muted"
      )}
    >
      <div
        className={cn(
          "absolute inset-0 opacity-10",
          unlocked && `bg-gradient-to-br ${tierColors[tier as keyof typeof tierColors]}`
        )}
      />
      
      <div className="relative p-4 space-y-2">
        <div className="flex items-start justify-between">
          <div
            className={cn(
              "text-4xl transition-all duration-300",
              unlocked ? "animate-scale-in" : "grayscale opacity-50"
            )}
          >
            {icon}
          </div>
          {!unlocked && (
            <Lock className="w-4 h-4 text-muted-foreground" />
          )}
        </div>

        <div className="space-y-1">
          <h3 className={cn(
            "font-semibold text-sm",
            !unlocked && "text-muted-foreground"
          )}>
            {title}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {description}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <Badge
            variant={unlocked ? "default" : "secondary"}
            className={cn(
              "text-xs capitalize",
              unlocked && `bg-gradient-to-r ${tierColors[tier as keyof typeof tierColors]} text-white`
            )}
          >
            {tier}
          </Badge>

          {!unlocked && requirementValue > 0 && (
            <span className="text-xs text-muted-foreground">
              {progress}/{requirementValue}
            </span>
          )}
        </div>

        {!unlocked && requirementValue > 0 && (
          <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
            />
          </div>
        )}
      </div>
    </Card>
  );
};
