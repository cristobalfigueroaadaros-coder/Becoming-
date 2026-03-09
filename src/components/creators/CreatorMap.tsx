import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { CreatorMapPin } from "./CreatorMapPin";
import { CreatorPreviewCard } from "./CreatorPreviewCard";
import { CreatorDetailCard } from "./CreatorDetailCard";
import type { SeedPost } from "./SeedPostCard";

export interface MapSeedPost extends SeedPost {
  coords: { x: number; y: number };
  category: string;
}

const CATEGORIES = ["All", "Family", "Education", "Healing", "Community", "Environment", "Art", "Tech for Good"] as const;

// Simplified world map SVG path (continents outline)
const WORLD_PATH = `M 5,38 Q 8,34 12,35 Q 15,33 18,34 L 20,32 Q 22,28 25,30 L 28,28 Q 30,25 33,26 L 38,24 Q 42,22 46,24 L 48,22 Q 50,20 53,22 Q 56,20 60,22 L 64,20 Q 68,18 72,22 Q 76,20 78,24 L 80,22 Q 84,20 86,24 L 88,22 Q 90,20 92,24 L 94,28 Q 92,32 88,30 Q 86,34 82,32 Q 78,36 74,34 Q 70,38 66,36 Q 62,40 58,38 L 54,40 Q 50,44 46,42 L 42,44 Q 38,48 34,46 Q 30,50 26,48 L 22,50 Q 18,52 14,50 Q 10,54 8,50 Q 6,46 5,42 Z
M 44,48 Q 46,46 50,48 L 54,46 Q 58,44 62,48 L 66,46 Q 70,44 74,48 Q 76,52 74,56 Q 70,60 66,58 L 62,60 Q 58,64 54,62 Q 50,66 46,64 Q 44,60 44,56 Z
M 10,56 Q 14,54 18,56 L 22,54 Q 26,52 30,56 Q 34,54 36,58 Q 34,62 30,60 Q 26,64 22,62 Q 18,66 14,64 Q 10,62 10,58 Z
M 78,48 Q 82,46 86,48 Q 90,46 92,50 Q 94,54 92,58 Q 88,62 84,60 Q 80,64 76,62 Q 74,58 76,54 Q 78,52 78,48 Z`;

export const CreatorMap = ({ posts }: { posts: MapSeedPost[] }) => {
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailPost, setDetailPost] = useState<MapSeedPost | null>(null);

  const filtered = useMemo(() => {
    if (activeCategory === "All") return posts;
    return posts.filter(p => p.category.toLowerCase() === activeCategory.toLowerCase());
  }, [posts, activeCategory]);

  const selectedPost = filtered.find(p => p.id === selectedId) ?? null;

  return (
    <div className="space-y-3">
      {/* Category filters */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => { setActiveCategory(cat); setSelectedId(null); }}
            className={cn(
              "text-[11px] whitespace-nowrap rounded-full px-3 py-1 transition-colors shrink-0",
              activeCategory === cat
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Map container */}
      <div
        className="relative w-full aspect-[2/1] rounded-xl bg-muted/30 border border-border/50 overflow-hidden"
        onClick={() => setSelectedId(null)}
      >
        {/* SVG world outline */}
        <svg viewBox="0 0 100 80" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet">
          <path d={WORLD_PATH} className="fill-muted/60 stroke-border" strokeWidth="0.3" />
        </svg>

        {/* Pins */}
        {filtered.map(post => (
          <CreatorMapPin
            key={post.id}
            x={post.coords.x}
            y={post.coords.y}
            color={post.gradient.from}
            isActive={selectedId === post.id}
            onClick={() => setSelectedId(prev => prev === post.id ? null : post.id)}
          />
        ))}

        {/* Preview card */}
        {selectedPost && (
          <CreatorPreviewCard
            post={selectedPost}
            onExpand={() => { setDetailPost(selectedPost); setSelectedId(null); }}
          />
        )}
      </div>

      {/* Stat */}
      <p className="text-center text-[11px] text-muted-foreground">
        {filtered.length} creator{filtered.length !== 1 ? "s" : ""} on the map
      </p>

      {/* Detail drawer */}
      <CreatorDetailCard
        post={detailPost}
        open={!!detailPost}
        onClose={() => setDetailPost(null)}
      />
    </div>
  );
};
