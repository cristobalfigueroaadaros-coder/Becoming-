import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Sparkles, Compass } from "lucide-react";
import type { ClusterWithState, AtlasDot } from "@/hooks/useAtlas";
import { DOMAIN_COLORS } from "@/hooks/useAtlas";
import { AtlasDotCard } from "./AtlasDotCard";
import { AtlasDotDetailModal } from "./AtlasDotDetailModal";

interface AtlasClusterDetailProps {
  cluster: ClusterWithState | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AtlasClusterDetail = ({ cluster, open, onOpenChange }: AtlasClusterDetailProps) => {
  const navigate = useNavigate();
  const [selectedDot, setSelectedDot] = useState<AtlasDot | null>(null);

  if (!cluster) return null;

  const domainName = cluster.meta_domain?.name || "Person";
  const colors = DOMAIN_COLORS[domainName] || DOMAIN_COLORS.Person;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[70vh] rounded-t-2xl">
          <SheetHeader className="text-left">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: colors.bg }} />
              <SheetTitle>{cluster.name}</SheetTitle>
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
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Future quests will help you discover insights here.
                </p>
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
