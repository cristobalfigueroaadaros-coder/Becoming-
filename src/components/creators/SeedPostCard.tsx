import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Target, ArrowRight, MessageCircle, UserPlus, Send } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const POST_TYPE_STYLES: Record<string, { label: string; border: string; badge: string }> = {
  creating: { label: "Creating", border: "border-l-blue-500", badge: "bg-blue-500/15 text-blue-400" },
  working_on_self: { label: "Working on myself", border: "border-l-purple-500", badge: "bg-purple-500/15 text-purple-400" },
  looking_for_help: { label: "Looking for help", border: "border-l-amber-500", badge: "bg-amber-500/15 text-amber-400" },
  offering_help: { label: "Offering help", border: "border-l-emerald-500", badge: "bg-emerald-500/15 text-emerald-400" },
};

const RESONANCE_CONFIG = [
  { key: "inspires_me" as const, emoji: "✨", label: "Inspires me" },
  { key: "creating_similar" as const, emoji: "🤝", label: "Creating similar" },
  { key: "want_to_help" as const, emoji: "💙", label: "Want to help" },
  { key: "needed_this" as const, emoji: "💛", label: "Needed this" },
];




interface SeedComment {
  id: string;
  name: string;
  location?: string;
  text: string;
  date: string;
}

// Some pre-seeded comments for demo
const SEED_COMMENTS: Record<string, SeedComment[]> = {
  "seed-1": [
    { id: "c1", name: "Aisha", location: "Dubai", text: "This is so needed! Conscious parenting can change everything. Rooting for you 🙌", date: "Mar 2" },
  ],
  "seed-3": [
    { id: "c2", name: "Tom", location: "Sydney", text: "I've been wanting something like this in my city. So inspiring!", date: "Mar 4" },
    { id: "c3", name: "Raj", text: "Men need this. Thank you for creating it 💙", date: "Mar 5" },
  ],
  "seed-4": [
    { id: "c4", name: "Nina", location: "Costa Rica", text: "Happy to support if needed! I organize cleanups too 🌊", date: "Mar 5" },
  ],
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
  coords?: { x: number; y: number };
  category?: string;
}

export const SeedPostCard = ({ post }: { post: SeedPost }) => {
  const navigate = useNavigate();
  const style = POST_TYPE_STYLES[post.post_type] ?? POST_TYPE_STYLES.creating;
  const [localResonances, setLocalResonances] = useState(post.resonances);
  const [clicked, setClicked] = useState<Set<string>>(new Set());
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<SeedComment[]>(SEED_COMMENTS[post.id] || []);
  const [commentText, setCommentText] = useState("");

  const handleResonance = (key: keyof typeof post.resonances) => {
    if (clicked.has(key)) {
      setClicked((prev) => { const n = new Set(prev); n.delete(key); return n; });
      setLocalResonances((prev) => ({ ...prev, [key]: prev[key] - 1 }));
    } else {
      setClicked((prev) => new Set(prev).add(key));
      setLocalResonances((prev) => ({ ...prev, [key]: prev[key] + 1 }));
    }
  };

  const handleAddComment = () => {
    const trimmed = commentText.trim();
    if (!trimmed || trimmed.length > 200) return;
    setComments(prev => [...prev, {
      id: `local-${Date.now()}`,
      name: "You",
      text: trimmed,
      date: "Just now",
    }]);
    setCommentText("");
  };

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
              <span className="font-medium text-foreground">Goal:</span> {post.goal}
            </div>
          )}
          {post.next_step && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ArrowRight className="w-3 h-3 text-primary" />
              <span className="font-medium text-foreground">Next:</span> {post.next_step}
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

      {/* Interactive resonance buttons + comment toggle */}
      <div className="flex flex-wrap items-center gap-2 pt-0.5">
        {RESONANCE_CONFIG.map(({ key, emoji, label }) => (
          <button
            key={key}
            onClick={() => handleResonance(key)}
            className={cn(
              "flex items-center gap-1.5 text-xs rounded-full px-2.5 py-1 transition-all",
              clicked.has(key)
                ? "bg-primary/15 text-primary font-medium scale-105"
                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <span>{emoji}</span>
            <span className="hidden sm:inline">{label}</span>
            <span className="font-medium">{localResonances[key]}</span>
          </button>
        ))}
        <button
          onClick={() => setShowComments(!showComments)}
          className={cn(
            "flex items-center gap-1 text-xs rounded-full px-2.5 py-1 transition-all ml-auto",
            showComments
              ? "bg-primary/15 text-primary font-medium"
              : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <MessageCircle className="w-3 h-3" />
          <span>{comments.length}</span>
        </button>
      </div>

      {/* Comment Section */}
      {showComments && (
        <div className="space-y-3 pt-1 border-t border-border/50">
          {/* Guideline */}
          <p className="text-[10px] text-muted-foreground/60 text-center italic">
            This space is for positive support, encouragement, and collaboration.
          </p>

          {/* Existing comments */}
          {comments.length > 0 && (
            <div className="space-y-2.5">
              {comments.map(comment => (
                <div key={comment.id} className="flex gap-2">
                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground shrink-0 mt-0.5">
                    {comment.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium text-foreground">{comment.name}</span>
                      {comment.location && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                          <MapPin className="w-2.5 h-2.5" />{comment.location}
                        </span>
                      )}
                      <span className="text-[10px] text-muted-foreground/50 ml-auto shrink-0">{comment.date}</span>
                    </div>
                    <p className="text-xs text-foreground/80 leading-relaxed">{comment.text}</p>
                    {comment.name !== "You" && (
                      <button className="flex items-center gap-1 text-[10px] text-primary/70 hover:text-primary mt-0.5 transition-colors">
                        <UserPlus className="w-2.5 h-2.5" /> Connect
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}




          {/* Comment input */}
          <div className="flex gap-2 items-end">
            <div className="flex-1 relative">
              <textarea
                value={commentText}
                onChange={e => setCommentText(e.target.value.slice(0, 200))}
                placeholder="Write something supportive or share how this resonates with you..."
                rows={2}
                className="w-full text-xs bg-muted/30 border border-border/50 rounded-lg px-3 py-2 resize-none placeholder:text-muted-foreground/50 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <span className={cn(
                "absolute bottom-1.5 right-2 text-[9px]",
                commentText.length > 180 ? "text-destructive" : "text-muted-foreground/40"
              )}>
                {commentText.length}/200
              </span>
            </div>
            <Button
              size="icon"
              className="h-8 w-8 shrink-0"
              disabled={!commentText.trim()}
              onClick={handleAddComment}
            >
              <Send className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};
