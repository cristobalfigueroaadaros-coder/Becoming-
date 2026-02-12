import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const STAGE_MENTORS: Record<string, string[]> = {
  DISCOVER: [
    "strategist_mentor",
    "creative_visionary",
    "inner_clarity_mentor",
    "problem_mentor",
    "perspective_mentor",
    "alignment_mentor",
    "design_thinking_mentor",
  ],
  GROW: [
    "strategist_mentor",
    "creative_visionary",
    "business_mentor",
    "perspective_mentor",
    "challenger_mentor",
    "design_thinking_mentor",
    "alignment_mentor",
  ],
  BUILD: [
    "strategist_mentor",
    "creative_visionary",
    "business_mentor",
    "discipline_mentor",
    "marketing_mentor",
    "problem_mentor",
    "design_thinking_mentor",
  ],
};

const OnboardingStep4 = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"assembling" | "done" | "error">("assembling");

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
    assembleMentors();
  }, []);

  const assembleMentors = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Determine entry state
      const focusKey = localStorage.getItem("onboarding_focus");
      let entryState = "DISCOVER"; // default
      if (focusKey === "grow_purpose") entryState = "GROW";
      else if (focusKey === "already_working") entryState = "BUILD";

      const mentors = STAGE_MENTORS[entryState] || STAGE_MENTORS.DISCOVER;

      // Clear any existing mentors first to avoid duplicates
      await supabase
        .from("user_mentors")
        .delete()
        .eq("user_id", user.id);

      const { error } = await supabase
        .from("user_mentors")
        .insert(
          mentors.map((mentorType) => ({
            user_id: user.id,
            mentor_type: mentorType as any,
          }))
        );

      if (error) throw error;

      setStatus("done");

      // Brief pause to show success state, then navigate
      setTimeout(() => {
        navigate("/onboarding/quest");
      }, 1200);
    } catch (error: any) {
      console.error("Failed to assemble council:", error);
      setStatus("error");
      toast.error("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center space-y-6 max-w-md"
      >
        <motion.div
          animate={{ rotate: status === "assembling" ? 360 : 0 }}
          transition={{ duration: 2, repeat: status === "assembling" ? Infinity : 0, ease: "linear" }}
          className="w-20 h-20 mx-auto rounded-full bg-primary/20 flex items-center justify-center"
        >
          <Sparkles className="w-10 h-10 text-primary" />
        </motion.div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold">
            {status === "assembling" && "Assembling your Project Council..."}
            {status === "done" && "Your Council is ready ✨"}
            {status === "error" && "Something went wrong"}
          </h1>
          <p className="text-muted-foreground text-lg">
            {status === "assembling" && "Selecting the best mentors for your journey"}
            {status === "done" && "7 mentors matched to your path"}
            {status === "error" && "Please refresh and try again"}
          </p>
        </div>

        {status === "error" && (
          <button
            onClick={() => { setStatus("assembling"); assembleMentors(); }}
            className="text-primary underline"
          >
            Try again
          </button>
        )}
      </motion.div>
    </div>
  );
};

export default OnboardingStep4;
