import { useState } from "react";
import { ArrowLeft, ChevronDown, Plus, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AtlasDot } from "@/hooks/useAtlas";
import { getDotColor } from "@/hooks/useAtlas";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";

interface AtlasMiniDot {
  id: string;
  content: string;
  origin: string;
  created_at: string | null;
}

interface AtlasDotViewProps {
  dot: AtlasDot;
  clusterName: string;
  clusterSlug: string;
  onBack: () => void;
  onGoDeeper: () => void;
}

export const AtlasDotView = ({ dot, clusterName, clusterSlug, onBack, onGoDeeper }: AtlasDotViewProps) => {
  const [showInsightInput, setShowInsightInput] = useState(false);
  const [insightText, setInsightText] = useState("");
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();
  const dotColor = getDotColor(dot);

  const { data: miniDots = [] } = useQuery({
    queryKey: ["atlas-mini-dots", dot.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("atlas_mini_dots")
        .select("*")
        .eq("parent_dot_id", dot.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as AtlasMiniDot[];
    },
  });

  const handleAddInsight = async () => {
    if (!insightText.trim()) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase.from("atlas_mini_dots").insert({
        user_id: user.id,
        parent_dot_id: dot.id,
        content: insightText.trim(),
        origin: "user",
        cluster_slug: clusterSlug,
      });
      if (error) throw error;
      setInsightText("");
      setShowInsightInput(false);
      queryClient.invalidateQueries({ queryKey: ["atlas-mini-dots", dot.id] });
      queryClient.invalidateQueries({ queryKey: ["atlas-mini-dot-counts"] });
      toast.success("Insight added");
    } catch (e) {
      toast.error("Failed to save insight");
    } finally {
      setSaving(false);
    }
  };

  const displayTitle = (dot as any).original_title || dot.title;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{clusterName}</p>
          <h3 className="text-base font-semibold text-foreground truncate">{displayTitle}</h3>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-6">
        {/* Dot color indicator + description */}
        <div className="flex items-start gap-3">
          <span className="mt-1 w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: dotColor }} />
          <div>
            {dot.short_description && (
              <p className="text-sm text-muted-foreground">{dot.short_description}</p>
            )}
            {dot.dot_category && dot.dot_category !== "strength" && (
              <span
                className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: `${dotColor}20`, color: dotColor }}
              >
                {dot.dot_category === "shadow" ? "Shadow" : "Life Imprint"}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 flex-1" onClick={onGoDeeper}>
            <ChevronDown className="w-3.5 h-3.5" /> Go deeper
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 flex-1"
            onClick={() => setShowInsightInput(!showInsightInput)}
          >
            <Plus className="w-3.5 h-3.5" /> Add insight
          </Button>
        </div>

        {/* Inline insight input */}
        {showInsightInput && (
          <div className="flex gap-2">
            <Input
              placeholder="Your insight..."
              value={insightText}
              onChange={(e) => setInsightText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddInsight()}
              className="text-sm"
              autoFocus
            />
            <Button size="icon" variant="default" onClick={handleAddInsight} disabled={saving || !insightText.trim()}>
              <Send className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}

        {/* Mini-dots */}
        {miniDots.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
              Deeper insights · {miniDots.length}
            </p>
            {miniDots.map((md) => (
              <div key={md.id} className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/40 border border-border/30">
                <span className="mt-1 w-1.5 h-1.5 rounded-full shrink-0 bg-primary/50" />
                <div className="min-w-0">
                  <p className="text-sm text-foreground">{md.content}</p>
                  {md.created_at && (
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                      {format(new Date(md.created_at), "MMM d, yyyy")}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Date */}
        {dot.created_at && (
          <p className="text-xs text-muted-foreground/60">
            Discovered {format(new Date(dot.created_at), "MMMM d, yyyy")}
          </p>
        )}
      </div>
    </div>
  );
};
