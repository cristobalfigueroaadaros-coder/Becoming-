// Anchor type classification for the Living Constellation
// Determines whether a dot belongs to Becoming (identity), Creating (action), or Both (bridge)

export type AnchorType = 'becoming' | 'creating' | 'both';

// Source types that are identity-oriented (Becoming)
const BECOMING_SOURCE_TYPES = new Set([
  'core_values',
  'ikigai',
  'strengths',
  'my_why',
  'patterns',
  'shadow_work',
  'quest_completion',
  'self_discovery',
  'future_self',
  'emotion',
  'memory',
  'value',
  'belief',
  'identity',
  'reflection',
]);

// Source types that are action-oriented (Creating)
const CREATING_SOURCE_TYPES = new Set([
  'integrator_step',
  'focus_mode',
  'milestone',
  'project',
  'task',
  'experiment',
  'skill',
  'output',
  'creation',
  'iteration',
  'validation',
  'failure',
  'learning',
]);

// Source types that can be both (depends on content)
const HYBRID_SOURCE_TYPES = new Set([
  'journal',
  'insight',
  'book',
  'idea',
  'mentor_chat',
  'council_meeting',
  'custom',
]);

// Keywords that indicate identity/becoming focus
const BECOMING_KEYWORDS = [
  'who i am',
  'identity',
  'values',
  'strength',
  'purpose',
  'meaning',
  'belief',
  'feel',
  'emotion',
  'self',
  'growth',
  'awareness',
  'pattern',
  'shadow',
  'fear',
  'desire',
  'authentic',
  'becoming',
  'understand myself',
  'realize',
  'discover about myself',
];

// Keywords that indicate action/creating focus
const CREATING_KEYWORDS = [
  'build',
  'create',
  'make',
  'launch',
  'ship',
  'complete',
  'finish',
  'achieve',
  'accomplish',
  'project',
  'task',
  'goal',
  'milestone',
  'skill',
  'learn how to',
  'implement',
  'execute',
  'action',
  'result',
  'output',
  'product',
  'deliver',
];

/**
 * Classify a dot's anchor type based on its source type and content
 */
export function classifyAnchorType(
  sourceType: string,
  content: string
): AnchorType {
  const normalizedSourceType = sourceType.toLowerCase().trim();
  const normalizedContent = content.toLowerCase();

  // Direct classification for known source types
  if (BECOMING_SOURCE_TYPES.has(normalizedSourceType)) {
    // Check if content also has creating keywords → bridge
    const hasCreatingKeywords = CREATING_KEYWORDS.some(kw => 
      normalizedContent.includes(kw)
    );
    return hasCreatingKeywords ? 'both' : 'becoming';
  }

  if (CREATING_SOURCE_TYPES.has(normalizedSourceType)) {
    // Check if content also has becoming keywords → bridge
    const hasBecomingKeywords = BECOMING_KEYWORDS.some(kw => 
      normalizedContent.includes(kw)
    );
    return hasBecomingKeywords ? 'both' : 'creating';
  }

  // For hybrid types, analyze content
  if (HYBRID_SOURCE_TYPES.has(normalizedSourceType)) {
    const becomingScore = BECOMING_KEYWORDS.filter(kw => 
      normalizedContent.includes(kw)
    ).length;
    
    const creatingScore = CREATING_KEYWORDS.filter(kw => 
      normalizedContent.includes(kw)
    ).length;

    if (becomingScore > 0 && creatingScore > 0) {
      return 'both'; // Bridge
    } else if (becomingScore > creatingScore) {
      return 'becoming';
    } else if (creatingScore > becomingScore) {
      return 'creating';
    }
  }

  // Default to 'both' for unknown types
  return 'both';
}

/**
 * Get the visual position angle for a dot based on its anchor type
 * Becoming: left/top quadrants (180-360 degrees)
 * Creating: right/bottom quadrants (0-180 degrees)
 * Both: along the boundary (around 0, 90, 180, 270 degrees)
 */
export function getAnchorAngleRange(anchorType: AnchorType): { min: number; max: number } {
  switch (anchorType) {
    case 'becoming':
      return { min: 180, max: 360 }; // Left side (top-left to bottom-left)
    case 'creating':
      return { min: 0, max: 180 }; // Right side (top-right to bottom-right)
    case 'both':
      // Bridge dots spread along boundaries
      return { min: 0, max: 360 };
  }
}

/**
 * Get color for anchor type
 */
export function getAnchorColor(anchorType: AnchorType): string {
  switch (anchorType) {
    case 'becoming':
      return 'hsl(270 75% 60%)'; // Violet
    case 'creating':
      return 'hsl(45 90% 55%)'; // Amber
    case 'both':
      return 'hsl(200 70% 55%)'; // Teal (bridge)
  }
}

/**
 * Get label for anchor type
 */
export function getAnchorLabel(anchorType: AnchorType): string {
  switch (anchorType) {
    case 'becoming':
      return 'Identity';
    case 'creating':
      return 'Action';
    case 'both':
      return 'Bridge';
  }
}
