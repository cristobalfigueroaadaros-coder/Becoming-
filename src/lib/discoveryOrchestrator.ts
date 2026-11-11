import {
  discoveryMissionDefinitions,
  discoveryMissionOrder,
  DiscoveryMission,
  EvidenceClass,
  EvidenceRecord,
} from "@/lib/discoveryMissions";
import type { GroundedLifetimeMoment } from "@/lib/lifetimeCandidates";

export type DiscoveryState =
  | "ENTRY"
  | "OPEN_INTRO"
  | "LISTENING"
  | "ACKNOWLEDGE"
  | "MISSION_SELECTED"
  | "INTERACTION"
  | "FOLLOW_UP"
  | "READY_FOR_DOTS"
  | "DOT_REVIEW"
  | "ATLAS_UPDATE"
  | "NEXT_MISSION"
  | "EXIT_OR_CONTINUE";

export type DiscoveryAction =
  | "LISTEN"
  | "ACKNOWLEDGE"
  | "ASK"
  | "SHOW_INTERACTION"
  | "GENERATE_DOTS"
  | "MOVE_MISSION"
  | "COMPLETE_FOR_NOW";

export interface MissionCoverage {
  mission: DiscoveryMission;
  score: number;
  covered: string[];
  missing: string[];
}

export interface DeferredSignal {
  topic: string;
  source?: string;
  possibleMissions: DiscoveryMission[];
  reason: string;
  explored: boolean;
}

export interface PrivateDiscoverySignal {
  type:
    | "timeline_moment"
    | "possible_dot"
    | "possible_connection"
    | "transferable_skill"
    | "value_signal"
    | "audience_signal"
    | "project_seed"
    | "action_reflection"
    | "mentor_handoff_context";
  summary: string;
  revealTiming: string;
  mentorUse: string;
  confidence: number;
}

export interface DiscoveryNextMove {
  priority:
    | "origin"
    | "learning"
    | "creation"
    | "direction"
    | "action_reflection"
    | "project_momentum"
    | "atlas_deepening"
    | "mentor_handoff";
  reason: string;
  suggestedQuestion: string;
  recommendedMentor?: string;
}

export interface DiscoveryDecision {
  message: string;
  activeMission: DiscoveryMission;
  action: DiscoveryAction;
  state: DiscoveryState;
  coverage: MissionCoverage;
  interactionKey?: string;
  deferredSignals: DeferredSignal[];
  evidence: EvidenceRecord[];
  privateSignals?: PrivateDiscoverySignal[];
  lifetimeMoments?: GroundedLifetimeMoment[];
  nextMove?: DiscoveryNextMove;
}

export interface DiscoveryTurn {
  text: string;
  source?: string;
  priorUserTurns?: number;
  interactionCount?: number;
}

export interface DiscoveryInteractionTurn {
  activeMission: DiscoveryMission;
  interactionKey?: string;
  response: unknown;
}

export const futureSelfDiscoveryGuidance = [
  "Warm, human, concise, and emotionally intelligent.",
  "Ask one clear prompt per turn; it can contain two connected parts when that makes the follow-up more useful.",
  "Do not ask things already answered.",
  "Acknowledge before probing.",
  "Distinguish fact from interpretation.",
  "Never diagnose, interpret trauma, or make absolute identity claims.",
  "Do not force depth.",
  "Recognize broadly and explore narrowly.",
  "Save useful unrelated themes as deferred signals.",
  "Future Self is an emergent mirror, not an oracle.",
];

const splitIntoSentences = (text: string) =>
  text
    .split(/[.!?\n]+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

const includesAny = (text: string, prompts: string[]) =>
  prompts.some((prompt) => text.includes(prompt));

const createEvidenceId = (mission: DiscoveryMission, index: number) =>
  `${mission}-${index + 1}`;

const classifyEvidence = (sentence: string): EvidenceClass => {
  const normalized = sentence.toLowerCase();

  if (/\bi am\b|\bi'm\b|\bi feel\b|\bi think\b|\bi believe\b|\bi'm good\b/.test(normalized)) {
    return "SELF_INTERPRETATION";
  }

  return "FACT";
};

export const assessMissionCoverage = (text: string, mission: DiscoveryMission): MissionCoverage => {
  const normalized = text.toLowerCase();
  const definition = discoveryMissionDefinitions[mission];
  const covered = definition.dimensions
    .filter((dimension) => includesAny(normalized, dimension.prompts))
    .map((dimension) => dimension.key);
  const missing = definition.dimensions
    .filter((dimension) => !covered.includes(dimension.key))
    .map((dimension) => dimension.key);
  const score = definition.dimensions.reduce((total, dimension) => {
    return covered.includes(dimension.key) ? total + dimension.weight : total;
  }, 0);

  return {
    mission,
    score: Number(score.toFixed(2)),
    covered,
    missing,
  };
};

const selectMission = (text: string) => {
  const coverages = discoveryMissionOrder.map((mission) => assessMissionCoverage(text, mission));
  const strongest = coverages.reduce((best, current) => {
    if (current.score > best.score) return current;
    return best;
  }, coverages[0]);

  return strongest.score > 0 ? strongest : assessMissionCoverage(text, "skills");
};

const extractEvidence = (text: string, mission: DiscoveryMission): EvidenceRecord[] => {
  const sentences = splitIntoSentences(text);
  const definition = discoveryMissionDefinitions[mission];
  const missionSentences = sentences.filter((sentence) =>
    definition.dimensions.some((dimension) => includesAny(sentence.toLowerCase(), dimension.prompts))
  );

  return missionSentences.slice(0, 4).map((sentence, index) => ({
    id: createEvidenceId(mission, index),
    mission,
    evidenceClass: classifyEvidence(sentence),
    text: sentence,
    source: "initial introduction",
    confidence: 0.55,
  }));
};

const detectDeferredSignals = (text: string, activeMission: DiscoveryMission): DeferredSignal[] => {
  const normalized = text.toLowerCase();
  const signals: DeferredSignal[] = [];

  const addSignal = (signal: DeferredSignal) => {
    if (!signal.possibleMissions.includes(activeMission)) {
      signals.push(signal);
    }
  };

  if (/\bmoved\b|\blived in\b|\bcountry\b|\bcity\b|\brelocat/.test(normalized)) {
    addSignal({
      topic: "moving or rebuilding life in a place",
      source: "initial introduction",
      possibleMissions: ["experiments"],
      reason: "The user may be describing adaptation, independence, or a life experiment.",
      explored: false,
    });
  }

  if (/\bfamily\b|\bmother\b|\bfather\b|\bgrandmother\b|\bgrandfather\b|\bparent/.test(normalized)) {
    addSignal({
      topic: "family influence",
      source: "initial introduction",
      possibleMissions: ["natural_talents", "inspirations"],
      reason: "The user mentioned a relationship that may contain early signals or admired qualities.",
      explored: false,
    });
  }

  if (/\bwork\b|\bjob\b|\bcareer\b|\bbusiness\b|\bcompany\b/.test(normalized)) {
    addSignal({
      topic: "work and creation context",
      source: "initial introduction",
      possibleMissions: ["skills", "experiments"],
      reason: "The user referenced a practical arena where skills or experiments may have evidence.",
      explored: false,
    });
  }

  if (/\bhard\b|\bpain\b|\btrauma\b|\bgrief\b|\bloss\b|\bstruggle\b/.test(normalized)) {
    addSignal({
      topic: "emotionally heavy experience",
      source: "initial introduction",
      possibleMissions: ["experiments"],
      reason: "The user shared heavier material that should be acknowledged carefully without forcing depth.",
      explored: false,
    });
  }

  return signals.slice(0, 3);
};

const buildPrivateSignals = (
  text: string,
  mission: DiscoveryMission,
  evidence: EvidenceRecord[]
): PrivateDiscoverySignal[] => {
  const normalized = text.toLowerCase();
  const signals: PrivateDiscoverySignal[] = [];

  const addSignal = (signal: PrivateDiscoverySignal) => {
    if (!signals.some((item) => item.type === signal.type && item.summary === signal.summary)) {
      signals.push(signal);
    }
  };

  if (/\bchile\b|\bberlin\b|\baustralia\b|\bleft\b|\blived\b|\btravel/.test(normalized)) {
    addSignal({
      type: "timeline_moment",
      summary: "The user's moves and places may be important life chapters, not just biography.",
      revealTiming: "Invite a Life Timeline moment when the user is ready to anchor where a shift happened.",
      mentorUse: "Use these places as context for adaptation, independence, identity change, and life transitions.",
      confidence: 0.7,
    });
  }

  if (/\bfamily squad\b|\bdigital board game\b|\bgame\b|\bgamification\b|\bexperience/.test(normalized)) {
    addSignal({
      type: "project_seed",
      summary: "The user has created experience-based products that use play, learning, family, or human behavior.",
      revealTiming: "Reveal when shaping a new project or routing to builders, UX, or gamification guidance.",
      mentorUse: "Ask what mechanics, emotional outcomes, and testing lessons can transfer into the next project.",
      confidence: 0.76,
    });
  }

  if (/\bhelp\b|\bserve\b|\bsociety\b|\bimpact\b|\bfamil/.test(normalized)) {
    addSignal({
      type: "value_signal",
      summary: "The user returns to service: helping people become better and creating positive impact.",
      revealTiming: "Reveal when clarifying direction, audience, or why a project matters.",
      mentorUse: "Connect strategy to service and impact so project advice does not become generic.",
      confidence: 0.72,
    });
  }

  if (/\btest\b|\biterate\b|\bfeedback\b|\bprototype\b|\btry\b|\bcreated\b|\bbuilt\b|\bdeveloped\b/.test(normalized)) {
    addSignal({
      type: "transferable_skill",
      summary: "The user learns by testing ideas in reality and iterating from feedback.",
      revealTiming: "Reveal when the user needs confidence or a practical next experiment.",
      mentorUse: "Route toward small experiments, user feedback, and fast iteration instead of abstract planning.",
      confidence: 0.74,
    });
  }

  if (evidence.length > 0) {
    addSignal({
      type: "mentor_handoff_context",
      summary: `Current discovery route: ${mission}. Strongest evidence: ${evidence.slice(0, 2).map((item) => item.text).join(" / ")}`,
      revealTiming: "Keep hidden unless a mentor needs context to give tailored guidance.",
      mentorUse: "Use as compact background for the next mentor response without naming the internal route.",
      confidence: 0.62,
    });
  }

  return signals.slice(0, 6);
};

const buildNextMove = (
  coverage: MissionCoverage,
  action: DiscoveryAction,
  message: string
): DiscoveryNextMove => {
  if (action === "GENERATE_DOTS") {
    return {
      priority: "atlas_deepening",
      reason: "There is enough grounded material to let the user validate one visible insight while preserving other signals for later.",
      suggestedQuestion: "Choose the one that feels most true, or edit it until it sounds like you.",
    };
  }

  if (coverage.mission === "experiments" || coverage.mission === "skills") {
    return {
      priority: "creation",
      reason: "The user is describing things they made, tried, tested, or learned by doing.",
      suggestedQuestion: message,
      recommendedMentor: "builder_team",
    };
  }

  return {
    priority: "learning",
    reason: "The next useful move is to understand what the user learned from a concrete life chapter.",
    suggestedQuestion: message,
  };
};

const chooseAction = (coverage: MissionCoverage, priorUserTurns = 0, interactionCount = 0): DiscoveryAction => {
  if (priorUserTurns < 1) return "ASK";
  if (priorUserTurns >= 2 && interactionCount >= 1 && coverage.score >= 0.65) return "GENERATE_DOTS";
  if (coverage.score >= 0.35) return "SHOW_INTERACTION";
  return "ASK";
};

const buildMessage = (coverage: MissionCoverage, action: DiscoveryAction, text: string) => {
  const normalized = text.toLowerCase();
  const mentionsBiographicalArc =
    /\bchile\b/.test(normalized) &&
    /\bberlin\b/.test(normalized) &&
    /\baustralia\b/.test(normalized);
  const mentionsFamilySquad = /\bfamily squad\b|\bdigital board game\b/.test(normalized);
  const wantsMeaningfulChange = /\bchange\b|\bdifferent\b|\bmeaningful\b|\bimpact\b|\bserve\b|\bhelp\b|\bbetter world\b|\b9\s*to\s*5\b|\bjob\b/.test(normalized);
  const biographyDetails = [
    /\bchile\b/.test(normalized) ? "growing up in Chile" : "",
    /\be-?commerce\b|\bonline store\b/.test(normalized) ? "starting an e-commerce business" : "",
    /\bberlin\b/.test(normalized) ? "being shaped by Berlin" : "",
    /\baustralia\b/.test(normalized) ? "spending years in Australia" : "",
    mentionsFamilySquad ? "building Family Squad" : "",
    /\bfestival\b|\bevents?\b|\bparties\b/.test(normalized) ? "creating experiences for people" : "",
    /\bsomething different\b|\bnew project\b|\bnext chapter\b/.test(normalized) ? "looking for something different now" : "",
  ].filter(Boolean);

  const summarizeDetails = (details: string[]) => {
    const unique = Array.from(new Set(details)).slice(0, 4);
    if (unique.length <= 1) return unique[0] || "";
    if (unique.length === 2) return `${unique[0]} and ${unique[1]}`;
    return `${unique.slice(0, -1).join(", ")}, and ${unique[unique.length - 1]}`;
  };

  if (action === "GENERATE_DOTS") {
    return "I think I understand something real now. I am going to offer a few possible mirrors from what you shared. Choose only what feels true.";
  }

  if (action === "SHOW_INTERACTION") {
    if (coverage.mission === "experiments") {
      return "What stands out is that your ideas do not stay abstract; you try them, shape them, and learn from contact with real people. What did one of those projects teach you that you could use in a completely new project?";
    }

    if (coverage.mission === "skills") {
      return "I am noticing how you describe what you can do: breaking things down, connecting ideas, creating experiences. Give me one real moment where you used that ability and it changed the outcome.";
    }

    if (coverage.mission === "inspirations") {
      return "Something in that moment touched what you want the world to have more of. What did it make you want other people to feel or experience?";
    }

    return "Something in that part of your story feels important. Where else in your life have you seen that same way of moving, choosing, or creating?";
  }

  if (mentionsBiographicalArc && mentionsFamilySquad) {
    return "I heard several important chapters: leaving Chile, being shaped by Berlin, spending years in Australia, and creating Family Squad. What did that journey teach you that you want to carry into your next chapter?";
  }

  if ((turnHasRichBiography(normalized) || biographyDetails.length >= 3) && action === "ASK") {
    const detailSummary = summarizeDetails(biographyDetails);
    return `I heard several important chapters${detailSummary ? `: ${detailSummary}` : ""}. Which moment changed you most, and what did you learn from it?`;
  }

  if (mentionsFamilySquad) {
    return "Family Squad feels important because it was not only an idea; you turned what you were learning about people, families, and connection into something others could actually experience. What part of building it taught you the most about the kind of creator you are?";
  }

  if (wantsMeaningfulChange) {
    return "I hear that you are looking for something more meaningful, not just a different role or project. When you imagine the kind of change you want to create, who is the first small group of people you would feel called to help, and why them?";
  }

  if (coverage.mission === "experiments") {
    return "You have lived through several real experiments, not just thoughts: business, travel, programs, and building. Which one changed how you saw yourself or the kind of work you wanted to create?";
  }

  if (coverage.mission === "skills") {
    return "I am hearing a practical intelligence in the way you connect people, ideas, problems, and experiences. What is one thing you learned by building Family Squad that you think you could carry into your next project?";
  }

  if (coverage.mission === "inspirations") {
    return "That story feels like more than inspiration; it sounds like a value becoming visible. What did that moment teach you about the kind of world you want to help create?";
  }

  if (coverage.mission === "passions") {
    return "Your curiosity seems to move you into new worlds, not just new information. What were you really searching for when you left what was familiar?";
  }

  return "I want to stay close to what actually happened in your life. Which moment changed you most, and what did you learn from it?";
};

const turnHasRichBiography = (normalized: string) =>
  /\bgrew up\b|\bstudied\b|\bstarted\b|\bleft\b|\blived\b|\bwent to\b|\bcreated\b|\bdeveloped\b|\bbuilt\b/.test(normalized);

export const decideNextDiscoveryStep = (turn: DiscoveryTurn): DiscoveryDecision => {
  const text = turn.text.trim();
  const coverage = selectMission(text);
  const action = chooseAction(coverage, turn.priorUserTurns, turn.interactionCount);
  const definition = discoveryMissionDefinitions[coverage.mission];
  const evidence = extractEvidence(text, coverage.mission);
  const message = buildMessage(coverage, action, text);

  return {
    message,
    activeMission: coverage.mission,
    action,
    state: action === "ASK" ? "FOLLOW_UP" : action === "SHOW_INTERACTION" ? "INTERACTION" : "READY_FOR_DOTS",
    coverage,
    interactionKey: action === "SHOW_INTERACTION" ? definition.interactionKeys[0] : undefined,
    deferredSignals: detectDeferredSignals(text, coverage.mission),
    evidence,
    privateSignals: buildPrivateSignals(text, coverage.mission, evidence),
    nextMove: buildNextMove(coverage, action, message),
  };
};

export const decideAfterDiscoveryInteraction = (turn: DiscoveryInteractionTurn): DiscoveryDecision => {
  const coverage = assessMissionCoverage(JSON.stringify(turn.response), turn.activeMission);
  const nextCoverage: MissionCoverage = {
    ...coverage,
    score: Math.max(0.68, coverage.score),
    covered: Array.from(new Set([...coverage.covered, "real_world_evidence"])),
    missing: coverage.missing.filter((item) => item !== "real_world_evidence"),
  };

  return {
    message: "That gives me something much more concrete. I am going to offer a few possible mirrors from what you shared, and you can choose only what feels true.",
    activeMission: turn.activeMission,
    action: "GENERATE_DOTS",
    state: "READY_FOR_DOTS",
    coverage: nextCoverage,
    interactionKey: turn.interactionKey,
    deferredSignals: [],
    evidence: [
      {
        id: `${turn.activeMission}-interaction-1`,
        mission: turn.activeMission,
        evidenceClass: "FACT",
        text: JSON.stringify(turn.response),
        source: "selected Atlas interaction",
        confidence: 0.65,
      },
    ],
    privateSignals: [
      {
        type: "action_reflection",
        summary: "The user completed a focused discovery reflection that can inform future guidance.",
        revealTiming: "Use when connecting this reflection to a saved Dot, project decision, or next action.",
        mentorUse: "Treat the reflection as user-provided context, not as a final identity conclusion.",
        confidence: 0.64,
      },
    ],
    nextMove: {
      priority: "atlas_deepening",
      reason: "The reflection is now concrete enough to let the user validate a visible Atlas Dot.",
      suggestedQuestion: "Choose only what feels true, or edit the words until they fit.",
    },
  };
};
