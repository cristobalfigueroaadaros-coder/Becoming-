import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Target, CheckCircle2, SkipForward, Sparkles, RefreshCw } from "lucide-react";

export const TodaysChallengeWidget = () => {
  const [challenge, setChallenge] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showReflectionModal, setShowReflectionModal] = useState(false);
  const [reflection, setReflection] = useState("");
  const [isCompleting, setIsCompleting] = useState(false);

  useEffect(() => {
    loadTodaysChallenge();
  }, []);

  const loadTodaysChallenge = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from("daily_challenge")
        .select("*")
        .eq("user_id", user.id)
        .eq("date", today)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error loading challenge:", error);
        return;
      }

      setChallenge(data || null);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateChallenge = async () => {
    setGenerating(true);
    try {
      const { data: functionData, error: functionError } = await supabase.functions.invoke(
        'generate-daily-challenge'
      );

      if (functionError) throw functionError;

      setChallenge(functionData.challenge);
      toast.success("Today's challenge is ready!");
    } catch (error) {
      console.error("Error generating challenge:", error);
      toast.error("Failed to generate challenge");
    } finally {
      setGenerating(false);
    }
  };

  const handleComplete = async () => {
    if (!reflection.trim()) {
      toast.error("Please share your reflection");
      return;
    }

    setIsCompleting(true);
    try {
      const { error } = await supabase
        .from("daily_challenge")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          reflection_text: reflection.trim()
        })
        .eq("id", challenge.id);

      if (error) throw error;

      toast.success("Challenge completed! 🎉");
      setShowReflectionModal(false);
      setReflection("");
      loadTodaysChallenge();
    } catch (error) {
      console.error("Error completing challenge:", error);
      toast.error("Failed to complete challenge");
    } finally {
      setIsCompleting(false);
    }
  };

  const handleSkip = async () => {
    try {
      const { error } = await supabase
        .from("daily_challenge")
        .update({ status: "skipped" })
        .eq("id", challenge.id);

      if (error) throw error;

      toast("Challenge skipped");
      loadTodaysChallenge();
    } catch (error) {
      console.error("Error skipping challenge:", error);
      toast.error("Failed to skip challenge");
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse">Loading today's challenge...</div>
        </CardContent>
      </Card>
    );
  }

  if (!challenge) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Today's Challenge
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            No challenge generated yet for today. Generate one to get started!
          </p>
          <Button onClick={generateChallenge} disabled={generating} className="w-full">
            {generating ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Today's Challenge
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (challenge.status === "completed") {
    return (
      <Card className="border-primary/50 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <CheckCircle2 className="w-5 h-5" />
            Challenge Completed!
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <h4 className="font-semibold">{challenge.challenge_title}</h4>
              <p className="text-sm text-muted-foreground mt-1">
                {challenge.challenge_description}
              </p>
            </div>
            {challenge.reflection_text && (
              <div className="bg-background p-3 rounded-lg">
                <p className="text-sm font-medium mb-1">Your Reflection:</p>
                <p className="text-sm text-muted-foreground">{challenge.reflection_text}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (challenge.status === "skipped") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-muted-foreground" />
            Challenge Skipped
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            You skipped today's challenge. Come back tomorrow for a new one!
          </p>
          <p className="text-xs text-muted-foreground italic">
            {challenge.challenge_title}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Today's Challenge
          </CardTitle>
          <p className="text-xs text-muted-foreground">{challenge.source_reason}</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-lg mb-2">{challenge.challenge_title}</h4>
              <p className="text-muted-foreground">{challenge.challenge_description}</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setShowReflectionModal(true)} className="flex-1">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Complete
              </Button>
              <Button onClick={handleSkip} variant="outline" size="sm">
                <SkipForward className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showReflectionModal} onOpenChange={setShowReflectionModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Challenge Reflection</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">What did you do?</label>
              <Textarea
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                placeholder="Share what you did and what you learned..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReflectionModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleComplete} disabled={isCompleting || !reflection.trim()}>
              {isCompleting ? "Saving..." : "Complete Challenge"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};