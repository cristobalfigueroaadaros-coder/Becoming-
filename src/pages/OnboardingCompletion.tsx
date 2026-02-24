import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import confetti from "canvas-confetti";
import { Sparkles } from "lucide-react";

const MISSION_TEXT: Record<string, string> = {
  DISCOVER:
    "We'll identify a project direction worth committing to for the next 7 days — something aligned with your curiosity and strengths.",
  GROW:
    "We'll refine your current direction and test a sharper version of it.",
  BUILD:
    "We'll optimize your current trajectory and define your next execution sprint.",
};

const OnboardingCompletion = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<string | null>(null);
  const [stage, setStage] = useState("DISCOVER");
  const [loading, setLoading] = useState(true);
  const confettiFired = useRef(false);

  useEffect(() => {
    // Fire confetti once
    if (!confettiFired.current) {
      confettiFired.current = true;
      setTimeout(() => {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.35 },
          colors: ["hsl(var(--primary))", "hsl(var(--accent))", "#FFD700"],
        });
      }, 600);
    }

    const fetchSummary = async () => {
      try {
        const { data, error } = await supabase.functions.invoke(
          "generate-onboarding-summary",
          {}
        );
        if (!error && data) {
          setSummary(data.summary);
          setStage(data.stage || "DISCOVER");
        }
      } catch (e) {
        console.error("Failed to fetch summary:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  const handleCTA = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("profiles")
          .update({ onboarding_completion_seen: true } as any)
          .eq("id", user.id);
      }
    } catch (e) {
      console.error("Failed to update profile:", e);
    }
    navigate("/council");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-accent/5 px-4">
      <div className="max-w-xl w-full space-y-10 text-center py-12">
        {/* Block 1: Celebration */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7 }}
          className="space-y-4"
        >
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center shadow-lg">
            <Sparkles className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold text-foreground">
            Onboarding Complete.
          </h1>
          <p className="text-muted-foreground text-lg">
            You've taken the first step.
          </p>
        </motion.div>

        {/* Block 2: AI Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.7 }}
          className="text-left bg-card/60 backdrop-blur-sm border border-border/50 rounded-xl p-6 space-y-3"
        >
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
              <Skeleton className="h-4 w-full" />
            </div>
          ) : (
            summary?.split("\n").map((line, i) => (
              <motion.p
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * i, duration: 0.4 }}
                className={
                  i === (summary.split("\n").length - 1)
                    ? "text-foreground font-medium"
                    : "text-muted-foreground"
                }
              >
                {line}
              </motion.p>
            ))
          )}
        </motion.div>

        {/* Block 3: Mission Framing */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.7 }}
          className="space-y-3"
        >
          <p className="text-sm text-muted-foreground uppercase tracking-wider">
            Your focus now
          </p>
          <p className="text-lg text-foreground/90 leading-relaxed">
            {MISSION_TEXT[stage] || MISSION_TEXT.DISCOVER}
          </p>
        </motion.div>

        {/* Block 4: CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.7 }}
        >
          <Button
            size="lg"
            onClick={handleCTA}
            className="text-lg px-10 py-6"
          >
            Start My Project Session
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default OnboardingCompletion;
