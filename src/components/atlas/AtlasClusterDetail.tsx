import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Compass, ArrowLeft, Plus, Send } from "lucide-react";
import type { ClusterWithState, AtlasDot } from "@/hooks/useAtlas";
import { DOMAIN_COLORS, GROWTH_LEVEL_LABELS } from "@/hooks/useAtlas";
import { AtlasDotCard } from "./AtlasDotCard";
import { AtlasDotView } from "./AtlasDotView";
import { AtlasDotDeepLayer } from "./AtlasDotDeepLayer";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface AtlasClusterDetailProps {
  cluster: ClusterWithState | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ZoomLevel = "cluster" | "dot" | "deep";

const GROWTH_COLORS: Record<string, string> = {
  dormant: "bg-muted text-muted-foreground",
  activated: "bg-primary/20 text-primary",
  growing: "bg-primary/30 text-primary",
  resonant: "bg-accent text-accent-foreground",
  mature: "bg-primary text-primary-foreground",
};

export const AtlasClusterDetail = ({ cluster, open, onOpenChange }: AtlasClusterDetailProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>("cluster");
  const [selectedDot, setSelectedDot] = useState<AtlasDot | null>(null);
  const [showAddDot, setShowAddDot] = useState(false);
  const [newDotTitle, setNewDotTitle] = useState("");
  const [savingDot, setSavingDot] = useState(false);

  // Fetch mini-dot counts for dots in this cluster
  const dotIds = cluster?.dots.map(d => d.id) || [];
  const { data: miniDotCounts = {} } = useQuery({
    queryKey: ["atlas-mini-dot-counts-cluster", cluster?.id],
    queryFn: async () => {
      if (dotIds.length === 0) return {};
      const { data, error } = await supabase
        .from("atlas_mini_dots")
        .select("parent_dot_id")
        .in("parent_dot_id", dotIds);
      if (error) throw error;
      const counts: Record<string, number> = {};
      (data || []).forEach((row: any) => {
        counts[row.parent_dot_id] = (counts[row.parent_dot_id] || 0) + 1;
      });
      return counts;
    },
    enabled: !!cluster && dotIds.length > 0,
  });

  if (!cluster) return null;

  const domainName = cluster.meta_domain?.name || "Person";
  const colors = DOMAIN_COLORS[domainName] || DOMAIN_COLORS.Person;
  const growthLabel = GROWTH_LEVEL_LABELS[cluster.growthLevel];

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setZoomLevel("cluster");
      setSelectedDot(null);
      setShowAddDot(false);
      setNewDotTitle("");
    }
    onOpenChange(open);
  };

  const handleDotTap = (dot: AtlasDot) => {
    setSelectedDot(dot);
    setZoomLevel("dot");
  };

  const handleBackToCluster = () => {
    setZoomLevel("cluster");
    setSelectedDot(null);
  };

  const handleGoDeeper = () => {
    setZoomLevel("deep");
  };

  const handleBackToDot = () => {
    setZoomLevel("dot");
  };

  const handleAddUserDot = async () => {
    if (!newDotTitle.trim()) return;
    setSavingDot(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase.from("atlas_dots").insert({
        user_id: user.id,
        cluster_id: cluster.id,
        title: newDotTitle.trim(),
        original_title: newDotTitle.trim(),
        dot_category: "strength",
        source_system: "user_created",
        origin: "user",
      } as any);
      if (error) throw error;
      setNewDotTitle("");
      setShowAddDot(false);
      queryClient.invalidateQueries({ queryKey: ["atlas-dots"] });
      toast.success("Dot added");
    } catch (e) {
      toast.error("Failed to add dot");
    } finally {
      setSavingDot(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="h-[80vh] rounded-t-2xl">
        {/* Level 2: Cluster View */}
        {zoomLevel === "cluster" && (
          <>
            <SheetHeader className="text-left">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: colors.bg }} />
                <SheetTitle>{cluster.name}</SheetTitle>
                <Badge variant="outline" className={`text-[10px] ${GROWTH_COLORS[cluster.growthLevel]}`}>
                  {growthLabel}
                </Badge>
              </div>
              <SheetDescription>{cluster.description}</SheetDescription>
            </SheetHeader>

            <div className="mt-4 space-y-3 overflow-y-auto max-h-[calc(80vh-140px)] pb-6">
              {/* Add dot button / form */}
              {!showAddDot ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2 border-dashed"
                  onClick={() => setShowAddDot(true)}
                >
                  <Plus className="w-3.5 h-3.5" /> Add your own dot
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Input
                    placeholder="Your discovery..."
                    value={newDotTitle}
                    onChange={(e) => setNewDotTitle(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddUserDot()}
                    className="text-sm"
                    autoFocus
                  />
                  <Button size="icon" onClick={handleAddUserDot} disabled={savingDot || !newDotTitle.trim()}>
                    <Send className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => { setShowAddDot(false); setNewDotTitle(""); }}>
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </Button>
                </div>
              )}

              {cluster.dots.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Sparkles className="w-8 h-8 text-muted-foreground/40 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    This area will grow as you explore yourself.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 gap-2"
                    onClick={() => { handleOpenChange(false); navigate(`/atlas/quest?cluster=${cluster.id}`); }}
                  >
                    <Compass className="w-4 h-4" /> Explore
                  </Button>
                </div>
              ) : (
                <>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                    Your Signals · {cluster.dotCount} {cluster.dotCount === 1 ? "discovery" : "discoveries"}
                  </p>
                  {cluster.dots.map((dot) => (
                    <AtlasDotCard
                      key={dot.id}
                      dot={dot}
                      color={colors.bg}
                      onTap={() => handleDotTap(dot)}
                      miniDotCount={miniDotCounts[dot.id] || 0}
                    />
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 gap-2 text-muted-foreground"
                    onClick={() => { handleOpenChange(false); navigate(`/atlas/quest?cluster=${cluster.id}`); }}
                  >
                    <Compass className="w-4 h-4" /> Explore more
                  </Button>
                </>
              )}
            </div>
          </>
        )}

        {/* Level 3: Dot View */}
        {zoomLevel === "dot" && selectedDot && (
          <AtlasDotView
            dot={selectedDot}
            clusterName={cluster.name}
            clusterSlug={cluster.slug}
            onBack={handleBackToCluster}
            onGoDeeper={handleGoDeeper}
          />
        )}

        {/* Level 4: Deep Layer */}
        {zoomLevel === "deep" && selectedDot && (
          <AtlasDotDeepLayer
            dot={selectedDot}
            clusterSlug={cluster.slug}
            clusterName={cluster.name}
            onBack={handleBackToDot}
          />
        )}
      </SheetContent>
    </Sheet>
  );
};
