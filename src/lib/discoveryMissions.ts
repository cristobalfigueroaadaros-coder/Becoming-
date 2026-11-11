export type DiscoveryMission =
  | "skills"
  | "natural_talents"
  | "passions"
  | "experiments"
  | "inspirations";

export type EvidenceClass =
  | "FACT"
  | "SELF_INTERPRETATION"
  | "AI_HYPOTHESIS"
  | "CONFIRMED_DOT";

export interface EvidenceRecord {
  id: string;
  mission: DiscoveryMission;
  evidenceClass: EvidenceClass;
  text: string;
  source: string;
  confidence: number;
}

export interface MissionDimension {
  key: string;
  label: string;
  weight: number;
  prompts: string[];
}

export interface DiscoveryMissionDefinition {
  mission: DiscoveryMission;
  label: string;
  goal: string;
  threshold: number;
  dimensions: MissionDimension[];
  interactionKeys: string[];
}

export const discoveryMissionDefinitions: Record<DiscoveryMission, DiscoveryMissionDefinition> = {
  skills: {
    mission: "skills",
    label: "Skills",
    goal: "Understand what the person can genuinely do well.",
    threshold: 0.65,
    dimensions: [
      {
        key: "self_perception",
        label: "Self-perceived ability",
        weight: 0.2,
        prompts: ["good at", "skilled", "strong at", "I can", "I know how"],
      },
      {
        key: "natural_ease",
        label: "Natural ease",
        weight: 0.2,
        prompts: ["comes naturally", "easy for me", "without trying", "naturally"],
      },
      {
        key: "real_world_evidence",
        label: "Real-world evidence",
        weight: 0.3,
        prompts: ["built", "created", "made", "led", "organized", "launched", "helped"],
      },
      {
        key: "external_recognition",
        label: "External recognition",
        weight: 0.15,
        prompts: ["people tell me", "recognized", "praised", "asked me", "trusted me"],
      },
      {
        key: "energy",
        label: "Energy and enjoyment",
        weight: 0.15,
        prompts: ["love", "enjoy", "energized", "excited", "alive"],
      },
    ],
    interactionKeys: ["skills_resonance"],
  },
  natural_talents: {
    mission: "natural_talents",
    label: "Natural talents / childhood signals",
    goal: "Understand abilities, tendencies, interests, or behaviors that appeared naturally or early.",
    threshold: 0.6,
    dimensions: [
      {
        key: "early_memory",
        label: "Early memory",
        weight: 0.3,
        prompts: ["child", "kid", "young", "grew up", "school", "early"],
      },
      {
        key: "natural_tendency",
        label: "Natural tendency",
        weight: 0.25,
        prompts: ["always", "naturally", "instinctively", "used to"],
      },
      {
        key: "repeated_pattern",
        label: "Repeated pattern",
        weight: 0.25,
        prompts: ["kept", "again", "repeatedly", "often"],
      },
      {
        key: "user_meaning",
        label: "User meaning",
        weight: 0.2,
        prompts: ["meant", "realized", "learned", "important"],
      },
    ],
    interactionKeys: ["childhood_signal_flash"],
  },
  passions: {
    mission: "passions",
    label: "Passions / curiosities",
    goal: "Understand what repeatedly attracts attention, curiosity, energy, or voluntary learning.",
    threshold: 0.6,
    dimensions: [
      {
        key: "attention",
        label: "Repeated attention",
        weight: 0.25,
        prompts: ["drawn to", "interested", "curious", "fascinated", "attention"],
      },
      {
        key: "voluntary_learning",
        label: "Voluntary learning",
        weight: 0.25,
        prompts: ["learn", "read", "study", "research", "watch"],
      },
      {
        key: "energy",
        label: "Energy",
        weight: 0.25,
        prompts: ["love", "energized", "excited", "obsessed", "alive"],
      },
      {
        key: "returning_theme",
        label: "Returning theme",
        weight: 0.25,
        prompts: ["keep coming back", "again and again", "always return", "still"],
      },
    ],
    interactionKeys: ["passion_energy_map"],
  },
  experiments: {
    mission: "experiments",
    label: "Experiments",
    goal: "Understand what the person has actually tried, built, launched, changed, failed at, learned from, or explored.",
    threshold: 0.65,
    dimensions: [
      {
        key: "action_taken",
        label: "Action taken",
        weight: 0.3,
        prompts: ["tried", "built", "started", "launched", "created", "changed"],
      },
      {
        key: "outcome",
        label: "Outcome",
        weight: 0.25,
        prompts: ["worked", "failed", "learned", "result", "ended", "became"],
      },
      {
        key: "reflection",
        label: "Reflection",
        weight: 0.25,
        prompts: ["realized", "learned", "taught me", "now I know"],
      },
      {
        key: "next_iteration",
        label: "Next iteration",
        weight: 0.2,
        prompts: ["next", "again", "continue", "improve", "different"],
      },
    ],
    interactionKeys: ["experiment_timeline"],
  },
  inspirations: {
    mission: "inspirations",
    label: "Inspirations",
    goal: "Understand admired people and the qualities, values, or direction their example reveals.",
    threshold: 0.5,
    dimensions: [
      {
        key: "admired_person",
        label: "Admired person",
        weight: 0.35,
        prompts: ["admire", "inspired by", "look up to", "role model"],
      },
      {
        key: "admired_quality",
        label: "Admired quality",
        weight: 0.45,
        prompts: ["because", "what I admire", "quality", "helped", "courage", "kind"],
      },
      {
        key: "aspirational_direction",
        label: "Aspirational direction",
        weight: 0.2,
        prompts: ["want to", "hope to", "matters", "value", "direction"],
      },
    ],
    interactionKeys: ["inspiration_quality_pick"],
  },
};

export const discoveryMissionOrder: DiscoveryMission[] = [
  "skills",
  "natural_talents",
  "passions",
  "experiments",
  "inspirations",
];
