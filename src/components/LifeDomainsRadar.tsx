import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Loader2 } from "lucide-react";

interface DomainData {
  domain: string;
  current: number;
  future: number;
}

export const LifeDomainsRadar = () => {
  const [data, setData] = useState<DomainData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDomains();
  }, []);

  const loadDomains = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: domains, error } = await supabase
        .from("life_domains")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;

      if (domains) {
        const chartData = domains.map(d => ({
          domain: d.domain_name.split(' & ')[0], // Shorten for chart
          current: d.current_score,
          future: d.future_score
        }));
        setData(chartData);
      }
    } catch (error) {
      console.error("Error loading domains:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-mentor-future/10 to-primary/5 border-mentor-future/20">
        <CardContent className="flex items-center justify-center h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-mentor-future" />
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-mentor-future/10 to-primary/5 border-mentor-future/20">
        <CardHeader>
          <CardTitle className="text-center">Complete Your Life Assessment</CardTitle>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground space-y-4">
          <p>Your life domains radar will appear here once you complete the assessment.</p>
          <Button onClick={() => window.location.href = '/life-assessment'}>
            Start Assessment
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-mentor-future/10 to-primary/5 border-mentor-future/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">🎯</span>
          Life Domains Map
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <RadarChart data={data}>
            <PolarGrid stroke="hsl(var(--border))" />
            <PolarAngleAxis 
              dataKey="domain" 
              tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
            />
            <PolarRadiusAxis 
              angle={90} 
              domain={[0, 10]}
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <Radar
              name="Current State"
              dataKey="current"
              stroke="hsl(var(--primary))"
              fill="hsl(var(--primary))"
              fillOpacity={0.3}
              strokeWidth={2}
            />
            <Radar
              name="Future Vision"
              dataKey="future"
              stroke="hsl(var(--mentor-future))"
              fill="hsl(var(--mentor-future))"
              fillOpacity={0.3}
              strokeWidth={2}
            />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="circle"
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                color: 'hsl(var(--foreground))'
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
