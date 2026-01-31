import type { TimePeriod } from "@/hooks/useLifetimeEvents";

export type PatternType =
  | "limiting_belief"
  | "protection_mechanism"
  | "relational_pattern"
  | "self_sabotage"
  | "emotional_block"
  | "core_wound"
  | "life_event"; // For when no clear pattern emerges, use the life event itself

export interface ExtractedPatternData {
  patternName: string;
  patternType: PatternType;
  lifeEvent: string;
  triggerContext?: string;
  emotionalImpact?: string;
  mentalLoop?: string;
  protectiveBehavior?: string;
  consequence?: string;
  primaryEmotion?: string;
  relatedEmotions?: string[];
  bodySensation?: string;
  timePeriod?: TimePeriod;
}

export interface PatternMapNodeData {
  trigger_event?: string;
  old_story?: string;
  mental_loop?: string;
  cost?: string;
  protective_role?: string;
  life_event?: string;
  life_event_age_category?: string;
}
