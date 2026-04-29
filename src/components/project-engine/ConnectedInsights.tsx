import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Lightbulb } from "lucide-react";

interface Insight {
  id: string;
  insight_text: string;
  source_type: string;
}

export function ConnectedInsights({ projectId, userId }: { projectId: string; userId: string }) {
  const [insights, setInsights] = useState<Insight[]>([]);

  useEffect(() => {
    loadInsights();
  }, [projectId]);

  const loadInsights = async () => {
    // Load insights from daily steps that have insight_text
    const { data } = await supabase
      .from("integrator_daily_steps")
      .select("id, insight_text, action_type")
      .eq("project_id", projectId)
      .not("insight_text", "is", null)
      .order("day_number", { ascending: false })
      .limit(10);

    setInsights(
      (data || [])
        .filter(d => d.insight_text)
        .map(d => ({
          id: d.id,
          insight_text: d.insight_text!,
          source_type: d.action_type || "insight",
        }))
    );
  };

  const typeColors: Record<string, string> = {
    insight: "bg-primary/20 text-primary",
    reflect: "bg-blue-500/20 text-blue-400",
    create: "bg-green-500/20 text-green-400",
    research: "bg-orange-500/20 text-orange-400",
  };

  return (
    <Card className="border-border/40">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-primary/80">Connected Insights</CardTitle>
      </CardHeader>
      <CardContent>
        {insights.length === 0 ? (
          <div className="text-center py-6 space-y-2">
            <Lightbulb className="w-8 h-8 mx-auto text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">
              Insights from your mentors will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {insights.map(insight => (
              <div key={insight.id} className="flex items-start gap-2 p-3 rounded-lg border border-border/30 bg-muted/10">
                <Badge variant="outline" className={typeColors[insight.source_type] || typeColors.insight}>
                  {insight.source_type}
                </Badge>
                <p className="text-sm flex-1">{insight.insight_text}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
