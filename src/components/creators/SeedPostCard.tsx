import { MapPin, Target, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const POST_TYPE_STYLES: Record<string, { label: string; border: string; badge: string }> = {
  creating: { label: "Creating", border: "border-l-blue-500", badge: "bg-blue-500/15 text-blue-400" },
  working_on_self: { label: "Working on myself", border: "border-l-purple-500", badge: "bg-purple-500/15 text-purple-400" },
  looking_for_help: { label: "Looking for help", border: "border-l-amber-500", badge: "bg-amber-500/15 text-amber-400" },
  offering_help: { label: "Offering help", border: "border-l-emerald-500", badge: "bg-emerald-500/15 text-emerald-400" },
};

export interface SeedPost {
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
}

export const SeedPostCard = ({ post }: { post: SeedPost }) => {
  const style = POST_TYPE_STYLES[post.post_type] ?? POST_TYPE_STYLES.creating;

  return (
    <Card className={cn("border-l-[3px] p-4 space-y-3", style.border)}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
            {post.name[0].toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{post.name}</p>
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-0.5">
                <MapPin className="w-3 h-3" />{post.location}
              </span>
              <span>{post.date}</span>
            </div>
          </div>
        </div>
        <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium", style.badge)}>
          {style.label}
        </span>
      </div>

      {/* Statement */}
      <p className="text-sm text-foreground leading-relaxed">{post.statement}</p>

      {/* Goal / Next step */}
      {(post.goal || post.next_step) && (
        <div className="space-y-1">
          {post.goal && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Target className="w-3 h-3 text-primary" />
              <span className="font-medium">Goal:</span> {post.goal}
            </div>
          )}
          {post.next_step && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ArrowRight className="w-3 h-3 text-primary" />
              <span className="font-medium">Next:</span> {post.next_step}
            </div>
          )}
        </div>
      )}

      {/* Themed gradient image */}
      <div
        className="rounded-lg h-40 flex items-center justify-center text-6xl"
        style={{ background: `linear-gradient(135deg, ${post.gradient.from}, ${post.gradient.to})` }}
      >
        {post.emoji}
      </div>

      {/* Static resonance counts */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-0.5">
        <span className="flex items-center gap-1">✨ <span>{post.resonances.inspires_me}</span></span>
        <span className="flex items-center gap-1">🤝 <span>{post.resonances.creating_similar}</span></span>
        <span className="flex items-center gap-1">💙 <span>{post.resonances.want_to_help}</span></span>
        <span className="flex items-center gap-1">💛 <span>{post.resonances.needed_this}</span></span>
      </div>
    </Card>
  );
};
