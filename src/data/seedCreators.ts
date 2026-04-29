export interface SeedCreator {
  id: string;
  name: string;
  location: string;
  post_type: string;
  statement: string;
  goal?: string;
  next_step?: string;
  gradient: { from: string; to: string };
  emoji: string;
  resonances: { inspires_me: number; creating_similar: number; want_to_help: number; needed_this: number };
  date: string;
  coords?: { x: number; y: number };
  category?: string;
}

export const SEED_POSTS: SeedCreator[] = [
  {
    id: "seed-1", name: "James", location: "Toronto", post_type: "creating",
    statement: "Launching a podcast about conscious parenting and emotional connection between parents and kids.",
    goal: "Reach 100,000 parents and help families reconnect.",
    next_step: "Record the first episode and publish it this week.",
    gradient: { from: "#f97316", to: "#fdba74" }, emoji: "🎙️",
    resonances: { inspires_me: 42, creating_similar: 8, want_to_help: 5, needed_this: 31 },
    date: "Mar 1, 2026", coords: { x: -79.38, y: 43.65 }, category: "family",
  },
  {
    id: "seed-2", name: "Maria", location: "Mexico City", post_type: "creating",
    statement: "Starting a community garden where neighbors can grow food together and reconnect with nature.",
    goal: "Create 50 garden beds and involve at least 200 people in the neighborhood.",
    next_step: "Find a small piece of land and organize the first volunteer day.",
    gradient: { from: "#16a34a", to: "#86efac" }, emoji: "🌱",
    resonances: { inspires_me: 38, creating_similar: 12, want_to_help: 9, needed_this: 27 },
    date: "Mar 2, 2026", coords: { x: -99.13, y: 19.43 }, category: "community",
  },
  {
    id: "seed-3", name: "Daniel", location: "Berlin", post_type: "creating",
    statement: "Hosting weekly circles where men can talk openly about emotions and mental health.",
    goal: "Create a safe community for at least 300 men in the next year.",
    next_step: "Organize the first gathering with 5 people.",
    gradient: { from: "#1d4ed8", to: "#93c5fd" }, emoji: "🤝",
    resonances: { inspires_me: 55, creating_similar: 17, want_to_help: 11, needed_this: 44 },
    date: "Mar 3, 2026", coords: { x: 13.41, y: 52.52 }, category: "healing",
  },
  {
    id: "seed-4", name: "Leila", location: "Bali", post_type: "creating",
    statement: "Building a small organization that organizes monthly ocean plastic cleanups with volunteers.",
    goal: "Remove 50 tons of plastic from beaches in the next three years.",
    next_step: "Organize the first beach cleanup event.",
    gradient: { from: "#0891b2", to: "#67e8f9" }, emoji: "🌊",
    resonances: { inspires_me: 73, creating_similar: 14, want_to_help: 28, needed_this: 19 },
    date: "Mar 4, 2026", coords: { x: 115.19, y: -8.65 }, category: "environment",
  },
  {
    id: "seed-5", name: "Alex", location: "California", post_type: "creating",
    statement: "Developing meditation workshops for teenagers struggling with anxiety.",
    goal: "Teach meditation to 10,000 teenagers over the next five years.",
    next_step: "Test the first workshop at a local high school.",
    gradient: { from: "#7c3aed", to: "#c4b5fd" }, emoji: "🧘",
    resonances: { inspires_me: 61, creating_similar: 9, want_to_help: 7, needed_this: 52 },
    date: "Mar 5, 2026", coords: { x: -119.42, y: 36.78 }, category: "healing",
  },
  {
    id: "seed-6", name: "Sofia", location: "Barcelona", post_type: "creating",
    statement: "Creating educational games that help kids understand and express emotions.",
    goal: "Bring emotional intelligence education to 50 schools.",
    next_step: "Design the first prototype of the game.",
    gradient: { from: "#db2777", to: "#fde68a" }, emoji: "🎮",
    resonances: { inspires_me: 47, creating_similar: 6, want_to_help: 13, needed_this: 38 },
    date: "Mar 5, 2026", coords: { x: 2.17, y: 41.39 }, category: "education",
  },
  {
    id: "seed-7", name: "Lucas", location: "Chile", post_type: "creating",
    statement: "Teaching regenerative farming techniques to local farmers.",
    goal: "Convert 100 farms to regenerative agriculture in the next 10 years.",
    next_step: "Host the first workshop for farmers.",
    gradient: { from: "#365314", to: "#84cc16" }, emoji: "🌾",
    resonances: { inspires_me: 34, creating_similar: 21, want_to_help: 16, needed_this: 22 },
    date: "Mar 6, 2026", coords: { x: -70.67, y: -33.45 }, category: "environment",
  },
  {
    id: "seed-8", name: "Maya", location: "Amsterdam", post_type: "working_on_self",
    statement: "Using painting and creative expression to heal trauma and inspire others to do the same.",
    goal: "Host art therapy workshops for at least 1,000 people.",
    next_step: "Create a small local workshop with 10 participants.",
    gradient: { from: "#9333ea", to: "#f9a8d4" }, emoji: "🎨",
    resonances: { inspires_me: 89, creating_similar: 11, want_to_help: 6, needed_this: 74 },
    date: "Mar 6, 2026", coords: { x: 4.90, y: 52.37 }, category: "art",
  },
  {
    id: "seed-9", name: "Ahmed", location: "Cairo", post_type: "creating",
    statement: "Starting a local kindness movement where people perform small acts of kindness every day.",
    goal: "Inspire 10,000 acts of kindness in the city.",
    next_step: "Launch a social page and invite friends to participate.",
    gradient: { from: "#d97706", to: "#fef08a" }, emoji: "💛",
    resonances: { inspires_me: 66, creating_similar: 19, want_to_help: 8, needed_this: 57 },
    date: "Mar 7, 2026", coords: { x: 31.24, y: 30.04 }, category: "community",
  },
  {
    id: "seed-10", name: "Emma", location: "London", post_type: "creating",
    statement: "Building a startup accelerator for founders creating businesses that solve social or environmental problems.",
    goal: "Support 200 conscious startups in the next 5 years.",
    next_step: "Interview the first group of founders.",
    gradient: { from: "#4338ca", to: "#818cf8" }, emoji: "🚀",
    resonances: { inspires_me: 53, creating_similar: 24, want_to_help: 18, needed_this: 30 },
    date: "Mar 8, 2026", coords: { x: -0.12, y: 51.51 }, category: "tech for good",
  },
];
