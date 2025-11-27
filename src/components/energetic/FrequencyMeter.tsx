/**
 * ❗ CONSCIOUSNESS TRACKING RULES
 * 
 * 1. NEVER display consciousness meters, scores, levels, or numeric progression
 * 2. NEVER show graphs/charts of spiritual/energetic states
 * 3. Consciousness is expressed ONLY through mentor voice, reflections, and task design
 * 4. Frequency references are SYMBOLIC METAPHORS, not metrics
 * 5. The arc is FELT, not displayed
 */

import { Card } from "@/components/ui/card";
import { Sparkles, Sun, Moon, Cloud, Flame } from "lucide-react";

interface FrequencyMeterProps {
  frequency: string;
}

export function FrequencyMeter({ frequency }: FrequencyMeterProps) {
  // Qualitative mood indicators - no numbers, no tracking
  const moodConfig: Record<string, { icon: React.ElementType; label: string; description: string; className: string }> = {
    "very-high": { 
      icon: Flame, 
      label: "On Fire", 
      description: "You're in flow ✨",
      className: "text-secondary"
    },
    "high": { 
      icon: Sun, 
      label: "Expansive", 
      description: "Open and aligned",
      className: "text-accent"
    },
    "medium": { 
      icon: Sparkles, 
      label: "Present", 
      description: "Grounded and aware",
      className: "text-primary"
    },
    "low": { 
      icon: Cloud, 
      label: "Reflective", 
      description: "Time for gentleness",
      className: "text-muted-foreground"
    },
  };

  const config = moodConfig[frequency] || moodConfig["medium"];
  const Icon = config.icon;

  return (
    <Card className="p-4 bg-card/50 backdrop-blur border-primary/20">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full bg-muted flex items-center justify-center ${config.className}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Right now you feel...</p>
          <p className={`text-lg font-semibold ${config.className}`}>{config.label}</p>
          <p className="text-xs text-muted-foreground italic">{config.description}</p>
        </div>
      </div>
    </Card>
  );
}
