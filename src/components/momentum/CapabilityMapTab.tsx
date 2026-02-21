import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, Star } from "lucide-react";
import { subDays } from "date-fns";
import type { Capability } from "@/hooks/useMomentumData";

interface CapabilityMapTabProps {
  capabilities: Capability[];
}

const CATEGORY_MAP: Record<string, string> = {
  task: "Execution",
  insight: "Reflection",
  phase: "Strategy",
  design_thinking: "Creativity",
};

export function CapabilityMapTab({ capabilities }: CapabilityMapTabProps) {
  const oneWeekAgo = subDays(new Date(), 7).toISOString();

  const grouped = capabilities.reduce<Record<string, Capability[]>>((acc, cap) => {
    const cat = CATEGORY_MAP[cap.source_type] || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(cap);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([category, caps]) => (
        <Card key={category}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4 text-secondary" />
              {category}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {caps.map((cap) => {
              const isNew = cap.first_activated_at >= oneWeekAgo;
              return (
                <Badge
                  key={cap.id}
                  variant={isNew ? "default" : "outline"}
                  className="flex items-center gap-1"
                >
                  {isNew && <Star className="h-3 w-3" />}
                  {cap.capability_name}
                  <span className="ml-1 opacity-60">×{cap.activation_count}</span>
                </Badge>
              );
            })}
          </CardContent>
        </Card>
      ))}

      {capabilities.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Capabilities appear as you complete tasks and capture insights.</p>
            <p className="text-sm text-muted-foreground mt-1">Each action activates skills.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
