import { Card } from "@/components/ui/card";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from "recharts";

interface EnergeticSnapshot {
  energy_level: number;
  clarity_level: number;
  expansion_level: number;
  alignment_feeling: number;
  coherence_level: number;
  overall_frequency: string | null;
}

interface CoherenceRadarProps {
  snapshots: EnergeticSnapshot[];
}

export function CoherenceRadar({ snapshots }: CoherenceRadarProps) {
  const latestSnapshot = snapshots[0];
  
  const radarData = latestSnapshot ? [
    { dimension: "Energy", value: latestSnapshot.energy_level },
    { dimension: "Clarity", value: latestSnapshot.clarity_level },
    { dimension: "Expansion", value: latestSnapshot.expansion_level },
    { dimension: "Alignment", value: latestSnapshot.alignment_feeling },
    { dimension: "Coherence", value: latestSnapshot.coherence_level },
  ] : [
    { dimension: "Energy", value: 0 },
    { dimension: "Clarity", value: 0 },
    { dimension: "Expansion", value: 0 },
    { dimension: "Alignment", value: 0 },
    { dimension: "Coherence", value: 0 },
  ];

  return (
    <Card className="p-6 bg-card/50 backdrop-blur border-accent/20">
      <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
        Current Coherence State
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={radarData}>
          <PolarGrid stroke="hsl(var(--border))" />
          <PolarAngleAxis 
            dataKey="dimension" 
            stroke="hsl(var(--muted-foreground))"
            style={{ fontSize: '14px' }}
          />
          <PolarRadiusAxis 
            angle={90} 
            domain={[0, 10]}
            stroke="hsl(var(--muted-foreground))"
          />
          <Radar
            name="Current State"
            dataKey="value"
            stroke="hsl(var(--accent))"
            fill="hsl(var(--accent))"
            fillOpacity={0.6}
          />
        </RadarChart>
      </ResponsiveContainer>
      {latestSnapshot && (
        <p className="text-sm text-muted-foreground mt-4 text-center">
          Overall Frequency: <span className="font-semibold text-accent capitalize">{latestSnapshot.overall_frequency || 'medium'}</span>
        </p>
      )}
    </Card>
  );
}
