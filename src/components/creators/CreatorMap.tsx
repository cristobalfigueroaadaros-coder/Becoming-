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
        className="relative w-full rounded-xl bg-muted/20 border border-border/50 overflow-hidden"
        style={{ aspectRatio: "2 / 1" }}
        onClick={() => setSelectedId(null)}
      >
        {/* Real world map SVG */}
        <svg
          viewBox="0 0 1000 500"
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="xMidYMid slice"
        >
          {/* Ocean background */}
          <rect width="1000" height="500" className="fill-primary/[0.03]" />

          {/* Grid lines for subtle geographic feel */}
          {[100,200,300,400,500,600,700,800,900].map(x => (
            <line key={`v${x}`} x1={x} y1={0} x2={x} y2={500} className="stroke-border/30" strokeWidth="0.5" strokeDasharray="4 4" />
          ))}
          {[100,200,300,400].map(y => (
            <line key={`h${y}`} x1={0} y1={y} x2={1000} y2={y} className="stroke-border/30" strokeWidth="0.5" strokeDasharray="4 4" />
          ))}
          {/* Equator */}
          <line x1={0} y1={250} x2={1000} y2={250} className="stroke-border/20" strokeWidth="1" />

          {/* North America */}
          <path d="M 80,60 L 120,55 L 160,50 L 200,55 L 230,70 L 250,60 L 270,65 L 280,80 L 270,95 L 260,110 L 250,120 L 240,135 L 220,150 L 200,160 L 185,175 L 175,190 L 160,200 L 150,215 L 135,225 L 115,230 L 100,225 L 90,215 L 80,200 L 75,185 L 80,170 L 85,155 L 90,140 L 85,125 L 80,110 L 75,95 L 70,80 Z" className="fill-muted/50 stroke-border/60" strokeWidth="1" />
          {/* Greenland */}
          <path d="M 270,35 L 290,30 L 320,35 L 330,50 L 320,65 L 300,70 L 280,65 L 270,50 Z" className="fill-muted/50 stroke-border/60" strokeWidth="1" />

          {/* South America */}
          <path d="M 180,250 L 200,240 L 220,245 L 235,260 L 245,280 L 250,300 L 252,320 L 248,340 L 240,360 L 230,380 L 215,400 L 200,415 L 190,425 L 185,410 L 180,390 L 175,370 L 170,350 L 168,330 L 170,310 L 172,290 L 175,270 Z" className="fill-muted/50 stroke-border/60" strokeWidth="1" />

          {/* Europe */}
          <path d="M 440,60 L 460,55 L 480,50 L 510,55 L 530,65 L 540,80 L 535,95 L 530,110 L 520,120 L 505,130 L 490,135 L 475,130 L 460,125 L 450,115 L 440,100 L 435,85 L 438,70 Z" className="fill-muted/50 stroke-border/60" strokeWidth="1" />
          {/* UK/Ireland */}
          <path d="M 425,75 L 435,70 L 440,80 L 435,90 L 425,88 Z" className="fill-muted/50 stroke-border/60" strokeWidth="1" />
          {/* Scandinavia */}
          <path d="M 480,30 L 500,25 L 510,35 L 505,55 L 495,50 L 485,45 L 480,35 Z" className="fill-muted/50 stroke-border/60" strokeWidth="1" />

          {/* Africa */}
          <path d="M 450,145 L 480,140 L 520,145 L 550,155 L 570,170 L 580,190 L 585,210 L 585,240 L 580,270 L 570,300 L 555,330 L 535,355 L 515,370 L 500,375 L 485,368 L 470,355 L 458,335 L 450,310 L 445,285 L 442,260 L 440,230 L 442,200 L 445,175 L 448,160 Z" className="fill-muted/50 stroke-border/60" strokeWidth="1" />

          {/* Asia */}
          <path d="M 545,50 L 580,40 L 620,35 L 660,30 L 700,35 L 740,40 L 780,50 L 810,60 L 830,75 L 840,95 L 835,115 L 825,135 L 810,150 L 790,160 L 770,165 L 750,155 L 730,150 L 710,155 L 690,165 L 670,170 L 650,175 L 630,170 L 610,160 L 595,150 L 580,135 L 565,120 L 555,105 L 548,85 L 545,65 Z" className="fill-muted/50 stroke-border/60" strokeWidth="1" />
          {/* India */}
          <path d="M 660,170 L 680,175 L 695,195 L 700,220 L 690,245 L 675,255 L 660,250 L 650,230 L 645,210 L 650,190 Z" className="fill-muted/50 stroke-border/60" strokeWidth="1" />
          {/* Southeast Asia */}
          <path d="M 730,170 L 755,175 L 770,190 L 780,210 L 775,225 L 760,230 L 745,225 L 735,210 L 730,190 Z" className="fill-muted/50 stroke-border/60" strokeWidth="1" />

          {/* Australia */}
          <path d="M 760,310 L 800,300 L 840,305 L 870,315 L 885,335 L 880,355 L 865,370 L 840,380 L 810,378 L 785,370 L 768,355 L 758,338 L 755,320 Z" className="fill-muted/50 stroke-border/60" strokeWidth="1" />
          {/* New Zealand */}
          <path d="M 905,370 L 912,365 L 918,375 L 915,390 L 908,395 L 902,385 Z" className="fill-muted/50 stroke-border/60" strokeWidth="1" />

          {/* Japan */}
          <path d="M 830,90 L 840,85 L 848,95 L 845,115 L 838,120 L 830,110 L 828,100 Z" className="fill-muted/50 stroke-border/60" strokeWidth="1" />

          {/* Indonesia archipelago */}
          <path d="M 740,260 L 755,258 L 770,262 L 785,260 L 800,265 L 795,272 L 780,275 L 765,273 L 750,270 L 740,266 Z" className="fill-muted/40 stroke-border/60" strokeWidth="0.8" />
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
