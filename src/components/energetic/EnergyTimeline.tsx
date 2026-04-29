import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format } from "date-fns";

interface EnergeticSnapshot {
  captured_at: string;
  energy_level: number;
  clarity_level: number;
  expansion_level: number;
  alignment_feeling: number;
  coherence_level: number;
}

interface EnergyTimelineProps {
  snapshots: EnergeticSnapshot[];
}

export function EnergyTimeline({ snapshots }: EnergyTimelineProps) {
  const chartData = snapshots
    .slice(0, 20)
    .reverse()
    .map((snapshot) => ({
      time: format(new Date(snapshot.captured_at), "MMM dd HH:mm"),
      Energy: snapshot.energy_level,
      Clarity: snapshot.clarity_level,
      Expansion: snapshot.expansion_level,
      Coherence: snapshot.coherence_level,
    }));

  return (
    <Card className="p-6 bg-card/50 backdrop-blur border-primary/20">
      <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        Energy Field Timeline
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="time" 
            stroke="hsl(var(--muted-foreground))"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="hsl(var(--muted-foreground))"
            domain={[0, 10]}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px'
            }}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="Energy" 
            stroke="hsl(var(--primary))" 
            strokeWidth={2}
            dot={{ fill: 'hsl(var(--primary))' }}
          />
          <Line 
            type="monotone" 
            dataKey="Clarity" 
            stroke="hsl(var(--accent))" 
            strokeWidth={2}
            dot={{ fill: 'hsl(var(--accent))' }}
          />
          <Line 
            type="monotone" 
            dataKey="Expansion" 
            stroke="hsl(var(--secondary))" 
            strokeWidth={2}
            dot={{ fill: 'hsl(var(--secondary))' }}
          />
          <Line 
            type="monotone" 
            dataKey="Coherence" 
            stroke="hsl(var(--muted-foreground))" 
            strokeWidth={2}
            dot={{ fill: 'hsl(var(--muted-foreground))' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}
