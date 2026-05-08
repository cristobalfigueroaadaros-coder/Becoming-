// Cris's hardcoded Founder's Atlas data
// All content lives here — no DB reads, no AI calls.

export type FounderDot = {
  id: string;
  title: string;
  insight?: string;
  miniDots?: string[];
};

export type FounderCluster = {
  id: string;
  name: string;
  domain: "Person" | "Process" | "Product" | "Environment";
  position: { x: number; y: number };
  dots: FounderDot[];
};

export type GoldConnection = {
  fromClusterId: string;
  toClusterId: string;
  insight: string;
};

export type TimelineEntry = {
  year: string;
  title: string;
  context: string;
  tag: "Life Event" | "Aha Moment" | "Skill" | "Experiment";
};

// Layout follows the existing Atlas grid feel — clusters spread, no overlap.
export const FOUNDERS_CLUSTERS: FounderCluster[] = [
  {
    id: "life-events",
    name: "Life Events",
    domain: "Person",
    position: { x: 18, y: 8 },
    dots: [
      {
        id: "le-1",
        title: "Left home in Chile",
        insight: "Comfort, stability, something calling that I couldn't yet name.",
        miniDots: ["Comfort is the enemy of becoming. The person I was becoming needed friction to emerge."],
      },
      { id: "le-2", title: "Germany — cleaner", insight: "Worked as a cleaner, controlled my ego for the first time. I came from privilege, now I was working for food." },
      { id: "le-3", title: "Mauer Park, Berlin", insight: "Watched a stranger in a tutu sing at the open karaoke — his voice stopped everything." },
      {
        id: "le-4",
        title: "COVID — broke my leg",
        insight: "Alone in Australia. A friend said: 'now you have time to finish it.'",
        miniDots: ["What I lost: the illusion that timing is in my control. What it gave me: the time to finish what mattered most."],
      },
      {
        id: "le-5",
        title: "Sold first 40 copies",
        insight: "Family Squad sold its first 40 copies. Missed the $100K investment, finished sixth out of five.",
        miniDots: ["One path closed. The question that opened the next one arrived."],
      },
      { id: "le-6", title: "Asked God for a sign", insight: "While sleeping — received the vision for Family Squad Digital." },
      { id: "le-7", title: "Left Australia for Bali", insight: "A new chapter. A different kind of clarity." },
      { id: "le-8", title: "Peyote ceremony", insight: "The week before the AI council idea — the vision arrived." },
      { id: "le-9", title: "Temazcal in Bali", insight: "The Rainbow Warriors — understood the deeper why behind everything." },
      { id: "le-10", title: "Built a festival in Bali", insight: "Paintings, dancing, fire rituals, real interaction." },
    ],
  },
  {
    id: "passions",
    name: "Passions",
    domain: "Person",
    position: { x: 50, y: 6 },
    dots: [
      { id: "pa-1", title: "Connecting people", insight: "Building real bridges between humans." },
      { id: "pa-2", title: "Interactive experiences", insight: "Designing fun that requires participation — not passive like cinema." },
      { id: "pa-3", title: "Psychology & behavior", insight: "Why we do what we do." },
      { id: "pa-4", title: "Why are we here?", insight: "The question that keeps me building." },
      { id: "pa-5", title: "Stories that make the invisible visible", insight: "Naming what people feel but cannot say." },
      { id: "pa-6", title: "Learning through play", insight: "I built a game because learning should be fun." },
    ],
  },
  {
    id: "values",
    name: "Values",
    domain: "Person",
    position: { x: 82, y: 10 },
    dots: [
      { id: "va-1", title: "Faith", insight: "Keep moving even when you cannot see where it is going." },
      { id: "va-2", title: "Contribution", insight: "Give what you have toward something larger than yourself." },
      { id: "va-3", title: "Curiosity", insight: "Exploration as a way of life, not a personality trait." },
      { id: "va-4", title: "Authenticity", insight: "Build from truth, not from what is expected of you." },
      { id: "va-5", title: "Service", insight: "Your gifts are not yours to keep." },
    ],
  },
  {
    id: "natural-talents",
    name: "Natural Talents",
    domain: "Person",
    position: { x: 10, y: 26 },
    dots: [
      {
        id: "nt-1",
        title: "Seeing patterns where others see chaos",
        insight: "Connecting what looks unrelated.",
        miniDots: ["This is how I connected Family Squad to Becoming — I could see the thread before anyone else could."],
      },
      { id: "nt-2", title: "Making people feel seen", insight: "Quickly, deeply, without performance." },
      { id: "nt-3", title: "Building belonging out of nothing", insight: "Strangers leave feeling like family." },
      { id: "nt-4", title: "Translating the invisible", insight: "Turning a feeling into something you can hold." },
      { id: "nt-5", title: "Persisting past where most people stop", insight: "The work begins where comfort ends." },
    ],
  },
  {
    id: "childhood-signals",
    name: "Childhood Signals",
    domain: "Person",
    position: { x: 42, y: 24 },
    dots: [
      { id: "cs-1", title: "Called to something bigger", insight: "Always felt it, couldn't name it." },
      { id: "cs-2", title: "Curious about people", insight: "Why they do what they do." },
      { id: "cs-3", title: "Natural at creating experiences", insight: "For others, since I was small." },
      { id: "cs-4", title: "Restless in conventional paths", insight: "School, jobs, expected lives." },
      { id: "cs-5", title: "Loved storytelling", insight: "Making something invisible feel real." },
    ],
  },
  {
    id: "skills",
    name: "Skills",
    domain: "Process",
    position: { x: 75, y: 26 },
    dots: [
      { id: "sk-1", title: "SEO and web", insight: "10+ years of building on the internet." },
      { id: "sk-2", title: "Human design & gamification", insight: "Designing for the user's inner state." },
      { id: "sk-3", title: "Psychology & game theory", insight: "Why systems make people act." },
      { id: "sk-4", title: "Product prototyping", insight: "Iteration as a discipline." },
      { id: "sk-5", title: "Board game design", insight: "Mechanics that teach as they play." },
      { id: "sk-6", title: "Digital UX & emotional journey design", insight: "Designing how a product feels, not just how it looks." },
      { id: "sk-7", title: "Festival production", insight: "Holding a real-world container for hundreds of strangers." },
    ],
  },
  {
    id: "aha-moments",
    name: "Aha Moments",
    domain: "Person",
    position: { x: 25, y: 44 },
    dots: [
      {
        id: "ah-1",
        title: "Mauer Park: the man in the tutu",
        insight: "His extraordinary voice — 'if the world had more of this, it would be a better place.'",
        miniDots: ["Talent doesn't announce itself — it waits to be seen. Everyone is carrying something the world needs."],
      },
      { id: "ah-2", title: "Napoleon Hill's mental council", insight: "Realizing AI could make it real for everyone." },
      { id: "ah-3", title: "My grandfather's Israel story", insight: "Men with direction came home." },
      { id: "ah-4", title: "Steve Jobs", insight: "'You can only connect the dots looking backwards.'" },
      {
        id: "ah-5",
        title: "Family Squad took four years",
        insight: "Every lesson became the architecture of Becoming.",
        miniDots: ["The length of the journey is not a sign you're doing it wrong. What it produced: every skill needed to build what came next."],
      },
    ],
  },
  {
    id: "experiments",
    name: "Experiments",
    domain: "Process",
    position: { x: 65, y: 44 },
    dots: [
      { id: "ex-1", title: "First business: e-commerce in Chile", insight: "The first real dot." },
      { id: "ex-2", title: "Selling sangria at Mauer Park", insight: "Met hundreds of strangers." },
      { id: "ex-3", title: "Festival in Melbourne — rejected", insight: "Which opened five doors." },
      { id: "ex-4", title: "Family Squad board game", insight: "Four years, construction days, late nights." },
      { id: "ex-5", title: "Family Squad Digital", insight: "Received in a dream after asking for a sign." },
      { id: "ex-6", title: "Bali festival", insight: "Paintings, fire, dancing, full interactive experience." },
      { id: "ex-7", title: "Becoming", insight: "The experiment that brought everything together." },
    ],
  },
  {
    id: "vision",
    name: "Visions for a Better World",
    domain: "Product",
    position: { x: 88, y: 44 },
    dots: [
      { id: "vi-1", title: "144,000 conscious creators", insight: "Giving their gifts back to the world." },
      { id: "vi-2", title: "Everyone discovers what only they can build", insight: "A world built around individual purpose." },
      { id: "vi-3", title: "Purpose as practical and accessible", insight: "Not a privilege of a few." },
      { id: "vi-4", title: "The Creators community as a global cooperative", insight: "Everyone contributing what they have." },
      { id: "vi-5", title: "Individual awakenings → collective change", insight: "What no single person could have made alone." },
    ],
  },
  {
    id: "ideal-life",
    name: "Ideal Life",
    domain: "Person",
    position: { x: 15, y: 60 },
    dots: [
      { id: "il-1", title: "Build something that outlasts him", insight: "Beyond a single lifetime." },
      { id: "il-2", title: "144,000 conscious creators changing the world", insight: "Active, daily, real." },
      { id: "il-3", title: "Wake up with clear purpose", insight: "Every day, direction." },
      { id: "il-4", title: "Financial freedom through meaningful work", insight: "Money flowing from contribution." },
      { id: "il-5", title: "Continuing the lineage", insight: "Grandfather built homes, Cris builds maps — both give people a place to belong." },
    ],
  },
  {
    id: "frustrations",
    name: "Personal Frustrations",
    domain: "Environment",
    position: { x: 42, y: 62 },
    dots: [
      { id: "fr-1", title: "People with gifts who never use them", insight: "The biggest one." },
      { id: "fr-2", title: "Systems that bury curiosity", insight: "Under survival and routine." },
      { id: "fr-3", title: "The loneliness of building meaningful work", insight: "Most builders are alone." },
      { id: "fr-4", title: "Mentorship reaches only the privileged", insight: "Wisdom shouldn't be gated." },
      { id: "fr-5", title: "Gap between potential and action", insight: "Seeing it in others and not being able to reach them." },
    ],
  },
  {
    id: "inspirations",
    name: "People I Admire",
    domain: "Environment",
    position: { x: 80, y: 62 },
    dots: [
      {
        id: "in-1",
        title: "My grandfather",
        insight: "Wisdom, humility, cooperatives that gave people a role in each other's lives.",
        miniDots: ["Real contribution isn't charity — it's everyone doing their part. That became the Creators community model."],
      },
      { id: "in-2", title: "My father", insight: "Resilience, showing up on the hard days, keep going." },
      { id: "in-3", title: "Walt Disney", insight: "Creativity and the courage to build what didn't exist yet." },
      { id: "in-4", title: "Kobe Bryant", insight: "Discipline, mentality, relentless standard." },
      { id: "in-5", title: "Charles Darwin", insight: "Curiosity and exploration as a way of life." },
      { id: "in-6", title: "Notorious B.I.G.", insight: "Voice, message, making something from nothing." },
      { id: "in-7", title: "Lautaro", insight: "Warrior spirit, the refusal to stop, a warrior from Chile." },
    ],
  },
  {
    id: "external-reflections",
    name: "External Reflections",
    domain: "Environment",
    position: { x: 35, y: 80 },
    dots: [
      { id: "er-1", title: "'You see things in people they don't see in themselves'", insight: "What others say first." },
      { id: "er-2", title: "'You don't stop'", insight: "Persistence is what people notice first." },
      { id: "er-3", title: "'You make people feel like they belong somewhere'", insight: "The room shifts when he walks in." },
      { id: "er-4", title: "People come to him for direction", insight: "When they need a shift in perspective." },
      { id: "er-5", title: "'You build things that shouldn't be possible yet'", insight: "Ahead of the curve." },
    ],
  },
  {
    id: "who-i-serve",
    name: "Who I Serve",
    domain: "Product",
    position: { x: 28, y: 92 },
    dots: [
      { id: "ws-1", title: "People who feel something they cannot name", insight: "The unnamed calling." },
      { id: "ws-2", title: "People who stopped", insight: "Scared, alone, unsure there is anything worth building." },
      { id: "ws-3", title: "Lonely builders", insight: "Who need a real community, not a network." },
      { id: "ws-4", title: "Future generations", insight: "Whose curiosity is being buried by routine." },
      { id: "ws-5", title: "Anyone building money + meaning", insight: "Both, not one or the other." },
    ],
  },
  {
    id: "how-i-create-impact",
    name: "How I Create Impact",
    domain: "Product",
    position: { x: 68, y: 88 },
    dots: [
      { id: "hi-1", title: "Making the invisible visible", insight: "Naming what people feel." },
      { id: "hi-2", title: "A system to understand themselves", insight: "Before someone else defines them." },
      { id: "hi-3", title: "Building community", insight: "So no one has to build alone." },
      { id: "hi-4", title: "Sharing my journey as proof", insight: "Dots always connect if you keep moving." },
      { id: "hi-5", title: "Connecting people to their gifts", insight: "And their gifts to the world." },
    ],
  },
];

export const GOLD_CONNECTIONS: GoldConnection[] = [
  { fromClusterId: "aha-moments", toClusterId: "who-i-serve", insight: "Hidden talent is everywhere — that is who I build for." },
  { fromClusterId: "frustrations", toClusterId: "vision", insight: "The problem becomes the purpose." },
  { fromClusterId: "life-events", toClusterId: "skills", insight: "Every skill used to build Becoming came from Family Squad." },
  { fromClusterId: "inspirations", toClusterId: "how-i-create-impact", insight: "Grandfather's cooperative model became the Creators community." },
  { fromClusterId: "inspirations", toClusterId: "vision", insight: "Cooperative thinking → vision for a global community of creators." },
  { fromClusterId: "childhood-signals", toClusterId: "natural-talents", insight: "What was always there, named late." },
  { fromClusterId: "experiments", toClusterId: "life-events", insight: "Each experiment produced the dot that opened the next door." },
];

export const TIMELINE: TimelineEntry[] = [
  { year: "2016", title: "Left home in Chile", context: "Stable life — and something calling that I couldn't name.", tag: "Life Event" },
  { year: "2016", title: "First business: e-commerce for women", context: "Learned what building really costs. The first real dot.", tag: "Experiment" },
  { year: "2017", title: "Germany — cleaned floors, sold sangria", context: "Left comfort. Worked for food. The ego work began.", tag: "Life Event" },
  { year: "2017", title: "Mauer Park: the man in the tutu", context: "He sang and I understood: talent doesn't announce itself. It waits.", tag: "Aha Moment" },
  { year: "2018", title: "Melbourne, Australia", context: "Applied to create a festival. Rejected. Five doors opened.", tag: "Life Event" },
  { year: "2018", title: "Family Squad was born", context: "Build what exists first, then innovate. The game began.", tag: "Experiment" },
  { year: "2018–2020", title: "Construction by day, Family Squad by night", context: "Years of physical work to keep the mind clear. Afternoons of design.", tag: "Skill" },
  { year: "2020", title: "COVID. Broken leg. Everything dark.", context: "A friend said: now you have time to finish it. I finished it.", tag: "Life Event" },
  { year: "2020", title: "40 copies sold. $100K investment missed.", context: "Finished sixth out of five. Didn't get in. Turning point.", tag: "Experiment" },
  { year: "2021", title: "Asked God for a sign", context: "Received the vision for Family Squad Digital while sleeping.", tag: "Aha Moment" },
  { year: "2022", title: "Built Family Squad Digital", context: "All the UX, gamification, and emotional journey work converged.", tag: "Skill" },
  { year: "2023", title: "Left Australia for Bali", context: "A new chapter. A different kind of clarity.", tag: "Life Event" },
  { year: "2023", title: "Peyote ceremony", context: "The week before the AI council idea — the vision arrived.", tag: "Aha Moment" },
  { year: "2023", title: "Temazcal: the Rainbow Warriors", context: "Understood the deeper why behind everything I had been building toward.", tag: "Aha Moment" },
  { year: "2024", title: "Bali festival: paintings, fire, dancing", context: "Built a full interactive experience. The dots showing themselves.", tag: "Experiment" },
  { year: "2025", title: "Built Becoming", context: "The tool I needed at the beginning. Built for you.", tag: "Experiment" },
];
