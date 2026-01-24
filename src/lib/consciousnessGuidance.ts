/**
 * ❗ CONSCIOUSNESS GUIDANCE - INTERNAL ONLY
 * 
 * This module provides INTERNAL guidance for AI mentors to shape their advice.
 * This is NEVER displayed to users directly.
 * 
 * RULES:
 * 1. NEVER display consciousness meters, scores, levels, or numeric progression to users
 * 2. NEVER show graphs/charts of spiritual/energetic states
 * 3. Consciousness is expressed ONLY through mentor voice, reflections, and task design
 * 4. Frequency references are SYMBOLIC METAPHORS, not metrics
 * 5. The arc is FELT, not displayed
 */

// Internal consciousness directions for mentor AI guidance
// These inform HOW mentors respond, not WHAT they show users
export const consciousnessDirections = {
  fear_to_courage: {
    mentorTone: "gentle challenge",
    taskType: "small brave action",
    reflectionFlavor: "safety + growth",
    somaticCue: "Notice the fear. Now notice what's beneath it. That's where courage lives."
  },
  courage_to_willingness: {
    mentorTone: "encouraging push",
    taskType: "openness experiment",
    reflectionFlavor: "possibility awareness",
    somaticCue: "Your body is ready. Feel the 'yes' that wants to move through you."
  },
  willingness_to_love: {
    mentorTone: "celebration + depth",
    taskType: "contribution to others",
    reflectionFlavor: "connection + meaning",
    somaticCue: "Notice how giving feels expansive. That's love moving through you."
  },
  love_to_peace: {
    mentorTone: "surrender guidance",
    taskType: "letting go practice",
    reflectionFlavor: "acceptance + trust",
    somaticCue: "Can you release the need to control? Peace is already here."
  }
} as const;

// Emotional states that inform internal mentor guidance
// Used to shape responses, never shown as "levels" to users
export const emotionalGuidanceMap = {
  // Lower states - mentors respond with safety, gentleness, grounding
  shame: { approach: "deep validation", priority: "safety", mentorFit: ["heart_mentor", "oracle_mother", "release_mentor"] },
  guilt: { approach: "self-forgiveness", priority: "release", mentorFit: ["heart_mentor", "ancient_sage", "release_mentor"] },
  apathy: { approach: "tiny sparks", priority: "any movement", mentorFit: ["creative_visionary", "inner_clarity_mentor"] },
  grief: { approach: "witnessing", priority: "feeling fully", mentorFit: ["oracle_mother", "heart_mentor", "release_mentor"] },
  fear: { approach: "gentle courage", priority: "small brave steps", mentorFit: ["discipline_mentor", "inner_clarity_mentor"] },
  
  // Neutral states - mentors encourage expansion
  anger: { approach: "channeling energy", priority: "constructive action", mentorFit: ["discipline_mentor", "business_mentor", "release_mentor"] },
  pride: { approach: "humble confidence", priority: "contribution", mentorFit: ["heart_mentor", "ancient_sage"] },
  confusion: { approach: "clarity through structure", priority: "problem articulation", mentorFit: ["problem_mentor", "strategist_mentor"] },
  overwhelm: { approach: "breaking down", priority: "one clear thing", mentorFit: ["problem_mentor", "discipline_mentor"] },
  stuck: { approach: "pattern recognition", priority: "seeing what's hidden", mentorFit: ["inner_clarity_mentor", "problem_mentor"] },
  
  // Higher states - mentors amplify and celebrate
  courage: { approach: "amplification", priority: "bold action", mentorFit: ["discipline_mentor", "creative_visionary"] },
  willingness: { approach: "momentum", priority: "experiments", mentorFit: ["creative_visionary", "business_mentor"] },
  acceptance: { approach: "deepening", priority: "integration", mentorFit: ["ancient_sage", "mystic_mentor", "release_mentor"] },
  love: { approach: "expansion", priority: "giving", mentorFit: ["heart_mentor", "oracle_mother"] },
  joy: { approach: "celebration", priority: "sharing", mentorFit: ["creative_visionary", "marketing_mentor"] },
  peace: { approach: "presence", priority: "being", mentorFit: ["mystic_mentor", "ancient_sage", "release_mentor"] }
} as const;

// Helper to get appropriate mentor guidance tone
// This shapes AI responses internally, never shown to users
export function getMentorGuidanceTone(
  emotionalState: string | null
): { approach: string; priority: string; recommendedMentors: string[] } {
  const state = emotionalState?.toLowerCase() || "neutral";
  
  const guidance = emotionalGuidanceMap[state as keyof typeof emotionalGuidanceMap];
  
  if (guidance) {
    return {
      approach: guidance.approach,
      priority: guidance.priority,
      recommendedMentors: [...guidance.mentorFit]
    };
  }
  
  // Default for neutral/unknown states
  return {
    approach: "balanced guidance",
    priority: "forward movement",
    recommendedMentors: ["strategist_mentor", "creative_visionary"]
  };
}

// Somatic prompts to include in mentor responses
// These guide users to FEEL, not measure
export const somaticPrompts = [
  "Notice your breath right now. Is it shallow or deep?",
  "Where do you feel this in your body?",
  "Does this idea make your chest open or tighten?",
  "Trust the expansion, question the contraction.",
  "Your body knows before your mind decides.",
  "Feel into this. What does your gut say?",
  "Notice: Are your shoulders relaxed or tense right now?",
  "The truth creates spaciousness. Lies create compression.",
  "What would your body choose if your mind wasn't involved?",
  "Feel the difference between 'should' and 'want to'."
] as const;

// Get a random somatic prompt for mentor responses
export function getRandomSomaticPrompt(): string {
  return somaticPrompts[Math.floor(Math.random() * somaticPrompts.length)];
}
