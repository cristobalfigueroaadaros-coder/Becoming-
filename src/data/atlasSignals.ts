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
  // ===== LIFE EVENTS =====
  life_events_q1: {
    0: { _reflection: [{ signalName: "resilience", strength: 2 }, { signalName: "reflection", strength: 1 }] }, // then_vs_now treated as reflection
    1: {
      "A mountain climb — steep but worth it": [{ signalName: "resilience", strength: 2 }, { signalName: "purpose_drive", strength: 1 }],
      "A winding river — always moving": [{ signalName: "exploration", strength: 2 }, { signalName: "experimentation", strength: 1 }],
      "An open road — full of choices": [{ signalName: "exploration", strength: 2 }, { signalName: "expression", strength: 1 }],
      "A maze — surprising turns": [{ signalName: "resilience", strength: 2 }, { signalName: "pattern_thinking", strength: 1 }],
    },
    2: {
      "Moving to a new place": [{ signalName: "exploration", strength: 2 }, { signalName: "resilience", strength: 1 }],
      "A relationship change": [{ signalName: "connection", strength: 2 }, { signalName: "empathy", strength: 1 }],
      "A career shift": [{ signalName: "experimentation", strength: 2 }, { signalName: "resilience", strength: 1 }],
      "A loss or ending": [{ signalName: "reflection", strength: 2 }, { signalName: "resilience", strength: 2 }],
      "An unexpected win": [{ signalName: "creativity", strength: 1 }, { signalName: "purpose_drive", strength: 1 }],
      "A moment of clarity": [{ signalName: "pattern_thinking", strength: 2 }, { signalName: "reflection", strength: 1 }],
    },
    3: { _reflection: [{ signalName: "reflection", strength: 1 }, { signalName: "pattern_thinking", strength: 1 }] },
  },
  life_events_q2: {
    0: {
      "A sudden change": [{ signalName: "resilience", strength: 2 }, { signalName: "experimentation", strength: 1 }],
      "A slow realization": [{ signalName: "reflection", strength: 2 }, { signalName: "pattern_thinking", strength: 1 }],
      "An unexpected chance": [{ signalName: "exploration", strength: 2 }, { signalName: "curiosity", strength: 1 }],
      "A painful ending": [{ signalName: "resilience", strength: 2 }, { signalName: "reflection", strength: 2 }],
    },
    1: { _emoji: [{ signalName: "resilience", strength: 2 }, { signalName: "reflection", strength: 1 }] },
    2: {
      "To trust myself": [{ signalName: "leadership", strength: 2 }, { signalName: "resilience", strength: 1 }],
      "To let go": [{ signalName: "reflection", strength: 2 }, { signalName: "resilience", strength: 1 }],
      "To ask for help": [{ signalName: "connection", strength: 2 }, { signalName: "empathy", strength: 1 }],
      "To keep going": [{ signalName: "resilience", strength: 2 }, { signalName: "purpose_drive", strength: 1 }],
      "To change direction": [{ signalName: "experimentation", strength: 2 }, { signalName: "exploration", strength: 1 }],
      "To listen more": [{ signalName: "empathy", strength: 2 }, { signalName: "reflection", strength: 1 }],
    },
    3: { _reflection: [{ signalName: "resilience", strength: 1 }, { signalName: "reflection", strength: 1 }] },
  },
  life_events_q3: {
    0: { _emoji: [{ signalName: "reflection", strength: 2 }, { signalName: "empathy", strength: 1 }] },
    1: {
      "People who challenged me": [{ signalName: "resilience", strength: 2 }, { signalName: "connection", strength: 1 }],
      "Places that changed me": [{ signalName: "exploration", strength: 2 }, { signalName: "curiosity", strength: 1 }],
      "Decisions I almost didn't make": [{ signalName: "leadership", strength: 2 }, { signalName: "experimentation", strength: 1 }],
    },
    2: {
      "Adapt quickly": [{ signalName: "resilience", strength: 2 }],
      "Process deeply": [{ signalName: "reflection", strength: 2 }],
      "Seek support": [{ signalName: "connection", strength: 2 }],
      "Take action": [{ signalName: "leadership", strength: 2 }],
    },
    3: { _reflection: [{ signalName: "reflection", strength: 1 }, { signalName: "resilience", strength: 1 }] },
  },
  life_events_q4: {
    0: {
      "A spiral — returning deeper each time": [{ signalName: "reflection", strength: 2 }, { signalName: "pattern_thinking", strength: 1 }],
      "A river — always flowing forward": [{ signalName: "exploration", strength: 2 }, { signalName: "resilience", strength: 1 }],
      "A mosaic — many pieces forming a picture": [{ signalName: "creativity", strength: 2 }, { signalName: "pattern_thinking", strength: 1 }],
      "A book — with clear chapters": [{ signalName: "systems_thinking", strength: 2 }, { signalName: "reflection", strength: 1 }],
    },
    1: {
      "Starting over": [{ signalName: "experimentation", strength: 2 }, { signalName: "resilience", strength: 1 }],
      "Deep connections": [{ signalName: "connection", strength: 2 }, { signalName: "empathy", strength: 1 }],
      "Creative bursts": [{ signalName: "creativity", strength: 2 }, { signalName: "expression", strength: 1 }],
      "Solitude": [{ signalName: "reflection", strength: 2 }],
      "Breaking free": [{ signalName: "exploration", strength: 2 }, { signalName: "expression", strength: 1 }],
      "Learning the hard way": [{ signalName: "resilience", strength: 2 }, { signalName: "reflection", strength: 1 }],
    },
    2: {
      "How often I reinvent myself": [{ signalName: "experimentation", strength: 2 }],
      "How deeply I care": [{ signalName: "empathy", strength: 2 }],
      "How resilient I am": [{ signalName: "resilience", strength: 2 }],
      "How much I've changed": [{ signalName: "exploration", strength: 2 }],
    },
    3: { _reflection: [{ signalName: "pattern_thinking", strength: 1 }, { signalName: "reflection", strength: 1 }] },
  },

  // ===== PASSIONS =====
  passions_q1: {
    0: {
      "A bonfire — warm and magnetic": [{ signalName: "community_orientation", strength: 2 }, { signalName: "expression", strength: 1 }],
      "A lightning bolt — intense and sudden": [{ signalName: "creativity", strength: 2 }, { signalName: "experimentation", strength: 1 }],
      "A steady candle — calm and focused": [{ signalName: "reflection", strength: 2 }, { signalName: "purpose_drive", strength: 1 }],
      "A sunrise — growing and hopeful": [{ signalName: "curiosity", strength: 2 }, { signalName: "vision_thinking", strength: 1 }],
    },
    1: { _emoji: [{ signalName: "creativity", strength: 2 }, { signalName: "purpose_drive", strength: 1 }] },
    2: {
      "Writing or journaling": [{ signalName: "expression", strength: 2 }, { signalName: "reflection", strength: 1 }],
      "Teaching or mentoring": [{ signalName: "teaching_impulse", strength: 2 }, { signalName: "community_orientation", strength: 1 }],
      "Designing or building": [{ signalName: "creativity", strength: 2 }, { signalName: "experimentation", strength: 1 }],
      "Researching or learning": [{ signalName: "curiosity", strength: 2 }, { signalName: "pattern_thinking", strength: 1 }],
      "Moving my body": [{ signalName: "exploration", strength: 1 }, { signalName: "resilience", strength: 1 }],
      "Deep conversations": [{ signalName: "connection", strength: 2 }, { signalName: "empathy", strength: 1 }],
    },
    3: { _reflection: [{ signalName: "purpose_drive", strength: 1 }, { signalName: "curiosity", strength: 1 }] },
  },
  passions_q2: {
    0: {
      "People and behavior": [{ signalName: "empathy", strength: 2 }, { signalName: "pattern_thinking", strength: 1 }],
      "Technology and ideas": [{ signalName: "curiosity", strength: 2 }, { signalName: "systems_thinking", strength: 1 }],
      "Art and design": [{ signalName: "creativity", strength: 2 }, { signalName: "expression", strength: 1 }],
      "Meaning and purpose": [{ signalName: "purpose_drive", strength: 2 }, { signalName: "reflection", strength: 1 }],
      "Nature and science": [{ signalName: "curiosity", strength: 2 }, { signalName: "exploration", strength: 1 }],
      "Stories and history": [{ signalName: "reflection", strength: 2 }, { signalName: "curiosity", strength: 1 }],
    },
    1: {
      "Creating something from scratch": [{ signalName: "creativity", strength: 2 }, { signalName: "experimentation", strength: 1 }],
      "Learning something new": [{ signalName: "curiosity", strength: 2 }, { signalName: "exploration", strength: 1 }],
      "Connecting with someone deeply": [{ signalName: "connection", strength: 2 }, { signalName: "empathy", strength: 1 }],
    },
    2: { _slider: [{ signalName: "creativity", strength: 1 }, { signalName: "reflection", strength: 1 }, { signalName: "community_orientation", strength: 1 }] },
    3: { _reflection: [{ signalName: "expression", strength: 1 }, { signalName: "curiosity", strength: 1 }] },
  },
  passions_q3: {
    0: {
      "Making something beautiful": [{ signalName: "creativity", strength: 2 }, { signalName: "expression", strength: 1 }],
      "Understanding something complex": [{ signalName: "curiosity", strength: 2 }, { signalName: "systems_thinking", strength: 1 }],
      "Helping someone grow": [{ signalName: "teaching_impulse", strength: 2 }, { signalName: "empathy", strength: 1 }],
      "Discovering something new": [{ signalName: "exploration", strength: 2 }, { signalName: "curiosity", strength: 1 }],
    },
    1: {
      "A steady flame — consistent and deep": [{ signalName: "reflection", strength: 2 }, { signalName: "purpose_drive", strength: 1 }],
      "A lightning bolt — intense bursts": [{ signalName: "creativity", strength: 2 }, { signalName: "experimentation", strength: 1 }],
      "A flowing river — always moving": [{ signalName: "exploration", strength: 2 }, { signalName: "resilience", strength: 1 }],
      "A volcano — dormant then explosive": [{ signalName: "creativity", strength: 2 }, { signalName: "expression", strength: 1 }],
    },
    2: {
      "Quiet and solitude": [{ signalName: "reflection", strength: 2 }],
      "Inspiring people": [{ signalName: "community_orientation", strength: 2 }],
      "A clear challenge": [{ signalName: "problem_solving", strength: 2 }],
      "Freedom to try": [{ signalName: "experimentation", strength: 2 }],
      "Strong emotions": [{ signalName: "expression", strength: 2 }],
      "A deadline": [{ signalName: "resilience", strength: 1 }, { signalName: "systems_thinking", strength: 1 }],
    },
    3: { _reflection: [{ signalName: "creativity", strength: 1 }, { signalName: "reflection", strength: 1 }] },
  },
  passions_q4: {
    0: {
      "Art + Technology": [{ signalName: "creativity", strength: 2 }, { signalName: "systems_thinking", strength: 1 }],
      "Psychology + Teaching": [{ signalName: "empathy", strength: 2 }, { signalName: "teaching_impulse", strength: 1 }],
      "Science + Storytelling": [{ signalName: "curiosity", strength: 2 }, { signalName: "expression", strength: 1 }],
      "Design + Community": [{ signalName: "creativity", strength: 2 }, { signalName: "community_orientation", strength: 1 }],
      "Philosophy + Action": [{ signalName: "reflection", strength: 2 }, { signalName: "leadership", strength: 1 }],
      "Nature + Innovation": [{ signalName: "exploration", strength: 2 }, { signalName: "experimentation", strength: 1 }],
    },
    1: {
      "Creativity and impact": [{ signalName: "creativity", strength: 2 }, { signalName: "purpose_drive", strength: 1 }],
      "Knowledge and connection": [{ signalName: "curiosity", strength: 2 }, { signalName: "connection", strength: 1 }],
      "Freedom and purpose": [{ signalName: "exploration", strength: 2 }, { signalName: "purpose_drive", strength: 1 }],
    },
    2: { _emoji: [{ signalName: "purpose_drive", strength: 2 }, { signalName: "creativity", strength: 1 }] },
    3: { _reflection: [{ signalName: "creativity", strength: 1 }, { signalName: "purpose_drive", strength: 1 }] },
  },

  // ===== SKILLS =====
  skills_q1: {
    0: { // tap_resonates — each word maps to a signal
      "Organizing": [{ signalName: "systems_thinking", strength: 2 }],
      "Creating": [{ signalName: "creativity", strength: 2 }],
      "Listening": [{ signalName: "empathy", strength: 2 }],
      "Analyzing": [{ signalName: "problem_solving", strength: 2 }],
      "Leading": [{ signalName: "leadership", strength: 2 }],
      "Teaching": [{ signalName: "teaching_impulse", strength: 2 }],
      "Writing": [{ signalName: "expression", strength: 2 }],
      "Designing": [{ signalName: "creativity", strength: 2 }],
      "Negotiating": [{ signalName: "leadership", strength: 1 }, { signalName: "empathy", strength: 1 }],
      "Storytelling": [{ signalName: "expression", strength: 2 }],
      _reflection: [{ signalName: "reflection", strength: 1 }, { signalName: "problem_solving", strength: 1 }],
    },
    1: {
      "Writing": [{ signalName: "expression", strength: 2 }],
      "Analysis": [{ signalName: "problem_solving", strength: 2 }],
      "Leadership": [{ signalName: "leadership", strength: 2 }],
      "Design": [{ signalName: "creativity", strength: 2 }],
    },
    2: {
      "The planner": [{ signalName: "systems_thinking", strength: 2 }, { signalName: "leadership", strength: 1 }],
      "The idea generator": [{ signalName: "creativity", strength: 2 }, { signalName: "experimentation", strength: 1 }],
      "The people connector": [{ signalName: "community_orientation", strength: 2 }, { signalName: "empathy", strength: 1 }],
    },
    3: { _reflection: [{ signalName: "reflection", strength: 1 }, { signalName: "problem_solving", strength: 1 }] },
  },
  skills_q2: {
    0: {
      "Communicating under pressure": [{ signalName: "expression", strength: 2 }, { signalName: "resilience", strength: 1 }],
      "Solving new problems": [{ signalName: "problem_solving", strength: 2 }, { signalName: "curiosity", strength: 1 }],
      "Leading without authority": [{ signalName: "leadership", strength: 2 }, { signalName: "empathy", strength: 1 }],
      "Adapting to change": [{ signalName: "resilience", strength: 2 }, { signalName: "experimentation", strength: 1 }],
    },
    1: { _emoji: [{ signalName: "resilience", strength: 2 }, { signalName: "problem_solving", strength: 1 }] },
    2: {
      "Public speaking": [{ signalName: "expression", strength: 2 }],
      "Writing": [{ signalName: "expression", strength: 2 }],
      "Data analysis": [{ signalName: "problem_solving", strength: 2 }],
      "Design thinking": [{ signalName: "creativity", strength: 2 }],
      "Negotiation": [{ signalName: "leadership", strength: 2 }],
      "Project management": [{ signalName: "systems_thinking", strength: 2 }],
    },
    3: { _reflection: [{ signalName: "reflection", strength: 1 }, { signalName: "resilience", strength: 1 }] },
  },
  skills_q3: {
    0: {
      "See the big picture fast": [{ signalName: "systems_thinking", strength: 2 }, { signalName: "pattern_thinking", strength: 1 }],
      "Stay calm in chaos": [{ signalName: "resilience", strength: 3 }],
      "Explain complex things simply": [{ signalName: "expression", strength: 2 }, { signalName: "teaching_impulse", strength: 1 }],
      "Read a room's energy": [{ signalName: "empathy", strength: 2 }, { signalName: "connection", strength: 1 }],
      "Make quick decisions": [{ signalName: "leadership", strength: 2 }],
      "Hold space for others": [{ signalName: "empathy", strength: 2 }, { signalName: "community_orientation", strength: 1 }],
    },
    1: {
      "Stay rational and plan": [{ signalName: "systems_thinking", strength: 2 }, { signalName: "leadership", strength: 1 }],
      "Keep morale up": [{ signalName: "community_orientation", strength: 2 }, { signalName: "empathy", strength: 1 }],
      "Think creatively": [{ signalName: "creativity", strength: 2 }, { signalName: "experimentation", strength: 1 }],
    },
    2: { _slider: [{ signalName: "pattern_thinking", strength: 1 }, { signalName: "empathy", strength: 1 }, { signalName: "systems_thinking", strength: 1 }] },
    3: { _reflection: [{ signalName: "reflection", strength: 1 }, { signalName: "problem_solving", strength: 1 }] },
  },
  skills_q4: {
    0: {
      "Creativity + Strategy": [{ signalName: "creativity", strength: 2 }, { signalName: "systems_thinking", strength: 1 }],
      "Empathy + Communication": [{ signalName: "empathy", strength: 2 }, { signalName: "expression", strength: 1 }],
      "Analysis + Leadership": [{ signalName: "problem_solving", strength: 2 }, { signalName: "leadership", strength: 1 }],
      "Adaptability + Problem-solving": [{ signalName: "resilience", strength: 2 }, { signalName: "problem_solving", strength: 1 }],
    },
    1: {
      "A Swiss army knife — versatile": [{ signalName: "experimentation", strength: 2 }],
      "A laser — focused": [{ signalName: "problem_solving", strength: 2 }],
      "A bridge — connecting worlds": [{ signalName: "community_orientation", strength: 2 }],
      "A compass — guiding direction": [{ signalName: "vision_thinking", strength: 2 }],
    },
    2: {
      "Creative projects": [{ signalName: "creativity", strength: 2 }],
      "Team dynamics": [{ signalName: "community_orientation", strength: 2 }],
      "Problem-solving": [{ signalName: "problem_solving", strength: 2 }],
      "Teaching moments": [{ signalName: "teaching_impulse", strength: 2 }],
      "Big decisions": [{ signalName: "leadership", strength: 2 }],
      "Emotional situations": [{ signalName: "empathy", strength: 2 }],
    },
    3: { _reflection: [{ signalName: "reflection", strength: 1 }, { signalName: "creativity", strength: 1 }] },
  },

  // ===== PERSONAL FRUSTRATIONS =====
  personal_frustrations_q1: {
    0: {
      "Wasted potential": [{ signalName: "purpose_drive", strength: 2 }, { signalName: "vision_thinking", strength: 1 }],
      "Unfairness": [{ signalName: "empathy", strength: 2 }, { signalName: "purpose_drive", strength: 1 }],
      "Lack of depth": [{ signalName: "reflection", strength: 2 }, { signalName: "curiosity", strength: 1 }],
      "Inefficiency": [{ signalName: "systems_thinking", strength: 2 }, { signalName: "problem_solving", strength: 1 }],
      "Broken systems": [{ signalName: "systems_thinking", strength: 2 }, { signalName: "vision_thinking", strength: 1 }],
      "Apathy": [{ signalName: "purpose_drive", strength: 2 }, { signalName: "community_orientation", strength: 1 }],
    },
    1: { _emoji: [{ signalName: "purpose_drive", strength: 2 }, { signalName: "reflection", strength: 1 }] },
    2: {
      "People not reaching their potential": [{ signalName: "teaching_impulse", strength: 2 }, { signalName: "purpose_drive", strength: 1 }],
      "Systems that fail people": [{ signalName: "systems_thinking", strength: 2 }, { signalName: "vision_thinking", strength: 1 }],
      "Creativity being crushed": [{ signalName: "creativity", strength: 2 }, { signalName: "expression", strength: 1 }],
      "Lack of real connection": [{ signalName: "connection", strength: 2 }, { signalName: "empathy", strength: 1 }],
    },
    3: { _reflection: [{ signalName: "vision_thinking", strength: 1 }, { signalName: "purpose_drive", strength: 1 }] },
  },
  personal_frustrations_q2: {
    0: {
      "Seeing talent wasted": [{ signalName: "teaching_impulse", strength: 2 }, { signalName: "purpose_drive", strength: 1 }],
      "Being misunderstood": [{ signalName: "expression", strength: 2 }, { signalName: "connection", strength: 1 }],
      "Watching people settle": [{ signalName: "vision_thinking", strength: 2 }, { signalName: "purpose_drive", strength: 1 }],
    },
    1: {
      "Not being further ahead": [{ signalName: "purpose_drive", strength: 2 }],
      "Caring too much": [{ signalName: "empathy", strength: 2 }],
      "Struggling to find my tribe": [{ signalName: "community_orientation", strength: 2 }],
      "Knowing but not doing": [{ signalName: "reflection", strength: 2 }],
      "Feeling misaligned": [{ signalName: "purpose_drive", strength: 2 }],
      "Being too hard on myself": [{ signalName: "reflection", strength: 2 }],
    },
    2: {
      "A splinter — small but constant": [{ signalName: "reflection", strength: 2 }],
      "A storm — intense but passing": [{ signalName: "expression", strength: 2 }],
      "A weight — heavy and persistent": [{ signalName: "resilience", strength: 2 }],
      "A fire — it could become fuel": [{ signalName: "purpose_drive", strength: 2 }, { signalName: "experimentation", strength: 1 }],
    },
    3: { _reflection: [{ signalName: "reflection", strength: 1 }, { signalName: "purpose_drive", strength: 1 }] },
  },
  personal_frustrations_q3: {
    0: {
      "Repeating mistakes": [{ signalName: "reflection", strength: 2 }, { signalName: "pattern_thinking", strength: 1 }],
      "Same conflicts": [{ signalName: "connection", strength: 2 }, { signalName: "empathy", strength: 1 }],
      "Hitting the same ceiling": [{ signalName: "resilience", strength: 2 }, { signalName: "purpose_drive", strength: 1 }],
      "Avoiding hard conversations": [{ signalName: "expression", strength: 2 }, { signalName: "connection", strength: 1 }],
    },
    1: {
      "Taking the lead": [{ signalName: "leadership", strength: 2 }],
      "Being vulnerable": [{ signalName: "expression", strength: 2 }],
      "Starting over": [{ signalName: "experimentation", strength: 2 }],
      "Asking for what I need": [{ signalName: "connection", strength: 2 }],
      "Facing conflict": [{ signalName: "leadership", strength: 2 }],
      "Slowing down": [{ signalName: "reflection", strength: 2 }],
    },
    2: { _emoji: [{ signalName: "reflection", strength: 2 }, { signalName: "pattern_thinking", strength: 1 }] },
    3: { _reflection: [{ signalName: "reflection", strength: 1 }, { signalName: "purpose_drive", strength: 1 }] },
  },
  personal_frustrations_q4: {
    0: {
      "My frustration drives change": [{ signalName: "purpose_drive", strength: 2 }, { signalName: "leadership", strength: 1 }],
      "My anger shows what I value": [{ signalName: "reflection", strength: 2 }, { signalName: "purpose_drive", strength: 1 }],
      "My impatience pushes action": [{ signalName: "leadership", strength: 2 }, { signalName: "experimentation", strength: 1 }],
      "My disappointment raises standards": [{ signalName: "systems_thinking", strength: 2 }, { signalName: "reflection", strength: 1 }],
    },
    1: {
      "A career change": [{ signalName: "experimentation", strength: 2 }],
      "A creative project": [{ signalName: "creativity", strength: 2 }],
      "A boundary": [{ signalName: "expression", strength: 2 }],
      "A commitment": [{ signalName: "purpose_drive", strength: 2 }],
      "A new perspective": [{ signalName: "curiosity", strength: 2 }],
      "A bold decision": [{ signalName: "leadership", strength: 2 }],
    },
    2: { _slider: [{ signalName: "purpose_drive", strength: 1 }, { signalName: "connection", strength: 1 }, { signalName: "resilience", strength: 1 }] },
    3: { _reflection: [{ signalName: "reflection", strength: 1 }, { signalName: "resilience", strength: 1 }] },
  },

  // ===== VALUES =====
  values_q1: {
    0: { // this_or_that
      "Freedom": [{ signalName: "exploration", strength: 2 }, { signalName: "expression", strength: 1 }],
      "Security": [{ signalName: "resilience", strength: 2 }, { signalName: "systems_thinking", strength: 1 }],
    },
    1: {
      "Authenticity": [{ signalName: "expression", strength: 2 }, { signalName: "reflection", strength: 1 }],
      "Fairness": [{ signalName: "empathy", strength: 2 }, { signalName: "purpose_drive", strength: 1 }],
      "Creativity": [{ signalName: "creativity", strength: 2 }, { signalName: "expression", strength: 1 }],
      "Loyalty": [{ signalName: "connection", strength: 2 }, { signalName: "community_orientation", strength: 1 }],
      "Independence": [{ signalName: "exploration", strength: 2 }, { signalName: "leadership", strength: 1 }],
      "Compassion": [{ signalName: "empathy", strength: 2 }, { signalName: "community_orientation", strength: 1 }],
    },
    2: { // this_or_that
      "Honesty over harmony": [{ signalName: "expression", strength: 2 }, { signalName: "leadership", strength: 1 }],
      "Growth over comfort": [{ signalName: "experimentation", strength: 2 }, { signalName: "resilience", strength: 1 }],
    },
    3: { _reflection: [{ signalName: "reflection", strength: 1 }, { signalName: "purpose_drive", strength: 1 }] },
  },
  values_q2: {
    0: {
      "Patience": [{ signalName: "resilience", strength: 2 }],
      "Courage": [{ signalName: "leadership", strength: 2 }],
      "Generosity": [{ signalName: "community_orientation", strength: 2 }],
      "Curiosity": [{ signalName: "curiosity", strength: 2 }],
      "Discipline": [{ signalName: "systems_thinking", strength: 2 }],
      "Kindness": [{ signalName: "empathy", strength: 2 }],
    },
    1: {
      "I value balance but overwork": [{ signalName: "resilience", strength: 2 }],
      "I value honesty but avoid conflict": [{ signalName: "expression", strength: 2 }],
      "I value creativity but play it safe": [{ signalName: "creativity", strength: 2 }],
      "I value connection but isolate": [{ signalName: "connection", strength: 2 }],
    },
    2: { _emoji: [{ signalName: "purpose_drive", strength: 2 }, { signalName: "reflection", strength: 1 }] },
    3: { _reflection: [{ signalName: "reflection", strength: 1 }, { signalName: "purpose_drive", strength: 1 }] },
  },
  values_q3: {
    0: {
      "Someone who showed me how": [{ signalName: "connection", strength: 2 }, { signalName: "teaching_impulse", strength: 1 }],
      "A painful lesson": [{ signalName: "resilience", strength: 2 }, { signalName: "reflection", strength: 1 }],
      "Something I always knew inside": [{ signalName: "reflection", strength: 2 }, { signalName: "purpose_drive", strength: 1 }],
    },
    1: {
      "What success means": [{ signalName: "purpose_drive", strength: 2 }],
      "Relationships over achievement": [{ signalName: "connection", strength: 2 }],
      "Freedom over security": [{ signalName: "exploration", strength: 2 }],
      "Integrity over popularity": [{ signalName: "expression", strength: 2 }],
      "Depth over breadth": [{ signalName: "reflection", strength: 2 }],
      "Being over doing": [{ signalName: "reflection", strength: 2 }],
    },
    2: { _slider: [{ signalName: "expression", strength: 1 }, { signalName: "purpose_drive", strength: 1 }, { signalName: "resilience", strength: 1 }] },
    3: { _reflection: [{ signalName: "reflection", strength: 1 }, { signalName: "resilience", strength: 1 }] },
  },
  values_q4: {
    0: {
      "Courage to be different": [{ signalName: "expression", strength: 2 }, { signalName: "exploration", strength: 1 }],
      "Patience with the process": [{ signalName: "resilience", strength: 2 }, { signalName: "reflection", strength: 1 }],
      "Commitment to depth": [{ signalName: "reflection", strength: 2 }, { signalName: "curiosity", strength: 1 }],
      "Openness to change": [{ signalName: "experimentation", strength: 2 }, { signalName: "exploration", strength: 1 }],
    },
    1: {
      "Resilience": [{ signalName: "resilience", strength: 2 }],
      "Empathy": [{ signalName: "empathy", strength: 2 }],
      "Curiosity": [{ signalName: "curiosity", strength: 2 }],
      "Integrity": [{ signalName: "expression", strength: 2 }],
      "Joy": [{ signalName: "creativity", strength: 2 }],
      "Service": [{ signalName: "community_orientation", strength: 2 }],
    },
    2: {
      "My gut feeling": [{ signalName: "reflection", strength: 2 }],
      "My values": [{ signalName: "purpose_drive", strength: 2 }],
      "Other people's needs": [{ signalName: "empathy", strength: 2 }],
      "Long-term vision": [{ signalName: "vision_thinking", strength: 2 }],
    },
    3: { _reflection: [{ signalName: "reflection", strength: 1 }, { signalName: "purpose_drive", strength: 1 }] },
  },

  // ===== AHA MOMENTS =====
  aha_moments_q1: {
    0: {
      "Connecting unrelated ideas": [{ signalName: "pattern_thinking", strength: 3 }, { signalName: "creativity", strength: 1 }],
      "Seeing a hidden pattern": [{ signalName: "pattern_thinking", strength: 3 }, { signalName: "systems_thinking", strength: 1 }],
      "Understanding someone deeply": [{ signalName: "empathy", strength: 3 }, { signalName: "connection", strength: 1 }],
      "Realizing my own potential": [{ signalName: "purpose_drive", strength: 2 }, { signalName: "reflection", strength: 2 }],
    },
    1: {
      "In conversation": [{ signalName: "connection", strength: 2 }, { signalName: "community_orientation", strength: 1 }],
      "Alone": [{ signalName: "reflection", strength: 2 }, { signalName: "pattern_thinking", strength: 1 }],
      "While moving": [{ signalName: "exploration", strength: 2 }],
      "Before sleep": [{ signalName: "reflection", strength: 2 }, { signalName: "curiosity", strength: 1 }],
      "While creating": [{ signalName: "creativity", strength: 2 }, { signalName: "expression", strength: 1 }],
      "While reading": [{ signalName: "curiosity", strength: 2 }, { signalName: "pattern_thinking", strength: 1 }],
    },
    2: { _emoji: [{ signalName: "pattern_thinking", strength: 2 }, { signalName: "curiosity", strength: 1 }] },
    3: { _reflection: [{ signalName: "pattern_thinking", strength: 1 }, { signalName: "reflection", strength: 1 }] },
  },
  aha_moments_q2: {
    0: {
      "Being stuck": [{ signalName: "resilience", strength: 2 }],
      "A new perspective": [{ signalName: "curiosity", strength: 2 }],
      "Deep relaxation": [{ signalName: "reflection", strength: 2 }],
      "Intense focus": [{ signalName: "problem_solving", strength: 2 }],
      "Random connection": [{ signalName: "pattern_thinking", strength: 2 }],
      "Emotional openness": [{ signalName: "empathy", strength: 2 }],
    },
    1: {
      "A slow simmer — builds over time": [{ signalName: "reflection", strength: 2 }, { signalName: "pattern_thinking", strength: 1 }],
      "A lightning strike — sudden clarity": [{ signalName: "creativity", strength: 2 }, { signalName: "experimentation", strength: 1 }],
      "A kaleidoscope — mixing patterns": [{ signalName: "pattern_thinking", strength: 2 }, { signalName: "creativity", strength: 1 }],
      "A deep well — drawing from below": [{ signalName: "reflection", strength: 2 }, { signalName: "curiosity", strength: 1 }],
    },
    2: {
      "Asking why repeatedly": [{ signalName: "curiosity", strength: 2 }],
      "Flipping assumptions": [{ signalName: "creativity", strength: 2 }],
      "Looking at the opposite": [{ signalName: "pattern_thinking", strength: 2 }],
      "Changing environment": [{ signalName: "exploration", strength: 2 }],
    },
    3: { _reflection: [{ signalName: "reflection", strength: 1 }, { signalName: "pattern_thinking", strength: 1 }] },
  },
  // Simplified signal maps for remaining quests - using cluster-level signals
  aha_moments_q3: {
    0: {
      "How things really work": [{ signalName: "systems_thinking", strength: 2 }],
      "How people really feel": [{ signalName: "empathy", strength: 2 }],
      "What's possible": [{ signalName: "vision_thinking", strength: 2 }],
      "What needs to change": [{ signalName: "purpose_drive", strength: 2 }],
    },
    1: {
      "Emotional shifts": [{ signalName: "empathy", strength: 2 }],
      "System flaws": [{ signalName: "systems_thinking", strength: 2 }],
      "Creative openings": [{ signalName: "creativity", strength: 2 }],
      "Unspoken dynamics": [{ signalName: "empathy", strength: 2 }],
      "Hidden connections": [{ signalName: "pattern_thinking", strength: 2 }],
      "Timing patterns": [{ signalName: "pattern_thinking", strength: 2 }],
    },
    2: { _slider: [{ signalName: "reflection", strength: 1 }, { signalName: "curiosity", strength: 1 }, { signalName: "exploration", strength: 1 }] },
    3: { _reflection: [{ signalName: "pattern_thinking", strength: 1 }, { signalName: "reflection", strength: 1 }] },
  },
  aha_moments_q4: {
    0: {
      "Beliefs about myself": [{ signalName: "reflection", strength: 2 }, { signalName: "purpose_drive", strength: 1 }],
      "Understanding of others": [{ signalName: "empathy", strength: 2 }, { signalName: "connection", strength: 1 }],
      "Vision for the future": [{ signalName: "vision_thinking", strength: 2 }, { signalName: "purpose_drive", strength: 1 }],
    },
    1: {
      "A major decision": [{ signalName: "leadership", strength: 2 }],
      "A relationship shift": [{ signalName: "connection", strength: 2 }],
      "A creative project": [{ signalName: "creativity", strength: 2 }],
      "A new habit": [{ signalName: "resilience", strength: 2 }],
      "A hard conversation": [{ signalName: "expression", strength: 2 }],
      "A period of grief": [{ signalName: "reflection", strength: 2 }],
    },
    2: { _emoji: [{ signalName: "leadership", strength: 1 }, { signalName: "experimentation", strength: 1 }] },
    3: { _reflection: [{ signalName: "reflection", strength: 1 }, { signalName: "pattern_thinking", strength: 1 }] },
  },

  // ===== INSPIRATIONS =====
  inspirations_q1: {
    0: {
      "Bold risk-takers": [{ signalName: "experimentation", strength: 2 }, { signalName: "leadership", strength: 1 }],
      "Quiet creators": [{ signalName: "creativity", strength: 2 }, { signalName: "reflection", strength: 1 }],
      "Community builders": [{ signalName: "community_orientation", strength: 2 }, { signalName: "empathy", strength: 1 }],
      "Deep thinkers": [{ signalName: "reflection", strength: 2 }, { signalName: "curiosity", strength: 1 }],
      "Rebels": [{ signalName: "exploration", strength: 2 }, { signalName: "expression", strength: 1 }],
      "Healers": [{ signalName: "empathy", strength: 2 }, { signalName: "teaching_impulse", strength: 1 }],
    },
    1: {
      "Books and ideas": [{ signalName: "curiosity", strength: 2 }],
      "Real people's stories": [{ signalName: "empathy", strength: 2 }],
      "Art and music": [{ signalName: "expression", strength: 2 }],
      "Nature and silence": [{ signalName: "reflection", strength: 2 }],
    },
    2: {
      "A spark — sudden and bright": [{ signalName: "creativity", strength: 2 }],
      "A tide — it comes and goes": [{ signalName: "reflection", strength: 2 }],
      "A compass — it guides me": [{ signalName: "purpose_drive", strength: 2 }],
      "A mirror — it shows me who I am": [{ signalName: "reflection", strength: 2 }, { signalName: "pattern_thinking", strength: 1 }],
    },
    3: { _reflection: [{ signalName: "curiosity", strength: 1 }, { signalName: "connection", strength: 1 }] },
  },
  inspirations_q2: {
    0: {
      "Authenticity under pressure": [{ signalName: "expression", strength: 2 }, { signalName: "resilience", strength: 1 }],
      "Creative courage": [{ signalName: "creativity", strength: 2 }, { signalName: "experimentation", strength: 1 }],
      "Quiet strength": [{ signalName: "resilience", strength: 2 }, { signalName: "reflection", strength: 1 }],
      "Radical generosity": [{ signalName: "community_orientation", strength: 2 }, { signalName: "empathy", strength: 1 }],
    },
    1: {
      "Music": [{ signalName: "expression", strength: 2 }],
      "Visual art": [{ signalName: "creativity", strength: 2 }],
      "Writing and poetry": [{ signalName: "expression", strength: 2 }],
      "Film": [{ signalName: "curiosity", strength: 2 }],
      "Architecture": [{ signalName: "systems_thinking", strength: 2 }],
      "Performance": [{ signalName: "expression", strength: 2 }],
    },
    2: { _emoji: [{ signalName: "curiosity", strength: 2 }, { signalName: "reflection", strength: 1 }] },
    3: { _reflection: [{ signalName: "reflection", strength: 1 }, { signalName: "curiosity", strength: 1 }] },
  },
  inspirations_q3: {
    0: {
      "Into creative projects": [{ signalName: "creativity", strength: 2 }],
      "Into helping others": [{ signalName: "teaching_impulse", strength: 2 }],
      "Into personal growth": [{ signalName: "reflection", strength: 2 }],
      "Into conversations": [{ signalName: "connection", strength: 2 }],
      "Into writing": [{ signalName: "expression", strength: 2 }],
      "Into experiments": [{ signalName: "experimentation", strength: 2 }],
    },
    1: {
      "I create something": [{ signalName: "creativity", strength: 2 }],
      "I share it": [{ signalName: "community_orientation", strength: 2 }],
      "I reflect deeply": [{ signalName: "reflection", strength: 2 }],
      "I change something": [{ signalName: "experimentation", strength: 2 }],
    },
    2: { _slider: [{ signalName: "connection", strength: 1 }, { signalName: "creativity", strength: 1 }, { signalName: "resilience", strength: 1 }] },
    3: { _reflection: [{ signalName: "creativity", strength: 1 }, { signalName: "purpose_drive", strength: 1 }] },
  },
  inspirations_q4: {
    0: {
      "Depth and authenticity": [{ signalName: "reflection", strength: 2 }, { signalName: "expression", strength: 1 }],
      "Courage and conviction": [{ signalName: "leadership", strength: 2 }, { signalName: "purpose_drive", strength: 1 }],
      "Beauty and craft": [{ signalName: "creativity", strength: 2 }, { signalName: "expression", strength: 1 }],
    },
    1: {
      "Renaissance creativity": [{ signalName: "creativity", strength: 2 }],
      "Social justice": [{ signalName: "purpose_drive", strength: 2 }],
      "Scientific revolution": [{ signalName: "curiosity", strength: 2 }],
      "Counterculture": [{ signalName: "exploration", strength: 2 }],
      "Indigenous wisdom": [{ signalName: "reflection", strength: 2 }],
      "Modern innovation": [{ signalName: "experimentation", strength: 2 }],
    },
    2: {
      "A philosopher": [{ signalName: "reflection", strength: 2 }],
      "An artist": [{ signalName: "creativity", strength: 2 }],
      "A builder": [{ signalName: "experimentation", strength: 2 }],
      "A healer": [{ signalName: "empathy", strength: 2 }],
    },
    3: { _reflection: [{ signalName: "curiosity", strength: 1 }, { signalName: "reflection", strength: 1 }] },
  },

  // ===== VISION =====
  vision_q1: {
    0: {
      "Education for all": [{ signalName: "teaching_impulse", strength: 2 }, { signalName: "purpose_drive", strength: 2 }],
      "Mental health": [{ signalName: "empathy", strength: 2 }, { signalName: "community_orientation", strength: 1 }],
      "Environmental restoration": [{ signalName: "systems_thinking", strength: 2 }, { signalName: "vision_thinking", strength: 1 }],
      "Economic fairness": [{ signalName: "purpose_drive", strength: 2 }, { signalName: "systems_thinking", strength: 1 }],
    },
    1: {
      "Equal opportunity": [{ signalName: "empathy", strength: 2 }, { signalName: "purpose_drive", strength: 1 }],
      "Creative freedom": [{ signalName: "creativity", strength: 2 }, { signalName: "expression", strength: 1 }],
      "Sustainable living": [{ signalName: "systems_thinking", strength: 2 }, { signalName: "vision_thinking", strength: 1 }],
      "Deeper connection": [{ signalName: "connection", strength: 2 }, { signalName: "empathy", strength: 1 }],
      "Better education": [{ signalName: "teaching_impulse", strength: 2 }, { signalName: "curiosity", strength: 1 }],
      "Health access": [{ signalName: "empathy", strength: 2 }, { signalName: "community_orientation", strength: 1 }],
    },
    2: { _emoji: [{ signalName: "purpose_drive", strength: 2 }, { signalName: "vision_thinking", strength: 1 }] },
    3: { _reflection: [{ signalName: "vision_thinking", strength: 1 }, { signalName: "expression", strength: 1 }] },
  },
  // Remaining vision/ideal_life/natural_talents/childhood/external_reflections/experiments
  // use generic cluster-appropriate signals for new interaction types
  vision_q2: {
    0: {
      "System reform": [{ signalName: "systems_thinking", strength: 2 }],
      "Culture shift": [{ signalName: "expression", strength: 2 }],
      "Individual power": [{ signalName: "purpose_drive", strength: 2 }],
      "Tech innovation": [{ signalName: "experimentation", strength: 2 }],
      "Community healing": [{ signalName: "community_orientation", strength: 2 }],
      "Education change": [{ signalName: "teaching_impulse", strength: 2 }],
    },
    1: {
      "Planting seeds — quiet and patient": [{ signalName: "reflection", strength: 2 }, { signalName: "community_orientation", strength: 1 }],
      "Building something — visible and lasting": [{ signalName: "creativity", strength: 2 }, { signalName: "purpose_drive", strength: 1 }],
      "Starting a fire — spreading fast": [{ signalName: "leadership", strength: 2 }, { signalName: "expression", strength: 1 }],
      "Digging deep — finding the root": [{ signalName: "systems_thinking", strength: 2 }, { signalName: "reflection", strength: 1 }],
    },
    2: {
      "Justice": [{ signalName: "purpose_drive", strength: 2 }],
      "Creativity": [{ signalName: "creativity", strength: 2 }],
      "Health": [{ signalName: "empathy", strength: 2 }],
      "Knowledge": [{ signalName: "curiosity", strength: 2 }],
    },
    3: { _reflection: [{ signalName: "vision_thinking", strength: 1 }, { signalName: "purpose_drive", strength: 1 }] },
  },
  vision_q3: {
    0: {
      "Personal experience": [{ signalName: "reflection", strength: 2 }],
      "Seeing potential in people": [{ signalName: "teaching_impulse", strength: 2 }],
      "Love for beauty and creation": [{ signalName: "creativity", strength: 2 }],
      "Understanding broken systems": [{ signalName: "systems_thinking", strength: 2 }],
    },
    1: {
      "Through my work": [{ signalName: "purpose_drive", strength: 2 }],
      "Through relationships": [{ signalName: "connection", strength: 2 }],
      "Through creativity": [{ signalName: "creativity", strength: 2 }],
      "Through conversations": [{ signalName: "expression", strength: 2 }],
      "Through example": [{ signalName: "leadership", strength: 2 }],
      "Through support": [{ signalName: "community_orientation", strength: 2 }],
    },
    2: { _slider: [{ signalName: "community_orientation", strength: 1 }, { signalName: "experimentation", strength: 1 }, { signalName: "teaching_impulse", strength: 1 }] },
    3: { _reflection: [{ signalName: "vision_thinking", strength: 1 }, { signalName: "purpose_drive", strength: 1 }] },
  },
  vision_q4: {
    0: {
      "Something I built": [{ signalName: "creativity", strength: 2 }, { signalName: "purpose_drive", strength: 1 }],
      "People I helped grow": [{ signalName: "teaching_impulse", strength: 2 }, { signalName: "empathy", strength: 1 }],
      "A way of thinking I shared": [{ signalName: "expression", strength: 2 }, { signalName: "vision_thinking", strength: 1 }],
    },
    1: {
      "Creative works": [{ signalName: "creativity", strength: 2 }],
      "Relationships": [{ signalName: "connection", strength: 2 }],
      "Systems changed": [{ signalName: "systems_thinking", strength: 2 }],
      "Knowledge shared": [{ signalName: "teaching_impulse", strength: 2 }],
      "Communities built": [{ signalName: "community_orientation", strength: 2 }],
      "Lives transformed": [{ signalName: "empathy", strength: 2 }],
    },
    2: {
      "An architect — designing systems": [{ signalName: "systems_thinking", strength: 2 }],
      "A gardener — nurturing growth": [{ signalName: "teaching_impulse", strength: 2 }],
      "A bridge — connecting worlds": [{ signalName: "community_orientation", strength: 2 }],
      "A torch — lighting the way": [{ signalName: "leadership", strength: 2 }],
    },
    3: { _reflection: [{ signalName: "vision_thinking", strength: 1 }, { signalName: "purpose_drive", strength: 1 }] },
  },

  // ===== IDEAL LIFE =====
  ideal_life_q1: {
    0: {
      "Sunrise — creative and fresh": [{ signalName: "creativity", strength: 2 }],
      "Forest — quiet and grounded": [{ signalName: "reflection", strength: 2 }],
      "Ocean — expansive and free": [{ signalName: "exploration", strength: 2 }],
      "City — buzzing with energy": [{ signalName: "community_orientation", strength: 2 }],
    },
    1: {
      "Creative freedom": [{ signalName: "creativity", strength: 2 }, { signalName: "expression", strength: 1 }],
      "Financial security": [{ signalName: "systems_thinking", strength: 1 }, { signalName: "resilience", strength: 1 }],
      "Deep relationships": [{ signalName: "connection", strength: 2 }, { signalName: "empathy", strength: 1 }],
      "Travel and adventure": [{ signalName: "exploration", strength: 2 }, { signalName: "curiosity", strength: 1 }],
      "Meaningful work": [{ signalName: "purpose_drive", strength: 2 }, { signalName: "vision_thinking", strength: 1 }],
      "Peace and quiet": [{ signalName: "reflection", strength: 2 }, { signalName: "expression", strength: 1 }],
    },
    2: {
      "Location freedom": [{ signalName: "exploration", strength: 2 }],
      "Community": [{ signalName: "community_orientation", strength: 2 }],
      "Professional mastery": [{ signalName: "problem_solving", strength: 2 }],
      "Inner peace": [{ signalName: "reflection", strength: 2 }],
    },
    3: { _reflection: [{ signalName: "vision_thinking", strength: 1 }, { signalName: "purpose_drive", strength: 1 }] },
  },
  ideal_life_q2: {
    0: {
      "A creative studio full of light": [{ signalName: "creativity", strength: 2 }],
      "A cabin in nature": [{ signalName: "reflection", strength: 2 }],
      "A vibrant city": [{ signalName: "community_orientation", strength: 2 }],
      "A cozy home with loved ones": [{ signalName: "connection", strength: 2 }],
    },
    1: {
      "Natural light": [{ signalName: "creativity", strength: 1 }],
      "Creative tools": [{ signalName: "creativity", strength: 2 }],
      "Beautiful objects": [{ signalName: "expression", strength: 2 }],
      "Books everywhere": [{ signalName: "curiosity", strength: 2 }],
      "Plants": [{ signalName: "exploration", strength: 1 }],
      "Quiet": [{ signalName: "reflection", strength: 2 }],
    },
    2: { _emoji: [{ signalName: "vision_thinking", strength: 2 }, { signalName: "purpose_drive", strength: 1 }] },
    3: { _reflection: [{ signalName: "exploration", strength: 1 }, { signalName: "reflection", strength: 1 }] },
  },
  ideal_life_q3: {
    0: {
      "Intellectual spark": [{ signalName: "curiosity", strength: 2 }],
      "Emotional safety": [{ signalName: "empathy", strength: 2 }],
      "Creative energy": [{ signalName: "creativity", strength: 2 }],
      "Shared values": [{ signalName: "purpose_drive", strength: 2 }],
      "Growth focus": [{ signalName: "experimentation", strength: 2 }],
      "Playfulness": [{ signalName: "expression", strength: 2 }],
    },
    1: {
      "A small circle of deep thinkers": [{ signalName: "reflection", strength: 2 }],
      "A diverse network of creators": [{ signalName: "community_orientation", strength: 2 }],
      "A warm family-like group": [{ signalName: "connection", strength: 2 }],
    },
    2: {
      "Depth over breadth": [{ signalName: "reflection", strength: 2 }],
      "Freedom within togetherness": [{ signalName: "exploration", strength: 2 }],
      "Mutual growth": [{ signalName: "experimentation", strength: 2 }],
      "Unconditional acceptance": [{ signalName: "empathy", strength: 2 }],
    },
    3: { _reflection: [{ signalName: "connection", strength: 1 }, { signalName: "community_orientation", strength: 1 }] },
  },
  ideal_life_q4: {
    0: {
      "Structured creative blocks": [{ signalName: "systems_thinking", strength: 2 }],
      "Fluid and responsive": [{ signalName: "exploration", strength: 2 }],
      "Seasonal — intense then rest": [{ signalName: "resilience", strength: 2 }],
      "Same beautiful routine daily": [{ signalName: "reflection", strength: 2 }],
    },
    1: {
      "Morning creative time": [{ signalName: "creativity", strength: 2 }],
      "Nature time": [{ signalName: "exploration", strength: 2 }],
      "Deep conversations": [{ signalName: "connection", strength: 2 }],
      "Physical movement": [{ signalName: "resilience", strength: 1 }],
      "Learning something": [{ signalName: "curiosity", strength: 2 }],
      "Quiet reflection": [{ signalName: "reflection", strength: 2 }],
    },
    2: { _slider: [{ signalName: "creativity", strength: 1 }, { signalName: "exploration", strength: 1 }, { signalName: "reflection", strength: 1 }] },
    3: { _reflection: [{ signalName: "reflection", strength: 1 }, { signalName: "purpose_drive", strength: 1 }] },
  },

  // ===== NATURAL TALENTS =====
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
      "Generating ideas": [{ signalName: "creativity", strength: 3 }, { signalName: "experimentation", strength: 1 }],
      "Staying calm under pressure": [{ signalName: "resilience", strength: 3 }, { signalName: "leadership", strength: 1 }],
    },
    2: { _emoji: [{ signalName: "expression", strength: 1 }, { signalName: "creativity", strength: 1 }] },
    3: { _reflection: [{ signalName: "reflection", strength: 1 }, { signalName: "pattern_thinking", strength: 1 }] },
  },
  natural_talents_q2: {
    0: {
      "Making people comfortable": [{ signalName: "empathy", strength: 2 }, { signalName: "community_orientation", strength: 1 }],
      "Seeing solutions quickly": [{ signalName: "problem_solving", strength: 2 }, { signalName: "pattern_thinking", strength: 1 }],
      "Bringing ideas to life": [{ signalName: "creativity", strength: 2 }, { signalName: "experimentation", strength: 1 }],
    },
    1: {
      "Understanding systems": [{ signalName: "systems_thinking", strength: 2 }],
      "Creating beauty": [{ signalName: "creativity", strength: 2 }],
      "Sensing emotions": [{ signalName: "empathy", strength: 2 }],
      "Finding the right words": [{ signalName: "expression", strength: 2 }],
      "Motivating others": [{ signalName: "leadership", strength: 2 }],
      "Spotting patterns": [{ signalName: "pattern_thinking", strength: 2 }],
    },
    2: {
      "Water — it flows naturally": [{ signalName: "exploration", strength: 2 }],
      "A magnet — it draws people": [{ signalName: "community_orientation", strength: 2 }],
      "A lens — it brings clarity": [{ signalName: "systems_thinking", strength: 2 }],
      "A seed — it grows without force": [{ signalName: "reflection", strength: 2 }],
    },
    3: { _reflection: [{ signalName: "reflection", strength: 1 }, { signalName: "creativity", strength: 1 }] },
  },
  natural_talents_q3: {
    0: {
      "Making things clearer": [{ signalName: "systems_thinking", strength: 2 }],
      "Making people feel seen": [{ signalName: "empathy", strength: 2 }],
      "Making the impossible possible": [{ signalName: "creativity", strength: 2 }],
      "Making beauty where there was none": [{ signalName: "expression", strength: 2 }],
    },
    1: {
      "In a crisis I stayed calm": [{ signalName: "resilience", strength: 2 }],
      "In a creative flow I couldn't stop": [{ signalName: "creativity", strength: 2 }],
      "In a conversation that went deep": [{ signalName: "connection", strength: 2 }],
      "A solution came instantly": [{ signalName: "problem_solving", strength: 2 }],
      "Intuitive knowing": [{ signalName: "pattern_thinking", strength: 2 }],
      "Leading unexpectedly": [{ signalName: "leadership", strength: 2 }],
    },
    2: { _slider: [{ signalName: "teaching_impulse", strength: 1 }, { signalName: "creativity", strength: 1 }, { signalName: "empathy", strength: 1 }] },
    3: { _reflection: [{ signalName: "reflection", strength: 1 }, { signalName: "creativity", strength: 1 }] },
  },
  natural_talents_q4: {
    0: {
      "Creative vision": [{ signalName: "creativity", strength: 2 }],
      "Emotional depth": [{ signalName: "empathy", strength: 2 }],
      "Strategic thinking": [{ signalName: "systems_thinking", strength: 2 }],
      "Healing presence": [{ signalName: "empathy", strength: 2 }],
      "Storytelling": [{ signalName: "expression", strength: 2 }],
      "Problem-solving": [{ signalName: "problem_solving", strength: 2 }],
    },
    1: {
      "I'd start something bold": [{ signalName: "experimentation", strength: 2 }],
      "I'd deepen what exists": [{ signalName: "reflection", strength: 2 }],
      "I'd help others find theirs": [{ signalName: "teaching_impulse", strength: 2 }],
    },
    2: {
      "Creative spaces": [{ signalName: "creativity", strength: 2 }],
      "Healing spaces": [{ signalName: "empathy", strength: 2 }],
      "Learning spaces": [{ signalName: "teaching_impulse", strength: 2 }],
      "Building spaces": [{ signalName: "experimentation", strength: 2 }],
    },
    3: { _reflection: [{ signalName: "reflection", strength: 1 }, { signalName: "expression", strength: 1 }] },
  },

  // ===== CHILDHOOD SIGNALS =====
  childhood_signals_q1: {
    0: {
      "A playground — always exploring": [{ signalName: "exploration", strength: 2 }, { signalName: "curiosity", strength: 1 }],
      "A library — always imagining": [{ signalName: "curiosity", strength: 2 }, { signalName: "expression", strength: 1 }],
      "A stage — always performing": [{ signalName: "expression", strength: 2 }, { signalName: "leadership", strength: 1 }],
      "A workshop — always building": [{ signalName: "creativity", strength: 2 }, { signalName: "experimentation", strength: 1 }],
    },
    1: {
      "Curiosity": [{ signalName: "curiosity", strength: 2 }],
      "Stubbornness": [{ signalName: "resilience", strength: 2 }],
      "Empathy": [{ signalName: "empathy", strength: 2 }],
      "Creativity": [{ signalName: "creativity", strength: 2 }],
      "Independence": [{ signalName: "exploration", strength: 2 }],
      "Sensitivity": [{ signalName: "empathy", strength: 1 }, { signalName: "reflection", strength: 1 }],
    },
    2: { _emoji: [{ signalName: "reflection", strength: 2 }, { signalName: "connection", strength: 1 }] },
    3: { _reflection: [{ signalName: "reflection", strength: 1 }, { signalName: "curiosity", strength: 1 }] },
  },
  childhood_signals_q2: {
    0: {
      "Drawing or painting": [{ signalName: "creativity", strength: 2 }],
      "Stories and books": [{ signalName: "curiosity", strength: 2 }],
      "Animals and nature": [{ signalName: "exploration", strength: 2 }],
      "Machines and gadgets": [{ signalName: "problem_solving", strength: 2 }],
      "Music and rhythm": [{ signalName: "expression", strength: 2 }],
      "People and relationships": [{ signalName: "community_orientation", strength: 2 }],
    },
    1: {
      "The dreamer — always imagining": [{ signalName: "creativity", strength: 2 }],
      "The builder — always making": [{ signalName: "experimentation", strength: 2 }],
      "The explorer — always questioning": [{ signalName: "curiosity", strength: 2 }],
      "The caretaker — always helping": [{ signalName: "empathy", strength: 2 }],
    },
    2: {
      "A moment of wonder": [{ signalName: "curiosity", strength: 2 }],
      "Feeling truly seen": [{ signalName: "connection", strength: 2 }],
      "Overcoming fear": [{ signalName: "resilience", strength: 2 }],
      "Creating something": [{ signalName: "creativity", strength: 2 }],
    },
    3: { _reflection: [{ signalName: "reflection", strength: 1 }, { signalName: "curiosity", strength: 1 }] },
  },
  childhood_signals_q3: {
    0: {
      "Being the responsible one": [{ signalName: "leadership", strength: 2 }, { signalName: "resilience", strength: 1 }],
      "Being the creative one": [{ signalName: "creativity", strength: 2 }, { signalName: "expression", strength: 1 }],
      "Being the peacemaker": [{ signalName: "empathy", strength: 2 }, { signalName: "community_orientation", strength: 1 }],
    },
    1: {
      "Seeking approval": [{ signalName: "connection", strength: 2 }],
      "Needing to be useful": [{ signalName: "purpose_drive", strength: 2 }],
      "Avoiding conflict": [{ signalName: "empathy", strength: 2 }],
      "Trying to fix things": [{ signalName: "problem_solving", strength: 2 }],
      "Performing for love": [{ signalName: "expression", strength: 2 }],
      "Staying invisible": [{ signalName: "reflection", strength: 2 }],
    },
    2: { _emoji: [{ signalName: "reflection", strength: 2 }, { signalName: "resilience", strength: 1 }] },
    3: { _reflection: [{ signalName: "reflection", strength: 1 }, { signalName: "empathy", strength: 1 }] },
  },
  childhood_signals_q4: {
    0: {
      "Fearless curiosity": [{ signalName: "curiosity", strength: 2 }],
      "Uninhibited creativity": [{ signalName: "creativity", strength: 2 }],
      "Easy joy": [{ signalName: "expression", strength: 2 }],
      "Trust in others": [{ signalName: "connection", strength: 2 }],
      "Sense of wonder": [{ signalName: "curiosity", strength: 2 }],
      "Playfulness": [{ signalName: "expression", strength: 2 }],
    },
    1: {
      "Play more": [{ signalName: "expression", strength: 2 }],
      "Trust your instincts": [{ signalName: "reflection", strength: 2 }],
      "Stop being so hard on yourself": [{ signalName: "empathy", strength: 2 }],
    },
    2: { _slider: [{ signalName: "expression", strength: 1 }, { signalName: "curiosity", strength: 1 }, { signalName: "connection", strength: 1 }] },
    3: { _reflection: [{ signalName: "reflection", strength: 1 }, { signalName: "curiosity", strength: 1 }] },
  },

  // ===== EXTERNAL REFLECTIONS =====
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
      "People find me inspiring": [{ signalName: "leadership", strength: 2 }, { signalName: "expression", strength: 1 }],
      "People see me as brave": [{ signalName: "resilience", strength: 2 }, { signalName: "experimentation", strength: 1 }],
      "People feel safe with me": [{ signalName: "empathy", strength: 3 }, { signalName: "connection", strength: 1 }],
      "People admire my ideas": [{ signalName: "creativity", strength: 2 }, { signalName: "vision_thinking", strength: 1 }],
    },
    3: { _reflection: [{ signalName: "reflection", strength: 1 }, { signalName: "connection", strength: 1 }] },
  },
  external_reflections_q2: {
    0: {
      "Bigger than you think": [{ signalName: "leadership", strength: 2 }],
      "Different from what you'd name": [{ signalName: "pattern_thinking", strength: 2 }],
      "Something you take for granted": [{ signalName: "reflection", strength: 2 }],
    },
    1: {
      "My patience": [{ signalName: "resilience", strength: 2 }],
      "My insight": [{ signalName: "pattern_thinking", strength: 2 }],
      "My energy": [{ signalName: "leadership", strength: 2 }],
      "My warmth": [{ signalName: "empathy", strength: 2 }],
      "My honesty": [{ signalName: "expression", strength: 2 }],
      "My stability": [{ signalName: "resilience", strength: 2 }],
    },
    2: { _emoji: [{ signalName: "reflection", strength: 2 }, { signalName: "expression", strength: 1 }] },
    3: { _reflection: [{ signalName: "reflection", strength: 1 }, { signalName: "connection", strength: 1 }] },
  },
  external_reflections_q3: {
    0: {
      "Confidence (but I doubt)": [{ signalName: "leadership", strength: 1 }, { signalName: "reflection", strength: 1 }],
      "Calm (but I'm overwhelmed)": [{ signalName: "resilience", strength: 1 }, { signalName: "reflection", strength: 1 }],
      "Strength (but I feel fragile)": [{ signalName: "resilience", strength: 1 }, { signalName: "empathy", strength: 1 }],
      "Independence (but I need support)": [{ signalName: "exploration", strength: 1 }, { signalName: "connection", strength: 1 }],
      "Happiness (but I feel lost)": [{ signalName: "expression", strength: 1 }, { signalName: "reflection", strength: 1 }],
      "Certainty (but I'm figuring it out)": [{ signalName: "leadership", strength: 1 }, { signalName: "reflection", strength: 1 }],
    },
    1: {
      "Vulnerability": [{ signalName: "expression", strength: 2 }],
      "Uncertainty": [{ signalName: "reflection", strength: 2 }],
      "Need for connection": [{ signalName: "connection", strength: 2 }],
      "Fear of failure": [{ signalName: "resilience", strength: 2 }],
    },
    2: {
      "Armor — protective but heavy": [{ signalName: "resilience", strength: 2 }],
      "A stage — performing well": [{ signalName: "expression", strength: 2 }],
      "A filter — showing only the best": [{ signalName: "reflection", strength: 2 }],
      "A window — mostly transparent": [{ signalName: "expression", strength: 2 }, { signalName: "connection", strength: 1 }],
    },
    3: { _reflection: [{ signalName: "reflection", strength: 1 }, { signalName: "expression", strength: 1 }] },
  },
  external_reflections_q4: {
    0: {
      "Someone believed in me first": [{ signalName: "connection", strength: 2 }, { signalName: "purpose_drive", strength: 1 }],
      "Someone challenged me to grow": [{ signalName: "resilience", strength: 2 }, { signalName: "experimentation", strength: 1 }],
      "Someone showed me my blind spot": [{ signalName: "reflection", strength: 2 }, { signalName: "pattern_thinking", strength: 1 }],
      "Someone thanked me unexpectedly": [{ signalName: "empathy", strength: 2 }, { signalName: "community_orientation", strength: 1 }],
    },
    1: {
      "I am a leader": [{ signalName: "leadership", strength: 2 }],
      "I am creative": [{ signalName: "creativity", strength: 2 }],
      "I am deeply caring": [{ signalName: "empathy", strength: 2 }],
      "I am resilient": [{ signalName: "resilience", strength: 2 }],
      "I am wise": [{ signalName: "reflection", strength: 2 }],
      "I am brave": [{ signalName: "experimentation", strength: 2 }],
    },
    2: { _slider: [{ signalName: "resilience", strength: 1 }, { signalName: "empathy", strength: 1 }, { signalName: "expression", strength: 1 }] },
    3: { _reflection: [{ signalName: "reflection", strength: 1 }, { signalName: "connection", strength: 1 }] },
  },

  // ===== EXPERIMENTS =====
  experiments_q1: {
    0: {
      "Dive in headfirst": [{ signalName: "experimentation", strength: 3 }, { signalName: "resilience", strength: 1 }],
      "Research everything first": [{ signalName: "curiosity", strength: 2 }, { signalName: "systems_thinking", strength: 1 }],
      "Find someone to try with": [{ signalName: "community_orientation", strength: 2 }, { signalName: "connection", strength: 1 }],
    },
    1: {
      "A side project": [{ signalName: "experimentation", strength: 2 }, { signalName: "creativity", strength: 1 }],
      "A new skill": [{ signalName: "curiosity", strength: 2 }, { signalName: "experimentation", strength: 1 }],
      "Changed my routine": [{ signalName: "experimentation", strength: 2 }, { signalName: "resilience", strength: 1 }],
      "Traveled solo": [{ signalName: "exploration", strength: 2 }, { signalName: "resilience", strength: 1 }],
      "Started creating content": [{ signalName: "expression", strength: 2 }, { signalName: "creativity", strength: 1 }],
      "A new career path": [{ signalName: "experimentation", strength: 2 }, { signalName: "exploration", strength: 1 }],
    },
    2: { _emoji: [{ signalName: "experimentation", strength: 2 }, { signalName: "resilience", strength: 1 }] },
    3: { _reflection: [{ signalName: "reflection", strength: 1 }, { signalName: "experimentation", strength: 1 }] },
  },
  experiments_q2: {
    0: {
      "I thrive in it": [{ signalName: "experimentation", strength: 3 }],
      "I calculate first": [{ signalName: "systems_thinking", strength: 2 }],
      "I push through fear": [{ signalName: "resilience", strength: 2 }],
      "I prefer small safe experiments": [{ signalName: "reflection", strength: 2 }],
    },
    1: {
      "Fear of wasting time": [{ signalName: "systems_thinking", strength: 2 }],
      "Fear of judgment": [{ signalName: "expression", strength: 2 }],
      "Lack of clarity": [{ signalName: "reflection", strength: 2 }],
      "Too many options": [{ signalName: "pattern_thinking", strength: 2 }],
      "Not enough support": [{ signalName: "community_orientation", strength: 2 }],
      "Perfectionism": [{ signalName: "systems_thinking", strength: 2 }],
    },
    2: {
      "A lab — controlled tests": [{ signalName: "systems_thinking", strength: 2 }],
      "A playground — playful tries": [{ signalName: "expression", strength: 2 }],
      "A cliff jump — all or nothing": [{ signalName: "experimentation", strength: 2 }],
      "A garden — patient planting": [{ signalName: "reflection", strength: 2 }],
    },
    3: { _reflection: [{ signalName: "reflection", strength: 1 }, { signalName: "experimentation", strength: 1 }] },
  },
  experiments_q3: {
    0: {
      "Creative expression": [{ signalName: "creativity", strength: 2 }],
      "Business ideas": [{ signalName: "experimentation", strength: 2 }],
      "Lifestyle changes": [{ signalName: "exploration", strength: 2 }],
      "Relationship dynamics": [{ signalName: "connection", strength: 2 }],
      "Learning challenges": [{ signalName: "curiosity", strength: 2 }],
      "Physical adventures": [{ signalName: "exploration", strength: 2 }],
    },
    1: {
      "Be something no one has tried": [{ signalName: "creativity", strength: 2 }],
      "Test my limits": [{ signalName: "resilience", strength: 2 }],
      "Solve a real problem": [{ signalName: "problem_solving", strength: 2 }],
    },
    2: { _slider: [{ signalName: "experimentation", strength: 1 }, { signalName: "resilience", strength: 1 }, { signalName: "exploration", strength: 1 }] },
    3: { _reflection: [{ signalName: "reflection", strength: 1 }, { signalName: "experimentation", strength: 1 }] },
  },
  experiments_q4: {
    0: {
      "Creativity and expression": [{ signalName: "creativity", strength: 2 }],
      "Career and purpose": [{ signalName: "purpose_drive", strength: 2 }],
      "Relationships": [{ signalName: "connection", strength: 2 }],
      "Inner growth": [{ signalName: "reflection", strength: 2 }],
    },
    1: {
      "Time and space": [{ signalName: "reflection", strength: 2 }],
      "A supportive community": [{ signalName: "community_orientation", strength: 2 }],
      "Expert guidance": [{ signalName: "teaching_impulse", strength: 2 }],
      "Financial runway": [{ signalName: "resilience", strength: 2 }],
      "Creative tools": [{ signalName: "creativity", strength: 2 }],
      "Permission to fail": [{ signalName: "experimentation", strength: 2 }],
    },
    2: {
      "Speed of learning": [{ signalName: "curiosity", strength: 2 }],
      "Depth of experience": [{ signalName: "reflection", strength: 2 }],
      "Impact on others": [{ signalName: "purpose_drive", strength: 2 }],
      "Personal transformation": [{ signalName: "experimentation", strength: 2 }],
    },
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
