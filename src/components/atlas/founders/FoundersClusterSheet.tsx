import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles } from "lucide-react";
import type { FounderCluster } from "@/data/foundersMap";
import { DOMAIN_COLORS } from "@/hooks/useAtlas";

interface FoundersClusterSheetProps {
  cluster: FounderCluster | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const FoundersClusterSheet = ({
  cluster,
  open,
  onOpenChange,
}: FoundersClusterSheetProps) => {
  if (!cluster) return null;
  const colors = DOMAIN_COLORS[cluster.domain] || DOMAIN_COLORS.Person;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[85vh] sm:max-w-2xl sm:mx-auto rounded-t-2xl border-border/60 bg-card/95 backdrop-blur-xl"
      >
        <SheetHeader className="text-left">
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full"
              style={{
                backgroundColor: colors.bg,
                boxShadow: `0 0 10px ${colors.glow}`,
              }}
            />
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {cluster.domain}
            </span>
          </div>
          <SheetTitle className="text-2xl text-foreground">
            {cluster.name}
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(85vh-7rem)] mt-4 pr-2">
          <div className="space-y-4 pb-8">
            {cluster.dots.map((dot) => (
              <div
                key={dot.id}
                className="rounded-xl border border-border/50 bg-background/40 p-4 hover:bg-background/60 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <span
                    className="mt-1.5 w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor: colors.bg,
                      boxShadow: `0 0 8px ${colors.glow}`,
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-foreground">
                      {dot.title}
                    </h3>
                    {dot.insight && (
                      <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                        {dot.insight}
                      </p>
                    )}
                    {dot.miniDots && dot.miniDots.length > 0 && (
                      <div className="mt-3 space-y-2 border-l-2 border-primary/40 pl-3">
                        {dot.miniDots.map((m, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-2 text-xs text-foreground/80 italic"
                          >
                            <Sparkles className="w-3 h-3 mt-0.5 text-primary flex-shrink-0" />
                            <span>{m}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};