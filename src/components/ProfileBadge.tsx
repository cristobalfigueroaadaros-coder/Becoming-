import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";

interface ProfileBadgeProps {
  badge_key: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  size?: "small" | "medium";
}

const colorMap: Record<string, string> = {
  blue: "bg-blue-500/10 border-blue-500/50 text-blue-400",
  gold: "bg-yellow-500/10 border-yellow-500/50 text-yellow-400",
  orange: "bg-orange-500/10 border-orange-500/50 text-orange-400",
  purple: "bg-purple-500/10 border-purple-500/50 text-purple-400",
  yellow: "bg-yellow-500/10 border-yellow-500/50 text-yellow-400",
  cyan: "bg-cyan-500/10 border-cyan-500/50 text-cyan-400",
  green: "bg-green-500/10 border-green-500/50 text-green-400",
  pink: "bg-pink-500/10 border-pink-500/50 text-pink-400",
};

export const ProfileBadge = ({ 
  badge_key, 
  name, 
  description, 
  icon, 
  color, 
  size = "small" 
}: ProfileBadgeProps) => {
  const sizeClasses = size === "small" 
    ? "h-6 px-2 text-xs" 
    : "h-8 px-3 text-sm";

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <div
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border backdrop-blur-sm",
            "transition-all duration-200 hover:scale-105 cursor-help",
            colorMap[color] || colorMap.blue,
            sizeClasses
          )}
        >
          <span className="text-base leading-none">{icon}</span>
          {size === "medium" && <span className="font-medium">{name}</span>}
        </div>
      </HoverCardTrigger>
      <HoverCardContent className="w-64">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{icon}</span>
            <h4 className="text-sm font-semibold">{name}</h4>
          </div>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};
