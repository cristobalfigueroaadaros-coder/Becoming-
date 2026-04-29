import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Heart, Compass, Zap, Target } from "lucide-react";

interface QuestsCardProps {
  showNotification?: boolean;
}

interface DiscoveryCount {
  core_values: number;
  ikigai: number;
  strengths: number;
  my_why: number;
}

const questConfig = [
  { key: "core_values", label: "Values", icon: Heart, color: "text-rose-500" },
  { key: "ikigai", label: "Ikigai", icon: Compass, color: "text-amber-500" },
  { key: "strengths", label: "Strengths", icon: Zap, color: "text-emerald-500" },
  { key: "my_why", label: "My Why", icon: Target, color: "text-blue-500" },
];

const QuestsCard = ({ showNotification = false }: QuestsCardProps) => {
  const [counts, setCounts] = useState<DiscoveryCount>({
    core_values: 0,
    ikigai: 0,
    strengths: 0,
    my_why: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDiscoveryCounts();
  }, []);

  const loadDiscoveryCounts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("becoming_discoveries")
        .select("discovery_type")
        .eq("user_id", user.id);

      if (error) throw error;

      const newCounts: DiscoveryCount = {
        core_values: 0,
        ikigai: 0,
        strengths: 0,
        my_why: 0,
      };

      (data || []).forEach((d) => {
        if (d.discovery_type in newCounts) {
          newCounts[d.discovery_type as keyof DiscoveryCount]++;
        }
      });

      setCounts(newCounts);
    } catch (error) {
      console.error("Error loading discovery counts:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalDiscoveries = Object.values(counts).reduce((a, b) => a + b, 0);
  const hasUncompleted = Object.values(counts).some((c) => c === 0);

  return (
    <div className="relative flex flex-col items-center justify-center gap-4 h-full min-h-[200px] p-4">
      {/* Notification badge */}
      {showNotification && hasUncompleted && (
        <Badge className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full h-6 w-6 flex items-center justify-center text-xs font-bold p-0 animate-pulse">
          !
        </Badge>
      )}

      {/* Progress Grid */}
      <div className="grid grid-cols-2 gap-3 w-full max-w-[200px]">
        {questConfig.map(({ key, label, icon: Icon, color }) => {
          const count = counts[key as keyof DiscoveryCount];
          const isComplete = count > 0;
          
          return (
            <div
              key={key}
              className={`flex items-center gap-2 p-2 rounded-lg border transition-colors ${
                isComplete 
                  ? "bg-muted/50 border-border" 
                  : "bg-muted/20 border-dashed border-muted-foreground/30"
              }`}
            >
              <Icon className={`w-4 h-4 ${isComplete ? color : "text-muted-foreground/50"}`} />
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-medium truncate ${isComplete ? "" : "text-muted-foreground"}`}>
                  {label}
                </p>
                {isComplete && (
                  <p className="text-[10px] text-muted-foreground">{count} found</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <p className="text-xs text-muted-foreground text-center">
        {totalDiscoveries === 0 
          ? "Begin your self-discovery journey"
          : `${totalDiscoveries} discoveries made`
        }
      </p>
    </div>
  );
};

export default QuestsCard;
