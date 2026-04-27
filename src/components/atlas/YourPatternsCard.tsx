import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, RefreshCw, ThumbsUp, ThumbsDown, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface PatternItem {
  pattern_title?: string;
  title?: string;
  pattern_description?: string;
  description?: string;
}

interface GeniusItem {
  title?: string;
  description?: string;
}

interface CreationItem {
  title?: string;
  first_step?: string;
  description?: string;
}

interface Snapshot {
  id: string;
  patterns: PatternItem[];
  emerging_genius: GeniusItem[];
  creation_ideas: CreationItem[];
  created_at: string;
  user_resonance: string | null;
}

interface YourPatternsCardProps {
  totalDots: number;
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export const YourPatternsCard = ({ totalDots }: YourPatternsCardProps) => {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [resonance, setResonance] = useState<string | null>(null);

  const loadLatest = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("atlas_analysis_snapshots" as any)
      .select("id, patterns, emerging_genius, creation_ideas, created_at, user_resonance")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) {
      const s = data as any;
      setSnapshot(s);
      setResonance(s.user_resonance ?? null);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadLatest();
  }, []);

  if (totalDots < 5) return null;

  if (loading) {
    return (
      <div className="mx-4 my-3 p-5 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span className="text-xs">Listening to your map…</span>
        </div>
      </div>
    );
  }

  if (!snapshot) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-4 my-3 p-5 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm"
      >
        <div className="flex items-center gap-2 mb-1.5">
          <Sparkles className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
            Your Patterns
          </span>
        </div>
        <p className="text-sm text-muted-foreground/90 leading-relaxed">
          Your map is growing. Once you have enough dots, patterns will begin to emerge.
        </p>
      </motion.div>
    );
  }

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const { error } = await supabase.functions.invoke("analyze-dot-connections", {
        body: { autoSave: true },
      });
      if (error) throw error;
      await loadLatest();
      toast({ title: "Patterns refreshed", description: "Your map has been re-read." });
    } catch (e: any) {
      toast({ title: "Couldn't refresh", description: e?.message || "Try again later.", variant: "destructive" });
    } finally {
      setRefreshing(false);
    }
  };

  const handleResonance = async (value: "high" | "low") => {
    const next = resonance === value ? null : value;
    setResonance(next);
    const { error } = await supabase
      .from("atlas_analysis_snapshots" as any)
      .update({ user_resonance: next } as any)
      .eq("id", snapshot.id);
    if (error) {
      setResonance(resonance);
      toast({ title: "Couldn't save", description: error.message, variant: "destructive" });
    }
  };

  const patterns = (snapshot.patterns || []).slice(0, 3);
  const genius = (snapshot.emerging_genius || [])[0];
  const ideas = (snapshot.creation_ideas || []).slice(0, 2);
  const ageMs = Date.now() - new Date(snapshot.created_at).getTime();
  const stale = ageMs > SEVEN_DAYS_MS;
  const lastUpdated = formatDistanceToNow(new Date(snapshot.created_at), { addSuffix: true });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mx-4 my-3 p-5 rounded-2xl border border-border/40 bg-card/70 backdrop-blur-sm relative overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-muted/40 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-foreground/70" />
          </div>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
            Your Patterns
          </span>
        </div>
        {stale && (
          <Button
            size="sm"
            variant="ghost"
            onClick={handleRefresh}
            disabled={refreshing}
            className="h-7 px-2 gap-1 text-[11px] text-muted-foreground hover:text-foreground"
          >
            {refreshing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            Refresh patterns
          </Button>
        )}
      </div>

      {/* Patterns */}
      {patterns.length > 0 && (
        <div className="space-y-2.5 mb-5">
          {patterns.map((p, i) => (
            <div key={i} className="pl-3 border-l border-border/40">
              <p className="text-sm font-semibold text-foreground leading-snug">
                {p.pattern_title || p.title || "Pattern"}
              </p>
              {(p.pattern_description || p.description) && (
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  {p.pattern_description || p.description}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Emerging Genius */}
      {genius && (
        <div className="mb-5">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground/80 mb-1.5">
            What your map is pointing toward
          </p>
          <div className="p-3 rounded-xl bg-background/40 border border-border/30">
            <p className="text-sm font-semibold text-foreground leading-snug">{genius.title}</p>
            {genius.description && (
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{genius.description}</p>
            )}
          </div>
        </div>
      )}

      {/* Creation Ideas */}
      {ideas.length > 0 && (
        <div className="mb-5">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground/80 mb-1.5">
            What you could build
          </p>
          <div className="space-y-2">
            {ideas.map((idea, i) => (
              <div key={i} className="p-3 rounded-xl bg-background/40 border border-border/30">
                <p className="text-sm font-semibold text-foreground leading-snug">{idea.title}</p>
                {idea.first_step && (
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    <span className="text-foreground/60">First step: </span>
                    {idea.first_step}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer: resonance + date */}
      <div className="flex items-center justify-between pt-3 border-t border-border/30">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleResonance("high")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] transition-colors ${
              resonance === "high"
                ? "bg-foreground/10 text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
            }`}
          >
            <ThumbsUp className="w-3 h-3" />
            This resonates
          </button>
          <button
            onClick={() => handleResonance("low")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] transition-colors ${
              resonance === "low"
                ? "bg-foreground/10 text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
            }`}
          >
            <ThumbsDown className="w-3 h-3" />
            Not quite right yet
          </button>
        </div>
        <span className="text-[10px] text-muted-foreground/70">Last updated {lastUpdated}</span>
      </div>
    </motion.div>
  );
};