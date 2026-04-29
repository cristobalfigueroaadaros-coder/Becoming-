import { useState } from "react";
import { format } from "date-fns";
import { Sparkles, Shield, Star, GitBranch, Crown } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import type { AtlasDot } from "@/hooks/useAtlas";
import { getDotColor, DOT_TYPE_COLORS } from "@/hooks/useAtlas";
import { SIGNAL_CATALOG } from "@/data/atlasSignals";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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

  // Fetch evolution history
  const { data: evolutions } = useQuery({
    queryKey: ["atlas-dot-evolutions", dot.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("atlas_dot_evolutions")
        .select("*")
        .eq("dot_id", dot.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  // Fetch connections
  const { data: connections } = useQuery({
    queryKey: ["atlas-dot-connections", dot.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("atlas_connections")
        .select("*, dot_a:dot_id_a(title), dot_b:dot_id_b(title)")
        .or(`dot_id_a.eq.${dot.id},dot_id_b.eq.${dot.id}`);
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: dotColor }} />
            <DialogTitle className="text-base">{(dot as any).original_title || dot.title}</DialogTitle>
          </div>
          {(dot as any).original_title && dot.title !== (dot as any).original_title && (
            <p className="text-xs text-muted-foreground/70 italic mt-1">Evolved to: {dot.title}</p>
          )}
          {clusterName && (
            <DialogDescription className="text-xs">From: {clusterName}</DialogDescription>
          )}
        </DialogHeader>

        {/* Category badge */}
        <div className="flex items-center gap-2 flex-wrap">
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
          {(dot as any).is_gold_moment && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ backgroundColor: "hsl(40 80% 55% / 0.2)", color: "hsl(40 80% 55%)" }}>
              <Crown className="w-2.5 h-2.5" /> Gold Moment
            </div>
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

        {/* Evolution history */}
        {evolutions && evolutions.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1">
              <GitBranch className="w-3 h-3" /> Evolution history
            </p>
            {evolutions.map((evo: any) => (
              <div key={evo.id} className="text-[11px] text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                <span className="text-muted-foreground/70">{evo.previous_title}</span>
                <span className="mx-1.5">→</span>
                <span className="text-foreground font-medium">{evo.new_title}</span>
                <span className="ml-2 text-[10px] text-muted-foreground/60">({evo.evolution_type})</span>
              </div>
            ))}
          </div>
        )}

        {/* Connections */}
        {connections && connections.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Connected to</p>
            {connections.map((conn: any) => {
              const otherTitle = conn.dot_id_a === dot.id
                ? (conn.dot_b as any)?.title
                : (conn.dot_a as any)?.title;
              return (
                <div key={conn.id} className="flex items-center gap-2 text-[11px]">
                  {conn.is_gold_moment && <Crown className="w-3 h-3" style={{ color: "hsl(40 80% 55%)" }} />}
                  <span className="text-muted-foreground">{otherTitle || "Unknown"}</span>
                  <span className="text-[10px] text-muted-foreground/50">({conn.connection_type})</span>
                </div>
              );
            })}
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
