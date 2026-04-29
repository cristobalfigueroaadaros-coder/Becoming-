import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Target, Star, Compass, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface Discovery {
  id: string;
  discovery_type: string;
  element_key: string;
  element_value: string;
  source: string;
  created_at: string;
}

const discoveryTypeConfig: Record<string, { label: string; icon: any; color: string }> = {
  core_values: { label: "Core Values", icon: Heart, color: "text-rose-500 bg-rose-500/10" },
  ikigai: { label: "Ikigai", icon: Compass, color: "text-amber-500 bg-amber-500/10" },
  strengths: { label: "Strengths", icon: Zap, color: "text-emerald-500 bg-emerald-500/10" },
  my_why: { label: "My Why", icon: Target, color: "text-blue-500 bg-blue-500/10" },
  patterns: { label: "Patterns", icon: Star, color: "text-violet-500 bg-violet-500/10" },
};

const ikigaiLabels: Record<string, string> = {
  love: "What You Love",
  good_at: "What You're Good At",
  needs: "What the World Needs",
  paid_for: "What You Can Be Paid For",
};

export const CoreDiscoveries = () => {
  const [discoveries, setDiscoveries] = useState<Discovery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDiscoveries();
  }, []);

  const loadDiscoveries = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("becoming_discoveries")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDiscoveries(data || []);
    } catch (error) {
      console.error("Error loading discoveries:", error);
    } finally {
      setLoading(false);
    }
  };

  // Group discoveries by type
  const groupedDiscoveries = discoveries.reduce((acc, disc) => {
    if (!acc[disc.discovery_type]) {
      acc[disc.discovery_type] = [];
    }
    acc[disc.discovery_type].push(disc);
    return acc;
  }, {} as Record<string, Discovery[]>);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="animate-pulse text-muted-foreground">Loading discoveries...</div>
        </CardContent>
      </Card>
    );
  }

  if (discoveries.length === 0) {
    return (
      <Card className="border-dashed border-2">
        <CardContent className="py-8 text-center">
          <Compass className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
          <h3 className="font-semibold mb-1">No Discoveries Yet</h3>
          <p className="text-sm text-muted-foreground">
            Complete quests or talk to your Future Self to discover who you're becoming
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Star className="w-5 h-5 text-amber-500" />
          Your Discoveries
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(groupedDiscoveries).map(([type, items]) => {
          const config = discoveryTypeConfig[type] || {
            label: type,
            icon: Star,
            color: "text-muted-foreground bg-muted",
          };
          const Icon = config.icon;

          return (
            <motion.div
              key={type}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              <div className="flex items-center gap-2">
                <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", config.color)}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="font-medium text-sm">{config.label}</span>
              </div>

              <div className="pl-10 space-y-2">
                {type === "ikigai" ? (
                  // Special layout for Ikigai - show as grid
                  <div className="grid grid-cols-2 gap-2">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="p-2 rounded-lg bg-muted/50 border border-border/50"
                      >
                        <span className="text-xs text-muted-foreground block mb-1">
                          {ikigaiLabels[item.element_key] || item.element_key}
                        </span>
                        <p className="text-sm">{item.element_value}</p>
                      </div>
                    ))}
                  </div>
                ) : type === "core_values" ? (
                  // Core values as horizontal badges
                  <div className="flex flex-wrap gap-2">
                    {items.map((item) => (
                      <Badge
                        key={item.id}
                        variant="secondary"
                        className="bg-rose-500/10 text-rose-600 border-rose-500/20"
                      >
                        {item.element_value}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  // Default list layout
                  items.map((item) => (
                    <div
                      key={item.id}
                      className="p-2 rounded-lg bg-muted/50 border border-border/50"
                    >
                      <p className="text-sm">{item.element_value}</p>
                      {item.element_key !== "values_list" && (
                        <span className="text-xs text-muted-foreground">
                          {item.element_key}
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          );
        })}
      </CardContent>
    </Card>
  );
};
