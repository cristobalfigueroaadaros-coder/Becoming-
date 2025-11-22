import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Play, Pause, SkipBack, SkipForward, Gauge, Filter, BarChart3, TrendingUp, Network as NetworkIcon, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";

interface InsightDot {
  id: string;
  source_type: string;
  source_mentor: string | null;
  insight_text: string;
  core_theme: string;
  skill_tags: string[];
  emotional_tone: string | null;
  created_at: string;
  reviewed_at: string | null;
  user_reflection: string | null;
  connection_ids: string[];
}

interface DotConnection {
  id: string;
  dot_id_1: string;
  dot_id_2: string;
  connection_type: string;
  connection_insight: string;
  ai_generated: boolean;
}

interface ConstellationTimelineProps {
  dots: InsightDot[];
  connections: DotConnection[];
  onDotClick: (dot: InsightDot) => void;
  selectedDot: InsightDot | null;
  userPurpose?: string | null;
}

const sourceColors: Record<string, string> = {
  book: "hsl(220 80% 60%)",
  idea: "hsl(45 90% 60%)",
  insight: "hsl(270 75% 65%)",
  milestone: "hsl(140 75% 55%)",
  memory: "hsl(190 80% 60%)",
  emotion: "hsl(330 80% 65%)",
  council_meeting: "hsl(220 90% 60%)",
  mentor_chat: "hsl(140 70% 50%)",
  journal: "hsl(270 70% 60%)",
  ritual: "hsl(30 90% 60%)",
  shadow_work: "hsl(0 80% 60%)",
  constellation: "hsl(50 90% 60%)",
  quest: "hsl(320 80% 60%)",
  goal_achievement: "hsl(160 80% 55%)",
  shadow_integration: "hsl(340 70% 60%)",
  journal_breakthrough: "hsl(280 75% 65%)",
  domain_milestone: "hsl(200 85% 60%)",
  quest_completion: "hsl(300 80% 60%)",
  human_design_type: "hsl(240 80% 65%)",
  human_design_strategy: "hsl(200 80% 60%)",
  human_design_authority: "hsl(40 90% 60%)",
  human_design_profile: "hsl(320 75% 65%)",
  human_design_centers: "hsl(160 75% 55%)",
  human_design_gate: "hsl(270 80% 65%)",
};

const sourceLabels: Record<string, string> = {
  book: "📚 Book",
  idea: "💡 Idea",
  insight: "✨ Insight",
  milestone: "🎯 Milestone",
  memory: "🧠 Memory",
  emotion: "😌 Emotion",
  council_meeting: "Council",
  mentor_chat: "1:1 Chat",
  journal: "Journal",
  ritual: "Ritual",
  shadow_work: "Shadow",
  constellation: "Constellation",
  quest: "Quest",
  goal_achievement: "Goal Win",
  shadow_integration: "Integration",
  journal_breakthrough: "Breakthrough",
  domain_milestone: "Milestone",
  quest_completion: "Quest Win",
  human_design_type: "⭐ HD Type",
  human_design_strategy: "⚡ HD Strategy",
  human_design_authority: "🧭 HD Authority",
  human_design_profile: "👤 HD Profile",
  human_design_centers: "🔮 HD Centers",
  human_design_gate: "🚪 HD Gate",
};

// Emotional tone colors for timeline visualization
const emotionalToneColors: Record<string, string> = {
  breakthrough: "hsl(280 90% 65%)",
  transformative: "hsl(320 85% 60%)",
  profound: "hsl(240 80% 65%)",
  excited: "hsl(30 95% 55%)",
  inspired: "hsl(50 90% 60%)",
  accomplished: "hsl(140 80% 55%)",
  peaceful: "hsl(200 70% 65%)",
  reflective: "hsl(270 60% 60%)",
  curious: "hsl(180 70% 55%)",
  challenged: "hsl(0 75% 60%)",
  uncertain: "hsl(220 40% 55%)",
  grateful: "hsl(340 80% 65%)",
};

// Helper to get dot color prioritizing emotional tone
const getDotColor = (dot: InsightDot): string => {
  if (dot.emotional_tone && emotionalToneColors[dot.emotional_tone]) {
    return emotionalToneColors[dot.emotional_tone];
  }
  return sourceColors[dot.source_type] || "hsl(var(--muted))";
};

export const ConstellationTimeline = ({
  dots,
  connections,
  onDotClick,
  selectedDot,
  userPurpose,
}: ConstellationTimelineProps) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [dotPositions, setDotPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [filterSource, setFilterSource] = useState<string>("all");
  const [filterTheme, setFilterTheme] = useState<string>("all");
  const [showStats, setShowStats] = useState(false);

  // Apply filters
  const filteredDots = dots.filter((dot) => {
    const sourceMatch = filterSource === "all" || dot.source_type === filterSource;
    const themeMatch = filterTheme === "all" || dot.core_theme === filterTheme;
    return sourceMatch && themeMatch;
  });

  // Extract unique themes for filter
  const uniqueThemes = Array.from(new Set(dots.map((dot) => dot.core_theme))).sort();

  // Sort dots chronologically
  const sortedDots = [...filteredDots].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  // Get visible dots up to current index
  const visibleDots = sortedDots.slice(0, currentIndex + 1);
  const visibleDotIds = new Set(visibleDots.map((d) => d.id));
  const visibleConnections = connections.filter(
    (c) => visibleDotIds.has(c.dot_id_1) && visibleDotIds.has(c.dot_id_2)
  );

  // Update canvas dimensions
  useEffect(() => {
    const updateDimensions = () => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // Generate dot positions (spiral layout from center)
  useEffect(() => {
    if (sortedDots.length === 0) return;

    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;
    const positions: Record<string, { x: number; y: number }> = {};

    if (userPurpose) {
      // Purpose at center
      positions["purpose"] = { x: centerX, y: centerY };
    }

    sortedDots.forEach((dot, index) => {
      const angle = (index / sortedDots.length) * Math.PI * 2;
      const radius = 150 + (index % 3) * 80;
      positions[dot.id] = {
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
      };
    });

    setDotPositions(positions);
  }, [dimensions, sortedDots, userPurpose]);

  // Autoplay
  useEffect(() => {
    if (!isPlaying || currentIndex >= sortedDots.length - 1) {
      setIsPlaying(false);
      return;
    }

    const interval = setInterval(() => {
      setCurrentIndex((prev) => Math.min(prev + 1, sortedDots.length - 1));
    }, 1000 / playbackSpeed);

    return () => clearInterval(interval);
  }, [isPlaying, currentIndex, sortedDots.length, playbackSpeed]);

  const handlePlayPause = () => {
    if (currentIndex >= sortedDots.length - 1) {
      setCurrentIndex(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setIsPlaying(false);
  };

  // Reset timeline when filters change
  useEffect(() => {
    setCurrentIndex(0);
    setIsPlaying(false);
  }, [filterSource, filterTheme]);

  const handleSkipForward = () => {
    setCurrentIndex((prev) => Math.min(prev + 5, sortedDots.length - 1));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Calculate statistics
  const calculateStats = () => {
    if (sortedDots.length === 0) return null;

    // Dots per month
    const monthCounts: Record<string, number> = {};
    sortedDots.forEach((dot) => {
      const date = new Date(dot.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
    });

    const avgDotsPerMonth = Object.values(monthCounts).reduce((a, b) => a + b, 0) / Object.keys(monthCounts).length;

    // Most common themes
    const themeCounts: Record<string, number> = {};
    sortedDots.forEach((dot) => {
      themeCounts[dot.core_theme] = (themeCounts[dot.core_theme] || 0) + 1;
    });
    const topThemes = Object.entries(themeCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([theme, count]) => ({ theme, count, percentage: (count / sortedDots.length) * 100 }));

    // Connection density over time
    const visibleDotsUpToCurrent = sortedDots.slice(0, currentIndex + 1);
    const visibleDotIds = new Set(visibleDotsUpToCurrent.map((d) => d.id));
    const currentConnections = connections.filter(
      (c) => visibleDotIds.has(c.dot_id_1) && visibleDotIds.has(c.dot_id_2)
    );
    const connectionDensity = visibleDotsUpToCurrent.length > 1
      ? (currentConnections.length / ((visibleDotsUpToCurrent.length * (visibleDotsUpToCurrent.length - 1)) / 2)) * 100
      : 0;

    // Growth rate (dots in last 30 days vs previous 30 days)
    const now = new Date(sortedDots[currentIndex]?.created_at || new Date());
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    
    const recentDots = visibleDotsUpToCurrent.filter(
      (d) => new Date(d.created_at) >= thirtyDaysAgo && new Date(d.created_at) <= now
    ).length;
    const previousDots = visibleDotsUpToCurrent.filter(
      (d) => new Date(d.created_at) >= sixtyDaysAgo && new Date(d.created_at) < thirtyDaysAgo
    ).length;
    
    const growthRate = previousDots > 0 ? ((recentDots - previousDots) / previousDots) * 100 : 0;

    // Source distribution
    const sourceCounts: Record<string, number> = {};
    sortedDots.forEach((dot) => {
      const label = sourceLabels[dot.source_type] || dot.source_type;
      sourceCounts[label] = (sourceCounts[label] || 0) + 1;
    });
    const topSources = Object.entries(sourceCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([source, count]) => ({ source, count }));

    return {
      totalDots: sortedDots.length,
      currentDots: visibleDotsUpToCurrent.length,
      avgDotsPerMonth: avgDotsPerMonth.toFixed(1),
      topThemes,
      connectionDensity: connectionDensity.toFixed(1),
      totalConnections: currentConnections.length,
      growthRate: growthRate.toFixed(1),
      topSources,
      monthsActive: Object.keys(monthCounts).length,
    };
  };

  const stats = calculateStats();

  // Export functions
  const exportToCSV = () => {
    if (!stats) return;

    const csvRows: string[] = [];
    
    // Header
    csvRows.push("Constellation Timeline Statistics Report");
    csvRows.push(`Generated: ${new Date().toLocaleString()}`);
    csvRows.push("");

    // Overall metrics
    csvRows.push("Overall Metrics");
    csvRows.push("Metric,Value");
    csvRows.push(`Total Insights,${stats.currentDots}`);
    csvRows.push(`Average Dots per Month,${stats.avgDotsPerMonth}`);
    csvRows.push(`Months Active,${stats.monthsActive}`);
    csvRows.push(`30-Day Growth Rate,${stats.growthRate}%`);
    csvRows.push(`Total Connections,${stats.totalConnections}`);
    csvRows.push(`Connection Density,${stats.connectionDensity}%`);
    csvRows.push("");

    // Top themes
    csvRows.push("Top Themes");
    csvRows.push("Theme,Count,Percentage");
    stats.topThemes.forEach(({ theme, count, percentage }) => {
      csvRows.push(`"${theme}",${count},${percentage.toFixed(1)}%`);
    });
    csvRows.push("");

    // Top sources
    csvRows.push("Top Sources");
    csvRows.push("Source,Count");
    stats.topSources.forEach(({ source, count }) => {
      csvRows.push(`"${source}",${count}`);
    });
    csvRows.push("");

    // All insights
    csvRows.push("All Insights");
    csvRows.push("Date,Source,Theme,Insight");
    sortedDots.forEach((dot) => {
      const date = formatDate(dot.created_at);
      const source = sourceLabels[dot.source_type] || dot.source_type;
      const insight = dot.insight_text.replace(/"/g, '""'); // Escape quotes
      csvRows.push(`"${date}","${source}","${dot.core_theme}","${insight}"`);
    });

    // Create and download
    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `constellation-timeline-${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("CSV report downloaded successfully");
  };

  const exportToPDF = () => {
    if (!stats) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;

    // Title
    doc.setFontSize(20);
    doc.setTextColor(99, 102, 241); // Primary color
    doc.text("Constellation Timeline Report", pageWidth / 2, yPos, { align: "center" });
    
    yPos += 10;
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, yPos, { align: "center" });
    
    yPos += 15;

    // Overall Metrics Section
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text("Overall Metrics", 14, yPos);
    yPos += 8;

    autoTable(doc, {
      startY: yPos,
      head: [["Metric", "Value"]],
      body: [
        ["Total Insights", stats.currentDots.toString()],
        ["Average Dots per Month", stats.avgDotsPerMonth],
        ["Months Active", stats.monthsActive.toString()],
        ["30-Day Growth Rate", `${stats.growthRate}%`],
        ["Total Connections", stats.totalConnections.toString()],
        ["Connection Density", `${stats.connectionDensity}%`],
      ],
      theme: "grid",
      headStyles: { fillColor: [99, 102, 241] },
      margin: { left: 14 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;

    // Top Themes Section
    doc.setFontSize(14);
    doc.text("Top Themes", 14, yPos);
    yPos += 8;

    autoTable(doc, {
      startY: yPos,
      head: [["Theme", "Count", "Percentage"]],
      body: stats.topThemes.map(({ theme, count, percentage }) => [
        theme,
        count.toString(),
        `${percentage.toFixed(1)}%`,
      ]),
      theme: "grid",
      headStyles: { fillColor: [99, 102, 241] },
      margin: { left: 14 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;

    // Check if we need a new page
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    // Top Sources Section
    doc.setFontSize(14);
    doc.text("Top Sources", 14, yPos);
    yPos += 8;

    autoTable(doc, {
      startY: yPos,
      head: [["Source", "Count"]],
      body: stats.topSources.map(({ source, count }) => [source, count.toString()]),
      theme: "grid",
      headStyles: { fillColor: [99, 102, 241] },
      margin: { left: 14 },
    });

    // Add insights summary on new page
    doc.addPage();
    yPos = 20;
    
    doc.setFontSize(14);
    doc.text("Recent Insights Summary", 14, yPos);
    yPos += 8;

    const recentDots = sortedDots.slice(Math.max(0, sortedDots.length - 10));
    
    autoTable(doc, {
      startY: yPos,
      head: [["Date", "Source", "Theme", "Insight"]],
      body: recentDots.map((dot) => [
        formatDate(dot.created_at),
        sourceLabels[dot.source_type] || dot.source_type,
        dot.core_theme,
        dot.insight_text.substring(0, 60) + (dot.insight_text.length > 60 ? "..." : ""),
      ]),
      theme: "grid",
      headStyles: { fillColor: [99, 102, 241] },
      margin: { left: 14 },
      columnStyles: {
        3: { cellWidth: 80 },
      },
    });

    // Save PDF
    doc.save(`constellation-timeline-${new Date().toISOString().split("T")[0]}.pdf`);
    toast.success("PDF report downloaded successfully");
  };

  if (sortedDots.length === 0) {
    return (
      <Card className="w-full h-[600px] flex items-center justify-center">
        <CardContent>
          <p className="text-muted-foreground">No insights yet. Start your journey to see your constellation grow!</p>
        </CardContent>
      </Card>
    );
  }

  const currentDot = sortedDots[currentIndex];

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Source Type</label>
                <Select value={filterSource} onValueChange={setFilterSource}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    {Object.entries(sourceLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Core Theme</label>
                <Select value={filterTheme} onValueChange={setFilterTheme}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Themes</SelectItem>
                    {uniqueThemes.map((theme) => (
                      <SelectItem key={theme} value={theme}>
                        {theme}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {(filterSource !== "all" || filterTheme !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFilterSource("all");
                  setFilterTheme("all");
                }}
              >
                Clear Filters
              </Button>
            )}
            <Button
              variant={showStats ? "default" : "outline"}
              size="sm"
              onClick={() => setShowStats(!showStats)}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Stats
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Timeline Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Statistics Panel */}
        <AnimatePresence>
          {showStats && stats && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="lg:col-span-1"
            >
              <Card className="h-full">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" />
                      Growth Metrics
                    </h3>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Download className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={exportToCSV}>
                          <Download className="w-4 h-4 mr-2" />
                          Export as CSV
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={exportToPDF}>
                          <Download className="w-4 h-4 mr-2" />
                          Export as PDF
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Overall Stats */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5">
                      <div>
                        <p className="text-xs text-muted-foreground">Total Insights</p>
                        <p className="text-2xl font-bold text-primary">{stats.currentDots}</p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-primary opacity-50" />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground">Avg/Month</p>
                        <p className="text-lg font-semibold">{stats.avgDotsPerMonth}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground">Months Active</p>
                        <p className="text-lg font-semibold">{stats.monthsActive}</p>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-accent/10">
                      <p className="text-xs text-muted-foreground">30-Day Growth</p>
                      <p className={cn(
                        "text-lg font-semibold",
                        parseFloat(stats.growthRate) > 0 ? "text-green-600" : "text-orange-600"
                      )}>
                        {parseFloat(stats.growthRate) > 0 ? "+" : ""}{stats.growthRate}%
                      </p>
                    </div>
                  </div>

                  {/* Connections */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <NetworkIcon className="w-3 h-3" />
                      Connection Density
                    </h4>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-muted-foreground">Active Connections</p>
                        <p className="text-sm font-semibold">{stats.totalConnections}</p>
                      </div>
                      <div className="w-full bg-background rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(parseFloat(stats.connectionDensity), 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {stats.connectionDensity}% density
                      </p>
                    </div>
                  </div>

                  {/* Top Themes */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Top Themes</h4>
                    <div className="space-y-2">
                      {stats.topThemes.map((theme, idx) => (
                        <div key={theme.theme} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="truncate flex-1">{theme.theme}</span>
                            <span className="text-muted-foreground ml-2">{theme.count}</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-1.5">
                            <div
                              className="bg-primary h-1.5 rounded-full transition-all duration-500"
                              style={{ width: `${theme.percentage}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Top Sources */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Top Sources</h4>
                    <div className="space-y-1">
                      {stats.topSources.map((source) => (
                        <div key={source.source} className="flex items-center justify-between text-sm p-2 rounded bg-muted/30">
                          <span className="truncate">{source.source}</span>
                          <Badge variant="secondary" className="ml-2">{source.count}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Canvas */}
        <div className={cn("lg:col-span-3", showStats && "lg:col-span-2")}>
      <Card className="relative overflow-hidden">
        <div ref={canvasRef} className="relative w-full h-[600px] bg-gradient-to-br from-background via-primary/5 to-accent/10">
          <svg className="absolute inset-0 w-full h-full">
            <defs>
              <filter id="timeline-glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <radialGradient id="timeline-dot-gradient">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.8" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0.3" />
              </radialGradient>
            </defs>

            {/* Purpose Node */}
            {userPurpose && dotPositions["purpose"] && (
              <g>
                <AnimatePresence>
                  <motion.circle
                    initial={{ r: 0, opacity: 0 }}
                    animate={{ r: 40, opacity: 0.2 }}
                    cx={dotPositions["purpose"].x}
                    cy={dotPositions["purpose"].y}
                    fill="hsl(var(--primary))"
                    className="animate-pulse"
                  />
                </AnimatePresence>
                <circle
                  cx={dotPositions["purpose"].x}
                  cy={dotPositions["purpose"].y}
                  r={30}
                  fill="hsl(var(--primary))"
                  filter="url(#timeline-glow)"
                />
                <text
                  x={dotPositions["purpose"].x}
                  y={dotPositions["purpose"].y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-2xl"
                >
                  ⭐
                </text>
              </g>
            )}

            {/* Connections */}
            {visibleConnections.map((connection) => {
              const pos1 = dotPositions[connection.dot_id_1];
              const pos2 = dotPositions[connection.dot_id_2];
              if (!pos1 || !pos2) return null;

              return (
                <motion.line
                  key={connection.id}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.3 }}
                  transition={{ duration: 0.5 }}
                  x1={pos1.x}
                  y1={pos1.y}
                  x2={pos2.x}
                  y2={pos2.y}
                  stroke="hsl(var(--primary))"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
              );
            })}

            {/* Dots */}
            {visibleDots.map((dot, index) => {
              const pos = dotPositions[dot.id];
              if (!pos) return null;

              const connectionCount = connections.filter(
                (c) => c.dot_id_1 === dot.id || c.dot_id_2 === dot.id
              ).length;
              const dotSize = 6 + connectionCount * 2;
              const isSelected = selectedDot?.id === dot.id;
              const isCurrent = index === currentIndex;

              return (
                <motion.g
                  key={dot.id}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  onClick={() => onDotClick(dot)}
                  style={{ cursor: "pointer" }}
                >
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={dotSize + (isSelected ? 8 : 0) + (isCurrent ? 6 : 0)}
                    fill={getDotColor(dot)}
                    fillOpacity={isCurrent ? 1 : 0.8}
                    filter="url(#timeline-glow)"
                    className={cn(
                      "transition-all duration-200",
                      isCurrent && "animate-pulse"
                    )}
                  />
                  {isSelected && (
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={dotSize + 12}
                      fill="none"
                      stroke="hsl(var(--primary))"
                      strokeWidth="2"
                    />
                  )}
                </motion.g>
              );
            })}
          </svg>

          {/* Current Dot Info Overlay */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentDot.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-4 left-4 right-4"
            >
              <Card className="bg-background/95 backdrop-blur-sm border-primary/20">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Badge className="shrink-0" style={{ backgroundColor: getDotColor(currentDot) }}>
                      {sourceLabels[currentDot.source_type]}
                    </Badge>
                    {currentDot.emotional_tone && (
                      <Badge variant="outline" className="shrink-0 border-pink-500/50">
                        💫 {currentDot.emotional_tone}
                      </Badge>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground mb-1">{currentDot.insight_text}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                        <span>{formatDate(currentDot.created_at)}</span>
                        <span>•</span>
                        <Badge variant="outline" className="text-xs">
                          {currentDot.core_theme}
                        </Badge>
                        <span>•</span>
                        <span>Dot {currentIndex + 1} of {sortedDots.length}</span>
                        {(filterSource !== "all" || filterTheme !== "all") && (
                          <>
                            <span>•</span>
                            <span className="text-primary">Filtered</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        </div>
      </Card>
        </div>
      </div>

      {/* Playback Controls */}
      <Card>
        <CardContent className="p-4 space-y-4">
          {/* Timeline Scrubber */}
          <div className="space-y-2">
            <Slider
              value={[currentIndex]}
              onValueChange={([value]) => setCurrentIndex(value)}
              max={sortedDots.length - 1}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{sortedDots[0] ? formatDate(sortedDots[0].created_at) : ""}</span>
              <span>{sortedDots[sortedDots.length - 1] ? formatDate(sortedDots[sortedDots.length - 1].created_at) : ""}</span>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-center gap-2">
            <Button variant="outline" size="icon" onClick={handleReset}>
              <SkipBack className="w-4 h-4" />
            </Button>
            <Button variant="default" size="icon" onClick={handlePlayPause}>
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            <Button variant="outline" size="icon" onClick={handleSkipForward}>
              <SkipForward className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-2 ml-4">
              <Gauge className="w-4 h-4 text-muted-foreground" />
              <div className="flex gap-1">
                {[0.5, 1, 2, 4].map((speed) => (
                  <Button
                    key={speed}
                    variant={playbackSpeed === speed ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPlaybackSpeed(speed)}
                    className="text-xs px-2"
                  >
                    {speed}x
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
