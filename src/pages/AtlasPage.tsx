import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Compass, Sparkles, Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAtlas, ClusterWithState, DOMAIN_COLORS, getCurrentPhase, getNextPhaseThreshold } from "@/hooks/useAtlas";
import { AtlasClusterNode, AtlasClusterDetail } from "@/components/atlas";
import { AtlasOnboardingOverlay } from "@/components/atlas/AtlasOnboardingOverlay";
import { ThinkOutOfBoxCard } from "@/components/atlas/ThinkOutOfBoxCard";
import { useOpportunityDetection } from "@/hooks/useOpportunityDetection";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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

const PROJECT_CLUSTER_POSITIONS = [
  { x: 50, y: 95 },
  { x: 30, y: 98 },
  { x: 70, y: 98 },
  { x: 15, y: 95 },
  { x: 85, y: 95 },
];

// Generate cross-cluster connections (not just same-domain)
function generateConnections(clusters: ClusterWithState[]) {
  const unlockedClusters = clusters.filter(c => c.computedState !== "locked" && c.dots.length > 0);
  const connections: { from: { x: number; y: number }; to: { x: number; y: number }; strength: number; color: string }[] = [];
  
  for (let i = 0; i < unlockedClusters.length; i++) {
    for (let j = i + 1; j < unlockedClusters.length; j++) {
      const a = unlockedClusters[i];
      const b = unlockedClusters[j];
      const posA = a.cluster_category === "project" 
        ? PROJECT_CLUSTER_POSITIONS[0] 
        : CLUSTER_POSITION_MAP[a.slug] || { x: 50, y: 50 };
      const posB = b.cluster_category === "project"
        ? PROJECT_CLUSTER_POSITIONS[0]
        : CLUSTER_POSITION_MAP[b.slug] || { x: 50, y: 50 };
      
      // Connection strength based on dot count proximity
      const strength = Math.min(a.dots.length, b.dots.length) / 5;
      if (strength < 0.2) continue;
      
      const sameDomain = a.meta_domain_id === b.meta_domain_id;
      const domainName = a.meta_domain?.name || "Person";
      const color = sameDomain 
        ? (DOMAIN_COLORS[domainName]?.glow || "hsl(265, 90%, 62%, 0.15)")
        : "hsl(265, 90%, 62%, 0.08)";
      
      connections.push({ from: posA, to: posB, strength: Math.min(strength, 1), color });
    }
  }
  return connections;
}

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
  const [opportunityDismissed, setOpportunityDismissed] = useState(false);
  const { data: opportunity } = useOpportunityDetection(totalDots);

  const connections = useMemo(() => generateConnections(clusters), [clusters]);

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
      if (!p?.atlas_onboarding_completed) setShowOnboarding(true);
    };
    checkFlags();
  }, []);

  useEffect(() => {
    if (threadUnlockReady && intakeCompleted === false) setShowUnlockCard(true);
  }, [threadUnlockReady, intakeCompleted]);

  useEffect(() => {
    if (highlightSlug) {
      setHighlightedSlug(highlightSlug);
      setSearchParams({}, { replace: true });
      const timer = setTimeout(() => setHighlightedSlug(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [highlightSlug, setSearchParams]);

  useEffect(() => {
    if (isLoading || clusters.length === 0) return;
    const currentUnlocked = new Set(clusters.filter(c => c.computedState !== "locked").map(c => c.id));
    if (prevUnlockedRef.current.size > 0) {
      currentUnlocked.forEach(id => {
        if (!prevUnlockedRef.current.has(id)) {
          const cluster = clusters.find(c => c.id === id);
          if (cluster) toast({ title: "New area unlocked!", description: cluster.name });
        }
      });
    }
    prevUnlockedRef.current = currentUnlocked;
  }, [clusters, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cosmic">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Compass className="w-8 h-8 text-primary drop-shadow-[0_0_12px_hsl(265_90%_62%/0.5)]" />
        </motion.div>
      </div>
    );
  }

  const currentPhase = getCurrentPhase(totalDots);
  const nextThreshold = getNextPhaseThreshold(totalDots);
  const unlockedCount = clusters.filter(c => c.computedState !== "locked").length;

  return (
    <div className="min-h-screen bg-cosmic relative overflow-hidden">
      {/* Living cosmic background layers */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse at 30% 20%, hsl(265 90% 62% / 0.08) 0%, transparent 50%),
              radial-gradient(ellipse at 70% 50%, hsl(220 95% 58% / 0.06) 0%, transparent 50%),
              radial-gradient(ellipse at 50% 80%, hsl(320 80% 55% / 0.04) 0%, transparent 40%)
            `,
          }}
        />
        {/* Subtle star particles */}
        {Array.from({ length: 30 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: Math.random() * 2 + 1,
              height: Math.random() * 2 + 1,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              backgroundColor: `hsl(${220 + Math.random() * 100}, 80%, ${70 + Math.random() * 20}%)`,
            }}
            animate={{ opacity: [0.2, 0.8, 0.2] }}
            transition={{ duration: 3 + Math.random() * 4, repeat: Infinity, delay: Math.random() * 3 }}
          />
        ))}
      </div>

      {/* Unlock notification card */}
      {showUnlockCard && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-20 mx-4 mt-4 mb-2 p-4 rounded-2xl border border-primary/20 glass"
        >
          <p className="text-sm font-medium text-foreground">Hey, I've been looking at what you've been sharing...</p>
          <p className="text-xs text-muted-foreground mt-1">I'm starting to see something interesting.</p>
          <p className="text-[10px] text-muted-foreground mt-2">The more you explore, the clearer this becomes.</p>
          <div className="flex gap-2 mt-3">
            <Button size="sm" className="gap-1.5" onClick={() => navigate("/council?view=intake")}>
              Start Your Journey <ArrowRight className="w-3 h-3" />
            </Button>
            <Button size="sm" variant="outline" onClick={() => { setShowUnlockCard(false); navigate("/atlas/quest"); }}>
              New Quest
            </Button>
          </div>
        </motion.div>
      )}

      {/* Think Out of the Box Opportunity */}
      {opportunity && !opportunityDismissed && !showUnlockCard && (
        <div className="relative z-20">
          <ThinkOutOfBoxCard opportunity={opportunity} onDismiss={() => setOpportunityDismissed(true)} />
        </div>
      )}

      {/* Header */}
      <div className="relative z-10 px-5 pt-6 pb-2">
        <div className="flex items-center gap-2">
          <Compass className="w-5 h-5 text-primary drop-shadow-[0_0_8px_hsl(265_90%_62%/0.4)]" />
          <h1 className="text-xl font-bold text-foreground">Atlas</h1>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {totalDots} {totalDots === 1 ? "discovery" : "discoveries"} · {unlockedCount} areas unlocked
        </p>

        {nextThreshold && (
          <div className="flex items-center gap-2 mt-2 px-3 py-1.5 rounded-full glass w-fit">
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
                className="w-2.5 h-2.5 rounded-full shadow-sm"
                style={{ 
                  backgroundColor: DOMAIN_COLORS[d.name]?.bg || "hsl(var(--muted-foreground))",
                  boxShadow: `0 0 6px ${DOMAIN_COLORS[d.name]?.glow || "transparent"}`,
                }}
              />
              <span className="text-[10px] text-muted-foreground">{d.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Cluster map */}
      <div className="relative z-10 w-full" style={{ height: "calc(100vh - 220px)" }}>
        {/* Connection lines — multi-directional network */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
          <defs>
            <filter id="connection-glow">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {connections.map((conn, i) => (
            <motion.line
              key={i}
              x1={`${conn.from.x}%`} y1={`${conn.from.y}%`}
              x2={`${conn.to.x}%`} y2={`${conn.to.y}%`}
              stroke={conn.color}
              strokeWidth={conn.strength > 0.5 ? 1.5 : 0.8}
              filter={conn.strength > 0.5 ? "url(#connection-glow)" : undefined}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: conn.strength * 0.6 }}
              transition={{ delay: i * 0.02, duration: 1 }}
            />
          ))}
        </svg>

        {clusters.map((cluster, i) => {
          let pos: { x: number; y: number };
          if (cluster.cluster_category === "project") {
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
                miniDotCounts={miniDotCounts}
                isFocused={!!selectedCluster && selectedCluster.id === cluster.id}
                isFaded={!!selectedCluster && selectedCluster.id !== cluster.id}
              />
            </div>
          );
        })}
      </div>

      {/* Start Quest floating button */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-20">
        <motion.div
          animate={{ scale: [1, 1.04, 1] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <Button
            onClick={() => navigate("/atlas/quest")}
            className="rounded-full gap-2 shadow-[0_0_30px_hsl(265_90%_62%/0.3)]"
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
