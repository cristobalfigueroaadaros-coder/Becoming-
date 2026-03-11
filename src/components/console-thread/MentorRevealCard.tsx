import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Check } from "lucide-react";
import { motion } from "framer-motion";
import { mentorDisplayNames, type ValidMentorId } from "@/lib/mentorTypes";
import confetti from "canvas-confetti";

// Mentor descriptors reused from ProjectCouncilIntroduction
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
  quantum_inventor: "Breakthrough innovation",
  mystic_mentor: "Deep intuition and patterns",
  scientific_mentor: "Evidence-based thinking",
  heart_mentor: "Emotional intelligence",
  ancient_sage: "Timeless wisdom",
  oracle_mother: "Nurturing guidance",
  future_self: "Your future vision",
};

interface MentorRevealCardProps {
  mentors: string[];
  entryState: string;
  onAccept: () => void;
  accepted?: boolean;
}

const MentorRevealCard = ({ mentors, entryState, onAccept, accepted }: MentorRevealCardProps) => {
  const stageLabel = entryState === "GROW" ? "Grow" : entryState === "BUILD" ? "Build" : "Discover";

  useEffect(() => {
    if (!accepted) {
      confetti({ particleCount: 60, spread: 50, origin: { y: 0.7 }, colors: ['#8B5CF6', '#D946EF', '#10B981'] });
    }
  }, []);

  return (
    <Card className="border-primary/20 bg-card/80 backdrop-blur-sm overflow-hidden">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Your {stageLabel} Council</span>
        </div>

        <div className="space-y-2">
          {mentors.map((mentorId, i) => (
            <motion.div
              key={mentorId}
              className="flex items-baseline gap-2"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <span className="text-sm font-medium text-foreground">
                {mentorDisplayNames[mentorId as ValidMentorId] || mentorId.replace(/_/g, ' ')}
              </span>
              <span className="text-xs text-muted-foreground">
                — {MENTOR_DESCRIPTORS[mentorId] || ""}
              </span>
            </motion.div>
          ))}
        </div>

        {!accepted ? (
          <Button onClick={onAccept} className="w-full gap-2 animate-pulse" size="sm">
            <Check className="w-4 h-4" />
            Accept Your Council
          </Button>
        ) : (
          <div className="text-center text-sm text-primary font-medium py-1">
            ✨ Council Accepted
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MentorRevealCard;
