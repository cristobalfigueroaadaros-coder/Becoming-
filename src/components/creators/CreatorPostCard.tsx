import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, ChevronDown, ChevronUp, Target, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { ResonanceButtons } from "./ResonanceButtons";
import { ProgressThread } from "./ProgressThread";
import { CommentSection } from "./CommentSection";
import type { CreatorPost, CreatorResonance, CreatorComment, CreatorUpdate, ResonanceType } from "@/hooks/useCreatorPosts";

const POST_TYPE_STYLES: Record<string, { label: string; border: string; badge: string }> = {
  creating: { label: "Creating", border: "border-l-blue-500", badge: "bg-blue-500/15 text-blue-400" },
  working_on_self: { label: "Working on myself", border: "border-l-purple-500", badge: "bg-purple-500/15 text-purple-400" },
  looking_for_help: { label: "Looking for help", border: "border-l-amber-500", badge: "bg-amber-500/15 text-amber-400" },
  offering_help: { label: "Offering help", border: "border-l-emerald-500", badge: "bg-emerald-500/15 text-emerald-400" },
};

interface CreatorPostCardProps {
  post: CreatorPost;
  currentUserId: string | null;
  resonances: CreatorResonance[];
  updates: CreatorUpdate[];
  comments: CreatorComment[];
  onToggleResonance: (type: ResonanceType) => void;
  onAddUpdate: (content: string) => Promise<void>;
  onAddComment: (content: string) => Promise<void>;
}

export const CreatorPostCard = ({
  post, currentUserId, resonances, updates, comments,
  onToggleResonance, onAddUpdate, onAddComment,
}: CreatorPostCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const style = POST_TYPE_STYLES[post.post_type] || POST_TYPE_STYLES.creating;
  const isOwner = currentUserId === post.user_id;

  return (
    <Card className={cn("border-l-[3px] p-4 space-y-3", style.border)}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
            {(post.profiles?.display_name || "?")[0].toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{post.profiles?.display_name || "Creator"}</p>
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              {post.location && (
                <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" />{post.location}</span>
              )}
              <span>{format(new Date(post.created_at), "MMM d, yyyy")}</span>
            </div>
          </div>
        </div>
        <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium", style.badge)}>{style.label}</span>
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

      {/* Image */}
      {post.image_url && (
        <img src={post.image_url} alt="" className="rounded-lg w-full max-h-60 object-cover" />
      )}

      {/* Resonance buttons */}
      <ResonanceButtons resonances={resonances} currentUserId={currentUserId} onToggle={onToggleResonance} />

      {/* Expand */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        {updates.length > 0 ? `${updates.length} update${updates.length > 1 ? "s" : ""}` : ""}
        {updates.length > 0 && comments.length > 0 ? " · " : ""}
        {comments.length > 0 ? `${comments.length} comment${comments.length > 1 ? "s" : ""}` : ""}
        {updates.length === 0 && comments.length === 0 ? (isOwner ? "Add update or comment" : "Comment") : ""}
      </button>

      {expanded && (
        <>
          <ProgressThread updates={updates} isOwner={isOwner} onAddUpdate={onAddUpdate} />
          <CommentSection comments={comments} onAddComment={onAddComment} />
        </>
      )}
    </Card>
  );
};
