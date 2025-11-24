import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface EnergeticSnapshot {
  captured_at: string;
  snapshot_type: string;
  overall_frequency: string;
  emotional_state: string;
}

interface FlowStateTrackerProps {
  snapshots: EnergeticSnapshot[];
}

export function FlowStateTracker({ snapshots }: FlowStateTrackerProps) {
  // Count flow states by type
  const flowTypeCount: Record<string, number> = {};
  snapshots.forEach((snapshot) => {
    if (snapshot.snapshot_type) {
      flowTypeCount[snapshot.snapshot_type] = (flowTypeCount[snapshot.snapshot_type] || 0) + 1;
    }
  });

  const chartData = Object.entries(flowTypeCount).map(([type, count]) => ({
    type: type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
    count,
  }));

  const colors = [
    "hsl(var(--primary))",
    "hsl(var(--secondary))",
    "hsl(var(--accent))",
    "hsl(var(--mamba))",
    "hsl(var(--quantum))",
    "hsl(var(--sage))",
  ];

  return (
    <Card className="p-6 bg-card/50 backdrop-blur border-secondary/20">
      <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
        Flow State Distribution
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="type" 
            stroke="hsl(var(--muted-foreground))"
            style={{ fontSize: '12px' }}
            angle={-45}
            textAnchor="end"
            height={100}
          />
          <YAxis stroke="hsl(var(--muted-foreground))" />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px'
            }}
          />
          <Bar dataKey="count" radius={[8, 8, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
