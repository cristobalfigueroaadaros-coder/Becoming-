import { useState } from "react";
import { MapPin, Target, ArrowRight, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import type { SeedPost } from "./SeedPostCard";

const RESONANCE_CONFIG = [
  { key: "inspires_me" as const, emoji: "✨", label: "Inspires me" },
  { key: "creating_similar" as const, emoji: "🤝", label: "Creating similar" },
  { key: "want_to_help" as const, emoji: "💙", label: "Want to help" },
  { key: "needed_this" as const, emoji: "💛", label: "Needed this" },
];

interface CreatorDetailCardProps {
  post: SeedPost | null;
  open: boolean;
  onClose: () => void;
}

export const CreatorDetailCard = ({ post, open, onClose }: CreatorDetailCardProps) => {
  const [clicked, setClicked] = useState<Set<string>>(new Set());
  const [localResonances, setLocalResonances] = useState(post?.resonances ?? { inspires_me: 0, creating_similar: 0, want_to_help: 0, needed_this: 0 });

  // Reset state when post changes
  if (post && localResonances.inspires_me !== post.resonances.inspires_me && clicked.size === 0) {
    setLocalResonances(post.resonances);
  }

  const handleResonance = (key: keyof typeof localResonances) => {
    if (clicked.has(key)) {
      setClicked(prev => { const n = new Set(prev); n.delete(key); return n; });
      setLocalResonances(prev => ({ ...prev, [key]: prev[key] - 1 }));
    } else {
      setClicked(prev => new Set(prev).add(key));
      setLocalResonances(prev => ({ ...prev, [key]: prev[key] + 1 }));
    }
  };

  if (!post) return null;

  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center text-lg font-bold text-primary-foreground"
              style={{ background: `linear-gradient(135deg, ${post.gradient.from}, ${post.gradient.to})` }}
            >
              {post.emoji}
            </div>
            <div>
              <DrawerTitle className="text-base">{post.name}</DrawerTitle>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3" />{post.location}
              </p>
            </div>
          </div>
        </DrawerHeader>

        <div className="px-4 pb-6 space-y-4 overflow-y-auto">
          <p className="text-sm text-foreground leading-relaxed">{post.statement}</p>

          {(post.goal || post.next_step) && (
            <div className="space-y-2 rounded-lg bg-muted/40 p-3">
              {post.goal && (
                <div className="flex items-start gap-2 text-xs">
                  <Target className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <span className="font-semibold text-foreground">Goal</span>
                    <p className="text-muted-foreground">{post.goal}</p>
                  </div>
                </div>
              )}
              {post.next_step && (
                <div className="flex items-start gap-2 text-xs">
                  <ArrowRight className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <span className="font-semibold text-foreground">Next step</span>
                    <p className="text-muted-foreground">{post.next_step}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Resonance buttons */}
          <div className="flex flex-wrap gap-2">
            {RESONANCE_CONFIG.map(({ key, emoji, label }) => (
              <button
                key={key}
                onClick={() => handleResonance(key)}
                className={cn(
                  "flex items-center gap-1.5 text-xs rounded-full px-3 py-1.5 transition-all",
                  clicked.has(key)
                    ? "bg-primary/15 text-primary font-medium"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted"
                )}
              >
                <span>{emoji}</span>
                <span>{label}</span>
                <span className="font-semibold">{localResonances[key]}</span>
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Button size="sm" className="flex-1 text-xs">Connect</Button>
            <Button size="sm" variant="outline" className="text-xs">
              <Bookmark className="w-3.5 h-3.5 mr-1" /> Save
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
