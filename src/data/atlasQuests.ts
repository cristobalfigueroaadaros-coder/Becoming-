export type InteractionType = "multi_select" | "ranking" | "scenario" | "card_pick" | "energy_slider" | "reflection";

export interface QuestInteraction {
  type: InteractionType;
  prompt: string;
  options?: string[];
  minSelect?: number;
  maxSelect?: number;
  sliderItems?: string[];
}

export interface DotInterpretation {
  title: string;
  description: string;
}

export interface AtlasQuestDefinition {
  questKey: string;
  clusterSlug: string;
  clusterName: string;
  intro: string;
  interactions: [QuestInteraction, QuestInteraction, QuestInteraction, QuestInteraction];
  interpret: (responses: any[]) => DotInterpretation;
}

const pickByIndex = (titles: string[], responses: any[]): DotInterpretation => {
  const firstResponse = responses[0];
  const idx = Array.isArray(firstResponse) ? firstResponse.length % titles.length : 0;
  return { title: titles[idx], description: `Discovered through Atlas quest exploration.` };
};

export const ATLAS_QUESTS: AtlasQuestDefinition[] = [
  {
    questKey: "life_events_q1",
    clusterSlug: "life-events",
    clusterName: "Life Events",
    intro: "Let's explore the moments that shaped who you are.",
    interactions: [
      { type: "multi_select", prompt: "Which life moments feel like turning points?", options: ["A move to a new place", "A relationship shift", "A career change", "A loss or ending", "A surprising success", "A moment of clarity"], minSelect: 2, maxSelect: 3 },
      { type: "ranking", prompt: "Rank these by emotional impact on you.", options: ["Family experiences", "Travel & places", "Education milestones", "Personal crises"] },
      { type: "scenario", prompt: "If you could revisit one type of moment, which would it be?", options: ["A moment of courage", "A moment of connection", "A moment of reinvention"] },
      { type: "reflection", prompt: "In one sentence, what thread connects your biggest life moments?" },
    ],
    interpret: (r) => pickByIndex(["Resilience Weaver", "Transformation Seeker", "Story Architect"], r),
  },
  {
    questKey: "passions_q1",
    clusterSlug: "passions",
    clusterName: "Passions",
    intro: "Let's discover what lights you up inside.",
    interactions: [
      { type: "card_pick", prompt: "Pick the card that resonates most with your energy.", options: ["Creating something new", "Understanding deeply", "Helping others grow", "Exploring the unknown"] },
      { type: "energy_slider", prompt: "Rate how much energy these give you.", sliderItems: ["Making art or music", "Solving complex problems", "Building communities"] },
      { type: "multi_select", prompt: "Which activities make you lose track of time?", options: ["Writing or journaling", "Teaching or mentoring", "Designing or building", "Researching or learning", "Physical movement", "Deep conversations"], minSelect: 2, maxSelect: 3 },
      { type: "reflection", prompt: "What would you do every day if nothing held you back?" },
    ],
    interpret: (r) => pickByIndex(["Creative Fire", "Curiosity Engine", "Purpose Igniter"], r),
  },
  {
    questKey: "skills_q1",
    clusterSlug: "skills",
    clusterName: "Skills",
    intro: "Let's map what you're naturally good at.",
    interactions: [
      { type: "multi_select", prompt: "What do people often ask you for help with?", options: ["Organizing things", "Creative ideas", "Emotional support", "Technical problems", "Strategic thinking", "Communication"], minSelect: 2, maxSelect: 3 },
      { type: "ranking", prompt: "Order these by your confidence level.", options: ["Writing & communication", "Analysis & logic", "Leadership & influence", "Design & aesthetics"] },
      { type: "scenario", prompt: "In a team project, which role do you naturally take?", options: ["The planner who structures everything", "The creative who generates ideas", "The connector who aligns people"] },
      { type: "reflection", prompt: "What skill feels so natural you forget it's a skill?" },
    ],
    interpret: (r) => pickByIndex(["Natural Strategist", "Creative Problem Solver", "Empathic Communicator"], r),
  },
  {
    questKey: "personal_frustrations_q1",
    clusterSlug: "personal-frustrations",
    clusterName: "Personal Frustrations",
    intro: "Frustrations often point to what matters most.",
    interactions: [
      { type: "multi_select", prompt: "What frustrates you most in the world?", options: ["Wasted potential", "Unfairness or injustice", "Lack of depth", "Inefficiency", "Broken systems", "Apathy"], minSelect: 2, maxSelect: 3 },
      { type: "card_pick", prompt: "Which frustration feels most personal?", options: ["People not reaching their potential", "Systems that don't serve people", "Creativity being suppressed", "Lack of genuine connection"] },
      { type: "energy_slider", prompt: "How strongly do these bother you?", sliderItems: ["Mediocrity", "Dishonesty", "Short-term thinking"] },
      { type: "reflection", prompt: "What problem would you solve if you had unlimited resources?" },
    ],
    interpret: (r) => pickByIndex(["Justice Seeker", "Potential Unlocker", "System Challenger"], r),
  },
  {
    questKey: "values_q1",
    clusterSlug: "values",
    clusterName: "Values",
    intro: "Let's uncover the principles that guide your life.",
    interactions: [
      { type: "ranking", prompt: "Order these values by importance to you.", options: ["Freedom", "Growth", "Connection", "Impact"] },
      { type: "multi_select", prompt: "Which values do you refuse to compromise?", options: ["Authenticity", "Fairness", "Creativity", "Loyalty", "Independence", "Compassion"], minSelect: 2, maxSelect: 3 },
      { type: "scenario", prompt: "When values conflict, which wins?", options: ["Honesty over harmony", "Growth over comfort", "Community over ambition"] },
      { type: "reflection", prompt: "What value were you taught that you still live by?" },
    ],
    interpret: (r) => pickByIndex(["Integrity Anchor", "Freedom Champion", "Growth Seeker"], r),
  },
  {
    questKey: "aha_moments_q1",
    clusterSlug: "aha-moments",
    clusterName: "Aha Moments",
    intro: "Let's explore your breakthrough insights.",
    interactions: [
      { type: "card_pick", prompt: "What type of realization hits you hardest?", options: ["Connecting two unrelated ideas", "Seeing a hidden pattern", "Understanding someone deeply", "Realizing your own potential"] },
      { type: "multi_select", prompt: "When do your best ideas arrive?", options: ["During conversations", "In solitude", "While moving", "Right before sleep", "While creating", "While reading"], minSelect: 2, maxSelect: 3 },
      { type: "energy_slider", prompt: "How often do these spark insights?", sliderItems: ["Nature & walks", "Books & learning", "Deep conversations"] },
      { type: "reflection", prompt: "Describe a recent moment when everything suddenly clicked." },
    ],
    interpret: (r) => pickByIndex(["Pattern Thinker", "Insight Generator", "Connection Finder"], r),
  },
  {
    questKey: "inspirations_q1",
    clusterSlug: "inspirations",
    clusterName: "Inspirations",
    intro: "Let's discover who and what inspires you.",
    interactions: [
      { type: "multi_select", prompt: "What type of people inspire you most?", options: ["Bold risk-takers", "Quiet creators", "Community builders", "Deep thinkers", "Rebels & mavericks", "Healers & helpers"], minSelect: 2, maxSelect: 3 },
      { type: "ranking", prompt: "Rank these inspiration sources.", options: ["Books & ideas", "Real people's stories", "Art & music", "Nature & silence"] },
      { type: "scenario", prompt: "Which story moves you most?", options: ["Someone who built something from nothing", "Someone who stood up for what's right", "Someone who found peace after struggle"] },
      { type: "reflection", prompt: "Who is someone you admire and why?" },
    ],
    interpret: (r) => pickByIndex(["Courage Admirer", "Wisdom Seeker", "Beauty Collector"], r),
  },
  {
    questKey: "vision_q1",
    clusterSlug: "vision-for-a-better-world",
    clusterName: "Vision for a Better World",
    intro: "Let's explore your vision for the future.",
    interactions: [
      { type: "card_pick", prompt: "Which cause pulls at your heart?", options: ["Education for all", "Mental health & wellbeing", "Environmental restoration", "Economic fairness"] },
      { type: "multi_select", prompt: "What changes would you fight for?", options: ["Equal opportunity", "Creative freedom", "Sustainable living", "Deeper human connection", "Better education", "Health access"], minSelect: 2, maxSelect: 3 },
      { type: "energy_slider", prompt: "How much do these matter to you?", sliderItems: ["Local community impact", "Global systemic change", "Individual transformation"] },
      { type: "reflection", prompt: "If the world listened, what would you say?" },
    ],
    interpret: (r) => pickByIndex(["Visionary Builder", "Equity Champion", "Future Architect"], r),
  },
  {
    questKey: "ideal_life_q1",
    clusterSlug: "ideal-life",
    clusterName: "Ideal Life",
    intro: "Let's paint the picture of your ideal day.",
    interactions: [
      { type: "scenario", prompt: "Your ideal morning starts with…", options: ["Creating something meaningful", "Moving your body in nature", "Deep learning or reading"] },
      { type: "multi_select", prompt: "What must your ideal life include?", options: ["Creative freedom", "Financial security", "Deep relationships", "Travel & exploration", "Meaningful work", "Solitude & peace"], minSelect: 2, maxSelect: 3 },
      { type: "ranking", prompt: "Order these by priority.", options: ["Location independence", "Community belonging", "Professional mastery", "Inner peace"] },
      { type: "reflection", prompt: "Describe one moment from your ideal future day." },
    ],
    interpret: (r) => pickByIndex(["Freedom Designer", "Harmony Seeker", "Intentional Liver"], r),
  },
  {
    questKey: "natural_talents_q1",
    clusterSlug: "natural-talents",
    clusterName: "Natural Talents",
    intro: "Let's uncover gifts you might take for granted.",
    interactions: [
      { type: "multi_select", prompt: "What came easily to you as a child?", options: ["Making friends", "Imagining stories", "Figuring things out", "Leading groups", "Creating art", "Noticing details"], minSelect: 2, maxSelect: 3 },
      { type: "card_pick", prompt: "Which talent feels most natural right now?", options: ["Reading people's emotions", "Simplifying complex things", "Generating creative ideas", "Staying calm under pressure"] },
      { type: "energy_slider", prompt: "How effortlessly can you do these?", sliderItems: ["Public speaking", "Creative thinking", "Empathic listening"] },
      { type: "reflection", prompt: "What do people compliment you on that surprises you?" },
    ],
    interpret: (r) => pickByIndex(["Empathy Signal", "Creative Starter", "Calm Navigator"], r),
  },
  {
    questKey: "childhood_signals_q1",
    clusterSlug: "childhood-signals",
    clusterName: "Childhood Signals",
    intro: "Your childhood holds clues about your true self.",
    interactions: [
      { type: "card_pick", prompt: "What did you love doing as a kid?", options: ["Building & making things", "Exploring nature", "Reading & imagining", "Organizing & leading friends"] },
      { type: "multi_select", prompt: "What childhood traits still show up today?", options: ["Curiosity", "Stubbornness", "Empathy", "Creativity", "Independence", "Sensitivity"], minSelect: 2, maxSelect: 3 },
      { type: "scenario", prompt: "Your childhood self would be proud of you for…", options: ["Still being curious", "Following your own path", "Caring deeply about others"] },
      { type: "reflection", prompt: "What dream did you have as a child that still matters?" },
    ],
    interpret: (r) => pickByIndex(["Inner Child Signal", "Curiosity Root", "Original Dreamer"], r),
  },
  {
    questKey: "external_reflections_q1",
    clusterSlug: "external-reflections",
    clusterName: "External Reflections",
    intro: "How others see you reveals hidden truths.",
    interactions: [
      { type: "multi_select", prompt: "What words do others use to describe you?", options: ["Thoughtful", "Driven", "Creative", "Kind", "Intense", "Reliable"], minSelect: 2, maxSelect: 3 },
      { type: "ranking", prompt: "Rank how others perceive your strengths.", options: ["Leadership", "Creativity", "Empathy", "Intelligence"] },
      { type: "card_pick", prompt: "Which reflection surprises you most?", options: ["People find you inspiring", "People see you as brave", "People feel safe around you", "People admire your ideas"] },
      { type: "reflection", prompt: "What feedback changed how you see yourself?" },
    ],
    interpret: (r) => pickByIndex(["Hidden Leader", "Mirror Insight", "Community Builder"], r),
  },
  {
    questKey: "experiments_q1",
    clusterSlug: "experiments",
    clusterName: "Experiments",
    intro: "Let's explore your relationship with trying new things.",
    interactions: [
      { type: "scenario", prompt: "When facing something new, you usually…", options: ["Dive in headfirst", "Research everything first", "Find someone to do it with"] },
      { type: "multi_select", prompt: "What experiments have you tried?", options: ["Started a side project", "Learned a new skill", "Changed your routine", "Traveled solo", "Started creating content", "Tried a new career path"], minSelect: 2, maxSelect: 3 },
      { type: "energy_slider", prompt: "How comfortable are you with these?", sliderItems: ["Uncertainty", "Public failure", "Starting over"] },
      { type: "reflection", prompt: "What experiment taught you the most about yourself?" },
    ],
    interpret: (r) => pickByIndex(["Bold Experimenter", "Calculated Explorer", "Resilient Tester"], r),
  },
];

export function getQuestForCluster(slug: string): AtlasQuestDefinition | undefined {
  return ATLAS_QUESTS.find(q => q.clusterSlug === slug);
}
