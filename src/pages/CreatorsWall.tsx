import { useState } from "react";
import { Globe, ArrowRight, LayoutList, Map } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useCreatorPosts } from "@/hooks/useCreatorPosts";
import { PostComposer } from "@/components/creators/PostComposer";
import { CreatorPostCard } from "@/components/creators/CreatorPostCard";
import { SeedPostCard } from "@/components/creators/SeedPostCard";
import { CreatorMap } from "@/components/creators/CreatorMap";
import { SEED_POSTS } from "@/data/seedCreators";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { ResonanceType } from "@/hooks/useCreatorPosts";
import type { MapSeedPost } from "@/components/creators/CreatorMap";

const MAPPED_SEED_POSTS: MapSeedPost[] = SEED_POSTS as MapSeedPost[];
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
        <CreatorMap posts={MAPPED_SEED_POSTS} />
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
