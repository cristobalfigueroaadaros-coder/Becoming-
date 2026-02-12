import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users } from "lucide-react";
import { motion } from "framer-motion";
import { mentorDisplayNames, type ValidMentorId } from "@/lib/mentorTypes";

const MENTOR_DESCRIPTORS: Record<string, string> = {
  strategist_mentor: "Clarity and structured planning",
  creative_visionary: "Imagination and expansion",
  business_mentor: "Leverage and execution",
  problem_mentor: "Clear problem definition",
  discipline_mentor: "Focus and ownership",
  perspective_mentor: "Systems thinking",
  challenger_mentor: "Exposes blind spots",
  alignment_mentor: "Values and direction alignment",
  design_thinking_mentor: "Iterative experimentation",
  inner_clarity_mentor: "Self-awareness and inner patterns",
  marketing_mentor: "Positioning and reach",
};

const STAGE_DESCRIPTIONS: Record<string, { label: string; text: string }> = {
  DISCOVER: {
    label: "Discover",
    text: "This Council is designed to help you connect the dots, clarify direction, and shape a meaningful project aligned with who you are.",
  },
  GROW: {
    label: "Grow",
    text: "This Council is designed to refine your direction, strengthen your thinking, and help you build something more powerful from what you already sense.",
  },
  BUILD: {
    label: "Build",
    text: "This Council is designed to accelerate your execution, sharpen your strategy, and help you move your project or business forward.",
  },
};

const ProjectCouncilIntroduction = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");
  const [entryState, setEntryState] = useState("DISCOVER");
  const [mentors, setMentors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [profileRes, mentorsRes] = await Promise.all([
        supabase.from("profiles").select("birth_name, entry_state").eq("id", user.id).single(),
        supabase.from("user_mentors").select("mentor_type").eq("user_id", user.id),
      ]);

      if (profileRes.data) {
        setUserName(profileRes.data.birth_name || "");
        setEntryState(profileRes.data.entry_state || "DISCOVER");
      }
      if (mentorsRes.data) {
        setMentors(mentorsRes.data.map((m: any) => m.mentor_type));
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const stage = STAGE_DESCRIPTIONS[entryState] || STAGE_DESCRIPTIONS.DISCOVER;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4 py-12 flex items-center justify-center">
      <motion.div
        className="max-w-xl w-full space-y-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Greeting */}
        <div className="text-center space-y-2">
          <motion.p
            className="text-lg text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Hello, {userName}.
          </motion.p>
          <motion.h1
            className="text-3xl font-bold text-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            This is your Project Council.
          </motion.h1>
        </div>

        {/* Stage description */}
        <motion.div
          className="text-center space-y-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <p className="text-sm font-medium text-primary">
            You are in the {stage.label} stage.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            {stage.text}
          </p>
        </motion.div>

        {/* Mentor roster */}
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          <div className="flex items-center gap-2 justify-center">
            <Users className="w-4 h-4 text-primary" />
            <p className="text-sm font-medium text-foreground">You will be guided by:</p>
          </div>
          <div className="space-y-2">
            {mentors.map((mentorId, i) => (
              <motion.div
                key={mentorId}
                className="flex items-baseline gap-2 px-4"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1 + i * 0.08 }}
              >
                <span className="font-medium text-foreground text-sm">
                  {mentorDisplayNames[mentorId as ValidMentorId] || mentorId}
                </span>
                <span className="text-muted-foreground text-xs">
                  — {MENTOR_DESCRIPTORS[mentorId] || ""}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Closing */}
        <motion.p
          className="text-center text-sm text-muted-foreground leading-relaxed max-w-md mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6 }}
        >
          We are here to think with you, challenge you, and support you as you move forward.
          This is not random advice. This is about building something meaningful together.
        </motion.p>

        {/* CTA */}
        <motion.div
          className="flex justify-center pt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8 }}
        >
          <Button
            size="lg"
            onClick={() => navigate("/gravity/council-intro")}
            className="gap-2"
          >
            Next
            <ArrowRight className="w-4 h-4" />
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ProjectCouncilIntroduction;
