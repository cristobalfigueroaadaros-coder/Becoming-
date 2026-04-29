import { useState, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
  Marker,
} from "react-simple-maps";
import { CreatorDetailCard } from "./CreatorDetailCard";
import type { SeedPost } from "./SeedPostCard";
import { Card } from "@/components/ui/card";
import { MapPin, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface MapSeedPost extends SeedPost {
  coords: { x: number; y: number };
  category: string;
}

const CATEGORIES = ["All", "Family", "Education", "Healing", "Community", "Environment", "Art", "Tech for Good"] as const;

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

export const CreatorMap = ({ posts }: { posts: MapSeedPost[] }) => {
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailPost, setDetailPost] = useState<MapSeedPost | null>(null);
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState<[number, number]>([10, 20]);

  const filtered = useMemo(() => {
    if (activeCategory === "All") return posts;
    return posts.filter(p => p.category.toLowerCase() === activeCategory.toLowerCase());
  }, [posts, activeCategory]);

  const selectedPost = filtered.find(p => p.id === selectedId) ?? null;

  const handleZoomIn = useCallback(() => setZoom(z => Math.min(z * 1.5, 8)), []);
  const handleZoomOut = useCallback(() => setZoom(z => Math.max(z / 1.5, 1)), []);
  const handleReset = useCallback(() => { setZoom(1); setCenter([10, 20]); }, []);

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
      <div className="relative rounded-xl border border-border/50 overflow-hidden bg-primary/[0.02]">
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ scale: 120, center: [0, 30] }}
          style={{ width: "100%", height: "auto" }}
          height={400}
        >
          <ZoomableGroup
            zoom={zoom}
            center={center}
            onMoveEnd={({ coordinates, zoom: z }) => { setCenter(coordinates as [number, number]); setZoom(z); }}
            maxZoom={8}
            minZoom={1}
          >
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies.map((geo) => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onClick={() => setSelectedId(null)}
                    style={{
                      default: { fill: "hsl(var(--muted))", stroke: "hsl(var(--border))", strokeWidth: 0.5, outline: "none" },
                      hover: { fill: "hsl(var(--muted))", stroke: "hsl(var(--border))", strokeWidth: 0.5, outline: "none" },
                      pressed: { fill: "hsl(var(--muted))", stroke: "hsl(var(--border))", strokeWidth: 0.5, outline: "none" },
                    }}
                  />
                ))
              }
            </Geographies>

            {/* Creator markers */}
            {filtered.map(post => (
              <Marker
                key={post.id}
                coordinates={[post.coords.x, post.coords.y]}
                onClick={(e) => {
                  e.stopPropagation?.();
                  setSelectedId(prev => prev === post.id ? null : post.id);
                }}
              >
                {/* Pulse ring */}
                <circle r={6 / zoom} fill={post.gradient.from} opacity={0.25}>
                  <animate attributeName="r" from={4 / zoom} to={10 / zoom} dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" from="0.4" to="0" dur="2s" repeatCount="indefinite" />
                </circle>
                {/* Pin dot */}
                <circle
                  r={selectedId === post.id ? 5 / zoom : 3.5 / zoom}
                  fill={post.gradient.from}
                  stroke="hsl(var(--background))"
                  strokeWidth={1.5 / zoom}
                  className="cursor-pointer transition-all"
                  style={{ filter: `drop-shadow(0 0 ${3 / zoom}px ${post.gradient.from}40)` }}
                />
              </Marker>
            ))}
          </ZoomableGroup>
        </ComposableMap>

        {/* Zoom controls */}
        <div className="absolute bottom-3 right-3 flex flex-col gap-1">
          <Button size="icon" variant="outline" className="h-7 w-7 bg-background/80 backdrop-blur-sm" onClick={handleZoomIn}>
            <ZoomIn className="w-3.5 h-3.5" />
          </Button>
          <Button size="icon" variant="outline" className="h-7 w-7 bg-background/80 backdrop-blur-sm" onClick={handleZoomOut}>
            <ZoomOut className="w-3.5 h-3.5" />
          </Button>
          <Button size="icon" variant="outline" className="h-7 w-7 bg-background/80 backdrop-blur-sm" onClick={handleReset}>
            <RotateCcw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Preview card overlay */}
      {selectedPost && (
        <Card
          className="p-3 space-y-1.5 cursor-pointer hover:shadow-md transition-shadow border-border/50"
          onClick={() => { setDetailPost(selectedPost); setSelectedId(null); }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-primary-foreground shrink-0"
              style={{ background: `linear-gradient(135deg, ${selectedPost.gradient.from}, ${selectedPost.gradient.to})` }}
            >
              {selectedPost.emoji}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">{selectedPost.name}</p>
              <p className="text-[11px] text-muted-foreground flex items-center gap-0.5">
                <MapPin className="w-3 h-3 shrink-0" />{selectedPost.location}
              </p>
            </div>
          </div>
          <p className="text-xs text-foreground/80 leading-relaxed line-clamp-2">{selectedPost.statement}</p>
          <p className="text-[10px] text-primary font-medium">Tap to see full profile →</p>
        </Card>
      )}

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
