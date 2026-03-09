import { Sparkles, Users, HeartHandshake, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ResonanceType, CreatorResonance } from "@/hooks/useCreatorPosts";

const RESONANCE_CONFIG: { type: ResonanceType; label: string; icon: React.ElementType; activeColor: string }[] = [
  { type: "inspires_me", label: "Inspires me", icon: Sparkles, activeColor: "text-amber-400" },
  { type: "creating_similar", label: "Creating similar", icon: Users, activeColor: "text-blue-400" },
  { type: "want_to_help", label: "Want to help", icon: HeartHandshake, activeColor: "text-emerald-400" },
  { type: "needed_this", label: "Needed this", icon: Heart, activeColor: "text-rose-400" },
];

interface ResonanceButtonsProps {
  resonances: CreatorResonance[];
  currentUserId: string | null;
  onToggle: (type: ResonanceType) => void;
}

export const ResonanceButtons = ({ resonances, currentUserId, onToggle }: ResonanceButtonsProps) => {
  return (
    <div className="flex flex-wrap gap-1.5">
      {RESONANCE_CONFIG.map(({ type, label, icon: Icon, activeColor }) => {
        const count = resonances.filter((r) => r.resonance_type === type).length;
        const isActive = resonances.some((r) => r.resonance_type === type && r.user_id === currentUserId);

        return (
          <button
            key={type}
            onClick={() => onToggle(type)}
            className={cn(
              "flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-full border transition-all",
              isActive
                ? `${activeColor} border-current/30 bg-current/10`
                : "text-muted-foreground border-border hover:text-foreground hover:border-primary/30"
            )}
          >
            <Icon className="w-3 h-3" />
            {label}
            {count > 0 && <span className="font-semibold">{count}</span>}
          </button>
        );
      })}
    </div>
  );
};
