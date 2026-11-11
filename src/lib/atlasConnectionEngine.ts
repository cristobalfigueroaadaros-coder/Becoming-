import type { AtlasDot } from "@/hooks/useAtlas";

export interface AtlasConnection {
  dotIdA: string;
  dotIdB: string;
  connectionType: "signal_overlap" | "cross_cluster_bridge" | "gold_moment";
  sharedSignals: string[];
  strength: number;
  isGoldMoment: boolean;
  insightText: string;
}

export interface MiniDotContent {
  parent_dot_id: string;
  content: string;
}

// Clusters whose dots represent frustrations/shadows.
const FRUSTRATION_CLUSTERS = new Set(["personal-frustrations"]);

// Clusters whose dots represent strengths/skills.
const STRENGTH_CLUSTERS = new Set(["skills", "natural-talents", "experiments"]);

const GENERIC_SIGNALS = new Set([
  "future_self_conversation",
  "future_self_discovery",
  "future_self",
  "conversation",
  "discovery",
  "learning",
  "future_use",
]);

type BridgeRule = {
  key: string;
  label: string;
  left: Set<string>;
  right: Set<string>;
  insight: string;
};

const BRIDGE_RULES: BridgeRule[] = [
  {
    key: "audience-capability",
    label: "audience ↔ capability",
    left: new Set(["who-i-serve", "vision-for-a-better-world"]),
    right: new Set(["skills", "natural-talents", "experiments", "how-i-create-impact"]),
    insight: "What you want to change for people is connected to something you already know how to do.",
  },
  {
    key: "lived-capability",
    label: "lived chapter ↔ capability",
    left: new Set(["life-events", "aha-moments", "inspirations"]),
    right: new Set(["skills", "natural-talents", "experiments"]),
    insight: "A lived chapter is becoming a capability you can carry into the world.",
  },
  {
    key: "value-action",
    label: "value ↔ action",
    left: new Set(["values", "vision-for-a-better-world"]),
    right: new Set(["experiments", "how-i-create-impact", "creative-evidence"]),
    insight: "A belief is moving out of the abstract and into a way of creating something real.",
  },
  {
    key: "passion-impact",
    label: "passion ↔ impact",
    left: new Set(["passions"]),
    right: new Set(["how-i-create-impact", "experiments", "vision-for-a-better-world"]),
    insight: "What gives you energy is also pointing toward the kind of experience or change you want to create.",
  },
];

// Extract keywords from text for semantic matching
function extractKeywords(text: string): Set<string> {
  const stopWords = new Set([
    "i", "a", "the", "is", "it", "to", "and", "of", "in", "my", "me", "for", "that", "this", "with", "was", "but", "have", "has", "had", "do", "does", "am", "are", "be", "been", "being", "so", "if", "or", "an", "as", "at", "by", "from", "on", "not", "no", "can", "will", "just", "about", "when", "how", "what", "why", "who", "which", "more", "very", "really", "because", "feel", "think", "like", "also", "would", "could", "should",
    "your", "their", "they", "them", "you", "people", "something", "things", "make", "makes", "made", "want", "help", "helps", "create", "creates", "creating", "real", "life", "work", "world", "change", "impact", "learn", "learns", "learning",
  ]);
  return new Set(
    text.toLowerCase()
      .replace(/[^a-z\s]/g, "")
      .split(/\s+/)
      .map((word) => word.length > 5 && word.endsWith("ing") ? word.slice(0, -3) : word)
      .map((word) => word.length > 4 && word.endsWith("ed") ? word.slice(0, -2) : word)
      .map((word) => word.length > 4 && word.endsWith("s") ? word.slice(0, -1) : word)
      .filter(w => w.length > 3 && !stopWords.has(w))
  );
}

function meaningfulSignals(signals: unknown): Set<string> {
  if (!Array.isArray(signals)) return new Set();
  return new Set(
    signals
      .filter((signal): signal is string => typeof signal === "string")
      .map((signal) => signal.toLowerCase().trim())
      .filter((signal) => signal && !GENERIC_SIGNALS.has(signal))
  );
}

function sharedValues(a: Set<string>, b: Set<string>): string[] {
  return Array.from(a).filter((value) => b.has(value)).slice(0, 4);
}

function findBridge(aSlug: string, bSlug: string): BridgeRule | null {
  return BRIDGE_RULES.find((rule) =>
    (rule.left.has(aSlug) && rule.right.has(bSlug)) ||
    (rule.left.has(bSlug) && rule.right.has(aSlug))
  ) || null;
}

function hasStrengthCluster(slug: string): boolean {
  return STRENGTH_CLUSTERS.has(slug) || slug === "how-i-create-impact";
}

function buildInsightText(
  a: AtlasDot,
  b: AtlasDot,
  bridge: BridgeRule | null,
  isGold: boolean,
  themes: string[],
): string {
  if (isGold) {
    return `The tension between "${a.title}" and "${b.title}" may be productive: the friction is pointing toward a strength you can use.`;
  }

  if (bridge) {
    return `${bridge.insight} "${a.title}" connects with "${b.title}" through ${bridge.label}.`;
  }

  const themeText = themes.slice(0, 2).join(" and ") || "a shared theme";
  return `"${a.title}" and "${b.title}" both carry ${themeText}; this may be a pattern worth watching as the Atlas grows.`;
}

// Check semantic overlap between two sets of mini-dot content
function computeMiniDotOverlap(
  aMiniDots: MiniDotContent[],
  bMiniDots: MiniDotContent[]
): { score: number; sharedThemes: string[] } {
  if (aMiniDots.length === 0 || bMiniDots.length === 0) return { score: 0, sharedThemes: [] };

  const aKeywords = new Set<string>();
  aMiniDots.forEach(md => extractKeywords(md.content).forEach(k => aKeywords.add(k)));

  const bKeywords = new Set<string>();
  bMiniDots.forEach(md => extractKeywords(md.content).forEach(k => bKeywords.add(k)));

  const shared: string[] = [];
  aKeywords.forEach(k => {
    if (bKeywords.has(k)) shared.push(k);
  });

  return { score: shared.length, sharedThemes: shared.slice(0, 5) };
}

export function detectConnections(
  dots: AtlasDot[],
  existingPairs: Set<string>,
  clusterSlugMap: Record<string, string>,
  miniDots?: MiniDotContent[]
): AtlasConnection[] {
  const newConnections: AtlasConnection[] = [];

  // Group mini-dots by parent dot
  const miniDotsByDot: Record<string, MiniDotContent[]> = {};
  (miniDots || []).forEach(md => {
    if (!miniDotsByDot[md.parent_dot_id]) miniDotsByDot[md.parent_dot_id] = [];
    miniDotsByDot[md.parent_dot_id].push(md);
  });

  for (let i = 0; i < dots.length; i++) {
    for (let j = i + 1; j < dots.length; j++) {
      const a = dots[i];
      const b = dots[j];

      // Skip same cluster
      if (a.cluster_id === b.cluster_id) continue;

      // Skip existing
      const pairKey = [a.id, b.id].sort().join(":");
      if (existingPairs.has(pairKey)) continue;

      const aSignals = meaningfulSignals(a.signal_sources);
      const bSignals = meaningfulSignals(b.signal_sources);
      const shared = sharedValues(aSignals, bSignals);

      const aText = `${a.title} ${a.short_description || ""}`;
      const bText = `${b.title} ${b.short_description || ""}`;
      const lexicalThemes = sharedValues(extractKeywords(aText), extractKeywords(bText));

      // Mini-dot semantic boost: each shared keyword counts as +0.5 signal
      const miniOverlap = computeMiniDotOverlap(
        miniDotsByDot[a.id] || [],
        miniDotsByDot[b.id] || []
      );
      const aSlug = a.cluster_id ? clusterSlugMap[a.cluster_id] : "";
      const bSlug = b.cluster_id ? clusterSlugMap[b.cluster_id] : "";
      const isGoldCandidate =
        (FRUSTRATION_CLUSTERS.has(aSlug) && hasStrengthCluster(bSlug)) ||
        (FRUSTRATION_CLUSTERS.has(bSlug) && hasStrengthCluster(aSlug));
      const bridge = findBridge(aSlug, bSlug);
      const hasEvidence = shared.length > 0 || lexicalThemes.length > 0 || miniOverlap.score > 0;
      const isGold = isGoldCandidate && hasEvidence;
      const categoryPair = a.dot_category !== b.dot_category && a.dot_category && b.dot_category;
      const bridgeScore = bridge ? 2 : 0;
      const lexicalScore = Math.min(lexicalThemes.length * 0.75, 2.25);
      const signalScore = Math.min(shared.length * 0.6, 1.2);
      const miniScore = Math.min(miniOverlap.score * 0.35, 1.4);
      const categoryScore = categoryPair ? 0.35 : 0;
      const effectiveStrength = bridgeScore + lexicalScore + signalScore + miniScore + categoryScore + (isGold ? 0.8 : 0);

      // A bridge rule is meaningful on its own; generic signal overlap is not.
      // Require a real text/signal/mini-dot anchor for every connection.
      const minimumStrength = isGold ? 2.7 : bridge ? 2.1 : 2.4;
      if (!hasEvidence || effectiveStrength < minimumStrength) continue;

      const allShared = [
        ...(bridge ? [`bridge:${bridge.key}`] : []),
        ...shared.map((signal) => `signal:${signal}`),
        ...lexicalThemes.map((theme) => `theme:${theme}`),
        ...miniOverlap.sharedThemes.map((theme) => `depth:${theme}`),
      ].slice(0, 8);

      newConnections.push({
        dotIdA: a.id,
        dotIdB: b.id,
        connectionType: isGold ? "gold_moment" : bridge ? "cross_cluster_bridge" : "signal_overlap",
        sharedSignals: allShared,
        strength: Math.min(5, Math.max(1, Math.round(effectiveStrength))),
        isGoldMoment: isGold,
        insightText: buildInsightText(a, b, bridge, isGold, lexicalThemes),
      });
    }
  }

  return newConnections
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 8);
}

export function findGoldMoments(connections: AtlasConnection[]): AtlasConnection[] {
  return connections.filter(c => c.isGoldMoment);
}
