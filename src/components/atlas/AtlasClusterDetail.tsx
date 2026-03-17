import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Compass } from "lucide-react";
import type { ClusterWithState, AtlasDot } from "@/hooks/useAtlas";
import { DOMAIN_COLORS, GROWTH_LEVEL_LABELS } from "@/hooks/useAtlas";
import { AtlasDotCard } from "./AtlasDotCard";
import { AtlasDotDetailModal } from "./AtlasDotDetailModal";

interface AtlasClusterDetailProps {
  cluster: ClusterWithState | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const GROWTH_COLORS: Record<string, string> = {
  dormant: "bg-muted text-muted-foreground",
  activated: "bg-primary/20 text-primary",
  growing: "bg-primary/30 text-primary",
  resonant: "bg-accent text-accent-foreground",
  mature: "bg-primary text-primary-foreground",
};

export const AtlasClusterDetail = ({ cluster, open, onOpenChange }: AtlasClusterDetailProps) => {
  const navigate = useNavigate();
  const [selectedDot, setSelectedDot] = useState<AtlasDot | null>(null);

  if (!cluster) return null;

  const domainName = cluster.meta_domain?.name || "Person";
  const colors = DOMAIN_COLORS[domainName] || DOMAIN_COLORS.Person;
  const growthLabel = GROWTH_LEVEL_LABELS[cluster.growthLevel];

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[70vh] rounded-t-2xl">
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

          <div className="mt-4 space-y-3 overflow-y-auto max-h-[calc(70vh-120px)] pb-6">
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
                  onClick={() => { onOpenChange(false); navigate(`/atlas/quest?cluster=${cluster.id}`); }}
                >
                  <Compass className="w-4 h-4" /> Explore
                </Button>
              </div>
            ) : (
              <>
                <p className="text-xs text-muted-foreground">
                  {cluster.dotCount} {cluster.dotCount === 1 ? "discovery" : "discoveries"}
                </p>
                {cluster.dots.map((dot) => (
                  <AtlasDotCard
                    key={dot.id}
                    dot={dot}
                    color={colors.bg}
                    onTap={() => setSelectedDot(dot)}
                  />
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 gap-2 text-muted-foreground"
                  onClick={() => { onOpenChange(false); navigate(`/atlas/quest?cluster=${cluster.id}`); }}
                >
                  <Compass className="w-4 h-4" /> Explore more
                </Button>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <AtlasDotDetailModal
        dot={selectedDot}
        clusterName={cluster.name}
        color={colors.bg}
        open={!!selectedDot}
        onOpenChange={(open) => !open && setSelectedDot(null)}
      />
    </>
  );
};
