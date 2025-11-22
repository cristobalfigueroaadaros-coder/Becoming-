import { supabase } from "@/integrations/supabase/client";

interface HumanDesignData {
  type: string;
  strategy: string;
  authority: string;
  profile: string;
  defined_centers: string[];
  undefined_centers: string[];
  incarnation_cross?: string;
  key_gates: Array<{ gate: number; description: string }>;
  is_approximate: boolean;
}

// ===== Astrological Calculation Functions =====

const calculateJulianDay = (date: Date): number => {
  const a = Math.floor((14 - (date.getMonth() + 1)) / 12);
  const y = date.getFullYear() + 4800 - a;
  const m = (date.getMonth() + 1) + 12 * a - 3;
  
  return date.getDate() + Math.floor((153 * m + 2) / 5) + 365 * y + 
         Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
};

const calculateSunPosition = (jd: number): number => {
  // Simplified sun position calculation (degrees in zodiac)
  const n = jd - 2451545.0;
  const L = (280.460 + 0.9856474 * n) % 360;
  const g = ((357.528 + 0.9856003 * n) % 360) * Math.PI / 180;
  const lambda = (L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) % 360;
  return lambda < 0 ? lambda + 360 : lambda;
};

const degreesToGate = (degrees: number): number => {
  // Convert zodiac degrees to I Ching gates (64 gates in 360 degrees)
  const gateNumber = Math.floor((degrees / 360) * 64) + 1;
  return gateNumber > 64 ? 1 : gateNumber;
};

const calculateProfile = (sunGate: number, earthGate: number): string => {
  const sunLine = (sunGate % 6) + 1;
  const earthLine = (earthGate % 6) + 1;
  return `${sunLine}/${earthLine}`;
};

const determineType = (definedCenters: string[]): string => {
  const hasSacral = definedCenters.includes('Sacral');
  const hasThroat = definedCenters.includes('Throat');
  const hasMotor = definedCenters.some(c => ['Heart/Ego', 'Solar Plexus', 'Root', 'Sacral'].includes(c));
  
  if (!hasSacral && !hasMotor) return 'Reflector';
  if (!hasSacral && hasMotor && hasThroat) return 'Manifestor';
  if (!hasSacral && hasThroat) return 'Projector';
  if (hasSacral && hasMotor && hasThroat) return 'Manifesting Generator';
  if (hasSacral) return 'Generator';
  return 'Projector';
};

const determineStrategy = (type: string): string => {
  switch (type) {
    case 'Generator': return 'To Respond';
    case 'Manifesting Generator': return 'To Respond';
    case 'Projector': return 'To Wait for Invitation';
    case 'Manifestor': return 'To Inform';
    case 'Reflector': return 'To Wait 28 Days';
    default: return 'To Respond';
  }
};

const determineAuthority = (definedCenters: string[]): string => {
  if (definedCenters.includes('Solar Plexus')) return 'Emotional Authority';
  if (definedCenters.includes('Sacral')) return 'Sacral Authority';
  if (definedCenters.includes('Spleen')) return 'Splenic Authority';
  if (definedCenters.includes('Heart/Ego')) return 'Ego Authority';
  if (definedCenters.includes('G Center')) return 'Self-Projected Authority';
  if (definedCenters.includes('Throat') && definedCenters.includes('Ajna')) return 'Mental Authority';
  return 'Lunar Authority';
};

const gateDescriptions: { [key: number]: string } = {
  1: 'Creative self-expression and individuality',
  2: 'Direction - receiving and responding',
  3: 'Ordering - innovation through challenge',
  4: 'Mental solutions and formulization',
  5: 'Fixed rhythms and patience',
  6: 'Friction and intimacy',
  7: 'The role of the self in interaction',
  8: 'Contribution and creative fulfillment',
  9: 'Focus and determination',
  10: 'Behavior of the self',
  13: 'The listener - storytelling and sharing experiences',
  14: 'Power skills and resources',
  15: 'Extremes and love of humanity',
  16: 'Skills and enthusiasm',
  17: 'Following and opinions',
  18: 'Correction and finding what needs work',
  19: 'Wanting and sensitivity to needs',
  20: 'The now - contemplation in action',
  21: 'The treasurer - control',
  22: 'Openness and grace',
  23: 'Assimilation and explaining',
  24: 'Rationalization and the return',
  25: 'Spirit of the self - universal love and acceptance',
  26: 'The egoist - willpower',
  27: 'Caring and nourishment',
  28: 'The game player - purpose',
  29: 'Perseverance and saying yes',
  30: 'Feelings and recognition of fate',
  31: 'Influence and leadership',
  32: 'Continuity and transformation',
  33: 'Privacy and retreat',
  34: 'Power and strength',
  35: 'Progress and change',
  36: 'Crisis and emotional experience',
  37: 'Friendship and family',
  38: 'Opposition and individuality',
  39: 'Provocation and emotional intensity',
  40: 'Aloneness and restoration',
  41: 'Contraction - fantasy and imagination',
  42: 'Increase - growth and expansion',
  43: 'Breakthrough and insight',
  44: 'Coming to meet - alertness',
  45: 'Gathering together - the king/queen',
  46: 'Pushing upward - determination',
  47: 'Oppression - realizing',
  48: 'The well - depth',
  49: 'Revolution - principles',
  50: 'Values and responsibility',
  51: 'Arousing - shock',
  52: 'Keeping still - stillness',
  53: 'Development - starting',
  54: 'The marrying maiden - ambition',
  55: 'Abundance - spirit',
  56: 'The wanderer - stimulation',
  57: 'Gentle - intuitive clarity',
  58: 'Joy and vitality',
  59: 'Dispersion - intimacy',
  60: 'Limitation - acceptance',
  61: 'Inner truth - mystery',
  62: 'Preponderance of the small - details',
  63: 'After completion - doubt',
  64: 'Before completion - confusion'
};

const getIncarnationCross = (sunGate: number, earthGate: number, profile: string): string => {
  const isRightAngle = profile.startsWith('1/') || profile.startsWith('2/') || 
                       profile.startsWith('3/') || profile.startsWith('4/');
  const angle = isRightAngle ? 'Right Angle' : 
                profile.startsWith('5/') || profile.startsWith('6/') ? 'Left Angle' : 'Juxtaposition';
  
  const sunDesc = gateDescriptions[sunGate]?.split(' - ')[0] || `Gate ${sunGate}`;
  return `${angle} Cross of ${sunDesc}`;
};

// Sophisticated Human Design calculator using birth data
export const generateMockHumanDesignData = (birthDate: string, birthTime?: string | null, isTimeUnknown?: boolean): HumanDesignData => {
  // Parse birth data
  const [year, month, day] = birthDate.split('-').map(Number);
  const time = birthTime ? birthTime.split(':').map(Number) : [12, 0]; // Default to noon if unknown
  const birthDateTime = new Date(year, month - 1, day, time[0], time[1]);
  
  // Calculate Julian Day
  const jd = calculateJulianDay(birthDateTime);
  
  // Add time of day factor (affects definition of centers)
  const timeOfDayFactor = isTimeUnknown ? 0.5 : (time[0] + time[1] / 60) / 24;
  
  // Calculate sun position at birth (Personality)
  const sunDegrees = calculateSunPosition(jd);
  const sunGate = degreesToGate(sunDegrees);
  
  // Calculate earth position (opposite sun)
  const earthDegrees = (sunDegrees + 180) % 360;
  const earthGate = degreesToGate(earthDegrees);
  
  // Calculate Design sun (88 degrees of sun before birth, roughly 88 days)
  const designJd = jd - 88;
  const designSunDegrees = calculateSunPosition(designJd);
  const designSunGate = degreesToGate(designSunDegrees);
  
  // Determine defined centers based on birth data and time
  const allCenters = ['Head', 'Ajna', 'Throat', 'G Center', 'Heart/Ego', 'Sacral', 'Solar Plexus', 'Spleen', 'Root'];
  
  // Use deterministic "randomness" based on Julian day and time
  const definedCenters = allCenters.filter((_, index) => {
    const hash = (jd * (index + 1) + timeOfDayFactor * 1000) % 100;
    return hash < 50; // Roughly 50% definition rate
  });
  
  // Determine type and ensure logical consistency
  let type = determineType(definedCenters);
  
  // Ensure Generators have Sacral defined
  if ((type === 'Generator' || type === 'Manifesting Generator') && !definedCenters.includes('Sacral')) {
    definedCenters.push('Sacral');
    type = determineType(definedCenters);
  }
  
  const undefinedCenters = allCenters.filter(center => !definedCenters.includes(center));
  
  // Calculate profile
  const profile = calculateProfile(sunGate, earthGate);
  
  // Determine strategy and authority
  const strategy = determineStrategy(type);
  const authority = determineAuthority(definedCenters);
  
  // Generate key gates based on planetary positions
  const keyGates = [
    { gate: sunGate, description: gateDescriptions[sunGate] || `Gate ${sunGate}` },
    { gate: earthGate, description: gateDescriptions[earthGate] || `Gate ${earthGate}` },
    { gate: designSunGate, description: gateDescriptions[designSunGate] || `Gate ${designSunGate}` }
  ].filter((gate, index, self) => 
    // Remove duplicates
    index === self.findIndex((g) => g.gate === gate.gate)
  );
  
  // Calculate incarnation cross
  const incarnationCross = getIncarnationCross(sunGate, earthGate, profile);
  
  return {
    type,
    strategy,
    authority,
    profile,
    defined_centers: definedCenters,
    undefined_centers: undefinedCenters,
    key_gates: keyGates,
    incarnation_cross: incarnationCross,
    is_approximate: isTimeUnknown || !birthTime
  };
};

// Generate constellation dots from Human Design data
export const generateHumanDesignDots = async (userId: string, data: HumanDesignData) => {
  const dots = [];

  // Type dot
  dots.push({
    user_id: userId,
    source_type: "human_design_type",
    insight_text: `Your Human Design Type: ${data.type}. ${getTypeInsight(data.type)}`,
    core_theme: "Human Design",
    skill_tags: ["Energy Type", data.type],
    emotional_tone: "empowering",
  });

  // Strategy dot
  dots.push({
    user_id: userId,
    source_type: "human_design_strategy",
    insight_text: `Your Strategy: ${data.strategy}. This is how you're designed to interact with the world and make aligned decisions.`,
    core_theme: "Decision Making",
    skill_tags: ["Strategy", data.strategy],
    emotional_tone: "clarifying",
  });

  // Authority dot
  dots.push({
    user_id: userId,
    source_type: "human_design_authority",
    insight_text: `Your Authority: ${data.authority}. This is your inner compass for making correct decisions.`,
    core_theme: "Inner Wisdom",
    skill_tags: ["Authority", data.authority],
    emotional_tone: "guiding",
  });

  // Profile dot
  dots.push({
    user_id: userId,
    source_type: "human_design_profile",
    insight_text: `Your Profile: ${data.profile}. This describes your life theme and how you learn and interact with others.`,
    core_theme: "Life Purpose",
    skill_tags: ["Profile", data.profile],
    emotional_tone: "illuminating",
  });

  // Defined centers dot
  if (data.defined_centers.length > 0) {
    dots.push({
      user_id: userId,
      source_type: "human_design_centers",
      insight_text: `Your Defined Centers: ${data.defined_centers.join(", ")}. These are areas where you have consistent, reliable energy.`,
      core_theme: "Consistent Energy",
      skill_tags: ["Defined Centers", ...data.defined_centers.slice(0, 2)],
      emotional_tone: "empowering",
    });
  }

  // Key gates dots
  data.key_gates.forEach((gate) => {
    dots.push({
      user_id: userId,
      source_type: "human_design_gate",
      insight_text: `Gate ${gate.gate}: ${gate.description}`,
      core_theme: "Natural Talents",
      skill_tags: [`Gate ${gate.gate}`, "Human Design"],
      emotional_tone: "insightful",
    });
  });

  // Incarnation Cross dot
  if (data.incarnation_cross) {
    dots.push({
      user_id: userId,
      source_type: "human_design_incarnation_cross",
      insight_text: `Your Incarnation Cross: ${data.incarnation_cross}. This is your life's purpose and the role you're here to play in the world.`,
      core_theme: "Life Purpose",
      skill_tags: ["Incarnation Cross", "Purpose"],
      emotional_tone: "profound",
    });
  }

  // Communication Style dot
  const commStyle = getCommunicationStyle(data.type, data.defined_centers);
  dots.push({
    user_id: userId,
    source_type: "human_design_communication",
    insight_text: `Communication Style: ${commStyle.style}. ${commStyle.insight}`,
    core_theme: "Expression",
    skill_tags: ["Communication", commStyle.style],
    emotional_tone: "clarifying",
  });

  // Decision-making Tendencies dot
  const decisionStyle = getDecisionMakingTendency(data.authority);
  dots.push({
    user_id: userId,
    source_type: "human_design_decision_making",
    insight_text: `Decision-Making: ${decisionStyle.tendency}. ${decisionStyle.insight}`,
    core_theme: "Decision Making",
    skill_tags: ["Decision Making", decisionStyle.tendency],
    emotional_tone: "empowering",
  });

  // Work Flow Pattern dot
  const workFlow = getWorkFlowPattern(data.type, data.defined_centers);
  dots.push({
    user_id: userId,
    source_type: "human_design_workflow",
    insight_text: `Work Flow: ${workFlow.pattern}. ${workFlow.insight}`,
    core_theme: "Energy Management",
    skill_tags: ["Work Flow", workFlow.pattern],
    emotional_tone: "practical",
  });

  // Insert all dots
  const { error } = await supabase.from("insight_dots").insert(dots);
  
  if (error) {
    console.error("Error creating Human Design dots:", error);
    throw error;
  }

  return dots;
};

const getTypeInsight = (type: string): string => {
  const insights: Record<string, string> = {
    Generator: "Your sustained energy comes from doing what lights you up. Respond to life rather than initiating.",
    "Manifesting Generator": "You're designed to multi-task and skip steps. Respond quickly and follow your gut.",
    Manifestor: "You're here to initiate and make things happen. Inform others before acting to reduce resistance.",
    Projector: "You're a natural guide who sees deeply into systems. Wait for recognition and invitations.",
    Reflector: "You mirror your environment. Give yourself time (28 days) before making major decisions.",
  };
  return insights[type] || "";
};

// Helper: Determine communication style based on type and throat center
const getCommunicationStyle = (type: string, definedCenters: string[]): { style: string; insight: string } => {
  const hasDefinedThroat = definedCenters.includes('Throat');
  
  if (type === 'Manifestor') {
    return {
      style: hasDefinedThroat ? "Direct & Initiating" : "Strategic & Selective",
      insight: hasDefinedThroat 
        ? "You communicate with natural authority and directness. Inform before you act to create flow."
        : "Your communication is selective and strategic. Choose when and how you speak with care."
    };
  }
  
  if (type === 'Generator' || type === 'Manifesting Generator') {
    return {
      style: hasDefinedThroat ? "Responsive & Expressive" : "Responsive & Thoughtful",
      insight: hasDefinedThroat
        ? "You communicate best when responding to what excites you. Your enthusiasm is contagious."
        : "You process through response. Give yourself time to feel into what you want to say."
    };
  }
  
  if (type === 'Projector') {
    return {
      style: hasDefinedThroat ? "Guiding & Clear" : "Insightful & Observant",
      insight: hasDefinedThroat
        ? "You communicate with natural wisdom and guidance. Wait for recognition before sharing deeply."
        : "Your insights come from observation. Wait to be asked before offering your perspective."
    };
  }
  
  if (type === 'Reflector') {
    return {
      style: "Reflective & Sampling",
      insight: "You communicate what you sense in your environment. Your perspective shifts with your surroundings."
    };
  }
  
  return {
    style: "Unique Expression",
    insight: "Your communication style is uniquely yours. Honor your process."
  };
};

// Helper: Determine decision-making tendencies based on authority
const getDecisionMakingTendency = (authority: string): { tendency: string; insight: string } => {
  const tendencies: Record<string, { tendency: string; insight: string }> = {
    "Emotional Authority": {
      tendency: "Time-Based Processing",
      insight: "You need time to ride your emotional wave before making decisions. No decision is correct in the moment. Sleep on it, process through your feelings, and clarity will emerge."
    },
    "Sacral Authority": {
      tendency: "Gut Response",
      insight: "Your gut knows instantly through sounds (uh-huh/uh-uh) or sensations. Trust your immediate body response, not your mind's logic. Your sacral is always right."
    },
    "Splenic Authority": {
      tendency: "Intuitive Knowing",
      insight: "Your decisions come from spontaneous intuitive hits in the moment. These whispers are quiet—trust the first instinct. Hesitation means it's not correct for you."
    },
    "Ego Authority": {
      tendency: "Willpower Alignment",
      insight: "Make decisions based on what you truly want and have the willpower to commit to. If you don't have the energy to back it, it's not correct for you."
    },
    "Self-Projected Authority": {
      tendency: "Speaking Your Truth",
      insight: "You need to talk it out to know your truth. Hear yourself speak in safe environments. Your voice carries your direction—listen to what you say."
    },
    "Mental Authority": {
      tendency: "External Sounding Board",
      insight: "Your mind needs to bounce ideas off trusted others. Through dialogue and contemplation, clarity emerges. Don't decide alone."
    },
    "Lunar Authority": {
      tendency: "Lunar Cycle Reflection",
      insight: "Wait through a full lunar cycle (28 days) to gain clarity. Sample different environments and perspectives. Your decision becomes clear through time and experience."
    }
  };
  
  return tendencies[authority] || {
    tendency: "Inner Guidance",
    insight: "Trust your unique decision-making process."
  };
};

// Helper: Determine work flow pattern based on type and sacral
const getWorkFlowPattern = (type: string, definedCenters: string[]): { pattern: string; insight: string } => {
  const hasSacral = definedCenters.includes('Sacral');
  
  if (type === 'Generator') {
    return {
      pattern: "Sustained & Responsive",
      insight: "You thrive with consistent, satisfying work that builds momentum. Respond to opportunities rather than forcing. Your energy recharges through doing what lights you up, and depletes when you push against resistance."
    };
  }
  
  if (type === 'Manifesting Generator') {
    return {
      pattern: "Multi-Tasking & Efficient",
      insight: "You work in bursts with high efficiency, often juggling multiple projects. You're designed to skip steps and move quickly. Follow your gut responses and don't be afraid to pivot when something new excites you."
    };
  }
  
  if (type === 'Manifestor') {
    return {
      pattern: "Initiating & Bursting",
      insight: "You work in powerful creative bursts followed by rest periods. You're not designed for consistent 9-5 energy. Initiate when inspiration strikes, then rest deeply. Inform others of your plans to reduce resistance."
    };
  }
  
  if (type === 'Projector') {
    return {
      pattern: "Focused & Guiding",
      insight: "You work best in focused sessions (3-4 hours) rather than all day. Your energy is penetrating but not sustainable for 8+ hours. Guide others, manage systems, and rest regularly. You're most effective when invited into the right work."
    };
  }
  
  if (type === 'Reflector') {
    return {
      pattern: "Cyclical & Adaptive",
      insight: "Your work flow changes with your environment and the lunar cycle. You need variety and flexibility. Sample different environments and rhythms. You thrive when your workspace feels right and you're not locked into rigid structures."
    };
  }
  
  return {
    pattern: "Unique Flow",
    insight: "Your work pattern is uniquely yours. Honor your natural rhythm."
  };
};