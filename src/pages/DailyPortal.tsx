import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Zap, AlertTriangle, Target, ArrowRight } from "lucide-react";
import { toast } from "sonner";

const DailyPortal = () => {
  const navigate = useNavigate();
  const [portal, setPortal] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrCreatePortal();
  }, []);

  const loadOrCreatePortal = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Check for today's portal entry
      const today = new Date().toISOString().split("T")[0];
      const { data: existingPortal } = await supabase
        .from("daily_portal_entries")
        .select("*")
        .eq("user_id", user.id)
        .gte("created_at", `${today}T00:00:00`)
        .maybeSingle();

      if (existingPortal && existingPortal.shown_at) {
        // Already shown today, redirect to dashboard
        navigate("/dashboard");
        return;
      }

      if (existingPortal) {
        // Mark as shown
        await supabase
          .from("daily_portal_entries")
          .update({ shown_at: new Date().toISOString() })
          .eq("id", existingPortal.id);
        setPortal(existingPortal);
      } else {
        // Create new portal entry using AI
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        const { data: progress } = await supabase
          .from("future_self_progress")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        // Generate portal content
        const portalPrompt = `Generate a Daily Portal message for a user at Evolution Level ${progress?.evolution_level || 1} with ${progress?.global_xp || 0} XP. Priority: ${profile?.priority_growth_area || "Growth"}. 
        
Include:
- One sentence truth about their journey
- A mini challenge for today
- A brief evolution reminder
        
Keep it under 100 words total. Be inspiring and direct.`;

        const aiResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: [{ role: "user", content: portalPrompt }]
          }),
        });

        const aiData = await aiResponse.json();
        const content = aiData.choices?.[0]?.message?.content || "Welcome to your daily portal!";

        const newPortal = {
          user_id: user.id,
          one_sentence_truth: content.split("\n")[0],
          mini_challenge: content.split("\n")[1] || "Complete one task today",
          evolution_reminder: `You're at Level ${progress?.evolution_level || 1}`,
          shown_at: new Date().toISOString(),
        };

        const { data: created } = await supabase
          .from("daily_portal_entries")
          .insert(newPortal)
          .select()
          .single();

        setPortal(created);
      }
    } catch (error: any) {
      console.error("Portal error:", error);
      toast.error("Unable to load portal");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center">
        <p className="text-muted-foreground">Opening Daily Portal...</p>
      </div>
    );
  }

  if (!portal) {
    navigate("/dashboard");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-mentor-future/10 via-background to-accent/10 p-4 py-12 flex items-center justify-center">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-mentor-future to-accent rounded-full flex items-center justify-center animate-pulse">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold">Daily Portal</h1>
          <p className="text-muted-foreground">Your personal gateway to transformation</p>
        </div>

        <Card className="shadow-2xl border-mentor-future/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              One-Sentence Truth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg">{portal.one_sentence_truth}</p>
          </CardContent>
        </Card>

        <Card className="shadow-2xl border-accent/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Today's Challenge
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>{portal.mini_challenge}</p>
          </CardContent>
        </Card>

        {portal.shadow_warning && (
          <Card className="shadow-2xl border-destructive/20 bg-destructive/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                Shadow Alert
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>{portal.shadow_warning}</p>
            </CardContent>
          </Card>
        )}

        <Card className="shadow-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Evolution Reminder
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>{portal.evolution_reminder}</p>
          </CardContent>
        </Card>

        <Button 
          size="lg" 
          className="w-full" 
          onClick={() => navigate("/dashboard")}
        >
          Enter Your Council <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default DailyPortal;