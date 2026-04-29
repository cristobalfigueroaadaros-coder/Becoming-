import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, TrendingUp, TrendingDown, Minus, Sparkles, Brain, Target } from "lucide-react";
import { toast } from "sonner";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface Theme {
  name: string;
  frequency: number;
  trend: "rising" | "stable" | "declining";
  description: string;
  relatedSources: string[];
}

interface SkillCluster {
  name: string;
  skills: string[];
  strength: number;
  description: string;
}

interface Pattern {
  type: string;
  description: string;
  frequency: string;
  insight: string;
}

interface Evolution {
  period: string;
  dominantThemes: string[];
  insight: string;
}

interface ConstellationInsights {
  themes: Theme[];
  skillClusters: SkillCluster[];
  patterns: Pattern[];
  evolution: Evolution[];
  summary: string;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))', 'hsl(280 80% 60%)', 'hsl(200 70% 55%)'];

const ConstellationInsightsDashboard = () => {
  const navigate = useNavigate();
  const [insights, setInsights] = useState<ConstellationInsights | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('analyze-constellation-insights');

      if (error) throw error;
      setInsights(data);
    } catch (error) {
      console.error('Error loading insights:', error);
      toast.error('Failed to load constellation insights');
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'rising': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'declining': return <TrendingDown className="w-4 h-4 text-red-500" />;
      default: return <Minus className="w-4 h-4 text-muted-foreground" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Unable to load insights</p>
          <Button onClick={loadInsights} className="mt-4">Retry</Button>
        </Card>
      </div>
    );
  }

  const themeChartData = insights.themes.map(t => ({
    name: t.name,
    frequency: t.frequency
  }));

  const skillStrengthData = insights.skillClusters.map(s => ({
    name: s.name,
    strength: s.strength
  }));

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/constellation')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                Constellation Insights
              </h1>
              <p className="text-muted-foreground">AI-powered pattern analysis of your journey</p>
            </div>
          </div>
          <Button onClick={loadInsights} variant="outline">
            <Sparkles className="w-4 h-4 mr-2" />
            Refresh Analysis
          </Button>
        </motion.div>

        {/* Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6 bg-gradient-to-br from-primary/10 to-purple-500/10 border-primary/20">
            <div className="flex items-start gap-4">
              <Brain className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-xl font-semibold mb-2">Key Insights</h2>
                <p className="text-foreground/90 leading-relaxed">{insights.summary}</p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Themes Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Target className="w-6 h-6 text-primary" />
            Emerging Themes
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Theme Frequency</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={themeChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--foreground))" />
                  <YAxis stroke="hsl(var(--foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="frequency" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <div className="space-y-3">
              {insights.themes.map((theme, idx) => (
                <Card key={idx} className="p-4 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{theme.name}</h3>
                      {getTrendIcon(theme.trend)}
                    </div>
                    <span className="text-sm text-muted-foreground">{theme.frequency} insights</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{theme.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {theme.relatedSources.map((source, i) => (
                      <span key={i} className="text-xs px-2 py-1 bg-secondary rounded-full">
                        {source}
                      </span>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Skill Clusters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          <h2 className="text-2xl font-bold">Skill Clusters</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Cluster Strength</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={skillStrengthData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => entry.name}
                    outerRadius={100}
                    fill="hsl(var(--primary))"
                    dataKey="strength"
                  >
                    {skillStrengthData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            <div className="space-y-3">
              {insights.skillClusters.map((cluster, idx) => (
                <Card key={idx} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{cluster.name}</h3>
                    <div className="flex items-center gap-1">
                      {[...Array(10)].map((_, i) => (
                        <div
                          key={i}
                          className={`w-2 h-4 rounded-sm ${
                            i < cluster.strength ? 'bg-primary' : 'bg-muted'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{cluster.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {cluster.skills.map((skill, i) => (
                      <span key={i} className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
                        {skill}
                      </span>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Patterns */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-4"
        >
          <h2 className="text-2xl font-bold">Behavioral Patterns</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.patterns.map((pattern, idx) => (
              <Card key={idx} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold">{pattern.type}</h3>
                  <span className="text-xs px-2 py-1 bg-accent text-accent-foreground rounded-full">
                    {pattern.frequency}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{pattern.description}</p>
                <p className="text-sm font-medium text-primary">{pattern.insight}</p>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Theme Evolution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-4"
        >
          <h2 className="text-2xl font-bold">Theme Evolution</h2>
          <Card className="p-6">
            <div className="space-y-6">
              {insights.evolution.map((evo, idx) => (
                <div key={idx} className="relative pl-8 pb-6 border-l-2 border-primary/30 last:pb-0">
                  <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-primary border-2 border-background" />
                  <div className="mb-2">
                    <h3 className="font-semibold text-lg">{evo.period}</h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {evo.dominantThemes.map((theme, i) => (
                        <span key={i} className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
                          {theme}
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{evo.insight}</p>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default ConstellationInsightsDashboard;