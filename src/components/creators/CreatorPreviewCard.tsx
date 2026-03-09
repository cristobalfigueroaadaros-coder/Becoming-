import { MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { SeedPost } from "./SeedPostCard";

interface CreatorPreviewCardProps {
  post: SeedPost & { coords: { x: number; y: number } };
  onExpand: () => void;
}

export const CreatorPreviewCard = ({ post, onExpand }: CreatorPreviewCardProps) => {
  const cardX = Math.min(Math.max(post.coords.x, 15), 85);
  const above = post.coords.y > 50;

  return (
    <div
      className="absolute z-30 -translate-x-1/2"
      style={{
        left: `${cardX}%`,
        ...(above ? { bottom: `${100 - post.coords.y + 3}%` } : { top: `${post.coords.y + 3}%` }),
      }}
      onClick={(e) => { e.stopPropagation(); onExpand(); }}
    >
      <Card className="w-56 p-3 space-y-1.5 shadow-lg cursor-pointer hover:shadow-xl transition-shadow border-border/50 bg-card">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-primary-foreground"
            style={{ background: `linear-gradient(135deg, ${post.gradient.from}, ${post.gradient.to})` }}
          >
            {post.name[0]}
          </div>
          <div>
            <p className="text-xs font-semibold text-foreground">{post.name}</p>
            <p className="text-[10px] text-muted-foreground flex items-center gap-0.5">
              <MapPin className="w-2.5 h-2.5" />{post.location}
            </p>
          </div>
        </div>
        <p className="text-[11px] text-foreground/80 leading-snug line-clamp-2">{post.statement}</p>
        <p className="text-[10px] text-primary font-medium">Tap to see more →</p>
      </Card>
    </div>
  );
};
