import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { format } from "date-fns";
import type { CreatorComment } from "@/hooks/useCreatorPosts";

interface CommentSectionProps {
  comments: CreatorComment[];
  onAddComment: (content: string) => Promise<void>;
}

export const CommentSection = ({ comments, onAddComment }: CommentSectionProps) => {
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setSubmitting(true);
    await onAddComment(content.trim());
    setContent("");
    setSubmitting(false);
  };

  return (
    <div className="space-y-2 mt-3">
      {comments.map((c) => (
        <div key={c.id} className="flex gap-2 text-xs">
          <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground shrink-0">
            {(c.profiles?.display_name || "?")[0].toUpperCase()}
          </div>
          <div>
            <span className="font-medium text-foreground">{c.profiles?.display_name || "Creator"}</span>
            <span className="text-muted-foreground ml-1.5">{format(new Date(c.created_at), "MMM d")}</span>
            <p className="text-foreground/80">{c.content}</p>
          </div>
        </div>
      ))}

      <p className="text-[10px] text-muted-foreground/60 italic">This space is for positive support, collaboration, and encouragement.</p>

      <div className="flex gap-2">
        <Input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Leave an encouraging comment..."
          className="text-xs h-8"
          maxLength={300}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        />
        <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={handleSubmit} disabled={!content.trim() || submitting}>
          <Send className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
};
