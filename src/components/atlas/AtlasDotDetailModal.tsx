import { format } from "date-fns";
import { Sparkles, Shield, Star } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import type { AtlasDot } from "@/hooks/useAtlas";
import { getDotColor, DOT_TYPE_COLORS } from "@/hooks/useAtlas";
import { SIGNAL_CATALOG } from "@/data/atlasSignals";

interface AtlasDotDetailModalProps {
  dot: AtlasDot | null;
  clusterName?: string;
  color: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CATEGORY_META: Record<string, { icon: typeof Sparkles; label: string; explanation: string }> = {
  strength: { icon: Sparkles, label: "Strength", explanation: "This discovery represents a natural ability, motivation, or behavioral tendency." },
  shadow: { icon: Shield, label: "Shadow", explanation: "This discovery represents a protective pattern or emotional barrier from past experiences." },
  life_imprint: { icon: Star, label: "Life Imprint", explanation: "This discovery represents an experience that shaped who you are." },
};

export const AtlasDotDetailModal = ({ dot, clusterName, open, onOpenChange }: AtlasDotDetailModalProps) => {
  if (!dot) return null;

  const dotColor = getDotColor(dot);
  const category = dot.dot_category || "strength";
  const meta = CATEGORY_META[category] || CATEGORY_META.strength;
  const Icon = meta.icon;

  const signalSources: string[] = Array.isArray(dot.signal_sources) ? dot.signal_sources : [];
  const uniqueSignals = [...new Set(signalSources)];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: dotColor }} />
            <DialogTitle className="text-base">{dot.title}</DialogTitle>
          </div>
          {clusterName && (
            <DialogDescription className="text-xs">From: {clusterName}</DialogDescription>
          )}
        </DialogHeader>

        {/* Category badge */}
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
            style={{ backgroundColor: `${dotColor}20`, color: dotColor }}
          >
            <Icon className="w-3 h-3" />
            {meta.label}
          </div>
          {dot.confidence_score && (
            <span className="text-[10px] text-muted-foreground">
              {Math.round(dot.confidence_score * 100)}% confidence
            </span>
          )}
        </div>

        {dot.short_description && (
          <p className="text-sm text-muted-foreground">{dot.short_description}</p>
        )}

        <p className="text-xs text-muted-foreground/80 italic">{meta.explanation}</p>

        {/* Signal sources */}
        {uniqueSignals.length > 0 && (
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Detected signals</p>
            <div className="flex flex-wrap gap-1">
              {uniqueSignals.slice(0, 8).map(sig => {
                const def = SIGNAL_CATALOG.find(s => s.name === sig);
                return (
                  <span key={sig} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {def?.label || sig}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {dot.created_at && (
          <p className="text-xs text-muted-foreground/70">
            Discovered {format(new Date(dot.created_at), "MMMM d, yyyy")}
          </p>
        )}

        {dot.dot_type && (
          <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
            {dot.dot_type === "pattern_discovery" ? "Cross-quest pattern" : "Quest discovery"}
          </span>
        )}
      </DialogContent>
    </Dialog>
  );
};
