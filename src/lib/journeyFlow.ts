// Shared single source of truth for phase-based progression thresholds and
// default mentor sets. Imported by Home, Atlas, Chats, and the project flow
// to prevent the values from drifting apart across the app.

export type EntryPhase = "DISCOVER" | "GROW" | "BUILD";

export const FUTURE_SELF_ONBOARDING_STEPS = ["origin", "gifts", "world", "experiments"] as const;

export function getFutureSelfOnboardingProgress(quests: readonly {
  quest_key?: string | null;
  status?: string | null;
  interactions?: unknown;
}[]) {
  const completedThemes = new Set<string>();
  for (const quest of quests) {
    if (quest.status !== "completed") continue;
    const metadata = quest.interactions as { source?: string; questTheme?: string } | null | undefined;
    if (!quest.quest_key?.startsWith("future_self_") && metadata?.source !== "future_self_discovery") continue;
    const theme = metadata?.questTheme ?? quest.quest_key?.split("_").pop();
    if (theme) completedThemes.add(theme);
  }
  const firstIncomplete = FUTURE_SELF_ONBOARDING_STEPS.findIndex((step) => !completedThemes.has(step));
  const completedSteps = firstIncomplete < 0 ? FUTURE_SELF_ONBOARDING_STEPS.length : firstIncomplete;
  const nextTheme: (typeof FUTURE_SELF_ONBOARDING_STEPS)[number] | "current" =
    firstIncomplete < 0 ? "current" : FUTURE_SELF_ONBOARDING_STEPS[firstIncomplete];
  return {
    completedSteps,
    nextTheme,
    crisMapUnlocked: completedSteps >= 2,
    lifetimeUnlocked: completedSteps >= 3,
    consoleUnlocked: completedSteps === FUTURE_SELF_ONBOARDING_STEPS.length,
  };
}

/**
 * Number of completed Atlas quests required to unlock the Council / Chats
 * intake for each entry phase.
 */
export const COUNCIL_THRESHOLDS: Record<EntryPhase, number> = {
  DISCOVER: 4,
  GROW: 3,
  BUILD: 2,
};

export function councilThresholdFor(state: string | null | undefined): number {
  const key = (state || "DISCOVER") as EntryPhase;
  return COUNCIL_THRESHOLDS[key] ?? COUNCIL_THRESHOLDS.DISCOVER;
}

export function hasCouncilUnlock(
  state: string | null | undefined,
  completedQuestCount: number,
  lifetimeAnchorCount: number,
): boolean {
  return completedQuestCount >= councilThresholdFor(state) && lifetimeAnchorCount > 0;
}

/**
 * Default 7 mentors per phase. Mirrors the assignment in OnboardingStep2 so
 * Chats / ConsoleThread can self-heal a missing user_mentors set without
 * reverting to a generic / empty council.
 */
export const DEFAULT_MENTORS_BY_PHASE: Record<EntryPhase, string[]> = {
  DISCOVER: [
    "strategist_mentor",
    "creative_visionary",
    "inner_clarity_mentor",
    "problem_mentor",
    "perspective_mentor",
    "alignment_mentor",
    "challenger_mentor",
  ],
  GROW: [
    "strategist_mentor",
    "creative_visionary",
    "business_mentor",
    "marketing_mentor",
    "perspective_mentor",
    "challenger_mentor",
    "design_thinking_mentor",
  ],
  BUILD: [
    "strategist_mentor",
    "creative_visionary",
    "business_mentor",
    "discipline_mentor",
    "marketing_mentor",
    "problem_mentor",
    "design_thinking_mentor",
  ],
};

export function defaultMentorsFor(state: string | null | undefined): string[] {
  const key = (state || "DISCOVER") as EntryPhase;
  return DEFAULT_MENTORS_BY_PHASE[key] || DEFAULT_MENTORS_BY_PHASE.DISCOVER;
}
