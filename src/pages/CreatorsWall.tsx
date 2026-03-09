import { useState } from "react";
import { Globe, ArrowRight, LayoutList, Map } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useCreatorPosts } from "@/hooks/useCreatorPosts";
import { PostComposer } from "@/components/creators/PostComposer";
import { CreatorPostCard } from "@/components/creators/CreatorPostCard";
import { SeedPostCard, type SeedPost } from "@/components/creators/SeedPostCard";
import { CreatorMap, type MapSeedPost } from "@/components/creators/CreatorMap";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { ResonanceType } from "@/hooks/useCreatorPosts";

const SEED_POSTS: MapSeedPost[] = [
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
    date: "Mar 4, 2026", coords: { x: 76, y: 53 }, category: "environment",
  },
  {
    id: "seed-5", name: "Alex", location: "California", post_type: "creating",
    statement: "Developing meditation workshops for teenagers struggling with anxiety.",
    goal: "Teach meditation to 10,000 teenagers over the next five years.",
    next_step: "Test the first workshop at a local high school.",
    gradient: { from: "#7c3aed", to: "#c4b5fd" }, emoji: "🧘",
    resonances: { inspires_me: 61, creating_similar: 9, want_to_help: 7, needed_this: 52 },
    date: "Mar 5, 2026", coords: { x: 10, y: 34 }, category: "healing",
  },
  {
    id: "seed-6", name: "Sofia", location: "Barcelona", post_type: "creating",
    statement: "Creating educational games that help kids understand and express emotions.",
    goal: "Bring emotional intelligence education to 50 schools.",
    next_step: "Design the first prototype of the game.",
    gradient: { from: "#db2777", to: "#fde68a" }, emoji: "🎮",
    resonances: { inspires_me: 47, creating_similar: 6, want_to_help: 13, needed_this: 38 },
    date: "Mar 5, 2026", coords: { x: 47, y: 24 }, category: "education",
  },
  {
    id: "seed-7", name: "Lucas", location: "Chile", post_type: "creating",
    statement: "Teaching regenerative farming techniques to local farmers.",
    goal: "Convert 100 farms to regenerative agriculture in the next 10 years.",
    next_step: "Host the first workshop for farmers.",
    gradient: { from: "#365314", to: "#84cc16" }, emoji: "🌾",
    resonances: { inspires_me: 34, creating_similar: 21, want_to_help: 16, needed_this: 22 },
    date: "Mar 6, 2026", coords: { x: 20, y: 76 }, category: "environment",
  },
  {
    id: "seed-8", name: "Maya", location: "Amsterdam", post_type: "working_on_self",
    statement: "Using painting and creative expression to heal trauma and inspire others to do the same.",
    goal: "Host art therapy workshops for at least 1,000 people.",
    next_step: "Create a small local workshop with 10 participants.",
    gradient: { from: "#9333ea", to: "#f9a8d4" }, emoji: "🎨",
    resonances: { inspires_me: 89, creating_similar: 11, want_to_help: 6, needed_this: 74 },
    date: "Mar 6, 2026", coords: { x: 49, y: 18 }, category: "art",
  },
  {
    id: "seed-9", name: "Ahmed", location: "Cairo", post_type: "creating",
    statement: "Starting a local kindness movement where people perform small acts of kindness every day.",
    goal: "Inspire 10,000 acts of kindness in the city.",
    next_step: "Launch a social page and invite friends to participate.",
    gradient: { from: "#d97706", to: "#fef08a" }, emoji: "💛",
    resonances: { inspires_me: 66, creating_similar: 19, want_to_help: 8, needed_this: 57 },
    date: "Mar 7, 2026", coords: { x: 53, y: 36 }, category: "community",
  },
  {
    id: "seed-10", name: "Emma", location: "London", post_type: "creating",
    statement: "Building a startup accelerator for founders creating businesses that solve social or environmental problems.",
    goal: "Support 200 conscious startups in the next 5 years.",
    next_step: "Interview the first group of founders.",
    gradient: { from: "#4338ca", to: "#818cf8" }, emoji: "🚀",
    resonances: { inspires_me: 53, creating_similar: 24, want_to_help: 18, needed_this: 30 },
    date: "Mar 8, 2026", coords: { x: 43, y: 17 }, category: "tech for good",
  },
];

const CreatorsWall = () => {
  const navigate = useNavigate();
  const { posts, isLoading, creatorCount, currentUserId, createPost, toggleResonance, addUpdate, addComment, useResonances, useUpdates, useComments } = useCreatorPosts();
  const [justPosted, setJustPosted] = useState(false);
  const [activeView, setActiveView] = useState<"wall" | "map">("wall");

  const handleCreatePost = async (post: Parameters<typeof createPost.mutateAsync>[0]) => {
    await createPost.mutateAsync(post);
    setJustPosted(true);
    toast({ title: "Shared with the world! ✨" });
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Globe className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Creators</h1>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Creators around the world are building things with a positive impact.<br />
          Here we connect, support each other, and grow together.
        </p>

        {/* Counter */}
        <div className="inline-flex flex-col items-center bg-primary/5 border border-primary/20 rounded-xl px-6 py-3">
          <span className="text-3xl font-bold text-primary">{(creatorCount + 1246).toLocaleString()}</span>
          <span className="text-xs text-muted-foreground">Creators connected</span>
        </div>

        <p className="text-xs text-muted-foreground/70 italic">
          Our mission is to connect 144,000 creators building a better world.
        </p>
      </div>

      {/* View Toggle */}
      <div className="flex justify-center">
        <div className="inline-flex rounded-lg bg-muted p-0.5 gap-0.5">
          <button
            onClick={() => setActiveView("wall")}
            className={cn(
              "flex items-center gap-1.5 text-xs font-medium px-4 py-1.5 rounded-md transition-colors",
              activeView === "wall"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <LayoutList className="w-3.5 h-3.5" /> Wall
          </button>
          <button
            onClick={() => setActiveView("map")}
            className={cn(
              "flex items-center gap-1.5 text-xs font-medium px-4 py-1.5 rounded-md transition-colors",
              activeView === "map"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Map className="w-3.5 h-3.5" /> Map
          </button>
        </div>
      </div>

      {activeView === "wall" ? (
        <>
          {/* Guidance message */}
          <p className="text-center text-xs text-muted-foreground/60">
            This space is for sharing positive impact, supporting each other, and building a better world together.
          </p>

          {/* Post Composer */}
          <PostComposer onSubmit={handleCreatePost} isSubmitting={createPost.isPending} />

          {/* Integration prompt after posting */}
          {justPosted && (
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Want help growing this creation?</p>
                <p className="text-xs text-muted-foreground">Start building your project in Creation Lab.</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => navigate("/creation-lab")}>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Feed */}
          <div className="space-y-4">
            {SEED_POSTS.map((post) => (
              <SeedPostCard key={post.id} post={post} />
            ))}
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-40 rounded-xl bg-muted animate-pulse" />
                ))}
              </div>
            ) : (
              posts.map((post) => (
                <PostCardWrapper
                  key={post.id}
                  post={post}
                  currentUserId={currentUserId}
                  toggleResonance={toggleResonance}
                  addUpdate={addUpdate}
                  addComment={addComment}
                  useResonances={useResonances}
                  useUpdates={useUpdates}
                  useComments={useComments}
                />
              ))
            )}
          </div>
        </>
      ) : (
        <CreatorMap posts={SEED_POSTS} />
      )}

      <div className="h-4" />
    </div>
  );
};

// Wrapper to use hooks per post
function PostCardWrapper({ post, currentUserId, toggleResonance, addUpdate, addComment, useResonances, useUpdates, useComments }: any) {
  const { data: resonances = [] } = useResonances(post.id);
  const { data: updates = [] } = useUpdates(post.id);
  const { data: comments = [] } = useComments(post.id);

  return (
    <CreatorPostCard
      post={post}
      currentUserId={currentUserId}
      resonances={resonances}
      updates={updates}
      comments={comments}
      onToggleResonance={(type: ResonanceType) => toggleResonance.mutate({ postId: post.id, resonanceType: type })}
      onAddUpdate={(content: string) => addUpdate.mutateAsync({ postId: post.id, content })}
      onAddComment={(content: string) => addComment.mutateAsync({ postId: post.id, content })}
    />
  );
}

export default CreatorsWall;
