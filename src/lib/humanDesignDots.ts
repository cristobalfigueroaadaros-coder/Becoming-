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

// Mock Human Design calculation (replace with real API later)
export const generateMockHumanDesignData = (birthDate: string, birthTime?: string | null, isTimeUnknown?: boolean): HumanDesignData => {
  // Simple mock data - in production, this would call a Human Design API
  const types = ["Generator", "Manifesting Generator", "Manifestor", "Projector", "Reflector"];
  const strategies = {
    Generator: "To Respond",
    "Manifesting Generator": "To Respond",
    Manifestor: "To Inform",
    Projector: "To Wait for Invitation",
    Reflector: "To Wait 28 Days",
  };
  
  const authorities = [
    "Sacral Authority",
    "Emotional Authority", 
    "Splenic Authority",
    "Ego Authority",
    "Self-Projected Authority",
    "Mental Authority",
    "Lunar Authority"
  ];

  const profiles = ["1/3", "1/4", "2/4", "2/5", "3/5", "3/6", "4/6", "5/1", "5/2", "6/2", "6/3"];
  
  const centers = [
    "Head", "Ajna", "Throat", "G Center", "Heart/Ego", 
    "Sacral", "Solar Plexus", "Spleen", "Root"
  ];

  // Use birth date to consistently generate same result
  const dateHash = new Date(birthDate).getTime() % 5;
  const type = types[dateHash];
  
  const defined = centers.slice(0, Math.floor(Math.random() * 5) + 2);
  const undefined = centers.filter(c => !defined.includes(c));

  return {
    type,
    strategy: strategies[type as keyof typeof strategies],
    authority: authorities[dateHash % authorities.length],
    profile: profiles[dateHash % profiles.length],
    defined_centers: defined,
    undefined_centers: undefined,
    incarnation_cross: `Cross of ${["Planning", "Awareness", "Laws", "Consciousness", "Maya"][dateHash]}`,
    key_gates: [
      { gate: 1, description: "Creative self-expression and individuality" },
      { gate: 13, description: "The listener - storytelling and sharing experiences" },
      { gate: 25, description: "Spirit of the self - universal love and acceptance" },
    ].slice(0, 2 + (dateHash % 2)),
    is_approximate: isTimeUnknown || !birthTime || false,
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