import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Compass, Sparkles, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAtlas, ClusterWithState, DOMAIN_COLORS, getCurrentPhase, getNextPhaseThreshold } from "@/hooks/useAtlas";
import { useAtlasQuests } from "@/hooks/useAtlasQuests";
import { AtlasClusterNode, AtlasClusterDetail } from "@/components/atlas";
import { AtlasOnboardingOverlay } from "@/components/atlas/AtlasOnboardingOverlay";
import { AtlasUnlockProgress } from "@/components/atlas/AtlasUnlockProgress";
import { ThinkOutOfBoxCard } from "@/components/atlas/ThinkOutOfBoxCard";
import { YourPatternsCard } from "@/components/atlas/YourPatternsCard";
import { useOpportunityDetection } from "@/hooks/useOpportunityDetection";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { FoundersMap } from "@/components/atlas/founders/FoundersMap";
import { cn } from "@/lib/utils";
import { TIME_PERIOD_LABELS, useLifetimeEvents } from "@/hooks/useLifetimeEvents";
import { ProgressiveGuideCard } from "@/components/ProgressiveGuideCard";
import { ensureProjectAtlasOriginDot } from "@/lib/projectAtlas";
import { readAccountStorage, writeAccountStorage } from "@/lib/accountStorage";

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
  { x: 50, y: 50 },
  { x: 38, y: 56 },
  { x: 62, y: 56 },
  { x: 44, y: 42 },
  { x: 56, y: 42 },
];

type AtlasConnectionRecord = {
  dot_id_a: string | null;
  dot_id_b: string | null;
  strength: number | null;
  is_gold_moment: boolean | null;
};

// Draw only connections that the Atlas engine persisted with evidence.
function generateConnections(clusters: ClusterWithState[], records: AtlasConnectionRecord[]) {
  const unlockedClusters = clusters.filter(c => c.computedState !== "locked" && c.dots.length > 0);
  const clusterById = new Map(unlockedClusters.map(cluster => [cluster.id, cluster]));
  const dotToCluster = new Map(
    unlockedClusters.flatMap(cluster => cluster.dots.map(dot => [dot.id, cluster.id] as const)),
  );
  const grouped = new Map<
    string,
    { a: ClusterWithState; b: ClusterWithState; strength: number; isGold: boolean }
  >();

  records.forEach(record => {
    if (!record.dot_id_a || !record.dot_id_b) return;
    const clusterIdA = dotToCluster.get(record.dot_id_a);
    const clusterIdB = dotToCluster.get(record.dot_id_b);
    if (!clusterIdA || !clusterIdB || clusterIdA === clusterIdB) return;

    const clusterA = clusterById.get(clusterIdA);
    const clusterB = clusterById.get(clusterIdB);
    if (!clusterA || !clusterB) return;

    const [firstId, secondId] = [clusterA.id, clusterB.id].sort();
    const key = `${firstId}:${secondId}`;
    const strength = Math.min(Math.max((record.strength || 1) / 5, 0.18), 1);
    const current = grouped.get(key);
    grouped.set(key, {
      a: firstId === clusterA.id ? clusterA : clusterB,
      b: firstId === clusterA.id ? clusterB : clusterA,
      strength: Math.max(current?.strength || 0, strength),
      isGold: Boolean(current?.isGold || record.is_gold_moment),
    });
  });

  return Array.from(grouped.values()).map(({ a, b, strength, isGold }) => {
    const posA = a.cluster_category === "project"
      ? PROJECT_CLUSTER_POSITIONS[0]
      : CLUSTER_POSITION_MAP[a.slug] || { x: 50, y: 50 };
    const posB = b.cluster_category === "project"
      ? PROJECT_CLUSTER_POSITIONS[0]
      : CLUSTER_POSITION_MAP[b.slug] || { x: 50, y: 50 };

    return {
      from: posA,
      to: posB,
      strength,
      color: isGold ? "hsl(40 80% 55% / 0.45)" : "hsl(265 90% 62% / 0.22)",
    };
  });
}

const LoadingStep = ({ active, label }: { active?: boolean; label: string }) => (
  <div className={cn(
    "flex items-center gap-2 text-xs transition-colors",
    active ? "text-primary" : "text-muted-foreground/70"
  )}>
    <span className={cn(
      "h-1.5 w-1.5 rounded-full transition-colors",
      active ? "bg-primary shadow-[0_0_10px_hsl(265_90%_62%/0.8)]" : "bg-muted-foreground/30"
    )} />
    {label}
  </div>
);

const AtlasLoadingState = () => (
  <div className="min-h-screen flex items-center justify-center bg-cosmic px-6">
    <div className="w-full max-w-sm text-center">
      <motion.div
        className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-primary/30 bg-primary/10 shadow-[0_0_34px_hsl(265_90%_62%/0.22)]"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
        >
          <Compass className="w-7 h-7 text-primary drop-shadow-[0_0_12px_hsl(265_90%_62%/0.55)]" />
        </motion.div>
      </motion.div>

      <p className="text-sm font-semibold text-foreground">Preparing your Atlas</p>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        Connecting your dots, life moments, and unlocked areas.
      </p>

      <div className="mx-auto mt-5 grid w-fit gap-2 text-left">
        <LoadingStep active label="Reading your latest discoveries" />
        <LoadingStep label="Updating Council progress" />
        <LoadingStep label="Drawing your map" />
      </div>
    </div>
  </div>
);

const AtlasPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const { clusters, domains, totalDots, isLoading, miniDotCounts } = useAtlas();
  const { data: atlasConnectionRecords = [] } = useQuery({
    queryKey: ["atlas-connections-map"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("atlas_connections")
        .select("dot_id_a, dot_id_b, strength, is_gold_moment")
        .eq("user_id", user.id);
      if (error) throw error;
      return (data || []) as AtlasConnectionRecord[];
    },
  });
  const { completedCount, futureSelfCompletedCount, preCouncilExploredCount, isLoading: questsLoading } = useAtlasQuests();
  const { events: lifetimeEvents, candidates: lifetimeCandidates } = useLifetimeEvents();
  const [lifetimeEventCount, setLifetimeEventCount] = useState(0);
  const [selectedCluster, setSelectedCluster] = useState<ClusterWithState | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  const prevUnlockedRef = useRef<Set<string>>(new Set());
  const highlightSlug = searchParams.get("highlight");
  const highlightClusterId = searchParams.get("clusterId");
  const newDotTitle = searchParams.get("newDot");
  const source = searchParams.get("source");
  const isFutureSelfReturn = source === "future-self";
  const [highlightedSlug, setHighlightedSlug] = useState<string | null>(null);
  const [recentDotTitle, setRecentDotTitle] = useState<string | null>(null);
  const [intakeCompleted, setIntakeCompleted] = useState<boolean | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [entryState, setEntryState] = useState<string>("DISCOVER");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [opportunityDismissed, setOpportunityDismissed] = useState(false);
  const { data: opportunity } = useOpportunityDetection(totalDots);
  const [atlasOnboardingPending, setAtlasOnboardingPending] = useState(false);
  const [atlasIntroCompleted, setAtlasIntroCompleted] = useState<boolean | null>(null);
  const [foundersAccepted, setFoundersAccepted] = useState(false);
  const [showFirstDiscoveryGuide, setShowFirstDiscoveryGuide] = useState(false);
  const [showFounderTabGuide, setShowFounderTabGuide] = useState(false);
  const foundersMapUnlocked = !questsLoading && futureSelfCompletedCount >= 2;

  const markAtlasIntroSeen = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);
    try {
      if (user?.id || currentUserId) {
        const userId = user?.id || currentUserId!;
        writeAccountStorage(userId, "atlas_intro_seen", "true");
        writeAccountStorage(userId, "progressive_guide_seen_atlas", "1");
      }
      sessionStorage.removeItem("force_atlas_onboarding_walkthrough");
    } catch {
      // ignore
    }

    setAtlasIntroCompleted(true);
    setAtlasOnboardingPending(false);
    setShowOnboarding(false);

    if (user) {
      await supabase
        .from("profiles")
        .update({ atlas_onboarding_completed: true } as any)
        .eq("id", user.id);
    }
  };

  // Repair project clusters created before the origin-dot write was in place.
  useEffect(() => {
    let cancelled = false;

    const syncProjectClusters = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("first_project_id" as any)
        .eq("id", user.id)
        .maybeSingle();
      const firstProjectId = (profile as any)?.first_project_id as string | null | undefined;

      const { data: activeProjects } = await supabase
        .from("integrator_projects")
        .select("id, project_title, project_description")
        .eq("user_id", user.id)
        .in("status", ["active", "completed"])
        .order("created_at", { ascending: false })
        .limit(8);

      const projectsById = new Map<string, any>();
      (activeProjects || []).forEach((project: any) => projectsById.set(project.id, project));

      if (firstProjectId && !projectsById.has(firstProjectId)) {
        const { data: firstProject } = await supabase
          .from("integrator_projects")
          .select("id, project_title, project_description")
          .eq("user_id", user.id)
          .eq("id", firstProjectId)
          .maybeSingle();

        if (firstProject) {
          projectsById.set((firstProject as any).id, firstProject);
        }
      }

      const projects = Array.from(projectsById.values());
      if (!projects?.length || cancelled) return;

      await Promise.all(projects.map((project: any) =>
        ensureProjectAtlasOriginDot({
          userId: user.id,
          projectId: project.id,
          title: project.project_title,
          description: project.project_description,
        })
      ));

      if (!cancelled) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["atlas-dots"] }),
          queryClient.invalidateQueries({ queryKey: ["atlas-clusters"] }),
        ]);
      }
    };

    syncProjectClusters().catch((error) => {
      console.warn("Project Atlas repair skipped:", error);
    });

    return () => { cancelled = true; };
  }, [queryClient]);

  // ── Founder's Atlas tab ─────────────────────────────────────────────
  const FOUNDERS_SEEN_FLAG = "atlas_founders_map_seen";
  // Default to founders ONLY for users we know haven't completed atlas onboarding.
  // Final decision is made in checkFlags() below using backend state.
  const [activeTab, setActiveTab] = useState<"mine" | "founders">("mine");

  const handleFoundersCta = () => {
    try {
      if (currentUserId) writeAccountStorage(currentUserId, FOUNDERS_SEEN_FLAG, "true");
      sessionStorage.removeItem("force_atlas_onboarding_walkthrough");
    } catch {
      // ignore
    }
    if (searchParams.get("next") === "council") {
      navigate("/council?view=intake", { replace: true });
      return;
    }
    if (searchParams.get("next") === "quest") {
      navigate("/atlas/quest", { replace: true });
      return;
    }
    setFoundersAccepted(true);
    setAtlasOnboardingPending(false);
    setShowOnboarding(false);
    setActiveTab("mine");
  };

  const handleSelectMyMap = () => {
    // Choosing a personal map is a deliberate handoff away from the founder
    // example. Keep that choice across later quest returns.
    try {
      if (currentUserId) writeAccountStorage(currentUserId, FOUNDERS_SEEN_FLAG, "true");
    } catch {
      // ignore
    }
    setActiveTab("mine");
  };

  const connections = useMemo(
    () => generateConnections(clusters, atlasConnectionRecords),
    [clusters, atlasConnectionRecords],
  );

  useEffect(() => {
    let cancelled = false;
    const checkFlags = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;
      setCurrentUserId(user.id);
      const { data: profile } = await supabase
        .from("profiles")
        .select("console_intake_completed, atlas_onboarding_completed, entry_state" as any)
        .eq("id", user.id)
        .single();
      if (cancelled) return;
      const p = profile as any;
      setIntakeCompleted(!!p?.console_intake_completed);
      setAtlasIntroCompleted(!!p?.atlas_onboarding_completed || completedCount > 0);
      if (p?.entry_state) setEntryState(p.entry_state);
      const { count } = await supabase
        .from("lifetime_events")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      if (cancelled) return;
      const fetchedLifetimeEventCount = count || 0;
      setLifetimeEventCount(fetchedLifetimeEventCount);
      let forceWalkthrough = false;
      try {
        forceWalkthrough = sessionStorage.getItem("force_atlas_onboarding_walkthrough") === "true";
      } catch {
        forceWalkthrough = false;
      }
      if (forceWalkthrough && completedCount > 0) {
        forceWalkthrough = false;
        try {
          sessionStorage.removeItem("force_atlas_onboarding_walkthrough");
        } catch {
          // ignore
        }
      }
      const introMode = searchParams.get("intro");
      const introQuery = introMode === "founder";
      const shouldShowGuide = introMode === "guide";
      const returningFromFutureSelf = searchParams.get("source") === "future-self";
      const hasNewDotReturn = !!searchParams.get("highlight") || !!searchParams.get("newDot");

      if (returningFromFutureSelf || hasNewDotReturn) {
        try {
          sessionStorage.removeItem("force_atlas_onboarding_walkthrough");
        } catch {
          // ignore
        }
        setAtlasOnboardingPending(false);
        setFoundersAccepted(false);
        setShowOnboarding(false);
        setShowFirstDiscoveryGuide(false);
        setShowFounderTabGuide(false);
        return;
      }

      // Founder Origin is an optional first-time reference, not a destination
      // after every quest. Users with any Atlas progress should always return
      // to their own map unless they explicitly request the founder example.
      if (introQuery) {
        setAtlasOnboardingPending(false);
        setFoundersAccepted(false);
        setShowFounderTabGuide(false);
      } else {
        setAtlasOnboardingPending(false);
        setFoundersAccepted(false);
        setShowFounderTabGuide(false);
        if (shouldShowGuide) {
          const next = new URLSearchParams(searchParams);
          next.delete("intro");
          setSearchParams(next, { replace: true });
        }
      }
    };
    if (!isLoading && !questsLoading) void checkFlags();
    return () => { cancelled = true; };
  }, [completedCount, isLoading, questsLoading, foundersMapUnlocked, totalDots, searchParams, setSearchParams]);

  // Trigger Atlas onboarding overlay only AFTER:
  //  1. The user has accepted the founder card (foundersAccepted), and
  //  2. They are now on "My Map".
  // Wait ~2s so the map can render first.
  useEffect(() => {
    if (!atlasOnboardingPending) return;
    if (activeTab !== "mine") return;
    if (!foundersAccepted) return;
    const timer = setTimeout(() => setShowOnboarding(true), 4000);
    return () => clearTimeout(timer);
  }, [atlasOnboardingPending, activeTab, foundersAccepted]);

  useEffect(() => {
    if (highlightSlug || highlightClusterId || newDotTitle) {
      const clusterFromReturn = clusters.find((cluster) =>
        (highlightSlug && cluster.slug === highlightSlug) ||
        (highlightClusterId && cluster.id === highlightClusterId)
      );
      setHighlightedSlug(clusterFromReturn?.slug || highlightSlug || null);
      setRecentDotTitle(newDotTitle);
      const next = new URLSearchParams(searchParams);
      next.delete("highlight");
      next.delete("clusterId");
      next.delete("newDot");
      next.delete("source");
      next.delete("afterQuest");
      setSearchParams(next, { replace: true });
    }
  }, [clusters, highlightClusterId, highlightSlug, newDotTitle, searchParams, setSearchParams]);

  useEffect(() => {
    if (!highlightedSlug && !recentDotTitle) return;
    const timer = window.setTimeout(() => {
      setHighlightedSlug(null);
      setRecentDotTitle(null);
    }, 5000);
    return () => window.clearTimeout(timer);
  }, [highlightedSlug, recentDotTitle]);

  useEffect(() => {
    if (isLoading || questsLoading) return;
    if (atlasIntroCompleted === null) return;
    if (isFutureSelfReturn || recentDotTitle) {
      setShowFirstDiscoveryGuide(false);
      return;
    }
    if (
      atlasIntroCompleted ||
      entryState !== "DISCOVER" ||
      completedCount !== 0 ||
      activeTab !== "mine" ||
      showFounderTabGuide
    ) {
      setShowFirstDiscoveryGuide(false);
      return;
    }
    const timer = window.setTimeout(() => {
      setShowFirstDiscoveryGuide(true);
    }, 4000);
    return () => window.clearTimeout(timer);
  }, [activeTab, atlasIntroCompleted, completedCount, entryState, isFutureSelfReturn, isLoading, questsLoading, recentDotTitle, showFounderTabGuide]);

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

  if (isLoading || questsLoading) {
    return <AtlasLoadingState />;
  }

  const currentPhase = getCurrentPhase(totalDots);
  const nextThreshold = getNextPhaseThreshold(totalDots);
  const unlockedCount = clusters.filter(c => c.computedState !== "locked").length;
  const councilProgressCount = entryState === "DISCOVER"
    ? futureSelfCompletedCount
    : preCouncilExploredCount;
  const availableLifeMoment = lifetimeCandidates.find((candidate) => candidate.status === "available");
  const lifetimePreviewUnlocked = lifetimeEventCount > 0 || lifetimeEvents.length > 0 || (futureSelfCompletedCount >= 3 && !!availableLifeMoment);
  const recentLifetimeEvents = lifetimeEvents.slice(-3).reverse();
  let hasSeenCrisMapGuide = false;
  try {
    hasSeenCrisMapGuide = currentUserId
      ? readAccountStorage(currentUserId, "progressive_guide_seen_cris_map") === "1"
      : false;
  } catch {
    hasSeenCrisMapGuide = false;
  }
  const shouldInviteCrisMap =
    foundersMapUnlocked && !!currentUserId && !recentDotTitle && !highlightedSlug && !isFutureSelfReturn && !hasSeenCrisMapGuide && searchParams.get("viewSaved") !== "1";
  const guideMoment = shouldInviteCrisMap
    ? "cris_map"
    : recentDotTitle || totalDots === 1
    ? "dot"
    : "atlas";
  const startFirstDiscoveryQuest = async () => {
    try {
      await markAtlasIntroSeen();
    } catch {
      // The quest can still start; this flag only prevents old onboarding from returning.
    }
    setShowFirstDiscoveryGuide(false);
    navigate(`/future-self/discovery?fresh=${Date.now()}`);
  };

  const startNextDiscoveryQuest = async () => {
    await markAtlasIntroSeen().catch(() => {});
    navigate(`/future-self/discovery?mode=next&fresh=${Date.now()}`);
  };

  const startDiscoveryQuest = () => {
    if (totalDots === 0) {
      startFirstDiscoveryQuest();
      return;
    }
    startNextDiscoveryQuest();
  };

  const openCrisMapGuide = () => {
    try {
      if (currentUserId) {
        writeAccountStorage(currentUserId, FOUNDERS_SEEN_FLAG, "true");
        writeAccountStorage(currentUserId, "progressive_guide_seen_cris_map", "1");
      }
    } catch {
      // ignore
    }
    setShowFounderTabGuide(false);
    setActiveTab("founders");
  };

  const shouldShowProgressiveGuide = !showOnboarding && (shouldInviteCrisMap || (!recentDotTitle && (showFirstDiscoveryGuide || guideMoment !== "atlas")));

  return (
    <div className="min-h-screen bg-cosmic relative overflow-x-hidden overflow-y-auto">
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

      {/* Two-tab toggle (always visible) */}
      <div className="relative z-30 px-5 pt-4">
        <div className="inline-flex rounded-full border border-border/60 bg-card/70 backdrop-blur-md p-1 shadow-sm">
          <button
            onClick={handleSelectMyMap}
            className={cn(
              "px-4 py-1.5 text-xs font-semibold rounded-full transition-all",
              activeTab === "mine"
                ? "bg-primary text-primary-foreground shadow-[0_0_16px_hsl(265_90%_62%/0.4)]"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            My Map
          </button>
          <button
            onClick={() => {
              if (!foundersMapUnlocked) {
                toast({
                  title: "Cris's Map unlocks soon",
                  description: "Complete two Future Self conversations and save your Dots first.",
                });
                return;
              }
              openCrisMapGuide();
            }}
            className={cn(
              "px-4 py-1.5 text-xs font-semibold rounded-full transition-all flex items-center gap-1.5 relative",
              activeTab === "founders"
                ? "bg-primary text-primary-foreground shadow-[0_0_16px_hsl(265_90%_62%/0.4)]"
                : "text-muted-foreground hover:text-foreground",
              showFounderTabGuide && "text-primary shadow-[0_0_22px_hsl(265_90%_62%/0.45)]"
            )}
          >
            {showFounderTabGuide && (
              <motion.span
                className="absolute inset-0 rounded-full border border-primary"
                animate={{ scale: [1, 1.14], opacity: [0.7, 0] }}
                transition={{ duration: 1.3, repeat: Infinity, ease: "easeOut" }}
              />
            )}
            {foundersMapUnlocked ? <Sparkles className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
            Cris's Map
          </button>
        </div>
      </div>

      {activeTab === "founders" ? (
        <FoundersMap
          onCtaClick={handleFoundersCta}
          forceOriginVideo
          originDelayMs={3500}
        />
      ) : (
        <>
      {/* Phase-based Council unlock progress */}
      {intakeCompleted === false && (
        <div className="relative z-20">
          <AtlasUnlockProgress
            phase={entryState as any}
            completedCount={councilProgressCount}
            hasLifetimeAnchor={lifetimeEventCount > 0}
            councilAlreadyStarted={!!intakeCompleted}
            onGoToCouncil={() => navigate("/council?view=intake")}
              onSaveLifetime={() => navigate("/life-timeline?unlock=mentor&new=1")}
            onKeepExploring={() => navigate("/atlas/quest")}
          />
        </div>
      )}

      {/* Think Out of the Box Opportunity */}
      {opportunity && !opportunityDismissed && (
        <div className="relative z-20">
          <ThinkOutOfBoxCard opportunity={opportunity} onDismiss={() => setOpportunityDismissed(true)} />
        </div>
      )}

      {/* Your Patterns — surfaces latest atlas analysis snapshot */}
      <div className="relative z-20">
        <YourPatternsCard totalDots={totalDots} />
      </div>

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

      {shouldShowProgressiveGuide && !showFounderTabGuide && (
        <div className="relative z-[100]">
          <ProgressiveGuideCard
            moment={showFirstDiscoveryGuide ? "atlas" : guideMoment}
            forceShow={showFirstDiscoveryGuide}
            actionLabel={showFirstDiscoveryGuide ? "Talk to Future Self" : guideMoment === "cris_map" ? "Open Cris's Map" : "I understand"}
            onDismiss={showFirstDiscoveryGuide ? startFirstDiscoveryQuest : guideMoment === "cris_map" ? openCrisMapGuide : undefined}
            secondaryAction={guideMoment === "cris_map" && !showFirstDiscoveryGuide
              ? { label: "Start Quest", onClick: startDiscoveryQuest }
              : undefined}
          />
        </div>
      )}

      {/* Cluster map — taller on mobile so clusters breathe instead of piling up */}
      <div
        className="relative z-10 w-full"
        style={{ height: isMobile ? "860px" : "calc(100vh - 220px)", minHeight: isMobile ? undefined : "520px" }}
      >
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
              animate={{ pathLength: 1, opacity: conn.strength * 0.9 }}
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
                zIndex: cluster.cluster_category === "project" ? 12 : 2,
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
                scale={isMobile ? 0.78 : 1}
              />
            </div>
          );
        })}
      </div>

      {lifetimePreviewUnlocked && (
      <div className="relative z-20 px-5 pb-28">
        <div
          className="rounded-2xl border border-primary/25 bg-card/70 p-4 backdrop-blur-sm"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <div
                className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary"
              >
                <BookOpen className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">Life Timeline</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {lifetimeEvents.length > 0 ? "Your saved moments connect your story with your Atlas." : `You shared a moment: ${availableLifeMoment?.event_label}. Would you like to place it on your timeline?`}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              className="shrink-0 gap-1.5 text-xs"
              onClick={() => navigate("/life-timeline")}
            >
              Open
              <BookOpen className="h-3.5 w-3.5" />
            </Button>
          </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {recentLifetimeEvents.length > 0 ? (
                recentLifetimeEvents.map((event) => (
                  <button
                    key={event.id}
                    onClick={() => navigate("/life-timeline")}
                    className="rounded-xl border border-border/45 bg-background/30 p-3 text-left transition-colors hover:border-primary/40 hover:bg-primary/5"
                  >
                    <p className="truncate text-xs font-semibold text-foreground">{event.event_label}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground">{TIME_PERIOD_LABELS[event.time_period]}</p>
                  </button>
                ))
              ) : (
                <button
                  onClick={() => navigate("/life-timeline?unlock=mentor&new=1")}
                  className="rounded-xl border border-dashed border-primary/35 bg-primary/5 p-3 text-left transition-colors hover:bg-primary/10 sm:col-span-3"
                >
                  <p className="text-xs font-semibold text-primary">Add the first Lifetime moment</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                    Choose a life impact moment or a creation moment so Atlas and your mentors have a real anchor.
                  </p>
                </button>
              )}
            </div>
        </div>
      </div>
      )}

      {/* Start Quest floating button */}
      {!showFounderTabGuide && (
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-20">
        <motion.div
          animate={{ scale: [1, 1.04, 1] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <Button
            onClick={startDiscoveryQuest}
            className="rounded-full gap-2 shadow-[0_0_30px_hsl(265_90%_62%/0.55)]"
            size="lg"
          >
            <Sparkles className="w-4 h-4" />
            {totalDots === 0 ? "Talk to Future Self" : "Start Quest"}
          </Button>
        </motion.div>
      </div>
      )}

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
            mode="atlas"
            onComplete={startFirstDiscoveryQuest}
          />
        )}
      </AnimatePresence>
        </>
      )}
    </div>
  );
};

export default AtlasPage;
