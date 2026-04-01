import type { AtlasDot } from "@/hooks/useAtlas";

export interface AtlasConnection {
  dotIdA: string;
  dotIdB: string;
  connectionType: "signal_overlap" | "gold_moment";
  sharedSignals: string[];
  strength: number;
  isGoldMoment: boolean;
}

export interface MiniDotContent {
  parent_dot_id: string;
  content: string;
}

// Clusters whose dots represent frustrations/shadows
const FRUSTRATION_CLUSTERS = new Set(["personal-frustrations"]);

// Clusters whose dots represent strengths/skills
const STRENGTH_CLUSTERS = new Set(["skills", "natural-talents", "experiments"]);

// Extract keywords from text for semantic matching
function extractKeywords(text: string): Set<string> {
  const stopWords = new Set(["i", "a", "the", "is", "it", "to", "and", "of", "in", "my", "me", "for", "that", "this", "with", "was", "but", "have", "has", "had", "do", "does", "am", "are", "be", "been", "being", "so", "if", "or", "an", "as", "at", "by", "from", "on", "not", "no", "can", "will", "just", "about", "when", "how", "what", "why", "who", "which", "more", "very", "really", "because", "feel", "think", "like", "also", "would", "could", "should"]);
  return new Set(
    text.toLowerCase()
      .replace(/[^a-z\s]/g, "")
      .split(/\s+/)
      .filter(w => w.length > 3 && !stopWords.has(w))
  );
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

      const aSignals: string[] = Array.isArray(a.signal_sources) ? a.signal_sources : [];
      const bSignals: string[] = Array.isArray(b.signal_sources) ? b.signal_sources : [];

      const aSet = new Set(aSignals);
      const shared = bSignals.filter(s => aSet.has(s));

      // Mini-dot semantic boost: each shared keyword counts as +0.5 signal
      const miniOverlap = computeMiniDotOverlap(
        miniDotsByDot[a.id] || [],
        miniDotsByDot[b.id] || []
      );
      const effectiveStrength = shared.length + Math.min(miniOverlap.score * 0.5, 2);

      // Gold moments need 2 shared signals, regular connections need 3
      const aSlug = a.cluster_id ? clusterSlugMap[a.cluster_id] : "";
      const bSlug = b.cluster_id ? clusterSlugMap[b.cluster_id] : "";
      const isGoldCandidate =
        (FRUSTRATION_CLUSTERS.has(aSlug) && STRENGTH_CLUSTERS.has(bSlug)) ||
        (FRUSTRATION_CLUSTERS.has(bSlug) && STRENGTH_CLUSTERS.has(aSlug));
      const minShared = isGoldCandidate ? 2 : 3;
      if (effectiveStrength < minShared) continue;

      const isGold =
        (FRUSTRATION_CLUSTERS.has(aSlug) && STRENGTH_CLUSTERS.has(bSlug)) ||
        (FRUSTRATION_CLUSTERS.has(bSlug) && STRENGTH_CLUSTERS.has(aSlug));

      const allShared = [...shared, ...miniOverlap.sharedThemes.map(t => `[depth:${t}]`)];

      newConnections.push({
        dotIdA: a.id,
        dotIdB: b.id,
        connectionType: isGold ? "gold_moment" : "signal_overlap",
        sharedSignals: allShared,
        strength: Math.round(effectiveStrength),
        isGoldMoment: isGold,
      });
    }
  }

  return newConnections;
}

export function findGoldMoments(connections: AtlasConnection[]): AtlasConnection[] {
  return connections.filter(c => c.isGoldMoment);
}
