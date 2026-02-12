import type { TransmutationData } from "@/hooks/useInnerPatterns";

/**
 * Generates a Golden Nugget Summary connecting the full transmutation arc.
 * This is the primary artifact that appears in the Lifetime Map.
 */
export function generateGoldenSummary(data: TransmutationData, patternName: string, primaryEmotion?: string, skillGained?: string): string {
  const parts: string[] = [];

  // The shadow/what happened
  if (data.shadow || patternName) {
    parts.push(`I went through ${data.shadow || patternName}.`);
  }

  // The main emotional trigger
  if (primaryEmotion) {
    parts.push(`The core emotion was ${primaryEmotion.toLowerCase()}.`);
  }

  // The challenge/lesson
  if (data.lesson_learned) {
    parts.push(`It challenged me, but I learned ${data.lesson_learned.toLowerCase()}.`);
  }

  // The shift
  if (data.shift_moment) {
    parts.push(`Then something shifted: ${data.shift_moment}`);
  }

  // What I became/gained
  if (data.gold_insight) {
    const gainText = data.gold_insight.endsWith('.') 
      ? data.gold_insight 
      : `${data.gold_insight}.`;
    parts.push(`I became ${gainText}`);
  }

  // The brave step/creation
  if (data.brave_step) {
    parts.push(`Now I'm taking action: ${data.brave_step}`);
  }

  // The primary skill gained
  if (skillGained) {
    parts.push(`My superpower: ${skillGained}.`);
  }

  return parts.join(' ').trim();
}

/**
 * Check if White phase is complete (minimum 2 of 3 required fields)
 */
export function isWhitePhaseComplete(data: TransmutationData): boolean {
  let count = 0;
  if (data.shift_moment) count++;
  if (data.protective_purpose) count++;
  if (data.lesson_learned) count++;
  return count >= 2; // Minimum 2 of 3 required
}

/**
 * Check if Gold phase is complete (minimum 2 of 3 required fields)
 */
export function isGoldPhaseComplete(data: TransmutationData): boolean {
  let count = 0;
  if (data.gold_insight) count++;
  if (data.letter_to_self) count++;
  if (data.brave_step) count++;
  return count >= 2; // Minimum 2 of 3 required
}
