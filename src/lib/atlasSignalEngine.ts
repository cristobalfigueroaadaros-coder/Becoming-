import { OPTION_SIGNAL_MAP, PATTERN_DEFINITIONS, SIGNAL_CATALOG, type SignalEmission, type PatternDefinition, type DotCategory } from "@/data/atlasSignals";
import type { DotInterpretation } from "@/data/atlasQuests";

export interface ExtractedSignal {
  signalName: string;
  signalCategory: string;
  strength: number;
  sourceQuestKey: string;
  sourceInteractionIndex: number;
}

export interface AggregatedSignal {
  signalName: string;
  totalStrength: number;
}

export interface DetectedPattern {
  pattern: PatternDefinition;
  totalStrength: number;
}

/**
 * Extract signals from a single interaction response
 */
export function extractSignals(
  questKey: string,
  interactionIndex: number,
  response: any
): ExtractedSignal[] {
  const mapping = OPTION_SIGNAL_MAP[questKey]?.[interactionIndex];
  if (!mapping) return [];

  const signals: ExtractedSignal[] = [];

  const addEmissions = (emissions: SignalEmission[]) => {
    for (const e of emissions) {
      const def = SIGNAL_CATALOG.find(s => s.name === e.signalName);
      signals.push({
        signalName: e.signalName,
        signalCategory: def?.category || "behavior",
        strength: e.strength,
        sourceQuestKey: questKey,
        sourceInteractionIndex: interactionIndex,
      });
    }
  };

  // Reflection / sentence_completion / memory_flash — use _reflection key
  if (typeof response === "string") {
    const reflectionEmissions = mapping["_reflection"];
    if (reflectionEmissions) addEmissions(reflectionEmissions);
    return signals;
  }

  // Emoji scale — use _emoji key, scale by selected index
  if (typeof response === "number" && mapping["_emoji"]) {
    const emojiEmissions = mapping["_emoji"];
    const factor = Math.max(0.5, (response + 1) / 3); // index 0=0.33, 4=1.67
    for (const e of emojiEmissions) {
      const def = SIGNAL_CATALOG.find(s => s.name === e.signalName);
      signals.push({
        signalName: e.signalName,
        signalCategory: def?.category || "behavior",
        strength: Math.max(1, Math.round(e.strength * factor)),
        sourceQuestKey: questKey,
        sourceInteractionIndex: interactionIndex,
      });
    }
    return signals;
  }

  // Slider type — use _slider key, scale by slider values
  if (mapping["_slider"] && typeof response === "object" && !Array.isArray(response)) {
    const sliderEmissions = mapping["_slider"];
    const values = Object.values(response) as number[];
    const avgFactor = values.length > 0 ? values.reduce((s, v) => s + v, 0) / (values.length * 3) : 1;
    for (const e of sliderEmissions) {
      const def = SIGNAL_CATALOG.find(s => s.name === e.signalName);
      signals.push({
        signalName: e.signalName,
        signalCategory: def?.category || "behavior",
        strength: Math.max(1, Math.round(e.strength * avgFactor * 2)),
        sourceQuestKey: questKey,
        sourceInteractionIndex: interactionIndex,
      });
    }
    return signals;
  }

  // Array of selections (multi_select, ranking top items)
  if (Array.isArray(response)) {
    for (const option of response) {
      const emissions = mapping[option];
      if (emissions) addEmissions(emissions);
    }
    return signals;
  }

  // Single selection (card_pick, scenario)
  if (typeof response === "string" || typeof response === "number") {
    const emissions = mapping[String(response)];
    if (emissions) addEmissions(emissions);
    return signals;
  }

  return signals;
}

/**
 * Extract signals from all 4 quest interactions
 */
export function extractAllQuestSignals(
  questKey: string,
  responses: any[]
): ExtractedSignal[] {
  return responses.flatMap((response, index) =>
    extractSignals(questKey, index, response)
  );
}

/**
 * Aggregate signals by name, summing strengths
 */
export function aggregateSignals(signals: ExtractedSignal[]): AggregatedSignal[] {
  const map = new Map<string, number>();
  for (const s of signals) {
    map.set(s.signalName, (map.get(s.signalName) || 0) + s.strength);
  }
  return Array.from(map.entries()).map(([signalName, totalStrength]) => ({
    signalName,
    totalStrength,
  }));
}

/**
 * Detect patterns that cross threshold from aggregated signals
 */
export function detectPatterns(
  aggregated: AggregatedSignal[],
  alreadyDetectedKeys: Set<string>
): DetectedPattern[] {
  const strengthMap = new Map(aggregated.map(s => [s.signalName, s.totalStrength]));
  const detected: DetectedPattern[] = [];

  for (const pattern of PATTERN_DEFINITIONS) {
    if (alreadyDetectedKeys.has(pattern.patternKey)) continue;

    let totalStrength = 0;
    let allMet = true;

    for (const req of pattern.requiredSignals) {
      const current = strengthMap.get(req.signalName) || 0;
      if (current < req.minStrength) {
        allMet = false;
        break;
      }
      totalStrength += current;
    }

    if (allMet && totalStrength >= pattern.threshold) {
      detected.push({ pattern, totalStrength });
    }
  }

  // Sort by total strength descending
  detected.sort((a, b) => b.totalStrength - a.totalStrength);
  return detected;
}

/**
 * Interpret quest result: try pattern detection first, fallback to quest interpret
 */
export function interpretQuestResult(
  questKey: string,
  responses: any[],
  existingSignals: AggregatedSignal[],
  alreadyDetectedPatternKeys: Set<string>,
  fallbackInterpret: (responses: any[]) => DotInterpretation
): {
  dot: DotInterpretation;
  newSignals: ExtractedSignal[];
  detectedPattern: DetectedPattern | null;
  isPatternBased: boolean;
} {
  // Extract new signals from this quest
  const newSignals = extractAllQuestSignals(questKey, responses);

  // Merge with existing
  const allSignals = [...existingSignals];
  const newAgg = aggregateSignals(newSignals);
  for (const ns of newAgg) {
    const existing = allSignals.find(s => s.signalName === ns.signalName);
    if (existing) {
      existing.totalStrength += ns.totalStrength;
    } else {
      allSignals.push({ ...ns });
    }
  }

  // Check for new patterns
  const newPatterns = detectPatterns(allSignals, alreadyDetectedPatternKeys);

  if (newPatterns.length > 0) {
    const best = newPatterns[0];
    return {
      dot: {
        title: best.pattern.title,
        description: best.pattern.description,
        dotCategory: best.pattern.dotCategory,
      },
      newSignals,
      detectedPattern: best,
      isPatternBased: true,
    };
  }

  // Fallback
  return {
    dot: fallbackInterpret(responses),
    newSignals,
    detectedPattern: null,
    isPatternBased: false,
  };
}
