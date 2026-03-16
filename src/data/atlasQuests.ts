import type { DotCategory } from "./atlasSignals";

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
  dotCategory: DotCategory;
}

export interface AtlasQuestDefinition {
  questKey: string;
  clusterSlug: string;
  clusterName: string;
  intro: string;
  interactions: [QuestInteraction, QuestInteraction, QuestInteraction, QuestInteraction];
  interpret: (responses: any[]) => DotInterpretation;
}

const pick = (titles: string[], responses: any[], cat: DotCategory = "strength"): DotInterpretation => {
  const first = responses[0];
  const idx = Array.isArray(first) ? first.length % titles.length : 0;
  return { title: titles[idx], description: "Discovered through Atlas quest exploration.", dotCategory: cat };
};

export const ATLAS_QUESTS: AtlasQuestDefinition[] = [
  // ===== LIFE EVENTS (4 quests) =====
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
    interpret: (r) => pick(["Resilience Weaver", "Transformation Seeker", "Story Architect"], r),
  },
  {
    questKey: "life_events_q2",
    clusterSlug: "life-events",
    clusterName: "Life Events",
    intro: "Let's look at how pivotal moments changed your direction.",
    interactions: [
      { type: "card_pick", prompt: "Which moment type left the deepest mark?", options: ["A sudden change", "A slow realization", "An unexpected opportunity", "A difficult ending"] },
      { type: "multi_select", prompt: "What did your hardest moments teach you?", options: ["To trust myself", "To let go", "To ask for help", "To keep going", "To change direction", "To listen more"], minSelect: 2, maxSelect: 3 },
      { type: "energy_slider", prompt: "How much did these shape who you are today?", sliderItems: ["Family events", "Work transitions", "Personal losses"] },
      { type: "reflection", prompt: "What lesson from a past struggle still guides you today?" },
    ],
    interpret: (r) => pick(["Lesson Keeper", "Transition Navigator", "Depth Finder"], r, "life_imprint"),
  },
  {
    questKey: "life_events_q3",
    clusterSlug: "life-events",
    clusterName: "Life Events",
    intro: "Let's explore the emotional texture of your key experiences.",
    interactions: [
      { type: "multi_select", prompt: "Which emotions dominated your defining moments?", options: ["Fear", "Excitement", "Grief", "Relief", "Anger", "Joy"], minSelect: 2, maxSelect: 3 },
      { type: "scenario", prompt: "Your strongest memories are usually tied to…", options: ["People who challenged me", "Places that changed me", "Decisions I almost didn't make"] },
      { type: "ranking", prompt: "Rank how you typically respond to major life shifts.", options: ["Adapt quickly", "Process deeply", "Seek support", "Take action"] },
      { type: "reflection", prompt: "What would your 10-year-ago self be surprised by about your life now?" },
    ],
    interpret: (r) => pick(["Emotional Cartographer", "Adaptive Spirit", "Memory Alchemist"], r, "life_imprint"),
  },
  {
    questKey: "life_events_q4",
    clusterSlug: "life-events",
    clusterName: "Life Events",
    intro: "Let's uncover hidden patterns in your life story.",
    interactions: [
      { type: "scenario", prompt: "Looking back, your life path feels most like…", options: ["A spiral — returning to themes with more depth", "A river — always flowing forward", "A mosaic — many disconnected pieces forming a picture"] },
      { type: "multi_select", prompt: "Which recurring themes appear in your life?", options: ["Starting over", "Deep connections", "Creative bursts", "Moments of solitude", "Breaking free", "Learning the hard way"], minSelect: 2, maxSelect: 3 },
      { type: "card_pick", prompt: "Which pattern surprises you most?", options: ["How often I reinvent myself", "How deeply I care", "How resilient I actually am", "How much I've changed"] },
      { type: "reflection", prompt: "If your life were a book, what would this chapter be called?" },
    ],
    interpret: (r) => pick(["Life Narrator", "Pattern Recognizer", "Chapter Turner"], r, "life_imprint"),
  },

  // ===== PASSIONS (4 quests) =====
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
    interpret: (r) => pick(["Creative Fire", "Curiosity Engine", "Purpose Igniter"], r),
  },
  {
    questKey: "passions_q2",
    clusterSlug: "passions",
    clusterName: "Passions",
    intro: "Let's explore what pulls you forward with excitement.",
    interactions: [
      { type: "multi_select", prompt: "What topics can you talk about for hours?", options: ["Psychology & human behavior", "Technology & innovation", "Art & design", "Philosophy & meaning", "Nature & science", "Stories & narratives"], minSelect: 2, maxSelect: 3 },
      { type: "scenario", prompt: "When you have free time, you're drawn to…", options: ["Creating something from scratch", "Learning something new", "Connecting with someone deeply"] },
      { type: "energy_slider", prompt: "How energized do you feel during these?", sliderItems: ["Brainstorming sessions", "Solo deep work", "Collaborative projects"] },
      { type: "reflection", prompt: "What passion have you abandoned that still calls to you?" },
    ],
    interpret: (r) => pick(["Deep Diver", "Creation Seeker", "Passion Archaeologist"], r),
  },
  {
    questKey: "passions_q3",
    clusterSlug: "passions",
    clusterName: "Passions",
    intro: "Let's understand the energy behind your passions.",
    interactions: [
      { type: "ranking", prompt: "Order these by how much they energize you.", options: ["Making something beautiful", "Understanding something complex", "Helping someone transform", "Discovering something new"] },
      { type: "card_pick", prompt: "Which best describes your creative energy?", options: ["Steady flame — consistent and deep", "Lightning bolt — intense and sudden", "Flowing river — adaptive and continuous", "Volcanic — dormant then explosive"] },
      { type: "multi_select", prompt: "What conditions fuel your passion?", options: ["Solitude and quiet", "Inspiring people around me", "A clear challenge", "Freedom to experiment", "Emotional intensity", "A sense of urgency"], minSelect: 2, maxSelect: 3 },
      { type: "reflection", prompt: "What would you create if you knew it would matter to someone?" },
    ],
    interpret: (r) => pick(["Energy Architect", "Flame Tender", "Passion Navigator"], r),
  },
  {
    questKey: "passions_q4",
    clusterSlug: "passions",
    clusterName: "Passions",
    intro: "Let's map the intersection of your passions.",
    interactions: [
      { type: "multi_select", prompt: "Which combinations excite you most?", options: ["Art + Technology", "Psychology + Teaching", "Science + Storytelling", "Design + Community", "Philosophy + Action", "Nature + Innovation"], minSelect: 2, maxSelect: 3 },
      { type: "scenario", prompt: "Your ideal project sits at the intersection of…", options: ["Creativity and impact", "Knowledge and connection", "Freedom and purpose"] },
      { type: "energy_slider", prompt: "How much do these matter in your work?", sliderItems: ["Beauty and aesthetics", "Meaning and depth", "Novelty and surprise"] },
      { type: "reflection", prompt: "What two interests, combined, could become your life's work?" },
    ],
    interpret: (r) => pick(["Intersection Finder", "Cross-Pollinator", "Fusion Thinker"], r),
  },

  // ===== SKILLS (4 quests) =====
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
    interpret: (r) => pick(["Natural Strategist", "Creative Problem Solver", "Empathic Communicator"], r),
  },
  {
    questKey: "skills_q2",
    clusterSlug: "skills",
    clusterName: "Skills",
    intro: "Let's explore skills you've developed through experience.",
    interactions: [
      { type: "card_pick", prompt: "Which skill grew most from challenge?", options: ["Communicating under pressure", "Solving unfamiliar problems", "Leading without authority", "Adapting to change quickly"] },
      { type: "multi_select", prompt: "Which skills have you actively cultivated?", options: ["Public speaking", "Writing", "Data analysis", "Design thinking", "Negotiation", "Project management"], minSelect: 2, maxSelect: 3 },
      { type: "ranking", prompt: "Rank these by how much you enjoy using them.", options: ["Teaching others", "Debugging problems", "Creating presentations", "Facilitating discussions"] },
      { type: "reflection", prompt: "What skill took you years to develop that now feels effortless?" },
    ],
    interpret: (r) => pick(["Cultivated Expert", "Pressure-Forged Skill", "Quiet Mastery"], r),
  },
  {
    questKey: "skills_q3",
    clusterSlug: "skills",
    clusterName: "Skills",
    intro: "Let's discover your hidden competencies.",
    interactions: [
      { type: "multi_select", prompt: "What can you do that most people find difficult?", options: ["See the big picture quickly", "Stay calm in chaos", "Explain complex ideas simply", "Read a room's energy", "Make decisions fast", "Hold space for others"], minSelect: 2, maxSelect: 3 },
      { type: "scenario", prompt: "In a crisis, people count on you to…", options: ["Stay rational and plan next steps", "Keep morale up and reassure everyone", "Think creatively about solutions"] },
      { type: "energy_slider", prompt: "How effortless are these for you?", sliderItems: ["Pattern recognition", "Emotional attunement", "Strategic planning"] },
      { type: "reflection", prompt: "What ability do you wish others recognized in you more?" },
    ],
    interpret: (r) => pick(["Hidden Strength", "Crisis Navigator", "Unsung Talent"], r),
  },
  {
    questKey: "skills_q4",
    clusterSlug: "skills",
    clusterName: "Skills",
    intro: "Let's understand how your skills combine.",
    interactions: [
      { type: "ranking", prompt: "Rank your strongest skill combinations.", options: ["Creativity + Strategy", "Empathy + Communication", "Analysis + Leadership", "Adaptability + Problem-solving"] },
      { type: "card_pick", prompt: "Your unique skill blend is most like…", options: ["A Swiss army knife — versatile", "A laser — intensely focused", "A bridge — connecting worlds", "A compass — guiding direction"] },
      { type: "multi_select", prompt: "Where do your skills create the most value?", options: ["In creative projects", "In team dynamics", "In problem-solving", "In teaching moments", "In strategic decisions", "In emotional situations"], minSelect: 2, maxSelect: 3 },
      { type: "reflection", prompt: "If you could combine your top two skills into a superpower, what would it be?" },
    ],
    interpret: (r) => pick(["Skill Synthesizer", "Unique Blend", "Power Combiner"], r),
  },

  // ===== PERSONAL FRUSTRATIONS (4 quests) =====
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
    interpret: (r) => pick(["Justice Seeker", "Potential Unlocker", "System Challenger"], r),
  },
  {
    questKey: "personal_frustrations_q2",
    clusterSlug: "personal-frustrations",
    clusterName: "Personal Frustrations",
    intro: "Your frustrations reveal your deepest values.",
    interactions: [
      { type: "scenario", prompt: "What triggers your frustration most?", options: ["Seeing talent wasted by bad systems", "Being misunderstood when I care deeply", "Watching people settle for less than they deserve"] },
      { type: "multi_select", prompt: "Which inner frustrations do you recognize?", options: ["Not being further ahead", "Caring too much about things", "Struggling to find my tribe", "Knowing what to do but not doing it", "Feeling misaligned with my work", "Being too hard on myself"], minSelect: 2, maxSelect: 3 },
      { type: "card_pick", prompt: "Which frustration holds a hidden gift?", options: ["My impatience drives me to act", "My sensitivity helps me understand others", "My restlessness pushes me to grow", "My perfectionism ensures quality"] },
      { type: "reflection", prompt: "What frustration could become your greatest strength if channeled?" },
    ],
    interpret: (r) => pick(["Channeled Intensity", "Shadow Gift", "Friction Point"], r, "shadow"),
  },
  {
    questKey: "personal_frustrations_q3",
    clusterSlug: "personal-frustrations",
    clusterName: "Personal Frustrations",
    intro: "Let's explore the patterns behind your frustrations.",
    interactions: [
      { type: "ranking", prompt: "Rank how often these frustration patterns appear.", options: ["Repeating the same mistakes", "Attracting similar conflicts", "Hitting the same ceiling", "Avoiding the same conversations"] },
      { type: "multi_select", prompt: "What do you avoid because of frustration?", options: ["Taking the lead", "Being vulnerable", "Starting over", "Asking for what I need", "Confronting conflict", "Slowing down"], minSelect: 2, maxSelect: 3 },
      { type: "scenario", prompt: "When frustrated, you typically…", options: ["Withdraw and process alone", "Push harder and overwork", "Seek perspective from others"] },
      { type: "reflection", prompt: "What recurring frustration is actually trying to teach you something?" },
    ],
    interpret: (r) => pick(["Pattern Breaker", "Shadow Teacher", "Friction Navigator"], r, "shadow"),
  },
  {
    questKey: "personal_frustrations_q4",
    clusterSlug: "personal-frustrations",
    clusterName: "Personal Frustrations",
    intro: "Let's transform frustration into fuel.",
    interactions: [
      { type: "card_pick", prompt: "Which transformation resonates with you?", options: ["Frustration → Fuel for change", "Anger → Clarity about values", "Impatience → Drive for action", "Disappointment → Deeper standards"] },
      { type: "multi_select", prompt: "What has frustration already pushed you toward?", options: ["A career change", "A creative project", "A relationship boundary", "A personal commitment", "A new perspective", "A bold decision"], minSelect: 2, maxSelect: 3 },
      { type: "energy_slider", prompt: "How much can frustration fuel positive change for you?", sliderItems: ["In work", "In relationships", "In personal growth"] },
      { type: "reflection", prompt: "What would you do differently if you embraced your frustration as guidance?" },
    ],
    interpret: (r) => pick(["Transmutation Artist", "Fuel Alchemist", "Fire Walker"], r),
  },

  // ===== VALUES (4 quests) =====
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
    interpret: (r) => pick(["Integrity Anchor", "Freedom Champion", "Growth Seeker"], r),
  },
  {
    questKey: "values_q2",
    clusterSlug: "values",
    clusterName: "Values",
    intro: "Let's explore the values you live by, not just believe in.",
    interactions: [
      { type: "multi_select", prompt: "Which values show up in your daily actions?", options: ["Patience", "Courage", "Generosity", "Curiosity", "Discipline", "Kindness"], minSelect: 2, maxSelect: 3 },
      { type: "card_pick", prompt: "Which value gap bothers you most?", options: ["I value balance but overwork", "I value honesty but avoid conflict", "I value creativity but play it safe", "I value connection but isolate"] },
      { type: "ranking", prompt: "Rank what matters most in your relationships.", options: ["Trust", "Growth together", "Fun and lightness", "Depth and honesty"] },
      { type: "reflection", prompt: "What value do you wish you lived more fully?" },
    ],
    interpret: (r) => pick(["Values Practitioner", "Alignment Seeker", "Integrity Builder"], r),
  },
  {
    questKey: "values_q3",
    clusterSlug: "values",
    clusterName: "Values",
    intro: "Let's discover where your values were forged.",
    interactions: [
      { type: "scenario", prompt: "Your strongest values were shaped by…", options: ["A person who modeled them for me", "A painful experience that taught me", "An inner knowing I always had"] },
      { type: "multi_select", prompt: "Which values evolved as you grew up?", options: ["Success means something different now", "Relationships matter more than achievement", "Freedom is more important than security", "Integrity over popularity", "Depth over breadth", "Being over doing"], minSelect: 2, maxSelect: 3 },
      { type: "energy_slider", prompt: "How strongly do you feel about these principles?", sliderItems: ["Standing up for beliefs", "Living authentically", "Prioritizing wellbeing"] },
      { type: "reflection", prompt: "What value would you fight for even if it cost you everything?" },
    ],
    interpret: (r) => pick(["Forged Conviction", "Evolved Principle", "Core Truth"], r, "life_imprint"),
  },
  {
    questKey: "values_q4",
    clusterSlug: "values",
    clusterName: "Values",
    intro: "Let's explore how your values guide your future.",
    interactions: [
      { type: "card_pick", prompt: "Which value will matter most in your next chapter?", options: ["Courage to be different", "Patience with the process", "Commitment to depth", "Openness to change"] },
      { type: "multi_select", prompt: "What values do you want to pass on?", options: ["Resilience", "Empathy", "Curiosity", "Integrity", "Joy", "Service"], minSelect: 2, maxSelect: 3 },
      { type: "ranking", prompt: "Rank what guides your biggest decisions.", options: ["My gut feeling", "My values compass", "Other people's needs", "Long-term vision"] },
      { type: "reflection", prompt: "If you could only teach one value to the next generation, what would it be?" },
    ],
    interpret: (r) => pick(["Legacy Builder", "Values Compass", "Future Anchor"], r),
  },

  // ===== AHA MOMENTS (4 quests) =====
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
    interpret: (r) => pick(["Pattern Thinker", "Insight Generator", "Connection Finder"], r),
  },
  {
    questKey: "aha_moments_q2",
    clusterSlug: "aha-moments",
    clusterName: "Aha Moments",
    intro: "Let's map how your mind creates breakthroughs.",
    interactions: [
      { type: "multi_select", prompt: "What conditions precede your biggest insights?", options: ["Being stuck for a while", "Encountering a new perspective", "Deep relaxation", "Intense focus", "Random juxtaposition", "Emotional openness"], minSelect: 2, maxSelect: 3 },
      { type: "scenario", prompt: "Your breakthrough thinking style is most like…", options: ["Slow simmer — ideas build over time", "Lightning strike — sudden clarity", "Cross-pollination — mixing unrelated ideas"] },
      { type: "ranking", prompt: "Rank these by how they trigger your insights.", options: ["Asking why repeatedly", "Flipping assumptions", "Looking at the opposite", "Changing my environment"] },
      { type: "reflection", prompt: "What insight about yourself changed everything?" },
    ],
    interpret: (r) => pick(["Slow Illuminator", "Flash Thinker", "Idea Mixer"], r, "life_imprint"),
  },
  {
    questKey: "aha_moments_q3",
    clusterSlug: "aha-moments",
    clusterName: "Aha Moments",
    intro: "Let's explore what your aha moments reveal about your thinking.",
    interactions: [
      { type: "card_pick", prompt: "Your insights tend to be about…", options: ["How things work underneath", "How people really feel", "What's possible that others don't see", "What needs to change"] },
      { type: "multi_select", prompt: "What do you notice that others miss?", options: ["Emotional undercurrents", "System inefficiencies", "Creative possibilities", "Unspoken dynamics", "Hidden connections", "Timing patterns"], minSelect: 2, maxSelect: 3 },
      { type: "energy_slider", prompt: "How important are these insight triggers?", sliderItems: ["Solitude and silence", "Diverse input", "Physical movement"] },
      { type: "reflection", prompt: "What pattern do you keep noticing in the world around you?" },
    ],
    interpret: (r) => pick(["Depth Perceiver", "System Reader", "Hidden Seer"], r),
  },
  {
    questKey: "aha_moments_q4",
    clusterSlug: "aha-moments",
    clusterName: "Aha Moments",
    intro: "Let's understand the impact of your greatest realizations.",
    interactions: [
      { type: "scenario", prompt: "Your most impactful aha moments changed your…", options: ["Beliefs about myself", "Understanding of others", "Vision for the future"] },
      { type: "multi_select", prompt: "What followed your biggest realization?", options: ["A major decision", "A shift in relationships", "A creative project", "A new habit", "A conversation I needed to have", "A period of grief or release"], minSelect: 2, maxSelect: 3 },
      { type: "card_pick", prompt: "How do you typically respond to an insight?", options: ["Act on it immediately", "Journal and process it", "Share it with someone", "Let it simmer before acting"] },
      { type: "reflection", prompt: "What realization are you sitting with right now that hasn't fully landed?" },
    ],
    interpret: (r) => pick(["Insight Activator", "Realization Processor", "Wisdom Collector"], r),
  },

  // ===== INSPIRATIONS (4 quests) =====
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
    interpret: (r) => pick(["Courage Admirer", "Wisdom Seeker", "Beauty Collector"], r),
  },
  {
    questKey: "inspirations_q2",
    clusterSlug: "inspirations",
    clusterName: "Inspirations",
    intro: "Let's explore the deeper patterns in what inspires you.",
    interactions: [
      { type: "card_pick", prompt: "What quality in others moves you most?", options: ["Authenticity under pressure", "Creative courage", "Quiet perseverance", "Radical generosity"] },
      { type: "multi_select", prompt: "What art forms speak to your soul?", options: ["Music", "Visual art", "Writing & poetry", "Film & cinema", "Architecture", "Performance"], minSelect: 2, maxSelect: 3 },
      { type: "scenario", prompt: "You're most inspired when you encounter…", options: ["Raw honesty about struggle", "Beauty in unexpected places", "Ideas that challenge everything I thought I knew"] },
      { type: "reflection", prompt: "What book, film, or conversation changed how you see the world?" },
    ],
    interpret: (r) => pick(["Authenticity Seeker", "Beauty Hunter", "Mind Expander"], r),
  },
  {
    questKey: "inspirations_q3",
    clusterSlug: "inspirations",
    clusterName: "Inspirations",
    intro: "Let's understand how inspiration fuels your actions.",
    interactions: [
      { type: "multi_select", prompt: "How do you channel inspiration?", options: ["Into creative projects", "Into helping others", "Into personal growth", "Into meaningful conversations", "Into writing or journaling", "Into new experiments"], minSelect: 2, maxSelect: 3 },
      { type: "ranking", prompt: "Rank how inspiration flows through you.", options: ["I create something", "I share it with others", "I reflect on it deeply", "I change something in my life"] },
      { type: "energy_slider", prompt: "How much do these inspire action in you?", sliderItems: ["A mentor's words", "A beautiful creation", "A personal struggle overcome"] },
      { type: "reflection", prompt: "What inspiration are you carrying right now that wants to become something?" },
    ],
    interpret: (r) => pick(["Inspiration Channeler", "Action Catalyst", "Meaning Weaver"], r),
  },
  {
    questKey: "inspirations_q4",
    clusterSlug: "inspirations",
    clusterName: "Inspirations",
    intro: "Let's discover the thread that connects all your inspirations.",
    interactions: [
      { type: "scenario", prompt: "The common thread in everything that inspires you is…", options: ["Depth and authenticity", "Courage and conviction", "Beauty and craft"] },
      { type: "multi_select", prompt: "Which eras or movements resonate with you?", options: ["Renaissance creativity", "Social justice movements", "Scientific revolution", "Artistic counterculture", "Indigenous wisdom", "Modern innovation"], minSelect: 2, maxSelect: 3 },
      { type: "card_pick", prompt: "If you could learn from one type of master…", options: ["A philosopher", "An artist", "A builder", "A healer"] },
      { type: "reflection", prompt: "What thread connects everything that has ever inspired you?" },
    ],
    interpret: (r) => pick(["Thread Finder", "Era Resonator", "Master Apprentice"], r),
  },

  // ===== VISION FOR A BETTER WORLD (4 quests) =====
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
    interpret: (r) => pick(["Visionary Builder", "Equity Champion", "Future Architect"], r),
  },
  {
    questKey: "vision_q2",
    clusterSlug: "vision-for-a-better-world",
    clusterName: "Vision for a Better World",
    intro: "Let's deepen your vision for change.",
    interactions: [
      { type: "multi_select", prompt: "What kind of change do you want to create?", options: ["Systemic reform", "Cultural shift", "Individual empowerment", "Technological innovation", "Community healing", "Educational transformation"], minSelect: 2, maxSelect: 3 },
      { type: "scenario", prompt: "Your approach to change is most like…", options: ["Plant seeds quietly and let them grow", "Build something that speaks for itself", "Rally people around a shared vision"] },
      { type: "ranking", prompt: "Rank your priorities for a better world.", options: ["Justice and equality", "Creativity and expression", "Health and wellbeing", "Knowledge and wisdom"] },
      { type: "reflection", prompt: "What does the world need that you are uniquely equipped to give?" },
    ],
    interpret: (r) => pick(["Seed Planter", "Change Architect", "Movement Builder"], r),
  },
  {
    questKey: "vision_q3",
    clusterSlug: "vision-for-a-better-world",
    clusterName: "Vision for a Better World",
    intro: "Let's explore how your vision connects to your identity.",
    interactions: [
      { type: "card_pick", prompt: "Your vision is rooted in…", options: ["Personal experience with injustice", "Seeing potential in people", "A deep love for beauty and creation", "Understanding systems that fail"] },
      { type: "multi_select", prompt: "How do you already contribute to change?", options: ["Through my work", "Through my relationships", "Through my creativity", "Through my conversations", "Through my example", "Through my support of others"], minSelect: 2, maxSelect: 3 },
      { type: "energy_slider", prompt: "How much energy can you dedicate to these?", sliderItems: ["Local volunteering", "Building solutions", "Mentoring others"] },
      { type: "reflection", prompt: "What small act of yours could have ripple effects you can't yet see?" },
    ],
    interpret: (r) => pick(["Ripple Maker", "Rooted Visionary", "Quiet Revolutionary"], r),
  },
  {
    questKey: "vision_q4",
    clusterSlug: "vision-for-a-better-world",
    clusterName: "Vision for a Better World",
    intro: "Let's crystallize your contribution to the future.",
    interactions: [
      { type: "scenario", prompt: "In 20 years, you want to be remembered for…", options: ["Something I built that outlasts me", "People I helped become who they were meant to be", "A way of thinking I introduced to the world"] },
      { type: "multi_select", prompt: "What legacy matters most to you?", options: ["Creative works", "Relationships nurtured", "Systems changed", "Knowledge shared", "Communities built", "Lives transformed"], minSelect: 2, maxSelect: 3 },
      { type: "card_pick", prompt: "Your impact style is…", options: ["The architect — designing better systems", "The gardener — nurturing growth", "The bridge — connecting worlds", "The torch — lighting the way"] },
      { type: "reflection", prompt: "What one sentence would you want carved into the wall of history?" },
    ],
    interpret: (r) => pick(["Legacy Architect", "Impact Gardener", "Bridge Builder"], r),
  },

  // ===== IDEAL LIFE (4 quests) =====
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
    interpret: (r) => pick(["Freedom Designer", "Harmony Seeker", "Intentional Liver"], r),
  },
  {
    questKey: "ideal_life_q2",
    clusterSlug: "ideal-life",
    clusterName: "Ideal Life",
    intro: "Let's explore the environment of your ideal life.",
    interactions: [
      { type: "card_pick", prompt: "Your ideal environment feels like…", options: ["A creative studio full of light", "A cabin surrounded by nature", "A vibrant city buzzing with energy", "A cozy space with loved ones nearby"] },
      { type: "multi_select", prompt: "What elements define your ideal space?", options: ["Natural light", "Creative tools", "Beautiful objects", "Books everywhere", "Plants and nature", "Quiet and stillness"], minSelect: 2, maxSelect: 3 },
      { type: "energy_slider", prompt: "How important are these in your ideal life?", sliderItems: ["Aesthetic beauty", "Functional simplicity", "Connection to nature"] },
      { type: "reflection", prompt: "Where in the world do you feel most like yourself?" },
    ],
    interpret: (r) => pick(["Space Curator", "Environment Shaper", "Place Finder"], r),
  },
  {
    questKey: "ideal_life_q3",
    clusterSlug: "ideal-life",
    clusterName: "Ideal Life",
    intro: "Let's explore the relationships in your ideal life.",
    interactions: [
      { type: "multi_select", prompt: "What qualities must your closest relationships have?", options: ["Intellectual stimulation", "Emotional safety", "Creative collaboration", "Shared values", "Growth orientation", "Playfulness"], minSelect: 2, maxSelect: 3 },
      { type: "scenario", prompt: "In your ideal life, your community is…", options: ["A small, tight-knit circle of deep thinkers", "A diverse network of creators and builders", "A warm, supportive family-like group"] },
      { type: "ranking", prompt: "Rank what matters most in your relationships.", options: ["Depth over breadth", "Freedom within togetherness", "Mutual growth", "Unconditional acceptance"] },
      { type: "reflection", prompt: "What kind of relationship are you still searching for?" },
    ],
    interpret: (r) => pick(["Connection Architect", "Community Dreamer", "Belonging Seeker"], r),
  },
  {
    questKey: "ideal_life_q4",
    clusterSlug: "ideal-life",
    clusterName: "Ideal Life",
    intro: "Let's design the rhythm of your ideal life.",
    interactions: [
      { type: "card_pick", prompt: "Your ideal life rhythm is…", options: ["Structured with creative blocks", "Fluid and responsive to inspiration", "Seasonal — intense periods and rest", "Ritualistic — same beautiful routine daily"] },
      { type: "multi_select", prompt: "What rituals would fill your ideal week?", options: ["Morning creative practice", "Nature immersion", "Deep conversations", "Physical movement", "Learning something new", "Quiet reflection"], minSelect: 2, maxSelect: 3 },
      { type: "energy_slider", prompt: "How much time would you give to these?", sliderItems: ["Deep work", "Play and exploration", "Rest and reflection"] },
      { type: "reflection", prompt: "What does 'enough' look and feel like in your ideal life?" },
    ],
    interpret: (r) => pick(["Rhythm Designer", "Balance Architect", "Flow Seeker"], r),
  },

  // ===== NATURAL TALENTS (4 quests) =====
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
    interpret: (r) => pick(["Empathy Signal", "Creative Starter", "Calm Navigator"], r),
  },
  {
    questKey: "natural_talents_q2",
    clusterSlug: "natural-talents",
    clusterName: "Natural Talents",
    intro: "Let's explore talents that show up without effort.",
    interactions: [
      { type: "scenario", prompt: "People often say you have a gift for…", options: ["Making people feel comfortable", "Seeing solutions quickly", "Bringing ideas to life"] },
      { type: "multi_select", prompt: "Which of these feel effortless?", options: ["Understanding complex systems", "Creating visual beauty", "Sensing emotional shifts", "Finding the right words", "Motivating others", "Spotting patterns"], minSelect: 2, maxSelect: 3 },
      { type: "ranking", prompt: "Rank your most natural abilities.", options: ["Communication", "Creativity", "Analysis", "Emotional intelligence"] },
      { type: "reflection", prompt: "What talent do you use daily without even thinking about it?" },
    ],
    interpret: (r) => pick(["Invisible Gift", "Natural Flow", "Effortless Strength"], r),
  },
  {
    questKey: "natural_talents_q3",
    clusterSlug: "natural-talents",
    clusterName: "Natural Talents",
    intro: "Let's discover how your talents connect to your identity.",
    interactions: [
      { type: "card_pick", prompt: "Your core talent serves the world by…", options: ["Making things clearer", "Making people feel seen", "Making the impossible seem possible", "Making beauty where there was none"] },
      { type: "multi_select", prompt: "When has your talent surprised even you?", options: ["In a crisis when I stayed calm", "In a creative flow I couldn't stop", "In a conversation that went deep", "In a solution that came instantly", "In a moment of intuitive knowing", "In leading when I didn't plan to"], minSelect: 2, maxSelect: 3 },
      { type: "energy_slider", prompt: "How much joy do these talents bring?", sliderItems: ["Teaching or guiding", "Creating or building", "Connecting or healing"] },
      { type: "reflection", prompt: "What talent would be lost if you weren't here to share it?" },
    ],
    interpret: (r) => pick(["Gift Carrier", "Surprise Talent", "Joy Source"], r),
  },
  {
    questKey: "natural_talents_q4",
    clusterSlug: "natural-talents",
    clusterName: "Natural Talents",
    intro: "Let's honor the talents that make you uniquely you.",
    interactions: [
      { type: "multi_select", prompt: "Which talents are you ready to use more fully?", options: ["Creative vision", "Emotional depth", "Strategic thinking", "Healing presence", "Storytelling", "Problem-solving"], minSelect: 2, maxSelect: 3 },
      { type: "scenario", prompt: "If you fully embraced your greatest talent, you would…", options: ["Start something new and bold", "Deepen what already exists", "Help others find their talents too"] },
      { type: "card_pick", prompt: "Your talent is most needed in…", options: ["Creative spaces", "Healing spaces", "Learning spaces", "Building spaces"] },
      { type: "reflection", prompt: "What would change if you stopped hiding your greatest gift?" },
    ],
    interpret: (r) => pick(["Unleashed Talent", "Gift Multiplier", "Talent Catalyst"], r),
  },

  // ===== CHILDHOOD SIGNALS (4 quests) =====
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
    interpret: (r) => pick(["Inner Child Signal", "Curiosity Root", "Original Dreamer"], r, "life_imprint"),
  },
  {
    questKey: "childhood_signals_q2",
    clusterSlug: "childhood-signals",
    clusterName: "Childhood Signals",
    intro: "Let's uncover the early signals that defined your path.",
    interactions: [
      { type: "multi_select", prompt: "What were you drawn to before anyone told you what to like?", options: ["Drawing or painting", "Stories and books", "Animals and nature", "Machines and gadgets", "Music and rhythm", "People and relationships"], minSelect: 2, maxSelect: 3 },
      { type: "card_pick", prompt: "Your childhood self was most like…", options: ["The dreamer — always imagining", "The builder — always making", "The explorer — always questioning", "The caretaker — always helping"] },
      { type: "ranking", prompt: "Rank these childhood experiences by their lasting impact.", options: ["A moment of wonder", "A time you felt truly seen", "An experience of overcoming fear", "A time you created something"] },
      { type: "reflection", prompt: "What childhood memory still gives you goosebumps?" },
    ],
    interpret: (r) => pick(["Early Dreamer", "Origin Builder", "First Wonder"], r, "life_imprint"),
  },
  {
    questKey: "childhood_signals_q3",
    clusterSlug: "childhood-signals",
    clusterName: "Childhood Signals",
    intro: "Let's explore how your childhood shaped your adult patterns.",
    interactions: [
      { type: "scenario", prompt: "As a child, you learned to survive by…", options: ["Being the responsible one", "Being the creative escape artist", "Being the peacemaker"] },
      { type: "multi_select", prompt: "What childhood patterns still run in the background?", options: ["Seeking approval", "Needing to be useful", "Avoiding conflict", "Trying to fix things", "Performing to be loved", "Staying invisible"], minSelect: 2, maxSelect: 3 },
      { type: "card_pick", prompt: "Which childhood wound holds the most power?", options: ["Not feeling enough", "Not feeling seen", "Not feeling safe", "Not feeling free"] },
      { type: "reflection", prompt: "What would you tell your childhood self if you could go back?" },
    ],
    interpret: (r) => pick(["Wound Holder", "Pattern Carrier", "Inner Protector"], r, "shadow"),
  },
  {
    questKey: "childhood_signals_q4",
    clusterSlug: "childhood-signals",
    clusterName: "Childhood Signals",
    intro: "Let's reconnect with the wisdom of your younger self.",
    interactions: [
      { type: "multi_select", prompt: "What qualities from childhood do you want to reclaim?", options: ["Fearless curiosity", "Uninhibited creativity", "Easy joy", "Trust in others", "Sense of wonder", "Playfulness"], minSelect: 2, maxSelect: 3 },
      { type: "scenario", prompt: "Your inner child needs you to…", options: ["Play more and worry less", "Listen to your instincts again", "Stop trying so hard to be perfect"] },
      { type: "energy_slider", prompt: "How connected do you feel to these childhood qualities?", sliderItems: ["Playfulness", "Wonder", "Trust"] },
      { type: "reflection", prompt: "What childhood joy could transform your adult life if you brought it back?" },
    ],
    interpret: (r) => pick(["Reclaimed Joy", "Inner Child Healer", "Wonder Keeper"], r, "life_imprint"),
  },

  // ===== EXTERNAL REFLECTIONS (4 quests) =====
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
    interpret: (r) => pick(["Hidden Leader", "Mirror Insight", "Community Pillar"], r),
  },
  {
    questKey: "external_reflections_q2",
    clusterSlug: "external-reflections",
    clusterName: "External Reflections",
    intro: "Let's explore the gap between how you see yourself and how others see you.",
    interactions: [
      { type: "scenario", prompt: "Others see your strength as…", options: ["Bigger than you think it is", "Different from what you'd name", "Something you take for granted"] },
      { type: "multi_select", prompt: "What do others value about you that you dismiss?", options: ["My patience", "My insight", "My energy", "My warmth", "My honesty", "My stability"], minSelect: 2, maxSelect: 3 },
      { type: "card_pick", prompt: "The biggest blind spot about yourself is…", options: ["How much I inspire others", "How strong I actually am", "How creative my thinking is", "How deeply people trust me"] },
      { type: "reflection", prompt: "What compliment do you always deflect, and why?" },
    ],
    interpret: (r) => pick(["Blind Spot Revealer", "Hidden Impact", "Self-Perception Gap"], r),
  },
  {
    questKey: "external_reflections_q3",
    clusterSlug: "external-reflections",
    clusterName: "External Reflections",
    intro: "Let's understand what you project vs. what you feel inside.",
    interactions: [
      { type: "multi_select", prompt: "What do you show the world that differs from your inner experience?", options: ["Confidence (but I doubt myself)", "Calm (but I feel overwhelmed)", "Strength (but I feel fragile)", "Independence (but I need support)", "Happiness (but I feel lost)", "Certainty (but I'm figuring it out)"], minSelect: 2, maxSelect: 3 },
      { type: "ranking", prompt: "Rank how much you mask these.", options: ["Vulnerability", "Uncertainty", "Need for connection", "Fear of failure"] },
      { type: "scenario", prompt: "If people saw the real you, they would…", options: ["Be surprised by my depth", "Understand why I need space", "See how much I care"] },
      { type: "reflection", prompt: "What part of yourself would you like to stop hiding?" },
    ],
    interpret: (r) => pick(["Mask Revealer", "Hidden Depth", "Authentic Self"], r, "shadow"),
  },
  {
    questKey: "external_reflections_q4",
    clusterSlug: "external-reflections",
    clusterName: "External Reflections",
    intro: "Let's integrate what others see with who you truly are.",
    interactions: [
      { type: "card_pick", prompt: "The feedback that shaped you most was…", options: ["Someone believed in me before I did", "Someone challenged me to grow", "Someone showed me my blind spot", "Someone thanked me for something I didn't know I did"] },
      { type: "multi_select", prompt: "What external reflections are you ready to own?", options: ["I am a leader", "I am creative", "I am deeply caring", "I am resilient", "I am wise", "I am brave"], minSelect: 2, maxSelect: 3 },
      { type: "energy_slider", prompt: "How ready are you to own these truths?", sliderItems: ["My strength", "My sensitivity", "My uniqueness"] },
      { type: "reflection", prompt: "What would change if you truly believed what others see in you?" },
    ],
    interpret: (r) => pick(["Truth Owner", "Integrated Self", "Reflection Integrator"], r),
  },

  // ===== EXPERIMENTS (4 quests) =====
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
    interpret: (r) => pick(["Bold Experimenter", "Calculated Explorer", "Resilient Tester"], r),
  },
  {
    questKey: "experiments_q2",
    clusterSlug: "experiments",
    clusterName: "Experiments",
    intro: "Let's explore how you handle the unknown.",
    interactions: [
      { type: "card_pick", prompt: "Your relationship with risk is…", options: ["I thrive in it", "I calculate before leaping", "I push through despite fear", "I prefer small safe experiments"] },
      { type: "multi_select", prompt: "What holds you back from experimenting more?", options: ["Fear of wasting time", "Fear of judgment", "Lack of clarity", "Too many options", "Not enough support", "Perfectionism"], minSelect: 2, maxSelect: 3 },
      { type: "ranking", prompt: "Rank what you learn most from.", options: ["Failed experiments", "Successful experiments", "Watching others experiment", "Reflecting on past experiments"] },
      { type: "reflection", prompt: "What experiment are you afraid to try that could change everything?" },
    ],
    interpret: (r) => pick(["Risk Dancer", "Fear Breaker", "Learning Experimenter"], r),
  },
  {
    questKey: "experiments_q3",
    clusterSlug: "experiments",
    clusterName: "Experiments",
    intro: "Let's discover your experimentation style.",
    interactions: [
      { type: "multi_select", prompt: "What kind of experiments excite you most?", options: ["Creative expression", "Business ideas", "Lifestyle changes", "Relationship dynamics", "Learning challenges", "Physical adventures"], minSelect: 2, maxSelect: 3 },
      { type: "scenario", prompt: "Your ideal experiment would be…", options: ["Something no one has tried before", "Something that tests my limits", "Something that solves a real problem"] },
      { type: "energy_slider", prompt: "How much energy do you have for these?", sliderItems: ["Short sprints", "Long commitments", "Spontaneous pivots"] },
      { type: "reflection", prompt: "What's the bravest experiment you've ever run on your own life?" },
    ],
    interpret: (r) => pick(["Pioneer Spirit", "Limit Tester", "Life Hacker"], r),
  },
  {
    questKey: "experiments_q4",
    clusterSlug: "experiments",
    clusterName: "Experiments",
    intro: "Let's map your experimental journey forward.",
    interactions: [
      { type: "card_pick", prompt: "Your next experiment should focus on…", options: ["Creativity and self-expression", "Career and purpose", "Relationships and connection", "Inner growth and healing"] },
      { type: "multi_select", prompt: "What resources would you need?", options: ["Time and space", "A supportive community", "Expert guidance", "Financial runway", "Creative tools", "Permission to fail"], minSelect: 2, maxSelect: 3 },
      { type: "ranking", prompt: "Rank your experiment priorities.", options: ["Speed of learning", "Depth of experience", "Impact on others", "Personal transformation"] },
      { type: "reflection", prompt: "If failure was impossible, what experiment would you start tomorrow?" },
    ],
    interpret: (r) => pick(["Future Experimenter", "Impact Tester", "Transformation Lab"], r),
  },
];

export function getQuestForCluster(slug: string): AtlasQuestDefinition | undefined {
  return ATLAS_QUESTS.find(q => q.clusterSlug === slug);
}

export function getQuestsForCluster(slug: string): AtlasQuestDefinition[] {
  return ATLAS_QUESTS.filter(q => q.clusterSlug === slug);
}
