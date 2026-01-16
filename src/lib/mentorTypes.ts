// Centralized mentor type configuration - single source of truth

export const VALID_MENTOR_IDS = [
  "discipline_mentor",
  "strategist_mentor", 
  "creative_visionary",
  "quantum_inventor",
  "mystic_mentor",
  "business_mentor",
  "marketing_mentor",
  "scientific_mentor",
  "heart_mentor",
  "ancient_sage",
  "alignment_mentor",
  "oracle_mother",
  "future_self",
  // New mentors from PDR expansion
  "perspective_mentor",
  "challenger_mentor",
  "design_thinking_mentor",
  "ux_mentor",
  "gamification_mentor"
] as const;

export type ValidMentorId = typeof VALID_MENTOR_IDS[number];

export const mentorDisplayNames: Record<ValidMentorId, string> = {
  discipline_mentor: "The Discipline Mentor",
  strategist_mentor: "The Strategist Mentor",
  business_mentor: "The Business Mentor",
  creative_visionary: "The Creative Visionary",
  marketing_mentor: "The Marketing Mentor",
  quantum_inventor: "The Quantum Inventor",
  scientific_mentor: "The Scientific Mentor",
  mystic_mentor: "The Mystic Mentor",
  ancient_sage: "The Ancient Sage",
  alignment_mentor: "The Alignment Mentor",
  oracle_mother: "The Oracle Mother",
  heart_mentor: "The Heart Mentor",
  future_self: "Your Future Self",
  // New mentors from PDR expansion
  perspective_mentor: "The Perspective Mentor",
  challenger_mentor: "The Challenger Mentor",
  design_thinking_mentor: "The Design Thinking Mentor",
  ux_mentor: "The User Experience Mentor",
  gamification_mentor: "The Gamification Mentor",
};

// Map of common aliases to canonical mentor IDs
const mentorAliases: Record<string, ValidMentorId> = {
  // Creative
  "creative_mentor": "creative_visionary",
  "creative": "creative_visionary",
  "creative visionary": "creative_visionary",
  "the creative": "creative_visionary",
  "visionary": "creative_visionary",
  
  // Strategist
  "strategist": "strategist_mentor",
  "strategy_mentor": "strategist_mentor",
  "strategy mentor": "strategist_mentor",
  "the strategist": "strategist_mentor",
  
  // Discipline
  "discipline": "discipline_mentor",
  "the discipline": "discipline_mentor",
  
  // Business
  "business": "business_mentor",
  "the business": "business_mentor",
  
  // Mystic
  "mystic": "mystic_mentor",
  "the mystic": "mystic_mentor",
  
  // Heart
  "heart": "heart_mentor",
  "the heart": "heart_mentor",
  
  // Ancient Sage
  "sage": "ancient_sage",
  "the sage": "ancient_sage",
  
  // Oracle Mother
  "oracle": "oracle_mother",
  "the oracle": "oracle_mother",
  "mother": "oracle_mother",
  
  // Quantum
  "quantum": "quantum_inventor",
  "inventor": "quantum_inventor",
  "the quantum": "quantum_inventor",
  
  // Marketing
  "marketing": "marketing_mentor",
  "the marketing": "marketing_mentor",
  
  // Scientific
  "scientific": "scientific_mentor",
  "science": "scientific_mentor",
  "scientist": "scientific_mentor",
  
  // Alignment
  "alignment": "alignment_mentor",
  "the alignment": "alignment_mentor",
  
  // Future Self
  "future": "future_self",
  "future self": "future_self",
  "your future self": "future_self",
  
  // Perspective Mentor
  "perspective": "perspective_mentor",
  "cartographer": "perspective_mentor",
  "the cartographer": "perspective_mentor",
  "the perspective": "perspective_mentor",
  
  // Challenger Mentor
  "challenger": "challenger_mentor",
  "socratic": "challenger_mentor",
  "the challenger": "challenger_mentor",
  "socratic challenger": "challenger_mentor",
  
  // Design Thinking Mentor
  "design thinking": "design_thinking_mentor",
  "design_thinking": "design_thinking_mentor",
  "experimenter": "design_thinking_mentor",
  "the experimenter": "design_thinking_mentor",
  "experimenter companion": "design_thinking_mentor",
  
  // UX Mentor
  "ux": "ux_mentor",
  "user experience": "ux_mentor",
  "empathic guide": "ux_mentor",
  "the empathic guide": "ux_mentor",
  
  // Gamification Mentor
  "gamification": "gamification_mentor",
  "game mentor": "gamification_mentor",
  "experience architect": "gamification_mentor",
  "the experience architect": "gamification_mentor",
};

/**
 * Canonicalize a mentor type string to a valid mentor ID.
 * Returns the canonical ID if found, or null if no match.
 */
export function canonicalizeMentorType(mentorType: string | undefined | null): ValidMentorId | null {
  if (!mentorType) return null;
  
  // Normalize: trim, lowercase, replace common separators
  const normalized = mentorType.trim().toLowerCase().replace(/-/g, '_');
  
  // Check if it's already a valid ID
  if (VALID_MENTOR_IDS.includes(normalized as ValidMentorId)) {
    return normalized as ValidMentorId;
  }
  
  // Check aliases
  if (mentorAliases[normalized]) {
    return mentorAliases[normalized];
  }
  
  // Try without underscores (e.g., "creativementor" -> "creative_mentor")
  const withoutUnderscores = normalized.replace(/_/g, '');
  for (const validId of VALID_MENTOR_IDS) {
    if (validId.replace(/_/g, '') === withoutUnderscores) {
      return validId;
    }
  }
  
  return null;
}

/**
 * Check if a string is a valid mentor ID
 */
export function isValidMentorId(mentorType: string | undefined | null): mentorType is ValidMentorId {
  return !!mentorType && VALID_MENTOR_IDS.includes(mentorType as ValidMentorId);
}
