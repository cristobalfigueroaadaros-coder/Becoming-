// Atlas Signal Catalog & Pattern Definitions

export type SignalCategory = "motivation" | "behavior" | "cognitive" | "creative" | "social";
export type DotCategory = "strength" | "shadow" | "life_imprint";

export interface SignalDefinition {
  name: string;
  category: SignalCategory;
  label: string;
}

export const SIGNAL_CATALOG: SignalDefinition[] = [
  // Motivation
  { name: "curiosity", category: "motivation", label: "Curiosity" },
  { name: "vision_thinking", category: "motivation", label: "Vision Thinking" },
  { name: "teaching_impulse", category: "motivation", label: "Teaching Impulse" },
  { name: "purpose_drive", category: "motivation", label: "Purpose Drive" },
  // Behavior
  { name: "experimentation", category: "behavior", label: "Experimentation" },
  { name: "exploration", category: "behavior", label: "Exploration" },
  { name: "leadership", category: "behavior", label: "Leadership" },
  { name: "resilience", category: "behavior", label: "Resilience" },
  // Cognitive
  { name: "pattern_thinking", category: "cognitive", label: "Pattern Thinking" },
  { name: "problem_solving", category: "cognitive", label: "Problem Solving" },
  { name: "reflection", category: "cognitive", label: "Reflection" },
  { name: "systems_thinking", category: "cognitive", label: "Systems Thinking" },
  // Creative
  { name: "creativity", category: "creative", label: "Creativity" },
  { name: "expression", category: "creative", label: "Expression" },
  // Social
  { name: "empathy", category: "social", label: "Empathy" },
  { name: "community_orientation", category: "social", label: "Community Orientation" },
  { name: "connection", category: "social", label: "Connection" },
];

export interface SignalEmission {
  signalName: string;
  strength: number;
}

// Maps: questKey → interactionIndex → optionText → signals emitted
// For reflection type, we emit generic signals based on the quest cluster
export const OPTION_SIGNAL_MAP: Record<string, Record<number, Record<string, SignalEmission[]>>> = {
  life_events_q1: {
    0: {
      "A move to a new place": [{ signalName: "exploration", strength: 2 }, { signalName: "resilience", strength: 1 }],
      "A relationship shift": [{ signalName: "connection", strength: 2 }, { signalName: "empathy", strength: 1 }],
      "A career change": [{ signalName: "experimentation", strength: 2 }, { signalName: "resilience", strength: 1 }],
      "A loss or ending": [{ signalName: "reflection", strength: 2 }, { signalName: "resilience", strength: 2 }],
      "A surprising success": [{ signalName: "creativity", strength: 1 }, { signalName: "purpose_drive", strength: 1 }],
      "A moment of clarity": [{ signalName: "pattern_thinking", strength: 2 }, { signalName: "reflection", strength: 1 }],
    },
    1: {
      "Family experiences": [{ signalName: "connection", strength: 2 }, { signalName: "empathy", strength: 1 }],
      "Travel & places": [{ signalName: "exploration", strength: 2 }, { signalName: "curiosity", strength: 1 }],
      "Education milestones": [{ signalName: "curiosity", strength: 2 }, { signalName: "problem_solving", strength: 1 }],
      "Personal crises": [{ signalName: "resilience", strength: 2 }, { signalName: "reflection", strength: 1 }],
    },
    2: {
      "A moment of courage": [{ signalName: "leadership", strength: 2 }, { signalName: "resilience", strength: 1 }],
      "A moment of connection": [{ signalName: "empathy", strength: 2 }, { signalName: "connection", strength: 1 }],
      "A moment of reinvention": [{ signalName: "experimentation", strength: 2 }, { signalName: "creativity", strength: 1 }],
    },
    3: { _reflection: [{ signalName: "reflection", strength: 1 }, { signalName: "pattern_thinking", strength: 1 }] },
  },
  passions_q1: {
    0: {
      "Creating something new": [{ signalName: "creativity", strength: 3 }, { signalName: "expression", strength: 1 }],
      "Understanding deeply": [{ signalName: "curiosity", strength: 3 }, { signalName: "reflection", strength: 1 }],
      "Helping others grow": [{ signalName: "teaching_impulse", strength: 2 }, { signalName: "empathy", strength: 2 }],
      "Exploring the unknown": [{ signalName: "exploration", strength: 3 }, { signalName: "curiosity", strength: 1 }],
    },
    1: { _slider: [{ signalName: "creativity", strength: 1 }, { signalName: "problem_solving", strength: 1 }, { signalName: "community_orientation", strength: 1 }] },
    2: {
      "Writing or journaling": [{ signalName: "expression", strength: 2 }, { signalName: "reflection", strength: 1 }],
      "Teaching or mentoring": [{ signalName: "teaching_impulse", strength: 2 }, { signalName: "community_orientation", strength: 1 }],
      "Designing or building": [{ signalName: "creativity", strength: 2 }, { signalName: "experimentation", strength: 1 }],
      "Researching or learning": [{ signalName: "curiosity", strength: 2 }, { signalName: "pattern_thinking", strength: 1 }],
      "Physical movement": [{ signalName: "exploration", strength: 1 }, { signalName: "resilience", strength: 1 }],
      "Deep conversations": [{ signalName: "connection", strength: 2 }, { signalName: "empathy", strength: 1 }],
    },
    3: { _reflection: [{ signalName: "purpose_drive", strength: 1 }, { signalName: "curiosity", strength: 1 }] },
  },
  skills_q1: {
    0: {
      "Organizing things": [{ signalName: "systems_thinking", strength: 2 }, { signalName: "leadership", strength: 1 }],
      "Creative ideas": [{ signalName: "creativity", strength: 2 }, { signalName: "expression", strength: 1 }],
      "Emotional support": [{ signalName: "empathy", strength: 3 }, { signalName: "connection", strength: 1 }],
      "Technical problems": [{ signalName: "problem_solving", strength: 3 }, { signalName: "pattern_thinking", strength: 1 }],
      "Strategic thinking": [{ signalName: "systems_thinking", strength: 2 }, { signalName: "vision_thinking", strength: 1 }],
      "Communication": [{ signalName: "expression", strength: 2 }, { signalName: "community_orientation", strength: 1 }],
    },
    1: {
      "Writing & communication": [{ signalName: "expression", strength: 2 }],
      "Analysis & logic": [{ signalName: "problem_solving", strength: 2 }],
      "Leadership & influence": [{ signalName: "leadership", strength: 2 }],
      "Design & aesthetics": [{ signalName: "creativity", strength: 2 }],
    },
    2: {
      "The planner who structures everything": [{ signalName: "systems_thinking", strength: 2 }, { signalName: "leadership", strength: 1 }],
      "The creative who generates ideas": [{ signalName: "creativity", strength: 2 }, { signalName: "experimentation", strength: 1 }],
      "The connector who aligns people": [{ signalName: "community_orientation", strength: 2 }, { signalName: "empathy", strength: 1 }],
    },
    3: { _reflection: [{ signalName: "reflection", strength: 1 }, { signalName: "problem_solving", strength: 1 }] },
  },
  personal_frustrations_q1: {
    0: {
      "Wasted potential": [{ signalName: "purpose_drive", strength: 2 }, { signalName: "vision_thinking", strength: 1 }],
      "Unfairness or injustice": [{ signalName: "empathy", strength: 2 }, { signalName: "purpose_drive", strength: 1 }],
      "Lack of depth": [{ signalName: "reflection", strength: 2 }, { signalName: "curiosity", strength: 1 }],
      "Inefficiency": [{ signalName: "systems_thinking", strength: 2 }, { signalName: "problem_solving", strength: 1 }],
      "Broken systems": [{ signalName: "systems_thinking", strength: 2 }, { signalName: "vision_thinking", strength: 1 }],
      "Apathy": [{ signalName: "purpose_drive", strength: 2 }, { signalName: "community_orientation", strength: 1 }],
    },
    1: {
      "People not reaching their potential": [{ signalName: "teaching_impulse", strength: 2 }, { signalName: "purpose_drive", strength: 1 }],
      "Systems that don't serve people": [{ signalName: "systems_thinking", strength: 2 }, { signalName: "vision_thinking", strength: 1 }],
      "Creativity being suppressed": [{ signalName: "creativity", strength: 2 }, { signalName: "expression", strength: 1 }],
      "Lack of genuine connection": [{ signalName: "connection", strength: 2 }, { signalName: "empathy", strength: 1 }],
    },
    2: { _slider: [{ signalName: "purpose_drive", strength: 1 }, { signalName: "reflection", strength: 1 }, { signalName: "vision_thinking", strength: 1 }] },
    3: { _reflection: [{ signalName: "vision_thinking", strength: 1 }, { signalName: "purpose_drive", strength: 1 }] },
  },
  values_q1: {
    0: {
      "Freedom": [{ signalName: "exploration", strength: 2 }, { signalName: "expression", strength: 1 }],
      "Growth": [{ signalName: "curiosity", strength: 2 }, { signalName: "experimentation", strength: 1 }],
      "Connection": [{ signalName: "connection", strength: 2 }, { signalName: "empathy", strength: 1 }],
      "Impact": [{ signalName: "purpose_drive", strength: 2 }, { signalName: "vision_thinking", strength: 1 }],
    },
    1: {
      "Authenticity": [{ signalName: "expression", strength: 2 }, { signalName: "reflection", strength: 1 }],
      "Fairness": [{ signalName: "empathy", strength: 2 }, { signalName: "purpose_drive", strength: 1 }],
      "Creativity": [{ signalName: "creativity", strength: 2 }, { signalName: "expression", strength: 1 }],
      "Loyalty": [{ signalName: "connection", strength: 2 }, { signalName: "community_orientation", strength: 1 }],
      "Independence": [{ signalName: "exploration", strength: 2 }, { signalName: "leadership", strength: 1 }],
      "Compassion": [{ signalName: "empathy", strength: 2 }, { signalName: "community_orientation", strength: 1 }],
    },
    2: {
      "Honesty over harmony": [{ signalName: "expression", strength: 2 }, { signalName: "leadership", strength: 1 }],
      "Growth over comfort": [{ signalName: "experimentation", strength: 2 }, { signalName: "resilience", strength: 1 }],
      "Community over ambition": [{ signalName: "community_orientation", strength: 2 }, { signalName: "empathy", strength: 1 }],
    },
    3: { _reflection: [{ signalName: "reflection", strength: 1 }, { signalName: "purpose_drive", strength: 1 }] },
  },
  aha_moments_q1: {
    0: {
      "Connecting two unrelated ideas": [{ signalName: "pattern_thinking", strength: 3 }, { signalName: "creativity", strength: 1 }],
      "Seeing a hidden pattern": [{ signalName: "pattern_thinking", strength: 3 }, { signalName: "systems_thinking", strength: 1 }],
      "Understanding someone deeply": [{ signalName: "empathy", strength: 3 }, { signalName: "connection", strength: 1 }],
      "Realizing your own potential": [{ signalName: "purpose_drive", strength: 2 }, { signalName: "reflection", strength: 2 }],
    },
    1: {
      "During conversations": [{ signalName: "connection", strength: 2 }, { signalName: "community_orientation", strength: 1 }],
      "In solitude": [{ signalName: "reflection", strength: 2 }, { signalName: "pattern_thinking", strength: 1 }],
      "While moving": [{ signalName: "exploration", strength: 2 }],
      "Right before sleep": [{ signalName: "reflection", strength: 2 }, { signalName: "curiosity", strength: 1 }],
      "While creating": [{ signalName: "creativity", strength: 2 }, { signalName: "expression", strength: 1 }],
      "While reading": [{ signalName: "curiosity", strength: 2 }, { signalName: "pattern_thinking", strength: 1 }],
    },
    2: { _slider: [{ signalName: "exploration", strength: 1 }, { signalName: "curiosity", strength: 1 }, { signalName: "connection", strength: 1 }] },
    3: { _reflection: [{ signalName: "pattern_thinking", strength: 1 }, { signalName: "reflection", strength: 1 }] },
  },
  inspirations_q1: {
    0: {
      "Bold risk-takers": [{ signalName: "experimentation", strength: 2 }, { signalName: "leadership", strength: 1 }],
      "Quiet creators": [{ signalName: "creativity", strength: 2 }, { signalName: "reflection", strength: 1 }],
      "Community builders": [{ signalName: "community_orientation", strength: 2 }, { signalName: "empathy", strength: 1 }],
      "Deep thinkers": [{ signalName: "reflection", strength: 2 }, { signalName: "curiosity", strength: 1 }],
      "Rebels & mavericks": [{ signalName: "exploration", strength: 2 }, { signalName: "expression", strength: 1 }],
      "Healers & helpers": [{ signalName: "empathy", strength: 2 }, { signalName: "teaching_impulse", strength: 1 }],
    },
    1: {
      "Books & ideas": [{ signalName: "curiosity", strength: 2 }],
      "Real people's stories": [{ signalName: "empathy", strength: 2 }],
      "Art & music": [{ signalName: "expression", strength: 2 }],
      "Nature & silence": [{ signalName: "reflection", strength: 2 }],
    },
    2: {
      "Someone who built something from nothing": [{ signalName: "experimentation", strength: 2 }, { signalName: "creativity", strength: 1 }],
      "Someone who stood up for what's right": [{ signalName: "purpose_drive", strength: 2 }, { signalName: "leadership", strength: 1 }],
      "Someone who found peace after struggle": [{ signalName: "resilience", strength: 2 }, { signalName: "reflection", strength: 1 }],
    },
    3: { _reflection: [{ signalName: "curiosity", strength: 1 }, { signalName: "connection", strength: 1 }] },
  },
  vision_q1: {
    0: {
      "Education for all": [{ signalName: "teaching_impulse", strength: 2 }, { signalName: "purpose_drive", strength: 2 }],
      "Mental health & wellbeing": [{ signalName: "empathy", strength: 2 }, { signalName: "community_orientation", strength: 1 }],
      "Environmental restoration": [{ signalName: "systems_thinking", strength: 2 }, { signalName: "vision_thinking", strength: 1 }],
      "Economic fairness": [{ signalName: "purpose_drive", strength: 2 }, { signalName: "systems_thinking", strength: 1 }],
    },
    1: {
      "Equal opportunity": [{ signalName: "empathy", strength: 2 }, { signalName: "purpose_drive", strength: 1 }],
      "Creative freedom": [{ signalName: "creativity", strength: 2 }, { signalName: "expression", strength: 1 }],
      "Sustainable living": [{ signalName: "systems_thinking", strength: 2 }, { signalName: "vision_thinking", strength: 1 }],
      "Deeper human connection": [{ signalName: "connection", strength: 2 }, { signalName: "empathy", strength: 1 }],
      "Better education": [{ signalName: "teaching_impulse", strength: 2 }, { signalName: "curiosity", strength: 1 }],
      "Health access": [{ signalName: "empathy", strength: 2 }, { signalName: "community_orientation", strength: 1 }],
    },
    2: { _slider: [{ signalName: "community_orientation", strength: 1 }, { signalName: "vision_thinking", strength: 1 }, { signalName: "purpose_drive", strength: 1 }] },
    3: { _reflection: [{ signalName: "vision_thinking", strength: 1 }, { signalName: "expression", strength: 1 }] },
  },
  ideal_life_q1: {
    0: {
      "Creating something meaningful": [{ signalName: "creativity", strength: 2 }, { signalName: "purpose_drive", strength: 1 }],
      "Moving your body in nature": [{ signalName: "exploration", strength: 2 }, { signalName: "resilience", strength: 1 }],
      "Deep learning or reading": [{ signalName: "curiosity", strength: 2 }, { signalName: "reflection", strength: 1 }],
    },
    1: {
      "Creative freedom": [{ signalName: "creativity", strength: 2 }, { signalName: "expression", strength: 1 }],
      "Financial security": [{ signalName: "systems_thinking", strength: 1 }, { signalName: "resilience", strength: 1 }],
      "Deep relationships": [{ signalName: "connection", strength: 2 }, { signalName: "empathy", strength: 1 }],
      "Travel & exploration": [{ signalName: "exploration", strength: 2 }, { signalName: "curiosity", strength: 1 }],
      "Meaningful work": [{ signalName: "purpose_drive", strength: 2 }, { signalName: "vision_thinking", strength: 1 }],
      "Solitude & peace": [{ signalName: "reflection", strength: 2 }, { signalName: "expression", strength: 1 }],
    },
    2: {
      "Location independence": [{ signalName: "exploration", strength: 2 }],
      "Community belonging": [{ signalName: "community_orientation", strength: 2 }],
      "Professional mastery": [{ signalName: "problem_solving", strength: 2 }],
      "Inner peace": [{ signalName: "reflection", strength: 2 }],
    },
    3: { _reflection: [{ signalName: "vision_thinking", strength: 1 }, { signalName: "purpose_drive", strength: 1 }] },
  },
  natural_talents_q1: {
    0: {
      "Making friends": [{ signalName: "community_orientation", strength: 2 }, { signalName: "empathy", strength: 1 }],
      "Imagining stories": [{ signalName: "creativity", strength: 2 }, { signalName: "expression", strength: 1 }],
      "Figuring things out": [{ signalName: "problem_solving", strength: 2 }, { signalName: "curiosity", strength: 1 }],
      "Leading groups": [{ signalName: "leadership", strength: 2 }, { signalName: "community_orientation", strength: 1 }],
      "Creating art": [{ signalName: "creativity", strength: 2 }, { signalName: "expression", strength: 2 }],
      "Noticing details": [{ signalName: "pattern_thinking", strength: 2 }, { signalName: "reflection", strength: 1 }],
    },
    1: {
      "Reading people's emotions": [{ signalName: "empathy", strength: 3 }, { signalName: "connection", strength: 1 }],
      "Simplifying complex things": [{ signalName: "systems_thinking", strength: 2 }, { signalName: "problem_solving", strength: 1 }],
      "Generating creative ideas": [{ signalName: "creativity", strength: 3 }, { signalName: "experimentation", strength: 1 }],
      "Staying calm under pressure": [{ signalName: "resilience", strength: 3 }, { signalName: "leadership", strength: 1 }],
    },
    2: { _slider: [{ signalName: "expression", strength: 1 }, { signalName: "creativity", strength: 1 }, { signalName: "empathy", strength: 1 }] },
    3: { _reflection: [{ signalName: "reflection", strength: 1 }, { signalName: "pattern_thinking", strength: 1 }] },
  },
  childhood_signals_q1: {
    0: {
      "Building & making things": [{ signalName: "creativity", strength: 2 }, { signalName: "experimentation", strength: 1 }],
      "Exploring nature": [{ signalName: "exploration", strength: 2 }, { signalName: "curiosity", strength: 1 }],
      "Reading & imagining": [{ signalName: "curiosity", strength: 2 }, { signalName: "expression", strength: 1 }],
      "Organizing & leading friends": [{ signalName: "leadership", strength: 2 }, { signalName: "community_orientation", strength: 1 }],
    },
    1: {
      "Curiosity": [{ signalName: "curiosity", strength: 2 }],
      "Stubbornness": [{ signalName: "resilience", strength: 2 }],
      "Empathy": [{ signalName: "empathy", strength: 2 }],
      "Creativity": [{ signalName: "creativity", strength: 2 }],
      "Independence": [{ signalName: "exploration", strength: 2 }],
      "Sensitivity": [{ signalName: "empathy", strength: 1 }, { signalName: "reflection", strength: 1 }],
    },
    2: {
      "Still being curious": [{ signalName: "curiosity", strength: 2 }, { signalName: "exploration", strength: 1 }],
      "Following your own path": [{ signalName: "exploration", strength: 2 }, { signalName: "expression", strength: 1 }],
      "Caring deeply about others": [{ signalName: "empathy", strength: 2 }, { signalName: "community_orientation", strength: 1 }],
    },
    3: { _reflection: [{ signalName: "reflection", strength: 1 }, { signalName: "curiosity", strength: 1 }] },
  },
  external_reflections_q1: {
    0: {
      "Thoughtful": [{ signalName: "reflection", strength: 2 }, { signalName: "pattern_thinking", strength: 1 }],
      "Driven": [{ signalName: "purpose_drive", strength: 2 }, { signalName: "leadership", strength: 1 }],
      "Creative": [{ signalName: "creativity", strength: 2 }, { signalName: "expression", strength: 1 }],
      "Kind": [{ signalName: "empathy", strength: 2 }, { signalName: "community_orientation", strength: 1 }],
      "Intense": [{ signalName: "purpose_drive", strength: 2 }, { signalName: "reflection", strength: 1 }],
      "Reliable": [{ signalName: "resilience", strength: 2 }, { signalName: "community_orientation", strength: 1 }],
    },
    1: {
      "Leadership": [{ signalName: "leadership", strength: 2 }],
      "Creativity": [{ signalName: "creativity", strength: 2 }],
      "Empathy": [{ signalName: "empathy", strength: 2 }],
      "Intelligence": [{ signalName: "problem_solving", strength: 2 }],
    },
    2: {
      "People find you inspiring": [{ signalName: "leadership", strength: 2 }, { signalName: "expression", strength: 1 }],
      "People see you as brave": [{ signalName: "resilience", strength: 2 }, { signalName: "experimentation", strength: 1 }],
      "People feel safe around you": [{ signalName: "empathy", strength: 3 }, { signalName: "connection", strength: 1 }],
      "People admire your ideas": [{ signalName: "creativity", strength: 2 }, { signalName: "vision_thinking", strength: 1 }],
    },
    3: { _reflection: [{ signalName: "reflection", strength: 1 }, { signalName: "connection", strength: 1 }] },
  },
  experiments_q1: {
    0: {
      "Dive in headfirst": [{ signalName: "experimentation", strength: 3 }, { signalName: "resilience", strength: 1 }],
      "Research everything first": [{ signalName: "curiosity", strength: 2 }, { signalName: "systems_thinking", strength: 1 }],
      "Find someone to do it with": [{ signalName: "community_orientation", strength: 2 }, { signalName: "connection", strength: 1 }],
    },
    1: {
      "Started a side project": [{ signalName: "experimentation", strength: 2 }, { signalName: "creativity", strength: 1 }],
      "Learned a new skill": [{ signalName: "curiosity", strength: 2 }, { signalName: "experimentation", strength: 1 }],
      "Changed your routine": [{ signalName: "experimentation", strength: 2 }, { signalName: "resilience", strength: 1 }],
      "Traveled solo": [{ signalName: "exploration", strength: 2 }, { signalName: "resilience", strength: 1 }],
      "Started creating content": [{ signalName: "expression", strength: 2 }, { signalName: "creativity", strength: 1 }],
      "Tried a new career path": [{ signalName: "experimentation", strength: 2 }, { signalName: "exploration", strength: 1 }],
    },
    2: { _slider: [{ signalName: "resilience", strength: 1 }, { signalName: "experimentation", strength: 1 }, { signalName: "resilience", strength: 1 }] },
    3: { _reflection: [{ signalName: "reflection", strength: 1 }, { signalName: "experimentation", strength: 1 }] },
  },
};

// Pattern definitions — cross-quest signal combinations
export interface PatternDefinition {
  patternKey: string;
  title: string;
  description: string;
  requiredSignals: { signalName: string; minStrength: number }[];
  threshold: number;
  clusterSlug: string;
  dotCategory: DotCategory;
}

export const PATTERN_DEFINITIONS: PatternDefinition[] = [
  // === STRENGTH patterns ===
  {
    patternKey: "explorer_mindset",
    title: "Explorer Mindset",
    description: "You consistently seek the unknown. Curiosity and exploration drive how you engage with life.",
    requiredSignals: [
      { signalName: "curiosity", minStrength: 3 },
      { signalName: "exploration", minStrength: 3 },
      { signalName: "experimentation", minStrength: 2 },
    ],
    threshold: 8,
    clusterSlug: "passions",
    dotCategory: "strength",
  },
  {
    patternKey: "community_builder",
    title: "Community Builder",
    description: "You naturally create spaces where people feel seen and supported. Connection is your craft.",
    requiredSignals: [
      { signalName: "empathy", minStrength: 3 },
      { signalName: "community_orientation", minStrength: 3 },
      { signalName: "teaching_impulse", minStrength: 2 },
    ],
    threshold: 8,
    clusterSlug: "natural-talents",
    dotCategory: "strength",
  },
  {
    patternKey: "creative_starter",
    title: "Creative Starter",
    description: "You light up when creating from scratch. Imagination and experimentation fuel your energy.",
    requiredSignals: [
      { signalName: "creativity", minStrength: 3 },
      { signalName: "experimentation", minStrength: 2 },
      { signalName: "expression", minStrength: 2 },
    ],
    threshold: 7,
    clusterSlug: "experiments",
    dotCategory: "strength",
  },
  {
    patternKey: "pattern_thinker",
    title: "Pattern Thinker",
    description: "You see connections others miss. Your mind naturally maps relationships between ideas.",
    requiredSignals: [
      { signalName: "pattern_thinking", minStrength: 3 },
      { signalName: "systems_thinking", minStrength: 2 },
      { signalName: "reflection", minStrength: 2 },
    ],
    threshold: 7,
    clusterSlug: "aha-moments",
    dotCategory: "strength",
  },
  {
    patternKey: "empathy_signal",
    title: "Empathy Signal",
    description: "You sense what others feel before they say it. Emotional intelligence is woven into who you are.",
    requiredSignals: [
      { signalName: "empathy", minStrength: 4 },
      { signalName: "connection", minStrength: 2 },
    ],
    threshold: 6,
    clusterSlug: "external-reflections",
    dotCategory: "strength",
  },
  {
    patternKey: "visionary_architect",
    title: "Visionary Architect",
    description: "You see beyond what exists. Vision and purpose guide you toward building a better future.",
    requiredSignals: [
      { signalName: "vision_thinking", minStrength: 3 },
      { signalName: "purpose_drive", minStrength: 3 },
      { signalName: "systems_thinking", minStrength: 2 },
    ],
    threshold: 8,
    clusterSlug: "vision-for-a-better-world",
    dotCategory: "strength",
  },
  {
    patternKey: "resilient_navigator",
    title: "Resilient Navigator",
    description: "You move through difficulty with grace. Challenges become fuel for your growth.",
    requiredSignals: [
      { signalName: "resilience", minStrength: 4 },
      { signalName: "reflection", minStrength: 2 },
    ],
    threshold: 6,
    clusterSlug: "life-events",
    dotCategory: "strength",
  },
  {
    patternKey: "natural_leader",
    title: "Natural Leader",
    description: "People gravitate to your clarity and direction. You lead by inspiring, not commanding.",
    requiredSignals: [
      { signalName: "leadership", minStrength: 3 },
      { signalName: "expression", minStrength: 2 },
      { signalName: "purpose_drive", minStrength: 2 },
    ],
    threshold: 7,
    clusterSlug: "skills",
    dotCategory: "strength",
  },
  {
    patternKey: "reflective_depth",
    title: "Reflective Depth",
    description: "You process life with unusual depth. Reflection is not just a habit — it's how you grow.",
    requiredSignals: [
      { signalName: "reflection", minStrength: 4 },
      { signalName: "curiosity", minStrength: 2 },
    ],
    threshold: 6,
    clusterSlug: "childhood-signals",
    dotCategory: "strength",
  },
  {
    patternKey: "purpose_engine",
    title: "Purpose Engine",
    description: "You are driven by meaning. Everything you do connects back to a deeper why.",
    requiredSignals: [
      { signalName: "purpose_drive", minStrength: 4 },
      { signalName: "vision_thinking", minStrength: 2 },
    ],
    threshold: 6,
    clusterSlug: "values",
    dotCategory: "strength",
  },
  {
    patternKey: "freedom_designer",
    title: "Freedom Designer",
    description: "You design life around autonomy. Exploration and expression define your ideal path.",
    requiredSignals: [
      { signalName: "exploration", minStrength: 3 },
      { signalName: "expression", minStrength: 2 },
      { signalName: "creativity", minStrength: 2 },
    ],
    threshold: 7,
    clusterSlug: "ideal-life",
    dotCategory: "strength",
  },
  {
    patternKey: "wisdom_seeker",
    title: "Wisdom Seeker",
    description: "You are drawn to people and ideas that carry depth. Learning never stops for you.",
    requiredSignals: [
      { signalName: "curiosity", minStrength: 3 },
      { signalName: "reflection", minStrength: 3 },
    ],
    threshold: 6,
    clusterSlug: "inspirations",
    dotCategory: "strength",
  },

  // === SHADOW patterns ===
  {
    patternKey: "fear_of_failure",
    title: "Fear of Failure",
    description: "A protective pattern that holds you back from taking risks. Your high standards create invisible barriers.",
    requiredSignals: [
      { signalName: "reflection", minStrength: 4 },
      { signalName: "purpose_drive", minStrength: 3 },
    ],
    threshold: 7,
    clusterSlug: "personal-frustrations",
    dotCategory: "shadow",
  },
  {
    patternKey: "perfectionism_loop",
    title: "Perfectionism Loop",
    description: "You set impossibly high standards. This drive for excellence can become a cage that prevents action.",
    requiredSignals: [
      { signalName: "systems_thinking", minStrength: 3 },
      { signalName: "reflection", minStrength: 3 },
      { signalName: "problem_solving", minStrength: 2 },
    ],
    threshold: 8,
    clusterSlug: "personal-frustrations",
    dotCategory: "shadow",
  },
  {
    patternKey: "avoidance_pattern",
    title: "Avoidance Pattern",
    description: "You explore endlessly but sometimes avoid commitment. Freedom becomes a way to escape depth.",
    requiredSignals: [
      { signalName: "exploration", minStrength: 4 },
      { signalName: "experimentation", minStrength: 3 },
    ],
    threshold: 7,
    clusterSlug: "external-reflections",
    dotCategory: "shadow",
  },
  {
    patternKey: "overgiving_tendency",
    title: "Overgiving Tendency",
    description: "Your deep empathy can lead to giving more than you receive, depleting your own reserves.",
    requiredSignals: [
      { signalName: "empathy", minStrength: 5 },
      { signalName: "community_orientation", minStrength: 3 },
    ],
    threshold: 8,
    clusterSlug: "external-reflections",
    dotCategory: "shadow",
  },

  // === LIFE IMPRINT patterns ===
  {
    patternKey: "mentor_influence",
    title: "Mentor Influence",
    description: "A significant person shaped how you see the world. Their impact lives on in your values and choices.",
    requiredSignals: [
      { signalName: "teaching_impulse", minStrength: 3 },
      { signalName: "connection", minStrength: 3 },
    ],
    threshold: 6,
    clusterSlug: "life-events",
    dotCategory: "life_imprint",
  },
  {
    patternKey: "turning_point",
    title: "Turning Point Experience",
    description: "A pivotal moment redirected your path. This experience still shapes your decisions today.",
    requiredSignals: [
      { signalName: "resilience", minStrength: 3 },
      { signalName: "reflection", minStrength: 3 },
      { signalName: "exploration", minStrength: 2 },
    ],
    threshold: 8,
    clusterSlug: "life-events",
    dotCategory: "life_imprint",
  },
  {
    patternKey: "creative_awakening",
    title: "Creative Awakening",
    description: "A moment when your creative nature first revealed itself. This spark continues to define you.",
    requiredSignals: [
      { signalName: "creativity", minStrength: 4 },
      { signalName: "expression", minStrength: 3 },
    ],
    threshold: 7,
    clusterSlug: "childhood-signals",
    dotCategory: "life_imprint",
  },
];
