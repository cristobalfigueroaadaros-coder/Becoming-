export interface Quote {
  text: string;
  author: string;
}

export const inspirationalQuotes: Quote[] = [
  // Becoming & Transformation
  { text: "Becoming is better than being.", author: "Carol Dweck" },
  { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Aristotle" },
  { text: "The only way to make sense out of change is to plunge into it, move with it, and join the dance.", author: "Alan Watts" },
  { text: "What you do makes a difference, and you have to decide what kind of difference you want to make.", author: "Jane Goodall" },
  { text: "You are not your past. You are the resources and capabilities you glean from it.", author: "Jordan Peterson" },
  
  // Action & Momentum
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Action is the foundational key to all success.", author: "Pablo Picasso" },
  { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
  { text: "Do not wait to strike till the iron is hot, but make it hot by striking.", author: "William Butler Yeats" },
  { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
  { text: "An ounce of action is worth a ton of theory.", author: "Ralph Waldo Emerson" },
  
  // Evolution & Change
  { text: "It is not the strongest of the species that survive, but the one most responsive to change.", author: "Charles Darwin" },
  { text: "The secret of change is to focus all of your energy not on fighting the old, but on building the new.", author: "Socrates" },
  { text: "Be water, my friend. Empty your mind. Be formless, shapeless, like water.", author: "Bruce Lee" },
  { text: "Growth is painful. Change is painful. But nothing is as painful as staying stuck.", author: "Mandy Hale" },
  { text: "Life is a series of natural and spontaneous changes. Don't resist them; that only creates sorrow.", author: "Lao Tzu" },
  
  // Learning & Growth
  { text: "Live as if you were to die tomorrow. Learn as if you were to live forever.", author: "Mahatma Gandhi" },
  { text: "The more that you read, the more things you will know. The more that you learn, the more places you'll go.", author: "Dr. Seuss" },
  { text: "Education is not the filling of a pail, but the lighting of a fire.", author: "W.B. Yeats" },
  { text: "The only person who is educated is the one who has learned how to learn and change.", author: "Carl Rogers" },
  { text: "In the middle of difficulty lies opportunity.", author: "Albert Einstein" },
  
  // Doing Over Thinking
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Vision without execution is hallucination.", author: "Thomas Edison" },
  { text: "Done is better than perfect.", author: "Sheryl Sandberg" },
  { text: "Knowing is not enough; we must apply. Willing is not enough; we must do.", author: "Johann Wolfgang von Goethe" },
  { text: "The world is changed by your example, not by your opinion.", author: "Paulo Coelho" },
  
  // Courage & Beginning
  { text: "The journey of a thousand miles begins with a single step.", author: "Lao Tzu" },
  { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
  { text: "Courage is not the absence of fear, but rather the judgment that something else is more important.", author: "Ambrose Redmoon" },
  { text: "The biggest adventure you can take is to live the life of your dreams.", author: "Oprah Winfrey" },
  { text: "What lies behind us and what lies before us are tiny matters compared to what lies within us.", author: "Ralph Waldo Emerson" },
  
  // Self-Improvement
  { text: "Be yourself; everyone else is already taken.", author: "Oscar Wilde" },
  { text: "Every moment is a fresh beginning.", author: "T.S. Eliot" },
  { text: "The only limit to our realization of tomorrow will be our doubts of today.", author: "Franklin D. Roosevelt" },
  { text: "Your time is limited, don't waste it living someone else's life.", author: "Steve Jobs" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  
  // Progress & Persistence
  { text: "Small daily improvements are the key to staggering long-term results.", author: "James Clear" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "I have not failed. I've just found 10,000 ways that won't work.", author: "Thomas Edison" },
  { text: "The only impossible journey is the one you never begin.", author: "Tony Robbins" },
  { text: "Progress is impossible without change, and those who cannot change their minds cannot change anything.", author: "George Bernard Shaw" },
];

export const getRandomQuote = (): Quote => {
  const randomIndex = Math.floor(Math.random() * inspirationalQuotes.length);
  return inspirationalQuotes[randomIndex];
};
