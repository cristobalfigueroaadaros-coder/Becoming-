import { useState } from "react";
import { ArrowLeft, Send, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AtlasDot } from "@/hooks/useAtlas";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CLUSTER_DEEPENING_QUESTIONS } from "@/data/atlasQuests";

interface AtlasDotDeepLayerProps {
  dot: AtlasDot;
  clusterSlug: string;
  clusterName: string;
  onBack: () => void;
}

export const AtlasDotDeepLayer = ({ dot, clusterSlug, clusterName, onBack }: AtlasDotDeepLayerProps) => {
  const questions = CLUSTER_DEEPENING_QUESTIONS[clusterSlug] || CLUSTER_DEEPENING_QUESTIONS["skills"];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [saving, setSaving] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [answeredCount, setAnsweredCount] = useState(0);
  const queryClient = useQueryClient();

  const displayTitle = (dot as any).original_title || dot.title;

  const handleSubmit = async () => {
    if (!answer.trim()) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase.from("atlas_mini_dots").insert({
        user_id: user.id,
        parent_dot_id: dot.id,
        content: answer.trim(),
        origin: "system",
        cluster_slug: clusterSlug,
      });
      if (error) throw error;

      const newCount = answeredCount + 1;
      setAnsweredCount(newCount);
      setAnswer("");

      if (currentIndex < questions.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        setCompleted(true);
        queryClient.invalidateQueries({ queryKey: ["atlas-mini-dots", dot.id] });
        toast.success(`${newCount} deeper insight${newCount > 1 ? "s" : ""} created`);
      }
    } catch (e) {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (completed) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-4">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Check className="w-6 h-6 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-1">You went deeper</h3>
        <p className="text-sm text-muted-foreground mb-6">
          {answeredCount} insight{answeredCount > 1 ? "s" : ""} added to "{displayTitle}"
        </p>
        <Button variant="outline" onClick={onBack}>Back to dot</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Going deeper into</p>
          <h3 className="text-sm font-medium text-foreground truncate">{displayTitle}</h3>
        </div>
      </div>

      {/* Progress */}
      <div className="flex gap-1 mb-6">
        {questions.map((_: string, i: number) => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full transition-colors"
            style={{
              backgroundColor: i <= currentIndex ? "hsl(var(--primary))" : "hsl(var(--muted))",
            }}
          />
        ))}
      </div>

      {/* Question */}
      <div className="flex-1 flex flex-col justify-center px-2">
        <p className="text-base font-medium text-foreground mb-4">{questions[currentIndex]}</p>
        <div className="flex gap-2">
          <Input
            placeholder="Your answer..."
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            className="text-sm"
            autoFocus
          />
          <Button size="icon" onClick={handleSubmit} disabled={saving || !answer.trim()}>
            <Send className="w-3.5 h-3.5" />
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground/60 mt-2">
          Question {currentIndex + 1} of {questions.length}
        </p>
      </div>
    </div>
  );
};
