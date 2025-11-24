import { Card } from "@/components/ui/card";
import { Waves } from "lucide-react";

interface FrequencyMeterProps {
  frequency: string;
}

export function FrequencyMeter({ frequency }: FrequencyMeterProps) {
  const frequencyConfig: Record<string, { color: string; label: string; intensity: number }> = {
    "very-high": { color: "text-secondary", label: "Very High", intensity: 100 },
    "high": { color: "text-accent", label: "High", intensity: 75 },
    "medium": { color: "text-primary", label: "Medium", intensity: 50 },
    "low": { color: "text-muted-foreground", label: "Low", intensity: 25 },
  };

  const config = frequencyConfig[frequency] || frequencyConfig["medium"];

  return (
    <Card className="p-4 bg-card/50 backdrop-blur border-primary/20">
      <div className="flex items-center gap-3">
        <Waves className={`w-8 h-8 ${config.color}`} />
        <div>
          <p className="text-xs text-muted-foreground">Current Frequency</p>
          <p className={`text-lg font-bold ${config.color}`}>{config.label}</p>
        </div>
        <div className="ml-4 w-20">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary via-accent to-secondary transition-all duration-500"
              style={{ width: `${config.intensity}%` }}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}
