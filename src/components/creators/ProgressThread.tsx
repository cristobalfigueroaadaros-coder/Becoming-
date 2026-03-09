import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { format } from "date-fns";
import type { CreatorUpdate } from "@/hooks/useCreatorPosts";

interface ProgressThreadProps {
  updates: CreatorUpdate[];
  isOwner: boolean;
  onAddUpdate: (content: string) => Promise<void>;
}

export const ProgressThread = ({ updates, isOwner, onAddUpdate }: ProgressThreadProps) => {
  const [showForm, setShowForm] = useState(false);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setSubmitting(true);
    await onAddUpdate(content.trim());
    setContent("");
    setShowForm(false);
    setSubmitting(false);
  };

  if (updates.length === 0 && !isOwner) return null;

  return (
    <div className="space-y-2 mt-3">
      {updates.length > 0 && (
        <div className="space-y-1.5 border-l-2 border-primary/20 pl-3">
          {updates.map((u) => (
            <div key={u.id} className="text-xs">
              <span className="text-muted-foreground">{format(new Date(u.created_at), "MMM d")}</span>
              <p className="text-foreground/90">{u.content}</p>
            </div>
          ))}
        </div>
      )}

      {isOwner && !showForm && (
        <button onClick={() => setShowForm(true)} className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors">
          <Plus className="w-3 h-3" /> Add progress update
        </button>
      )}

      {showForm && (
        <div className="space-y-2">
          <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Share your progress..." className="min-h-[60px] text-sm" maxLength={500} />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSubmit} disabled={!content.trim() || submitting}>Post update</Button>
            <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}
    </div>
  );
};
