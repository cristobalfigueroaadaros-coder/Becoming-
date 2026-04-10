import type { DotCategory } from "./atlasSignals";

export type InteractionType = "multi_select" | "ranking" | "scenario" | "card_pick" | "energy_slider" | "reflection"
  | "emoji_scale" | "visual_metaphor" | "sentence_completion" | "memory_flash"
  | "this_or_that" | "tap_resonates" | "then_vs_now";

export interface EmojiOption {
  emoji: string;
  label: string;
}

export interface QuestInteraction {
  type: InteractionType;
  prompt: string;
  options?: string[];
  minSelect?: number;
  maxSelect?: number;
  sliderItems?: string[];
  emojiOptions?: EmojiOption[];
  sentenceStem?: string;
  memoryPrompt?: string;
  /** For this_or_that: exactly 2 options */
  optionA?: string;
  optionB?: string;
  /** For tap_resonates: list of single words to tap */
  words?: string[];
  /** For then_vs_now: labels for the two text inputs */
  thenLabel?: string;
  nowLabel?: string;
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
  return { title: titles[idx], description: "Discovered through your Atlas journey.", dotCategory: cat };
};

export const ATLAS_QUESTS: AtlasQuestDefinition[] = [
  // ===== LIFE EVENTS (4 quests) =====
  {
    questKey: "life_events_q1",
    clusterSlug: "life-events",
    clusterName: "Life Events",
    intro: "Let's explore the moments that shaped who you are.",
    interactions: [
      { type: "then_vs_now", prompt: "How has your life changed?", thenLabel: "Who I was before my biggest change", nowLabel: "Who I am after it" },
      { type: "visual_metaphor", prompt: "Your life path feels most like…", options: ["A mountain climb — steep but worth it", "A winding river — always moving", "An open road — full of choices", "A maze — surprising turns"] },
      { type: "multi_select", prompt: "Which moments feel like turning points?", options: ["Moving to a new place", "A relationship change", "A career shift", "A loss or ending", "An unexpected win", "A moment of clarity"], minSelect: 2, maxSelect: 3 },
      { type: "reflection", prompt: "Describe your biggest life moment in two sentences." },
    ],
    interpret: (r) => pick(["Kept Going", "Changed Course", "Started Over"], r),
  },
  {
    questKey: "life_events_q2",
    clusterSlug: "life-events",
    clusterName: "Life Events",
    intro: "Let's look at how tough moments changed your direction.",
    interactions: [
      { type: "card_pick", prompt: "Which moment left the deepest mark?", options: ["A sudden change", "A slow realization", "An unexpected chance", "A painful ending"] },
      { type: "emoji_scale", prompt: "How much did hard times teach you?", emojiOptions: [
        { emoji: "😐", label: "Not much" }, { emoji: "🙂", label: "A bit" }, { emoji: "😊", label: "A lot" }, { emoji: "😄", label: "Everything" }, { emoji: "🤯", label: "They made me" }
      ]},
      { type: "multi_select", prompt: "What did your hardest moments teach you?", options: ["To trust myself", "To let go", "To ask for help", "To keep going", "To change direction", "To listen more"], minSelect: 2, maxSelect: 3 },
      { type: "memory_flash", prompt: "Think of a struggle that made you stronger. What happened?", memoryPrompt: "Close your eyes. Think of a time you were challenged and came out different on the other side." },
    ],
    interpret: (r) => pick(["Learned the Hard Way", "Found My Strength", "Grew Through It"], r, "life_imprint"),
  },
  {
    questKey: "life_events_q3",
    clusterSlug: "life-events",
    clusterName: "Life Events",
    intro: "Let's explore the emotions behind your key experiences.",
    interactions: [
      { type: "emoji_scale", prompt: "Your defining moments were mostly…", emojiOptions: [
        { emoji: "😢", label: "Painful" }, { emoji: "😰", label: "Scary" }, { emoji: "😐", label: "Mixed" }, { emoji: "😊", label: "Exciting" }, { emoji: "🤯", label: "Life-changing" }
      ]},
      { type: "scenario", prompt: "Your strongest memories are tied to…", options: ["People who challenged me", "Places that changed me", "Decisions I almost didn't make"] },
      { type: "ranking", prompt: "How do you handle big life shifts?", options: ["Adapt quickly", "Process deeply", "Seek support", "Take action"] },
      { type: "sentence_completion", prompt: "Complete this sentence:", sentenceStem: "The moment that changed everything was when I" },
    ],
    interpret: (r) => pick(["Deep Feeler", "Quick Adapter", "Turned It Around"], r, "life_imprint"),
  },
  {
    questKey: "life_events_q4",
    clusterSlug: "life-events",
    clusterName: "Life Events",
    intro: "Let's find hidden patterns in your life story.",
    interactions: [
      { type: "visual_metaphor", prompt: "Looking back, your life feels like…", options: ["A spiral — returning deeper each time", "A river — always flowing forward", "A mosaic — many pieces forming a picture", "A book — with clear chapters"] },
      { type: "multi_select", prompt: "Which themes keep showing up?", options: ["Starting over", "Deep connections", "Creative bursts", "Solitude", "Breaking free", "Learning the hard way"], minSelect: 2, maxSelect: 3 },
      { type: "card_pick", prompt: "What pattern surprises you most?", options: ["How often I reinvent myself", "How deeply I care", "How resilient I am", "How much I've changed"] },
      { type: "reflection", prompt: "If your life were a book, what would this chapter be called?" },
    ],
    interpret: (r) => pick(["Always Evolving", "Pattern Finder", "New Chapter"], r, "life_imprint"),
  },

  // ===== PASSIONS (4 quests) =====
  {
    questKey: "passions_q1",
    clusterSlug: "passions",
    clusterName: "Passions",
    intro: "Let's discover what lights you up.",
    interactions: [
      { type: "visual_metaphor", prompt: "Your energy feels most like…", options: ["A bonfire — warm and magnetic", "A lightning bolt — intense and sudden", "A steady candle — calm and focused", "A sunrise — growing and hopeful"] },
      { type: "emoji_scale", prompt: "How alive do you feel when doing what you love?", emojiOptions: [
        { emoji: "😐", label: "Okay" }, { emoji: "🙂", label: "Good" }, { emoji: "😊", label: "Great" }, { emoji: "😄", label: "On fire" }, { emoji: "🤯", label: "Unstoppable" }
      ]},
      { type: "multi_select", prompt: "What makes you lose track of time?", options: ["Writing or journaling", "Teaching or mentoring", "Designing or building", "Researching or learning", "Moving my body", "Deep conversations"], minSelect: 2, maxSelect: 3 },
      { type: "reflection", prompt: "What would you do every day if nothing held you back?" },
    ],
    interpret: (r) => pick(["On Fire", "Can't Stop Creating", "Always Curious"], r),
  },
  {
    questKey: "passions_q2",
    clusterSlug: "passions",
    clusterName: "Passions",
    intro: "Let's explore what pulls you forward.",
    interactions: [
      { type: "multi_select", prompt: "What can you talk about for hours?", options: ["People and behavior", "Technology and ideas", "Art and design", "Meaning and purpose", "Nature and science", "Stories and history"], minSelect: 2, maxSelect: 3 },
      { type: "scenario", prompt: "When you have free time, you're drawn to…", options: ["Creating something from scratch", "Learning something new", "Connecting with someone deeply"] },
      { type: "energy_slider", prompt: "How energized do you feel doing these?", sliderItems: ["Brainstorming", "Solo deep work", "Teamwork"] },
      { type: "sentence_completion", prompt: "Complete this:", sentenceStem: "I feel most alive when I" },
    ],
    interpret: (r) => pick(["Deep Diver", "Always Building", "Passion Driven"], r),
  },
  {
    questKey: "passions_q3",
    clusterSlug: "passions",
    clusterName: "Passions",
    intro: "Let's understand the energy behind your passions.",
    interactions: [
      { type: "ranking", prompt: "What energizes you most?", options: ["Making something beautiful", "Understanding something complex", "Helping someone grow", "Discovering something new"] },
      { type: "visual_metaphor", prompt: "Your creative energy is like…", options: ["A steady flame — consistent and deep", "A lightning bolt — intense bursts", "A flowing river — always moving", "A volcano — dormant then explosive"] },
      { type: "multi_select", prompt: "What fuels your passion?", options: ["Quiet and solitude", "Inspiring people", "A clear challenge", "Freedom to try", "Strong emotions", "A deadline"], minSelect: 2, maxSelect: 3 },
      { type: "memory_flash", prompt: "Think of a time you were completely absorbed in something you love. What were you doing?", memoryPrompt: "Remember a moment when time disappeared because you were doing something you love." },
    ],
    interpret: (r) => pick(["Steady Flame", "Creative Burst", "Flow Finder"], r),
  },
  {
    questKey: "passions_q4",
    clusterSlug: "passions",
    clusterName: "Passions",
    intro: "Let's find where your passions overlap.",
    interactions: [
      { type: "multi_select", prompt: "Which combinations excite you?", options: ["Art + Technology", "Psychology + Teaching", "Science + Storytelling", "Design + Community", "Philosophy + Action", "Nature + Innovation"], minSelect: 2, maxSelect: 3 },
      { type: "scenario", prompt: "Your ideal project sits at the intersection of…", options: ["Creativity and impact", "Knowledge and connection", "Freedom and purpose"] },
      { type: "emoji_scale", prompt: "How close are you to working on your passion?", emojiOptions: [
        { emoji: "😢", label: "Far away" }, { emoji: "😐", label: "Getting there" }, { emoji: "🙂", label: "Close" }, { emoji: "😄", label: "Almost there" }, { emoji: "🤯", label: "Living it" }
      ]},
      { type: "reflection", prompt: "What two interests, combined, could become your life's work?" },
    ],
    interpret: (r) => pick(["Cross-Pollinator", "Passion Mixer", "Found My Mix"], r),
  },

  // ===== SKILLS (4 quests) =====
  {
    questKey: "skills_q1",
    clusterSlug: "skills",
    clusterName: "Skills",
    intro: "Let's map what you're naturally good at.",
    interactions: [
      { type: "tap_resonates", prompt: "Tap all the skills that feel like you.", words: ["Organizing", "Creating", "Listening", "Analyzing", "Leading", "Teaching", "Writing", "Designing", "Negotiating", "Storytelling"] },
      { type: "ranking", prompt: "Order by your confidence level.", options: ["Writing", "Analysis", "Leadership", "Design"] },
      { type: "scenario", prompt: "In a team, you naturally become…", options: ["The planner", "The idea generator", "The people connector"] },
      { type: "sentence_completion", prompt: "Complete this:", sentenceStem: "The skill that comes most naturally to me is" },
    ],
    interpret: (r) => pick(["Natural Strategist", "Problem Solver", "People Reader"], r),
  },
  {
    questKey: "skills_q2",
    clusterSlug: "skills",
    clusterName: "Skills",
    intro: "Let's explore skills you built through experience.",
    interactions: [
      { type: "card_pick", prompt: "Which skill grew most from challenge?", options: ["Communicating under pressure", "Solving new problems", "Leading without authority", "Adapting to change"] },
      { type: "emoji_scale", prompt: "How hard was it to build your strongest skill?", emojiOptions: [
        { emoji: "😊", label: "Came easy" }, { emoji: "🙂", label: "Some effort" }, { emoji: "😐", label: "Real work" }, { emoji: "😰", label: "A struggle" }, { emoji: "😤", label: "Years of grind" }
      ]},
      { type: "multi_select", prompt: "Which skills have you worked to build?", options: ["Public speaking", "Writing", "Data analysis", "Design thinking", "Negotiation", "Project management"], minSelect: 2, maxSelect: 3 },
      { type: "reflection", prompt: "What skill took years to develop but now feels effortless?" },
    ],
    interpret: (r) => pick(["Hard-Won Skill", "Pressure Tested", "Quiet Mastery"], r),
  },
  {
    questKey: "skills_q3",
    clusterSlug: "skills",
    clusterName: "Skills",
    intro: "Let's find your hidden abilities.",
    interactions: [
      { type: "multi_select", prompt: "What can you do that most people find hard?", options: ["See the big picture fast", "Stay calm in chaos", "Explain complex things simply", "Read a room's energy", "Make quick decisions", "Hold space for others"], minSelect: 2, maxSelect: 3 },
      { type: "scenario", prompt: "In a crisis, people count on you to…", options: ["Stay rational and plan", "Keep morale up", "Think creatively"] },
      { type: "energy_slider", prompt: "How effortless are these for you?", sliderItems: ["Seeing patterns", "Reading emotions", "Planning ahead"] },
      { type: "memory_flash", prompt: "Think of a time someone thanked you for an ability you didn't know you had.", memoryPrompt: "Remember a moment when someone pointed out a strength you hadn't recognized." },
    ],
    interpret: (r) => pick(["Hidden Strength", "Crisis Calm", "Unsung Talent"], r),
  },
  {
    questKey: "skills_q4",
    clusterSlug: "skills",
    clusterName: "Skills",
    intro: "Let's see how your skills combine.",
    interactions: [
      { type: "ranking", prompt: "Rank your strongest skill combos.", options: ["Creativity + Strategy", "Empathy + Communication", "Analysis + Leadership", "Adaptability + Problem-solving"] },
      { type: "visual_metaphor", prompt: "Your skill blend is most like…", options: ["A Swiss army knife — versatile", "A laser — focused", "A bridge — connecting worlds", "A compass — guiding direction"] },
      { type: "multi_select", prompt: "Where do your skills shine most?", options: ["Creative projects", "Team dynamics", "Problem-solving", "Teaching moments", "Big decisions", "Emotional situations"], minSelect: 2, maxSelect: 3 },
      { type: "reflection", prompt: "If you combined your top two skills into a superpower, what would it be?" },
    ],
    interpret: (r) => pick(["Skill Mixer", "Unique Blend", "Power Combo"], r),
  },

  // ===== PERSONAL FRUSTRATIONS (4 quests) =====
  {
    questKey: "personal_frustrations_q1",
    clusterSlug: "personal-frustrations",
    clusterName: "Personal Frustrations",
    intro: "What frustrates you often points to what matters most.",
    interactions: [
      { type: "multi_select", prompt: "What frustrates you most?", options: ["Wasted potential", "Unfairness", "Lack of depth", "Inefficiency", "Broken systems", "Apathy"], minSelect: 2, maxSelect: 3 },
      { type: "emoji_scale", prompt: "How strongly does this frustration burn?", emojiOptions: [
        { emoji: "😐", label: "Mild" }, { emoji: "😤", label: "Annoying" }, { emoji: "😠", label: "Intense" }, { emoji: "🔥", label: "Burning" }, { emoji: "💥", label: "Explosive" }
      ]},
      { type: "card_pick", prompt: "Which one feels most personal?", options: ["People not reaching their potential", "Systems that fail people", "Creativity being crushed", "Lack of real connection"] },
      { type: "reflection", prompt: "What problem would you solve if you had unlimited resources?" },
    ],
    interpret: (r) => pick(["Justice Seeker", "Potential Unlocker", "System Fixer"], r),
  },
  {
    questKey: "personal_frustrations_q2",
    clusterSlug: "personal-frustrations",
    clusterName: "Personal Frustrations",
    intro: "Your frustrations reveal your deepest values.",
    interactions: [
      { type: "scenario", prompt: "What triggers your frustration most?", options: ["Seeing talent wasted", "Being misunderstood", "Watching people settle"] },
      { type: "multi_select", prompt: "Which inner frustrations do you recognize?", options: ["Not being further ahead", "Caring too much", "Struggling to find my tribe", "Knowing but not doing", "Feeling misaligned", "Being too hard on myself"], minSelect: 2, maxSelect: 3 },
      { type: "visual_metaphor", prompt: "Your frustration is like…", options: ["A splinter — small but constant", "A storm — intense but passing", "A weight — heavy and persistent", "A fire — it could become fuel"] },
      { type: "sentence_completion", prompt: "Complete this:", sentenceStem: "The frustration that could become my greatest strength is" },
    ],
    interpret: (r) => pick(["Channeled Intensity", "Shadow Fuel", "Turned It Around"], r, "shadow"),
  },
  {
    questKey: "personal_frustrations_q3",
    clusterSlug: "personal-frustrations",
    clusterName: "Personal Frustrations",
    intro: "Let's find the patterns behind your frustrations.",
    interactions: [
      { type: "ranking", prompt: "Which frustration patterns show up most?", options: ["Repeating mistakes", "Same conflicts", "Hitting the same ceiling", "Avoiding hard conversations"] },
      { type: "multi_select", prompt: "What do you avoid because of frustration?", options: ["Taking the lead", "Being vulnerable", "Starting over", "Asking for what I need", "Facing conflict", "Slowing down"], minSelect: 2, maxSelect: 3 },
      { type: "emoji_scale", prompt: "How aware are you of your frustration patterns?", emojiOptions: [
        { emoji: "😶", label: "Barely" }, { emoji: "😐", label: "Starting to see" }, { emoji: "🙂", label: "Aware" }, { emoji: "😊", label: "Working on it" }, { emoji: "💡", label: "Transforming it" }
      ]},
      { type: "reflection", prompt: "What keeps showing up in your life that you haven't solved yet?" },
    ],
    interpret: (r) => pick(["Pattern Breaker", "Facing It", "Growth Edge"], r, "shadow"),
  },
  {
    questKey: "personal_frustrations_q4",
    clusterSlug: "personal-frustrations",
    clusterName: "Personal Frustrations",
    intro: "Let's transform frustration into fuel.",
    interactions: [
      { type: "card_pick", prompt: "Which feels most true for you?", options: ["My frustration drives change", "My anger shows what I value", "My impatience pushes action", "My disappointment raises standards"] },
      { type: "multi_select", prompt: "What has frustration already pushed you toward?", options: ["A career change", "A creative project", "A boundary", "A commitment", "A new perspective", "A bold decision"], minSelect: 2, maxSelect: 3 },
      { type: "energy_slider", prompt: "How much can frustration fuel positive change?", sliderItems: ["In work", "In relationships", "In growth"] },
      { type: "memory_flash", prompt: "Think of a time frustration led to something good.", memoryPrompt: "Remember when you were frustrated and it pushed you to do something you're now proud of." },
    ],
    interpret: (r) => pick(["Turned Frustration to Fuel", "Fire Walker", "Used the Anger"], r),
  },

  // ===== VALUES (4 quests) =====
  {
    questKey: "values_q1",
    clusterSlug: "values",
    clusterName: "Values",
    intro: "Let's uncover the principles that guide your life.",
    interactions: [
      { type: "this_or_that", prompt: "Quick gut reaction:", optionA: "Freedom", optionB: "Security" },
      { type: "multi_select", prompt: "Which values won't you compromise?", options: ["Authenticity", "Fairness", "Creativity", "Loyalty", "Independence", "Compassion"], minSelect: 2, maxSelect: 3 },
      { type: "this_or_that", prompt: "When values clash:", optionA: "Honesty over harmony", optionB: "Growth over comfort" },
      { type: "reflection", prompt: "What value would you fight for even if it cost you?" },
    ],
    interpret: (r) => pick(["Integrity First", "Freedom Driven", "Growth Seeker"], r),
  },
  {
    questKey: "values_q2",
    clusterSlug: "values",
    clusterName: "Values",
    intro: "Let's explore the values you live, not just believe.",
    interactions: [
      { type: "multi_select", prompt: "Which values show up in your daily actions?", options: ["Patience", "Courage", "Generosity", "Curiosity", "Discipline", "Kindness"], minSelect: 2, maxSelect: 3 },
      { type: "card_pick", prompt: "Which values gap bothers you most?", options: ["I value balance but overwork", "I value honesty but avoid conflict", "I value creativity but play it safe", "I value connection but isolate"] },
      { type: "emoji_scale", prompt: "How aligned are your actions with your values?", emojiOptions: [
        { emoji: "😢", label: "Way off" }, { emoji: "😐", label: "Getting there" }, { emoji: "🙂", label: "Mostly aligned" }, { emoji: "😊", label: "Very close" }, { emoji: "✨", label: "Fully aligned" }
      ]},
      { type: "reflection", prompt: "What value do you wish you lived more fully?" },
    ],
    interpret: (r) => pick(["Values Practitioner", "Closing the Gap", "Walking the Talk"], r),
  },
  {
    questKey: "values_q3",
    clusterSlug: "values",
    clusterName: "Values",
    intro: "Let's find where your values come from.",
    interactions: [
      { type: "scenario", prompt: "Your strongest values were shaped by…", options: ["Someone who showed me how", "A painful lesson", "Something I always knew inside"] },
      { type: "multi_select", prompt: "Which values changed as you grew up?", options: ["What success means", "Relationships over achievement", "Freedom over security", "Integrity over popularity", "Depth over breadth", "Being over doing"], minSelect: 2, maxSelect: 3 },
      { type: "energy_slider", prompt: "How strongly do you feel about these?", sliderItems: ["Standing up for beliefs", "Living authentically", "Prioritizing wellbeing"] },
      { type: "memory_flash", prompt: "Think of a moment when you stood up for something you believe in.", memoryPrompt: "Remember a time you defended a value even when it was hard." },
    ],
    interpret: (r) => pick(["Forged by Fire", "Evolved Values", "Core Truth"], r, "life_imprint"),
  },
  {
    questKey: "values_q4",
    clusterSlug: "values",
    clusterName: "Values",
    intro: "Let's explore how your values guide your future.",
    interactions: [
      { type: "card_pick", prompt: "Which value matters most for your next chapter?", options: ["Courage to be different", "Patience with the process", "Commitment to depth", "Openness to change"] },
      { type: "multi_select", prompt: "What values do you want to pass on?", options: ["Resilience", "Empathy", "Curiosity", "Integrity", "Joy", "Service"], minSelect: 2, maxSelect: 3 },
      { type: "ranking", prompt: "What guides your biggest decisions?", options: ["My gut feeling", "My values", "Other people's needs", "Long-term vision"] },
      { type: "sentence_completion", prompt: "Complete this:", sentenceStem: "The one value I want to be known for is" },
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
      { type: "card_pick", prompt: "What kind of realization hits you hardest?", options: ["Connecting unrelated ideas", "Seeing a hidden pattern", "Understanding someone deeply", "Realizing my own potential"] },
      { type: "multi_select", prompt: "When do your best ideas show up?", options: ["In conversation", "Alone", "While moving", "Before sleep", "While creating", "While reading"], minSelect: 2, maxSelect: 3 },
      { type: "emoji_scale", prompt: "How often do you have breakthrough moments?", emojiOptions: [
        { emoji: "😐", label: "Rarely" }, { emoji: "🙂", label: "Sometimes" }, { emoji: "😊", label: "Often" }, { emoji: "😄", label: "Frequently" }, { emoji: "💡", label: "All the time" }
      ]},
      { type: "reflection", prompt: "Describe a moment when everything suddenly clicked." },
    ],
    interpret: (r) => pick(["Pattern Thinker", "Insight Generator", "Connection Finder"], r),
  },
  {
    questKey: "aha_moments_q2",
    clusterSlug: "aha-moments",
    clusterName: "Aha Moments",
    intro: "Let's map how your mind creates breakthroughs.",
    interactions: [
      { type: "multi_select", prompt: "What comes before your biggest insights?", options: ["Being stuck", "A new perspective", "Deep relaxation", "Intense focus", "Random connection", "Emotional openness"], minSelect: 2, maxSelect: 3 },
      { type: "visual_metaphor", prompt: "Your thinking style is most like…", options: ["A slow simmer — builds over time", "A lightning strike — sudden clarity", "A kaleidoscope — mixing patterns", "A deep well — drawing from below"] },
      { type: "ranking", prompt: "What triggers your insights most?", options: ["Asking why repeatedly", "Flipping assumptions", "Looking at the opposite", "Changing environment"] },
      { type: "memory_flash", prompt: "Think of an insight that changed how you see yourself.", memoryPrompt: "Remember a moment of sudden understanding about who you really are." },
    ],
    interpret: (r) => pick(["Slow Builder", "Flash Thinker", "Idea Mixer"], r, "life_imprint"),
  },
  {
    questKey: "aha_moments_q3",
    clusterSlug: "aha-moments",
    clusterName: "Aha Moments",
    intro: "Let's see what your aha moments reveal about you.",
    interactions: [
      { type: "card_pick", prompt: "Your insights tend to be about…", options: ["How things really work", "How people really feel", "What's possible", "What needs to change"] },
      { type: "multi_select", prompt: "What do you notice that others miss?", options: ["Emotional shifts", "System flaws", "Creative openings", "Unspoken dynamics", "Hidden connections", "Timing patterns"], minSelect: 2, maxSelect: 3 },
      { type: "energy_slider", prompt: "How important are these for your insights?", sliderItems: ["Solitude", "Diverse input", "Movement"] },
      { type: "sentence_completion", prompt: "Complete this:", sentenceStem: "I keep noticing that" },
    ],
    interpret: (r) => pick(["Depth Perceiver", "System Reader", "Pattern Spotter"], r),
  },
  {
    questKey: "aha_moments_q4",
    clusterSlug: "aha-moments",
    clusterName: "Aha Moments",
    intro: "Let's understand the impact of your realizations.",
    interactions: [
      { type: "scenario", prompt: "Your biggest aha moments changed your…", options: ["Beliefs about myself", "Understanding of others", "Vision for the future"] },
      { type: "multi_select", prompt: "What followed your biggest realization?", options: ["A major decision", "A relationship shift", "A creative project", "A new habit", "A hard conversation", "A period of grief"], minSelect: 2, maxSelect: 3 },
      { type: "emoji_scale", prompt: "How quickly do you act on your insights?", emojiOptions: [
        { emoji: "🐢", label: "Slowly" }, { emoji: "😐", label: "Eventually" }, { emoji: "🙂", label: "Fairly fast" }, { emoji: "⚡", label: "Quickly" }, { emoji: "🚀", label: "Immediately" }
      ]},
      { type: "reflection", prompt: "What realization are you sitting with right now?" },
    ],
    interpret: (r) => pick(["Insight to Action", "Wisdom Collector", "Still Processing"], r),
  },

  // ===== INSPIRATIONS (4 quests) =====
  {
    questKey: "inspirations_q1",
    clusterSlug: "inspirations",
    clusterName: "Inspirations",
    intro: "Let's discover who and what inspires you.",
    interactions: [
      { type: "multi_select", prompt: "What type of people inspire you?", options: ["Bold risk-takers", "Quiet creators", "Community builders", "Deep thinkers", "Rebels", "Healers"], minSelect: 2, maxSelect: 3 },
      { type: "ranking", prompt: "Rank your inspiration sources.", options: ["Books and ideas", "Real people's stories", "Art and music", "Nature and silence"] },
      { type: "visual_metaphor", prompt: "Inspiration feels like…", options: ["A spark — sudden and bright", "A tide — it comes and goes", "A compass — it guides me", "A mirror — it shows me who I am"] },
      { type: "reflection", prompt: "Who do you admire and why?" },
    ],
    interpret: (r) => pick(["Courage Admirer", "Wisdom Seeker", "Beauty Collector"], r),
  },
  {
    questKey: "inspirations_q2",
    clusterSlug: "inspirations",
    clusterName: "Inspirations",
    intro: "Let's explore the deeper patterns in what inspires you.",
    interactions: [
      { type: "card_pick", prompt: "What quality in others moves you most?", options: ["Authenticity under pressure", "Creative courage", "Quiet strength", "Radical generosity"] },
      { type: "multi_select", prompt: "Which art forms speak to you?", options: ["Music", "Visual art", "Writing and poetry", "Film", "Architecture", "Performance"], minSelect: 2, maxSelect: 3 },
      { type: "emoji_scale", prompt: "How deeply does inspiration affect you?", emojiOptions: [
        { emoji: "😐", label: "A little" }, { emoji: "🙂", label: "Somewhat" }, { emoji: "😊", label: "A lot" }, { emoji: "😄", label: "Deeply" }, { emoji: "🤯", label: "It transforms me" }
      ]},
      { type: "memory_flash", prompt: "Think of something you read, saw, or heard that changed you.", memoryPrompt: "Remember a book, film, conversation, or moment that shifted how you see the world." },
    ],
    interpret: (r) => pick(["Authenticity Seeker", "Beauty Hunter", "Mind Opener"], r),
  },
  {
    questKey: "inspirations_q3",
    clusterSlug: "inspirations",
    clusterName: "Inspirations",
    intro: "Let's see how inspiration fuels your actions.",
    interactions: [
      { type: "multi_select", prompt: "How do you channel inspiration?", options: ["Into creative projects", "Into helping others", "Into personal growth", "Into conversations", "Into writing", "Into experiments"], minSelect: 2, maxSelect: 3 },
      { type: "ranking", prompt: "How does inspiration flow through you?", options: ["I create something", "I share it", "I reflect deeply", "I change something"] },
      { type: "energy_slider", prompt: "What inspires you to act?", sliderItems: ["A mentor's words", "A beautiful creation", "Overcoming struggle"] },
      { type: "sentence_completion", prompt: "Complete this:", sentenceStem: "The inspiration I'm carrying right now is" },
    ],
    interpret: (r) => pick(["Inspiration to Action", "Meaning Weaver", "Moved to Create"], r),
  },
  {
    questKey: "inspirations_q4",
    clusterSlug: "inspirations",
    clusterName: "Inspirations",
    intro: "Let's find the thread that connects your inspirations.",
    interactions: [
      { type: "scenario", prompt: "Everything that inspires you shares…", options: ["Depth and authenticity", "Courage and conviction", "Beauty and craft"] },
      { type: "multi_select", prompt: "Which movements resonate with you?", options: ["Renaissance creativity", "Social justice", "Scientific revolution", "Counterculture", "Indigenous wisdom", "Modern innovation"], minSelect: 2, maxSelect: 3 },
      { type: "card_pick", prompt: "If you could learn from one type of master…", options: ["A philosopher", "An artist", "A builder", "A healer"] },
      { type: "reflection", prompt: "What thread connects everything that has ever inspired you?" },
    ],
    interpret: (r) => pick(["Thread Finder", "Era Resonator", "Lifelong Student"], r),
  },

  // ===== VISION FOR A BETTER WORLD (4 quests) =====
  {
    questKey: "vision_q1",
    clusterSlug: "vision-for-a-better-world",
    clusterName: "Vision for a Better World",
    intro: "Let's explore your vision for the future.",
    interactions: [
      { type: "card_pick", prompt: "Which cause pulls at your heart?", options: ["Education for all", "Mental health", "Environmental restoration", "Economic fairness"] },
      { type: "multi_select", prompt: "What changes would you fight for?", options: ["Equal opportunity", "Creative freedom", "Sustainable living", "Deeper connection", "Better education", "Health access"], minSelect: 2, maxSelect: 3 },
      { type: "emoji_scale", prompt: "How urgent does change feel to you?", emojiOptions: [
        { emoji: "😐", label: "Someday" }, { emoji: "🙂", label: "Important" }, { emoji: "😊", label: "Urgent" }, { emoji: "🔥", label: "Now" }, { emoji: "💥", label: "Yesterday" }
      ]},
      { type: "reflection", prompt: "If the world listened, what would you say?" },
    ],
    interpret: (r) => pick(["World Builder", "Equity Fighter", "Future Architect"], r),
  },
  {
    questKey: "vision_q2",
    clusterSlug: "vision-for-a-better-world",
    clusterName: "Vision for a Better World",
    intro: "Let's deepen your vision for change.",
    interactions: [
      { type: "multi_select", prompt: "What kind of change do you want to create?", options: ["System reform", "Culture shift", "Individual power", "Tech innovation", "Community healing", "Education change"], minSelect: 2, maxSelect: 3 },
      { type: "visual_metaphor", prompt: "Your approach to change is like…", options: ["Planting seeds — quiet and patient", "Building something — visible and lasting", "Starting a fire — spreading fast", "Digging deep — finding the root"] },
      { type: "ranking", prompt: "What matters most for a better world?", options: ["Justice", "Creativity", "Health", "Knowledge"] },
      { type: "reflection", prompt: "What does the world need that only you can give?" },
    ],
    interpret: (r) => pick(["Seed Planter", "Change Builder", "Movement Starter"], r),
  },
  {
    questKey: "vision_q3",
    clusterSlug: "vision-for-a-better-world",
    clusterName: "Vision for a Better World",
    intro: "Let's connect your vision to who you are.",
    interactions: [
      { type: "card_pick", prompt: "Your vision is rooted in…", options: ["Personal experience", "Seeing potential in people", "Love for beauty and creation", "Understanding broken systems"] },
      { type: "multi_select", prompt: "How do you already contribute?", options: ["Through my work", "Through relationships", "Through creativity", "Through conversations", "Through example", "Through support"], minSelect: 2, maxSelect: 3 },
      { type: "energy_slider", prompt: "How much energy can you give to these?", sliderItems: ["Local action", "Building solutions", "Mentoring others"] },
      { type: "sentence_completion", prompt: "Complete this:", sentenceStem: "My small act that could ripple outward is" },
    ],
    interpret: (r) => pick(["Ripple Maker", "Rooted Vision", "Quiet Revolutionary"], r),
  },
  {
    questKey: "vision_q4",
    clusterSlug: "vision-for-a-better-world",
    clusterName: "Vision for a Better World",
    intro: "Let's crystallize your contribution.",
    interactions: [
      { type: "scenario", prompt: "In 20 years, you want to be remembered for…", options: ["Something I built", "People I helped grow", "A way of thinking I shared"] },
      { type: "multi_select", prompt: "What legacy matters most?", options: ["Creative works", "Relationships", "Systems changed", "Knowledge shared", "Communities built", "Lives transformed"], minSelect: 2, maxSelect: 3 },
      { type: "visual_metaphor", prompt: "Your impact style is like…", options: ["An architect — designing systems", "A gardener — nurturing growth", "A bridge — connecting worlds", "A torch — lighting the way"] },
      { type: "memory_flash", prompt: "Think of a moment when you made a real difference to someone.", memoryPrompt: "Remember a time when your actions truly mattered to another person." },
    ],
    interpret: (r) => pick(["Legacy Builder", "Impact Gardener", "Bridge Builder"], r),
  },

  // ===== IDEAL LIFE (4 quests) =====
  {
    questKey: "ideal_life_q1",
    clusterSlug: "ideal-life",
    clusterName: "Ideal Life",
    intro: "Let's paint the picture of your ideal day.",
    interactions: [
      { type: "visual_metaphor", prompt: "Your ideal morning feels like…", options: ["Sunrise — creative and fresh", "Forest — quiet and grounded", "Ocean — expansive and free", "City — buzzing with energy"] },
      { type: "multi_select", prompt: "What must your ideal life include?", options: ["Creative freedom", "Financial security", "Deep relationships", "Travel and adventure", "Meaningful work", "Peace and quiet"], minSelect: 2, maxSelect: 3 },
      { type: "ranking", prompt: "Order these by priority.", options: ["Location freedom", "Community", "Professional mastery", "Inner peace"] },
      { type: "reflection", prompt: "Describe one moment from your ideal future day." },
    ],
    interpret: (r) => pick(["Freedom Designer", "Balance Seeker", "Intentional Life"], r),
  },
  {
    questKey: "ideal_life_q2",
    clusterSlug: "ideal-life",
    clusterName: "Ideal Life",
    intro: "Let's explore the environment of your ideal life.",
    interactions: [
      { type: "card_pick", prompt: "Your ideal space feels like…", options: ["A creative studio full of light", "A cabin in nature", "A vibrant city", "A cozy home with loved ones"] },
      { type: "multi_select", prompt: "What elements define your ideal space?", options: ["Natural light", "Creative tools", "Beautiful objects", "Books everywhere", "Plants", "Quiet"], minSelect: 2, maxSelect: 3 },
      { type: "emoji_scale", prompt: "How close is your current space to ideal?", emojiOptions: [
        { emoji: "😢", label: "Far away" }, { emoji: "😐", label: "Getting there" }, { emoji: "🙂", label: "Close" }, { emoji: "😊", label: "Almost" }, { emoji: "✨", label: "Living it" }
      ]},
      { type: "sentence_completion", prompt: "Complete this:", sentenceStem: "I feel most like myself when I'm in" },
    ],
    interpret: (r) => pick(["Space Creator", "Environment Shaper", "Found My Place"], r),
  },
  {
    questKey: "ideal_life_q3",
    clusterSlug: "ideal-life",
    clusterName: "Ideal Life",
    intro: "Let's explore the relationships in your ideal life.",
    interactions: [
      { type: "multi_select", prompt: "What must your closest relationships have?", options: ["Intellectual spark", "Emotional safety", "Creative energy", "Shared values", "Growth focus", "Playfulness"], minSelect: 2, maxSelect: 3 },
      { type: "scenario", prompt: "Your ideal community is…", options: ["A small circle of deep thinkers", "A diverse network of creators", "A warm family-like group"] },
      { type: "ranking", prompt: "What matters most in relationships?", options: ["Depth over breadth", "Freedom within togetherness", "Mutual growth", "Unconditional acceptance"] },
      { type: "reflection", prompt: "What kind of relationship are you still searching for?" },
    ],
    interpret: (r) => pick(["Connection Builder", "Community Dreamer", "Belonging Seeker"], r),
  },
  {
    questKey: "ideal_life_q4",
    clusterSlug: "ideal-life",
    clusterName: "Ideal Life",
    intro: "Let's design the rhythm of your ideal life.",
    interactions: [
      { type: "card_pick", prompt: "Your ideal life rhythm is…", options: ["Structured creative blocks", "Fluid and responsive", "Seasonal — intense then rest", "Same beautiful routine daily"] },
      { type: "multi_select", prompt: "What rituals fill your ideal week?", options: ["Morning creative time", "Nature time", "Deep conversations", "Physical movement", "Learning something", "Quiet reflection"], minSelect: 2, maxSelect: 3 },
      { type: "energy_slider", prompt: "How would you split your time?", sliderItems: ["Deep work", "Play and exploration", "Rest and reflection"] },
      { type: "memory_flash", prompt: "Think of a day that felt perfect. What made it that way?", memoryPrompt: "Remember a day when everything felt right — the pace, the people, the place." },
    ],
    interpret: (r) => pick(["Found My Pace", "Balance Artist", "Flow Seeker"], r),
  },

  // ===== NATURAL TALENTS (4 quests) =====
  {
    questKey: "natural_talents_q1",
    clusterSlug: "natural-talents",
    clusterName: "Natural Talents",
    intro: "Let's uncover gifts you might take for granted.",
    interactions: [
      { type: "tap_resonates", prompt: "Tap the talents that feel natural to you.", words: ["Empathy", "Creativity", "Focus", "Leadership", "Intuition", "Pattern-seeing", "Calm", "Teaching", "Humor", "Adaptability"] },
      { type: "this_or_that", prompt: "This talent is…", optionA: "Something I was born with", optionB: "Something I built through experience" },
      { type: "emoji_scale", prompt: "How easily do your talents come to you?", emojiOptions: [
        { emoji: "😰", label: "Effort" }, { emoji: "😐", label: "Some work" }, { emoji: "🙂", label: "Fairly easy" }, { emoji: "😊", label: "Natural" }, { emoji: "✨", label: "Effortless" }
      ]},
      { type: "sentence_completion", prompt: "Complete this:", sentenceStem: "Something I can do that most people find hard is" },
    ],
    interpret: (r) => pick(["Natural Gift", "Easy Talent", "Born With It"], r),
  },
  {
    questKey: "natural_talents_q2",
    clusterSlug: "natural-talents",
    clusterName: "Natural Talents",
    intro: "Let's explore talents that show up without effort.",
    interactions: [
      { type: "scenario", prompt: "People say you have a gift for…", options: ["Making people comfortable", "Seeing solutions quickly", "Bringing ideas to life"] },
      { type: "multi_select", prompt: "Which feel effortless to you?", options: ["Understanding systems", "Creating beauty", "Sensing emotions", "Finding the right words", "Motivating others", "Spotting patterns"], minSelect: 2, maxSelect: 3 },
      { type: "visual_metaphor", prompt: "Your talent is like…", options: ["Water — it flows naturally", "A magnet — it draws people", "A lens — it brings clarity", "A seed — it grows without force"] },
      { type: "sentence_completion", prompt: "Complete this:", sentenceStem: "The talent I use daily without thinking is" },
    ],
    interpret: (r) => pick(["Invisible Gift", "Natural Flow", "Effortless Strength"], r),
  },
  {
    questKey: "natural_talents_q3",
    clusterSlug: "natural-talents",
    clusterName: "Natural Talents",
    intro: "Let's discover how your talents connect to your identity.",
    interactions: [
      { type: "card_pick", prompt: "Your core talent serves the world by…", options: ["Making things clearer", "Making people feel seen", "Making the impossible possible", "Making beauty where there was none"] },
      { type: "multi_select", prompt: "When has your talent surprised you?", options: ["In a crisis I stayed calm", "In a creative flow I couldn't stop", "In a conversation that went deep", "A solution came instantly", "Intuitive knowing", "Leading unexpectedly"], minSelect: 2, maxSelect: 3 },
      { type: "energy_slider", prompt: "How much joy do these talents bring?", sliderItems: ["Teaching or guiding", "Creating or building", "Connecting or healing"] },
      { type: "memory_flash", prompt: "Think of a time your talent showed up when you needed it most.", memoryPrompt: "Remember a moment when your natural ability saved the day or surprised you." },
    ],
    interpret: (r) => pick(["Gift Carrier", "Surprise Talent", "Joy Source"], r),
  },
  {
    questKey: "natural_talents_q4",
    clusterSlug: "natural-talents",
    clusterName: "Natural Talents",
    intro: "Let's honor the talents that make you, you.",
    interactions: [
      { type: "multi_select", prompt: "Which talents are you ready to use more?", options: ["Creative vision", "Emotional depth", "Strategic thinking", "Healing presence", "Storytelling", "Problem-solving"], minSelect: 2, maxSelect: 3 },
      { type: "scenario", prompt: "If you fully embraced your greatest talent…", options: ["I'd start something bold", "I'd deepen what exists", "I'd help others find theirs"] },
      { type: "card_pick", prompt: "Your talent is most needed in…", options: ["Creative spaces", "Healing spaces", "Learning spaces", "Building spaces"] },
      { type: "reflection", prompt: "What would change if you stopped hiding your greatest gift?" },
    ],
    interpret: (r) => pick(["Unleashed", "Gift Multiplier", "Talent Catalyst"], r),
  },

  // ===== CHILDHOOD SIGNALS (4 quests) =====
  {
    questKey: "childhood_signals_q1",
    clusterSlug: "childhood-signals",
    clusterName: "Childhood Signals",
    intro: "Your childhood holds clues about your true self.",
    interactions: [
      { type: "visual_metaphor", prompt: "As a child, your world was like…", options: ["A playground — always exploring", "A library — always imagining", "A stage — always performing", "A workshop — always building"] },
      { type: "tap_resonates", prompt: "Tap the childhood traits that still show up today.", words: ["Curiosity", "Stubbornness", "Empathy", "Creativity", "Independence", "Sensitivity", "Energy", "Shyness", "Boldness", "Wonder"] },
      { type: "this_or_that", prompt: "As a child you were more…", optionA: "Outdoors and active", optionB: "Indoors and imaginative" },
      { type: "reflection", prompt: "What did you love doing as a child that you still do in some form today?" },
    ],
    interpret: (r) => pick(["Inner Child Signal", "Curiosity Root", "Original Dreamer"], r, "life_imprint"),
  },
  {
    questKey: "childhood_signals_q2",
    clusterSlug: "childhood-signals",
    clusterName: "Childhood Signals",
    intro: "Let's uncover the early signals on your path.",
    interactions: [
      { type: "multi_select", prompt: "What were you drawn to before anyone told you?", options: ["Drawing or painting", "Stories and books", "Animals and nature", "Machines and gadgets", "Music and rhythm", "People and relationships"], minSelect: 2, maxSelect: 3 },
      { type: "card_pick", prompt: "Your childhood self was most like…", options: ["The dreamer — always imagining", "The builder — always making", "The explorer — always questioning", "The caretaker — always helping"] },
      { type: "ranking", prompt: "Which childhood experiences lasted longest?", options: ["A moment of wonder", "Feeling truly seen", "Overcoming fear", "Creating something"] },
      { type: "memory_flash", prompt: "Think of a childhood memory that still gives you goosebumps.", memoryPrompt: "Close your eyes and remember a moment from childhood that still moves you." },
    ],
    interpret: (r) => pick(["Early Signal", "Origin Story", "First Wonder"], r, "life_imprint"),
  },
  {
    questKey: "childhood_signals_q3",
    clusterSlug: "childhood-signals",
    clusterName: "Childhood Signals",
    intro: "Let's explore how childhood shaped your adult patterns.",
    interactions: [
      { type: "scenario", prompt: "As a child, you learned to cope by…", options: ["Being the responsible one", "Being the creative one", "Being the peacemaker"] },
      { type: "multi_select", prompt: "What childhood patterns still run?", options: ["Seeking approval", "Needing to be useful", "Avoiding conflict", "Trying to fix things", "Performing for love", "Staying invisible"], minSelect: 2, maxSelect: 3 },
      { type: "emoji_scale", prompt: "How much do childhood patterns still affect you?", emojiOptions: [
        { emoji: "😊", label: "Barely" }, { emoji: "🙂", label: "A little" }, { emoji: "😐", label: "Sometimes" }, { emoji: "😰", label: "Often" }, { emoji: "😢", label: "A lot" }
      ]},
      { type: "sentence_completion", prompt: "Complete this:", sentenceStem: "What I would tell my childhood self is" },
    ],
    interpret: (r) => pick(["Old Pattern", "Inner Protector", "Childhood Echo"], r, "shadow"),
  },
  {
    questKey: "childhood_signals_q4",
    clusterSlug: "childhood-signals",
    clusterName: "Childhood Signals",
    intro: "Let's reconnect with the wisdom of your younger self.",
    interactions: [
      { type: "multi_select", prompt: "What childhood qualities do you want back?", options: ["Fearless curiosity", "Uninhibited creativity", "Easy joy", "Trust in others", "Sense of wonder", "Playfulness"], minSelect: 2, maxSelect: 3 },
      { type: "scenario", prompt: "Your inner child needs you to…", options: ["Play more", "Trust your instincts", "Stop being so hard on yourself"] },
      { type: "energy_slider", prompt: "How connected are you to these?", sliderItems: ["Playfulness", "Wonder", "Trust"] },
      { type: "memory_flash", prompt: "Think of a childhood joy that could transform your life today.", memoryPrompt: "Remember a simple joy from childhood — playing, exploring, creating — that made you feel alive." },
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
      { type: "tap_resonates", prompt: "Tap the words others use about you.", words: ["Thoughtful", "Driven", "Creative", "Kind", "Intense", "Reliable", "Inspiring", "Brave", "Warm", "Honest"] },
      { type: "this_or_that", prompt: "Others see you more as…", optionA: "A creator — you build new things", optionB: "A connector — you bring people together" },
      { type: "card_pick", prompt: "Which reflection surprises you most?", options: ["People find me inspiring", "People see me as brave", "People feel safe with me", "People admire my ideas"] },
      { type: "reflection", prompt: "What do people consistently say about you that you are still learning to believe?" },
    ],
    interpret: (r) => pick(["Hidden Leader", "Mirror Insight", "Community Pillar"], r),
  },
  {
    questKey: "external_reflections_q2",
    clusterSlug: "external-reflections",
    clusterName: "External Reflections",
    intro: "Let's explore how you see yourself vs. how others see you.",
    interactions: [
      { type: "scenario", prompt: "Others see your strength as…", options: ["Bigger than you think", "Different from what you'd name", "Something you take for granted"] },
      { type: "multi_select", prompt: "What do others value that you dismiss?", options: ["My patience", "My insight", "My energy", "My warmth", "My honesty", "My stability"], minSelect: 2, maxSelect: 3 },
      { type: "emoji_scale", prompt: "How well do you accept compliments?", emojiOptions: [
        { emoji: "😶", label: "I deflect" }, { emoji: "😐", label: "Awkwardly" }, { emoji: "🙂", label: "Getting better" }, { emoji: "😊", label: "Pretty well" }, { emoji: "💪", label: "I own it" }
      ]},
      { type: "reflection", prompt: "What compliment do you always deflect, and why?" },
    ],
    interpret: (r) => pick(["Blind Spot Found", "Hidden Impact", "Self-Perception Gap"], r),
  },
  {
    questKey: "external_reflections_q3",
    clusterSlug: "external-reflections",
    clusterName: "External Reflections",
    intro: "Let's look at what you show vs. what you feel.",
    interactions: [
      { type: "multi_select", prompt: "What do you show that differs from how you feel?", options: ["Confidence (but I doubt)", "Calm (but I'm overwhelmed)", "Strength (but I feel fragile)", "Independence (but I need support)", "Happiness (but I feel lost)", "Certainty (but I'm figuring it out)"], minSelect: 2, maxSelect: 3 },
      { type: "ranking", prompt: "Which do you mask most?", options: ["Vulnerability", "Uncertainty", "Need for connection", "Fear of failure"] },
      { type: "visual_metaphor", prompt: "Your public self is like…", options: ["Armor — protective but heavy", "A stage — performing well", "A filter — showing only the best", "A window — mostly transparent"] },
      { type: "sentence_completion", prompt: "Complete this:", sentenceStem: "The part of me I'd like to stop hiding is" },
    ],
    interpret: (r) => pick(["Mask Remover", "Hidden Depth", "Getting Real"], r, "shadow"),
  },
  {
    questKey: "external_reflections_q4",
    clusterSlug: "external-reflections",
    clusterName: "External Reflections",
    intro: "Let's integrate what others see with who you are.",
    interactions: [
      { type: "card_pick", prompt: "The feedback that shaped you most was…", options: ["Someone believed in me first", "Someone challenged me to grow", "Someone showed me my blind spot", "Someone thanked me unexpectedly"] },
      { type: "multi_select", prompt: "What truths are you ready to own?", options: ["I am a leader", "I am creative", "I am deeply caring", "I am resilient", "I am wise", "I am brave"], minSelect: 2, maxSelect: 3 },
      { type: "energy_slider", prompt: "How ready are you to own these?", sliderItems: ["My strength", "My sensitivity", "My uniqueness"] },
      { type: "memory_flash", prompt: "Think of someone who saw something in you before you did.", memoryPrompt: "Remember a person who believed in you or named a quality you hadn't recognized yet." },
    ],
    interpret: (r) => pick(["Truth Owner", "Integrated Self", "Owning It"], r),
  },

  // ===== EXPERIMENTS (4 quests) =====
  {
    questKey: "experiments_q1",
    clusterSlug: "experiments",
    clusterName: "Experiments",
    intro: "Let's explore your relationship with trying new things.",
    interactions: [
      { type: "this_or_that", prompt: "Facing something new, you usually…", optionA: "Dive in headfirst", optionB: "Research everything first" },
      { type: "tap_resonates", prompt: "Tap the experiments you've tried.", words: ["Side project", "New skill", "Routine change", "Solo travel", "Content creation", "Career pivot", "Started a business", "Moved countries", "Learned an instrument", "Public speaking"] },
      { type: "emoji_scale", prompt: "How comfortable are you with uncertainty?", emojiOptions: [
        { emoji: "😰", label: "Terrified" }, { emoji: "😐", label: "Uneasy" }, { emoji: "🙂", label: "Okay" }, { emoji: "😊", label: "Comfortable" }, { emoji: "🤯", label: "I thrive in it" }
      ]},
      { type: "reflection", prompt: "What experiment taught you the most about yourself?" },
    ],
    interpret: (r) => pick(["Bold Experimenter", "Careful Explorer", "Resilient Tester"], r),
  },
  {
    questKey: "experiments_q2",
    clusterSlug: "experiments",
    clusterName: "Experiments",
    intro: "Let's explore how you handle the unknown.",
    interactions: [
      { type: "card_pick", prompt: "Your relationship with risk is…", options: ["I thrive in it", "I calculate first", "I push through fear", "I prefer small safe experiments"] },
      { type: "multi_select", prompt: "What holds you back from trying more?", options: ["Fear of wasting time", "Fear of judgment", "Lack of clarity", "Too many options", "Not enough support", "Perfectionism"], minSelect: 2, maxSelect: 3 },
      { type: "visual_metaphor", prompt: "Your experimenting style is like…", options: ["A lab — controlled tests", "A playground — playful tries", "A cliff jump — all or nothing", "A garden — patient planting"] },
      { type: "memory_flash", prompt: "Think of an experiment you're afraid to try.", memoryPrompt: "Imagine the one bold experiment that could change everything if you tried it." },
    ],
    interpret: (r) => pick(["Risk Dancer", "Fear Breaker", "Learning by Doing"], r),
  },
  {
    questKey: "experiments_q3",
    clusterSlug: "experiments",
    clusterName: "Experiments",
    intro: "Let's discover your experimenting style.",
    interactions: [
      { type: "multi_select", prompt: "What experiments excite you most?", options: ["Creative expression", "Business ideas", "Lifestyle changes", "Relationship dynamics", "Learning challenges", "Physical adventures"], minSelect: 2, maxSelect: 3 },
      { type: "scenario", prompt: "Your ideal experiment would…", options: ["Be something no one has tried", "Test my limits", "Solve a real problem"] },
      { type: "energy_slider", prompt: "How much energy do you have for these?", sliderItems: ["Short sprints", "Long commitments", "Spontaneous pivots"] },
      { type: "sentence_completion", prompt: "Complete this:", sentenceStem: "The bravest experiment I've run on my own life was" },
    ],
    interpret: (r) => pick(["Pioneer Spirit", "Limit Tester", "Life Hacker"], r),
  },
  {
    questKey: "experiments_q4",
    clusterSlug: "experiments",
    clusterName: "Experiments",
    intro: "Let's map your experimental journey forward.",
    interactions: [
      { type: "card_pick", prompt: "Your next experiment should focus on…", options: ["Creativity and expression", "Career and purpose", "Relationships", "Inner growth"] },
      { type: "multi_select", prompt: "What would you need?", options: ["Time and space", "A supportive community", "Expert guidance", "Financial runway", "Creative tools", "Permission to fail"], minSelect: 2, maxSelect: 3 },
      { type: "ranking", prompt: "Rank your experiment priorities.", options: ["Speed of learning", "Depth of experience", "Impact on others", "Personal transformation"] },
      { type: "reflection", prompt: "If failure was impossible, what would you start tomorrow?" },
    ],
    interpret: (r) => pick(["Future Experimenter", "Impact Tester", "Ready to Try"], r),
  },
];

// ===== ONBOARDING QUESTS (14 guided quests in fixed sequence) =====
// DO NOT REORDER — sequence is intentional and feeds AI personalization for mentors + Future Self.
// Phase 1 (1–5): Identity core — who they are and what drives/blocks them
// Phase 2 (6–9): Depth layer — values, inspiration, roots, growth moments
// Phase 3 (10–14): Purpose + direction — who they serve, how they contribute, their vision
export const ONBOARDING_QUEST_SEQUENCE: string[] = [
  "skills",               // 1. What they've built — capability baseline
  "passions",             // 2. What drives them — motivational fuel
  "personal-frustrations",// 3. What blocks them — shadow (makes quest 4 answers more honest)
  "natural-talents",      // 4. What comes naturally — answered after shadow is activated
  "life-events",          // 5. Their story — WHY behind quests 1–4
  "values",               // 6. What they stand for — filter for all mentor advice from here on
  "inspirations",         // 7. Who shaped them — mirrors their aspirational identity
  "childhood-signals",    // 8. Deep roots — early programming, only works after trust is built
  "aha-moments",          // 9. How they grow — rich after 8 quests of self-reflection
  "who-i-serve",          // 10. Who they want to help — bridge to project + creator system
  "experiments",          // 11. What they've tried — grounds vision in real experience
  "ideal-life",           // 12. Personal vision — what their fulfilled life looks like
  "external-reflections", // 13. What others see in them — often surprising, deepens self-awareness
  "vision-for-a-better-world", // 14. World vision — purpose beyond self, closes the arc
];

export const ONBOARDING_QUESTS: AtlasQuestDefinition[] = [
  // 1. Skills — identity
  {
    questKey: "onboarding_skills",
    clusterSlug: "skills",
    clusterName: "Skills",
    intro: "Now let's find what you can actually do well.",
    interactions: [
      { type: "tap_resonates", prompt: "Tap all skills that feel like you.", words: ["Organizing", "Creating", "Listening", "Analyzing", "Leading", "Teaching", "Writing", "Designing", "Negotiating", "Storytelling", "Problem-solving", "Connecting people"] },
      { type: "ranking", prompt: "Rank your top 3 by confidence.", options: ["Communication", "Creative thinking", "Strategic planning", "Understanding people"] },
      { type: "scenario", prompt: "In a team you naturally become…", options: ["The planner", "The idea generator", "The people connector", "The executor", "The problem solver"] },
      { type: "reflection", prompt: "What are you naturally good at, even without trying too hard?" },
    ],
    interpret: (r) => pick(["Connects People Naturally", "Breaks Down Any System", "Understands and Guides Others"], r),
  },
  // 2. Passions — energy
  {
    questKey: "onboarding_passions",
    clusterSlug: "passions",
    clusterName: "Passions",
    intro: "Let's start with what lights you up.",
    interactions: [
      { type: "visual_metaphor", prompt: "You at your best feel most like…", options: ["A bonfire — warm and magnetic", "A lightning bolt — intense and sudden", "A steady candle — calm and focused", "A sunrise — growing and hopeful"] },
      { type: "tap_resonates", prompt: "Tap everything that resonates.", words: ["Create", "Connect", "Teach", "Build", "Explore", "Heal", "Lead", "Design", "Organize"] },
      { type: "emoji_scale", prompt: "How alive do you feel doing what you love?", emojiOptions: [
        { emoji: "😐", label: "Okay" }, { emoji: "🙂", label: "Good" }, { emoji: "😊", label: "Great" }, { emoji: "😄", label: "On fire" }, { emoji: "🤯", label: "Unstoppable" }
      ]},
      { type: "reflection", prompt: "What do you naturally enjoy doing, even if no one asks you to?" },
    ],
    interpret: (r) => pick(["Creates to Help Others", "Loves Exploring Ideas", "Brings Ideas Into Reality"], r),
  },
  // 3. Personal Frustrations — tension
  {
    questKey: "onboarding_frustrations",
    clusterSlug: "personal-frustrations",
    clusterName: "Personal Frustrations",
    intro: "What frustrates you most often points to what you care about most.",
    interactions: [
      { type: "multi_select", prompt: "What frustrates you most?", options: ["Wasted potential", "Lack of connection", "Broken systems", "People not growing", "Creativity crushed", "Apathy", "People living unlived lives"], minSelect: 2, maxSelect: 3 },
      { type: "emoji_scale", prompt: "How strongly does this frustration burn?", emojiOptions: [
        { emoji: "😐", label: "Mild" }, { emoji: "😤", label: "Annoying" }, { emoji: "😠", label: "Intense" }, { emoji: "🔥", label: "Burning" }, { emoji: "💥", label: "Explosive" }
      ]},
      { type: "card_pick", prompt: "Which one feels most personal?", options: ["People not reaching their potential", "Systems that fail people", "Creativity being crushed", "Lack of real connection"] },
      { type: "reflection", prompt: "What problem would you solve if you had unlimited resources, and why does it matter to you personally?" },
    ],
    interpret: (r) => pick(["Sees Wasted Potential", "Frustrated by Unlived Lives", "Builds for Those Who Are Lost"], r),
  },
  // 4. Experiments — growth edge
  {
    questKey: "onboarding_experiments",
    clusterSlug: "experiments",
    clusterName: "Experiments",
    intro: "Let's explore what you've tried and what you learned.",
    interactions: [
      { type: "tap_resonates", prompt: "Tap what you've done.", words: ["Built", "Launched", "Failed", "Pivoted", "Learned", "Created", "Tried", "Quit", "Scaled", "Started over"] },
      { type: "this_or_that", prompt: "Your most important experiment…", optionA: "Succeeded beyond expectations", optionB: "Taught me something more valuable than success" },
      { type: "sentence_completion", prompt: "Complete this:", sentenceStem: "The experiment I learned the most from was" },
      { type: "reflection", prompt: "What did your most important experiment teach you that you now carry into everything you build?" },
    ],
    interpret: (r) => pick(["Left Safety and Discovered What Matters", "Built Something From Nothing", "Learned to Shift Energy"], r),
  },
  // 5. Aha Moments — cognitive depth
  {
    questKey: "onboarding_aha_moments",
    clusterSlug: "aha-moments",
    clusterName: "Aha Moments",
    intro: "Let's find the moments that changed your direction.",
    interactions: [
      { type: "visual_metaphor", prompt: "Your biggest insight felt like…", options: ["A lightning bolt — sudden clarity", "A door opening unexpectedly", "A broken road becoming a new path", "Seeing your reflection clearly for the first time"] },
      { type: "memory_flash", prompt: "Think of a moment when everything suddenly made sense.", memoryPrompt: "Where were you? What happened? What shifted?" },
      { type: "sentence_completion", prompt: "Complete this:", sentenceStem: "The moment I stopped seeing the world the same way was when" },
      { type: "reflection", prompt: "Describe a specific moment when something clicked and you saw yourself or the world differently. Where were you, what happened, and what changed?" },
    ],
    interpret: (r) => pick(["Stopped Judging After That Moment", "Forced Pause Created Clarity", "Realized What I Actually Wanted"], r, "life_imprint"),
  },
  // 6. Life Events — grounding
  {
    questKey: "onboarding_life_events",
    clusterSlug: "life-events",
    clusterName: "Life Events",
    intro: "Let's ground everything in what actually happened.",
    interactions: [
      { type: "multi_select", prompt: "Which moments feel most defining?", options: ["A move", "A relationship shift", "A career change", "A loss", "A success", "A moment of clarity"], minSelect: 2, maxSelect: 3 },
      { type: "ranking", prompt: "Rank these by emotional impact.", options: ["The biggest risk I took", "The hardest loss", "The proudest moment", "The most unexpected turn"] },
      { type: "then_vs_now", prompt: "How did your biggest life change shape you?", thenLabel: "Who I was before my biggest change", nowLabel: "Who I became after it" },
      { type: "reflection", prompt: "In one sentence, what do your biggest life moments have in common? What is the thread that runs through them?" },
    ],
    interpret: (r) => pick(["Built Something Every Time Life Paused", "Always Returned to People", "Moved Toward Freedom Every Time"], r, "life_imprint"),
  },
  // 7. Natural Talents — direction
  {
    questKey: "onboarding_natural_talents",
    clusterSlug: "natural-talents",
    clusterName: "Natural Talents",
    intro: "Let's uncover the gifts you take for granted.",
    interactions: [
      { type: "tap_resonates", prompt: "Tap what feels natural to you.", words: ["Reads people", "Sees patterns", "Simplifies complexity", "Builds systems", "Holds space", "Generates ideas", "Connects dots", "Stays calm under pressure"] },
      { type: "sentence_completion", prompt: "Complete this:", sentenceStem: "Something I can do that most people find hard is" },
      { type: "this_or_that", prompt: "Your strongest abilities feel…", optionA: "Something I was born with", optionB: "Something I built through experience" },
      { type: "reflection", prompt: "What ability do you have that feels so natural you sometimes forget it is a skill?" },
    ],
    interpret: (r) => pick(["Understands Systems Deeply", "Reads a Room Instantly", "Connects Ideas No One Else Connects"], r),
  },
  // 8. Inspirations — deeper values
  {
    questKey: "onboarding_inspirations",
    clusterSlug: "inspirations",
    clusterName: "Inspirations",
    intro: "Who and what shaped how you think and create?",
    interactions: [
      { type: "multi_select", prompt: "Where does your inspiration come from?", options: ["A family member", "A creator", "A thinker", "A builder", "A leader", "A historical figure"], minSelect: 1, maxSelect: 3 },
      { type: "sentence_completion", prompt: "Complete this:", sentenceStem: "The person who most shaped how I think about my work is" },
      { type: "this_or_that", prompt: "You're more inspired by…", optionA: "People who built things", optionB: "People who changed how others think" },
      { type: "reflection", prompt: "Who is someone you deeply admire, and what specific quality or way of living do you wish you had more of yourself? What did they teach you just by existing?" },
    ],
    interpret: (r) => pick(["Inspired by Legacy of Building for Others", "Everything Can Be Connected", "Admires the Creator Who Built a Universe"], r),
  },
  // 9. Values — reinforces identity
  {
    questKey: "onboarding_values",
    clusterSlug: "values",
    clusterName: "Values",
    intro: "What do you stand for, no matter what?",
    interactions: [
      { type: "multi_select", prompt: "Which values won't you compromise?", options: ["Freedom", "Family", "Impact", "Growth", "Connection", "Integrity", "Creativity", "Service", "Depth", "Authenticity"], minSelect: 2, maxSelect: 4 },
      { type: "this_or_that", prompt: "Quick gut reaction:", optionA: "Freedom", optionB: "Security" },
      { type: "ranking", prompt: "What guides your biggest decisions?", options: ["My gut feeling", "My values", "Other people's needs", "Long-term vision"] },
      { type: "reflection", prompt: "What matters so much to you that you would not compromise on it, even when it is hard?" },
    ],
    interpret: (r) => pick(["Fights for Freedom", "Family and Legacy Drive Everything", "Connection Is Non-Negotiable"], r),
  },
  // 10. Ideal Life — connects to reality
  {
    questKey: "onboarding_ideal_life",
    clusterSlug: "ideal-life",
    clusterName: "Ideal Life",
    intro: "What does your fulfilled life actually look like?",
    interactions: [
      { type: "visual_metaphor", prompt: "Your ideal life environment…", options: ["A creative studio full of light", "A cabin in nature", "A vibrant city", "A cozy home with family", "Traveling the world"] },
      { type: "multi_select", prompt: "Non-negotiable conditions:", options: ["Freedom", "Family", "Meaningful work", "Financial stability", "Creative expression", "Deep relationships", "Impact"], minSelect: 2, maxSelect: 4 },
      { type: "emoji_scale", prompt: "How close is your current life to ideal?", emojiOptions: [
        { emoji: "😢", label: "Far away" }, { emoji: "😐", label: "Getting there" }, { emoji: "🙂", label: "Close" }, { emoji: "😊", label: "Almost" }, { emoji: "✨", label: "Living it" }
      ]},
      { type: "reflection", prompt: "Describe what a perfect ordinary week looks like in your ideal life. What are you doing, where are you, and how does it feel?" },
    ],
    interpret: (r) => pick(["Most Alive When Creating for Others", "Impact at Scale While Staying Free", "Build Family and Keep Building Things"], r),
  },
  // 11. Childhood Signals
  {
    questKey: "onboarding_childhood",
    clusterSlug: "childhood-signals",
    clusterName: "Childhood Signals",
    intro: "Let's go back to who you were before the world told you who to be.",
    interactions: [
      { type: "multi_select", prompt: "What did you love doing as a child?", options: ["Playing sport", "Making things", "Telling stories", "Organizing", "Exploring", "Performing", "Connecting with people"], minSelect: 2, maxSelect: 3 },
      { type: "sentence_completion", prompt: "Complete this:", sentenceStem: "Someone in my family whose way of living I admire is" },
      { type: "emoji_scale", prompt: "How connected is your childhood self to who you are today?", emojiOptions: [
        { emoji: "😐", label: "Very different" }, { emoji: "🙂", label: "Some overlap" }, { emoji: "😊", label: "Connected" }, { emoji: "😄", label: "Very connected" }, { emoji: "🤯", label: "Exactly the same" }
      ]},
      { type: "reflection", prompt: "What did you love doing as a child that you still do in some form today, and is there someone from your family whose skill or way of living you carry with you?" },
    ],
    interpret: (r) => pick(["Loved Organizing Games as a Kid", "Learned Legacy Through Family", "Built Things From Nothing Since Childhood"], r, "life_imprint"),
  },
  // 12. External Reflections
  {
    questKey: "onboarding_external_reflections",
    clusterSlug: "external-reflections",
    clusterName: "External Reflections",
    intro: "Sometimes others see what we cannot see in ourselves.",
    interactions: [
      { type: "multi_select", prompt: "People come to you for…", options: ["Advice", "Problem solving", "Creative ideas", "Emotional support", "Leadership", "Organizing", "Connection", "Perspective"], minSelect: 2, maxSelect: 3 },
      { type: "sentence_completion", prompt: "Complete this:", sentenceStem: "Something people compliment me on that still surprises me is" },
      { type: "this_or_that", prompt: "Others see you more as…", optionA: "A creator — you build new things", optionB: "A connector — you bring people together" },
      { type: "reflection", prompt: "What do people usually come to you for, and what do they say about you that you still find hard to fully believe?" },
    ],
    interpret: (r) => pick(["Creates Space for People", "People Come When Things Fall Apart", "Recognized as the One Who Connects"], r),
  },
  // 10. Who I Serve — bridge to project + creator system
  {
    questKey: "onboarding_who_i_serve",
    clusterSlug: "who-i-serve",
    clusterName: "Who I Serve",
    intro: "You've mapped who you are. Now let's discover who you feel called to help.",
    interactions: [
      { type: "multi_select", prompt: "Who do you feel most drawn to help?", options: ["People who feel lost", "Creators without direction", "Entrepreneurs starting out", "People without mentors", "Families", "Young professionals", "Kids", "People in transition"], minSelect: 1, maxSelect: 3 },
      { type: "card_pick", prompt: "Why do you care about this group?", options: ["I was once in their shoes", "I see their potential clearly", "The world overlooks them", "I have exactly what they need"] },
      { type: "sentence_completion", prompt: "Complete this:", sentenceStem: "The person I most want to help is someone who" },
      { type: "reflection", prompt: "Who do you feel most called to help, and why them specifically? What do you understand about them that most people miss?" },
    ],
    interpret: (r) => pick(["Feels Called to Help Others Find Direction", "Drawn to Supporting the Overlooked", "Wants to Help People Grow"], r),
  },
  // 14. Vision for a Better World
  {
    questKey: "onboarding_vision",
    clusterSlug: "vision-for-a-better-world",
    clusterName: "Vision for a Better World",
    intro: "What does the world need more of?",
    interactions: [
      { type: "card_pick", prompt: "The world needs more…", options: ["People finding purpose", "Families connected", "Conscious creators", "Compassion", "Meaningful work", "Human connection"] },
      { type: "sentence_completion", prompt: "Complete this:", sentenceStem: "The world would be better if everyone" },
      { type: "this_or_that", prompt: "Change starts…", optionA: "Inside the individual first", optionB: "In the systems around us" },
      { type: "reflection", prompt: "What does the world need more of that you are trying to contribute to, and what would it look like if your vision came true?" },
    ],
    interpret: (r) => pick(["World Where Everyone Finds Their Gift", "Building the System That Helps People Wake Up", "Everyone Deserves a Mentor"], r),
  },
  // ===== WHO I SERVE (4 quests) =====
  {
    questKey: "who_i_serve_q1",
    clusterSlug: "who-i-serve",
    clusterName: "Who I Serve",
    intro: "Let's discover who you feel most called to help.",
    interactions: [
      { type: "multi_select", prompt: "Who do you feel drawn to help?", options: ["Kids", "Creators", "Entrepreneurs", "Families", "People who feel lost", "People without mentors", "Young professionals", "Parents"], minSelect: 1, maxSelect: 3 },
      { type: "emoji_scale", prompt: "How strong is this pull?", emojiOptions: [
        { emoji: "😐", label: "Mild" }, { emoji: "🙂", label: "Real" }, { emoji: "😊", label: "Strong" }, { emoji: "😄", label: "Deep" }, { emoji: "🔥", label: "It drives me" }
      ]},
      { type: "scenario", prompt: "Why do you care about this group?", options: ["I was once in their shoes", "I see their potential", "The world neglects them"] },
      { type: "reflection", prompt: "Who do you feel most called to help, and why them specifically?" },
    ],
    interpret: (r) => pick(["Feels Called to Help Others Find Direction", "Drawn to Supporting the Overlooked", "Wants to Help People Grow"], r),
  },
  {
    questKey: "who_i_serve_q2",
    clusterSlug: "who-i-serve",
    clusterName: "Who I Serve",
    intro: "Let's understand your natural empathy.",
    interactions: [
      { type: "card_pick", prompt: "Who do you understand better than most?", options: ["People starting over", "People with big dreams and no plan", "People who care too much", "People who feel stuck"] },
      { type: "sentence_completion", prompt: "Complete this:", sentenceStem: "The group of people I understand best is" },
      { type: "this_or_that", prompt: "You help people by…", optionA: "Helping them see what they already have", optionB: "Giving them tools they didn't know they needed" },
      { type: "reflection", prompt: "Think of someone you once helped. What were they struggling with, and what did you give them?" },
    ],
    interpret: (r) => pick(["Understands the Stuck", "Sees Potential in Others", "Natural Supporter"], r),
  },
  {
    questKey: "who_i_serve_q3",
    clusterSlug: "who-i-serve",
    clusterName: "Who I Serve",
    intro: "Let's explore who needs what you have.",
    interactions: [
      { type: "visual_metaphor", prompt: "Your ideal audience feels like…", options: ["Lost travelers who need a compass", "Builders who need better tools", "Artists who need permission", "Leaders who need support"] },
      { type: "multi_select", prompt: "What do they need most?", options: ["Clarity", "Confidence", "Tools", "Community", "Mentorship", "Permission to start"], minSelect: 2, maxSelect: 3 },
      { type: "memory_flash", prompt: "Think of a time you helped someone who really needed it.", memoryPrompt: "Who was it? What did they need? What happened after?" },
      { type: "reflection", prompt: "What group of people would you most like to positively impact with your work?" },
    ],
    interpret: (r) => pick(["Wants to Guide Lost Travelers", "Builds Tools for Creators", "Gives Permission to Start"], r),
  },
  {
    questKey: "who_i_serve_q4",
    clusterSlug: "who-i-serve",
    clusterName: "Who I Serve",
    intro: "Let's connect your story to your audience.",
    interactions: [
      { type: "this_or_that", prompt: "You feel protective of…", optionA: "People who were like your younger self", optionB: "People who face challenges you understand deeply" },
      { type: "ranking", prompt: "Rank by how much this drives you.", options: ["Helping individuals grow", "Fixing broken systems", "Creating tools for many", "Being there for one person deeply"] },
      { type: "sentence_completion", prompt: "Complete this:", sentenceStem: "The person I was once in their position and could now help is" },
      { type: "reflection", prompt: "Who was once in your position that you could now help, and what would you want to give them?" },
    ],
    interpret: (r) => pick(["Helps Who I Once Was", "Wants to Fix What Broke Me", "Gives What I Never Had"], r),
  },

  // ===== HOW I CREATE IMPACT (4 quests) =====
  {
    questKey: "how_i_create_impact_q1",
    clusterSlug: "how-i-create-impact",
    clusterName: "How I Create Impact",
    intro: "Let's discover how you naturally create change.",
    interactions: [
      { type: "card_pick", prompt: "When someone needs help, you naturally…", options: ["Listen deeply and ask questions", "Create a plan or system", "Share a story or insight", "Build something they can use"] },
      { type: "emoji_scale", prompt: "How natural does helping feel?", emojiOptions: [
        { emoji: "😐", label: "I try" }, { emoji: "🙂", label: "Comes easy" }, { emoji: "😊", label: "Second nature" }, { emoji: "😄", label: "It's who I am" }, { emoji: "🔥", label: "Can't stop" }
      ]},
      { type: "multi_select", prompt: "Your way of creating impact:", options: ["Teaching", "Building", "Connecting", "Creating experiences", "Writing", "Leading"], minSelect: 2, maxSelect: 3 },
      { type: "reflection", prompt: "How do you naturally help people when they need you? What do you actually do?" },
    ],
    interpret: (r) => pick(["Creates Through Teaching", "Builds Systems for Others", "Connects People Naturally"], r),
  },
  {
    questKey: "how_i_create_impact_q2",
    clusterSlug: "how-i-create-impact",
    clusterName: "How I Create Impact",
    intro: "Let's explore your contribution style.",
    interactions: [
      { type: "scenario", prompt: "If you could build something to help others, it would be…", options: ["A tool that makes their life easier", "A community where they belong", "A system that guides them step by step"] },
      { type: "visual_metaphor", prompt: "Your impact style is like…", options: ["A bridge — connecting worlds", "A lighthouse — guiding from a distance", "A garden — growing things patiently", "A spark — igniting others"] },
      { type: "sentence_completion", prompt: "Complete this:", sentenceStem: "The way I help people most is by" },
      { type: "reflection", prompt: "What do people leave with after interacting with you? What's different for them?" },
    ],
    interpret: (r) => pick(["Bridge Between Worlds", "Guides from a Distance", "Grows Things Patiently"], r),
  },
  {
    questKey: "how_i_create_impact_q3",
    clusterSlug: "how-i-create-impact",
    clusterName: "How I Create Impact",
    intro: "Let's find your unique form of contribution.",
    interactions: [
      { type: "this_or_that", prompt: "You create impact by…", optionA: "Making complex things simple", optionB: "Making invisible things visible" },
      { type: "multi_select", prompt: "What role do you naturally take?", options: ["The teacher", "The builder", "The connector", "The protector", "The creator", "The guide"], minSelect: 1, maxSelect: 2 },
      { type: "ranking", prompt: "Rank by what feels most like you.", options: ["Creating something beautiful", "Solving a real problem", "Helping someone see themselves clearly", "Building something that lasts"] },
      { type: "reflection", prompt: "Imagine helping your ideal group of people. What are you actually doing with them?" },
    ],
    interpret: (r) => pick(["Makes the Complex Simple", "Helps People See Themselves", "Builds Things That Last"], r),
  },
  {
    questKey: "how_i_create_impact_q4",
    clusterSlug: "how-i-create-impact",
    clusterName: "How I Create Impact",
    intro: "Let's connect your gifts to your impact.",
    interactions: [
      { type: "card_pick", prompt: "Your best work happens when you…", options: ["Turn someone's pain into progress", "Build a tool that solves a real need", "Create an experience that changes perspective", "Connect two people who needed each other"] },
      { type: "emoji_scale", prompt: "How aligned is your current work with your impact?", emojiOptions: [
        { emoji: "😢", label: "Far off" }, { emoji: "😐", label: "Getting there" }, { emoji: "🙂", label: "Close" }, { emoji: "😊", label: "Almost" }, { emoji: "✨", label: "Fully aligned" }
      ]},
      { type: "memory_flash", prompt: "Think of a time your help truly changed someone's trajectory.", memoryPrompt: "What did you do? What happened for them?" },
      { type: "reflection", prompt: "If you combined all your skills, values, and passions into one form of contribution, what would it look like?" },
    ],
    interpret: (r) => pick(["Turns Pain into Progress", "Creates Experiences That Transform", "Connects What Needs Connecting"], r),
  },
];

export const CONNECTION_MOMENT_AFTER = [2, 5, 8, 12];

export const CLUSTER_DEEPENING_QUESTIONS: Record<string, string[]> = {
  skills: ["When do you use this skill most?", "What happens when you apply it?"],
  passions: ["What specifically about this excites you?", "When did you first feel this?"],
  "personal-frustrations": ["Why does this bother you so deeply?", "What would change if this was solved?"],
  experiments: ["What did you learn from doing this?", "Would you do it again differently?"],
  "aha-moments": ["What changed after this realization?", "How does this show up now?"],
  "life-events": ["How did this moment change you?", "What did you carry forward from it?"],
  "natural-talents": ["When does this feel most effortless?", "How do others react to it?"],
  inspirations: ["What specifically inspires you about this?", "How does it influence you?"],
  values: ["When was this value tested?", "How do you live this value daily?"],
  "ideal-life": ["What would a day in this life look like?", "What's the first step toward it?"],
  "childhood-signals": ["How does this memory connect to who you are now?", "What feeling does it bring back?"],
  "who-i-serve": ["What do these people struggle with most?", "Why do you feel drawn to help them?"],
  "how-i-create-impact": ["What happens when you do this for others?", "What makes your way unique?"],
  "golden-moments": ["What did this moment reveal about you?", "How has it shaped your direction?"],
  "external-reflections": ["What pattern do others see in you?", "Does their view surprise you?"],
  "vision-for-a-better-world": ["What would be different if this existed?", "What's your role in making it happen?"],
};

export function getQuestForCluster(slug: string): AtlasQuestDefinition | undefined {
  return ATLAS_QUESTS.find(q => q.clusterSlug === slug);
}

export function getQuestsForCluster(slug: string): AtlasQuestDefinition[] {
  return ATLAS_QUESTS.filter(q => q.clusterSlug === slug);
}
