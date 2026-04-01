import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Compass, Sparkles, Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAtlas, ClusterWithState, DOMAIN_COLORS, getCurrentPhase, getNextPhaseThreshold } from "@/hooks/useAtlas";
import { AtlasClusterNode, AtlasClusterDetail } from "@/components/atlas";
import { AtlasOnboardingOverlay } from "@/components/atlas/AtlasOnboardingOverlay";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
// Organic scatter positions for known clusters (percentage-based)
// Slug-based positions for known clusters
const CLUSTER_POSITION_MAP: Record<string, { x: number; y: number }> = {
  "life-events": { x: 18, y: 10 },
  "passions": { x: 55, y: 6 },
  "values": { x: 82, y: 12 },
  "natural-talents": { x: 10, y: 28 },
  "childhood-signals": { x: 42, y: 24 },
  "skills": { x: 75, y: 26 },
  "aha-moments": { x: 25, y: 44 },
  "experiments": { x: 65, y: 44 },
  "vision-for-a-better-world": { x: 88, y: 44 },
  "ideal-life": { x: 15, y: 62 },
  "personal-frustrations": { x: 42, y: 64 },
  "inspirations": { x: 80, y: 64 },
  "external-reflections": { x: 35, y: 80 },
  "golden-moments": { x: 50, y: 22 },
  "who-i-serve": { x: 28, y: 90 },
  "how-i-create-impact": { x: 68, y: 88 },
};

// Dynamic positions for project clusters (appear at bottom)
const PROJECT_CLUSTER_POSITIONS = [
  { x: 50, y: 95 },
  { x: 30, y: 98 },
  { x: 70, y: 98 },
  { x: 15, y: 95 },
  { x: 85, y: 95 },
];

const AtlasPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { clusters, domains, totalDots, isLoading, threadUnlockReady, miniDotCounts } = useAtlas();
  const [selectedCluster, setSelectedCluster] = useState<ClusterWithState | null>(null);
  const prevUnlockedRef = useRef<Set<string>>(new Set());
  const highlightSlug = searchParams.get("highlight");
  const [highlightedSlug, setHighlightedSlug] = useState<string | null>(null);
  const [showUnlockCard, setShowUnlockCard] = useState(false);
  const [intakeCompleted, setIntakeCompleted] = useState<boolean | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Check profile flags on mount
  useEffect(() => {
    const checkFlags = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("console_intake_completed, atlas_onboarding_completed" as any)
        .eq("id", user.id)
        .single();
      const p = profile as any;
      setIntakeCompleted(!!p?.console_intake_completed);
      if (!p?.atlas_onboarding_completed) {
        setShowOnboarding(true);
      }
    };
    checkFlags();
  }, []);

  // Show unlock card when conditions met
  useEffect(() => {
    if (threadUnlockReady && intakeCompleted === false) {
      setShowUnlockCard(true);
    }
  }, [threadUnlockReady, intakeCompleted]);

  // Handle highlight param
  useEffect(() => {
    if (highlightSlug) {
      setHighlightedSlug(highlightSlug);
      setSearchParams({}, { replace: true });
      const timer = setTimeout(() => setHighlightedSlug(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [highlightSlug, setSearchParams]);

  // Detect newly unlocked clusters
  useEffect(() => {
    if (isLoading || clusters.length === 0) return;
    const currentUnlocked = new Set(clusters.filter(c => c.computedState !== "locked").map(c => c.id));
    if (prevUnlockedRef.current.size > 0) {
      currentUnlocked.forEach(id => {
        if (!prevUnlockedRef.current.has(id)) {
          const cluster = clusters.find(c => c.id === id);
          if (cluster) {
            toast({ title: "New area unlocked!", description: cluster.name });
          }
        }
      });
    }
    prevUnlockedRef.current = currentUnlocked;
  }, [clusters, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Compass className="w-8 h-8 text-primary" />
        </motion.div>
      </div>
    );
  }

  const currentPhase = getCurrentPhase(totalDots);
  const nextThreshold = getNextPhaseThreshold(totalDots);
  const unlockedCount = clusters.filter(c => c.computedState !== "locked").length;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Radial gradient background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 50% 40%, hsl(var(--primary) / 0.06) 0%, transparent 70%)",
        }}
      />

      {/* Unlock notification card */}
      {showUnlockCard && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-20 mx-4 mt-4 mb-2 p-4 rounded-2xl border border-primary/20 bg-primary/5"
        >
          <p className="text-sm font-medium text-foreground">Hey, I've been looking at what you've been sharing...</p>
          <p className="text-xs text-muted-foreground mt-1">I'm starting to see something interesting.</p>
          <p className="text-[10px] text-muted-foreground mt-2">The more you explore, the clearer this becomes.</p>
          <div className="flex gap-2 mt-3">
            <Button size="sm" className="gap-1.5" onClick={() => navigate("/console")}>
              Start Your Journey <ArrowRight className="w-3 h-3" />
            </Button>
            <Button size="sm" variant="outline" onClick={() => { setShowUnlockCard(false); navigate("/atlas/quest"); }}>
              New Quest
            </Button>
          </div>
        </motion.div>
      )}

      {/* Header */}
      <div className="relative z-10 px-5 pt-6 pb-2">
        <div className="flex items-center gap-2">
          <Compass className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-bold text-foreground">Atlas</h1>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {totalDots} {totalDots === 1 ? "discovery" : "discoveries"} · {unlockedCount} areas unlocked
        </p>

        {/* Unlock progress hint */}
        {nextThreshold && (
          <div className="flex items-center gap-2 mt-2 px-3 py-1.5 rounded-full bg-muted/50 w-fit">
            <Lock className="w-3 h-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">
              {nextThreshold - totalDots} more {nextThreshold - totalDots === 1 ? "discovery" : "discoveries"} to unlock new areas
            </span>
          </div>
        )}

        {/* Domain legend */}
        <div className="flex flex-wrap gap-3 mt-3">
          {domains.map((d) => (
            <div key={d.id} className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: DOMAIN_COLORS[d.name]?.bg || "hsl(var(--muted-foreground))" }}
              />
              <span className="text-[10px] text-muted-foreground">{d.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Cluster map */}
      <div className="relative z-10 w-full" style={{ height: "calc(100vh - 220px)" }}>
        {clusters.map((cluster, i) => {
          let pos: { x: number; y: number };
          if (cluster.cluster_category === "project") {
            // Project clusters get dynamic positions
            const projectIndex = clusters.filter((c, ci) => ci < i && c.cluster_category === "project").length;
            pos = PROJECT_CLUSTER_POSITIONS[projectIndex % PROJECT_CLUSTER_POSITIONS.length];
          } else {
            pos = CLUSTER_POSITION_MAP[cluster.slug] || { x: 50, y: 50 };
          }
          return (
            <div
              key={cluster.id}
              className="absolute"
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              <AtlasClusterNode
                cluster={cluster}
                index={i}
                onTap={() => setSelectedCluster(cluster)}
                isHighlighted={highlightedSlug === cluster.slug}
              />
            </div>
          );
        })}

        {/* Subtle connection lines between same-domain clusters */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
          {domains.map((domain) => {
            const domainClusters = clusters
              .map((c) => ({ ...c, pos: CLUSTER_POSITION_MAP[c.slug] || { x: 50, y: 50 } }))
              .filter((c) => c.meta_domain_id === domain.id && c.computedState !== "locked");
            const color = DOMAIN_COLORS[domain.name]?.glow || "transparent";
            const lines: JSX.Element[] = [];
            for (let i = 0; i < domainClusters.length - 1; i++) {
              const a = domainClusters[i].pos;
              const b = domainClusters[i + 1].pos;
              lines.push(
                <line
                  key={`${domain.id}-${i}`}
                  x1={`${a.x}%`} y1={`${a.y}%`}
                  x2={`${b.x}%`} y2={`${b.y}%`}
                  stroke={color}
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
              );
            }
            return lines;
          })}
        </svg>
      </div>

      {/* Start Quest floating button */}
      <div className="fixed bottom-20 right-4 z-20">
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <Button
            onClick={() => navigate("/atlas/quest")}
            className="rounded-full gap-2 shadow-lg"
            size="lg"
          >
            <Sparkles className="w-4 h-4" />
            Start Quest
          </Button>
        </motion.div>
      </div>

      {/* Cluster detail sheet */}
      <AtlasClusterDetail
        cluster={selectedCluster}
        open={!!selectedCluster}
        onOpenChange={(open) => !open && setSelectedCluster(null)}
      />

      {/* Onboarding overlay */}
      <AnimatePresence>
        {showOnboarding && (
          <AtlasOnboardingOverlay
            onComplete={async () => {
              setShowOnboarding(false);
              const { data: { user } } = await supabase.auth.getUser();
              if (user) {
                await supabase
                  .from("profiles")
                  .update({ atlas_onboarding_completed: true } as any)
                  .eq("id", user.id);
              }
              navigate("/atlas/quest");
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AtlasPage;
