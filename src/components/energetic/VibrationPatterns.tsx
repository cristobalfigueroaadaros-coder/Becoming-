import { Card } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";

interface EnergeticSnapshot {
  captured_at: string;
  energy_level: number;
  expansion_level: number;
  overall_frequency: string;
}

interface VibrationPatternsProps {
  snapshots: EnergeticSnapshot[];
}

export function VibrationPatterns({ snapshots }: VibrationPatternsProps) {
  const chartData = snapshots
    .slice(0, 15)
    .reverse()
    .map((snapshot) => {
      // Calculate vibrational index
      const vibrationIndex = (snapshot.energy_level + snapshot.expansion_level) / 2;
      
      return {
        time: format(new Date(snapshot.captured_at), "MMM dd"),
        vibration: vibrationIndex,
        frequency: snapshot.overall_frequency,
      };
    });

  return (
    <Card className="p-6 bg-card/50 backdrop-blur border-primary/20">
      <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        Vibrational Wave Pattern
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="vibrationGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
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
          <Area
            type="monotone"
            dataKey="vibration"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            fill="url(#vibrationGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}
