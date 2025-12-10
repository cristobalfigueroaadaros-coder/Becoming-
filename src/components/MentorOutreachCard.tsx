import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, MessageCircle, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { HighlightedText } from "./HighlightedText";
import { motion, AnimatePresence } from "framer-motion";

interface MentorOutreachCardProps {
  outreach: {
    id: string;
    mentor_type: string;
    message: string;
    message_type: string;
  } | null;
  onDismiss: () => void;
  onRespond: () => void;
}

const mentorNames: Record<string, string> = {
  discipline_mentor: "Discipline Mentor",
  strategist_mentor: "Strategist Mentor",
  business_mentor: "Business Mentor",
  creative_visionary: "Creative Visionary",
  marketing_mentor: "Marketing Mentor",
  heart_mentor: "Heart Mentor",
  mystic_mentor: "Mystic Mentor",
  ancient_sage: "Ancient Sage",
  oracle_mother: "Oracle Mother",
  future_self: "Your Future Self",
};

const mentorGradients: Record<string, string> = {
  discipline_mentor: "from-orange-500/20 to-red-500/20",
  business_mentor: "from-emerald-500/20 to-teal-500/20",
  creative_visionary: "from-purple-500/20 to-pink-500/20",
  strategist_mentor: "from-blue-500/20 to-indigo-500/20",
  marketing_mentor: "from-yellow-500/20 to-orange-500/20",
  heart_mentor: "from-pink-500/20 to-rose-500/20",
  mystic_mentor: "from-violet-500/20 to-purple-500/20",
  ancient_sage: "from-amber-500/20 to-yellow-500/20",
  oracle_mother: "from-rose-500/20 to-pink-500/20",
  future_self: "from-primary/20 to-accent/20",
};

const messageTypeLabels: Record<string, string> = {
  goal_check: "Goal Check-in",
  idea: "New Idea",
  question: "Question for You",
  encouragement: "Encouragement",
  journey_suggestion: "Journey Suggestion",
  strategic_question: "Strategic Question",
  emotional_check: "Emotional Check-in",
  pattern_insight: "Pattern Insight",
};

export const MentorOutreachCard = ({ outreach, onDismiss, onRespond }: MentorOutreachCardProps) => {
  const navigate = useNavigate();

  if (!outreach) return null;

  const handleRespond = () => {
    onRespond();
    navigate(`/chat/${outreach.mentor_type}`);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.3 }}
      >
        <Card className={`relative overflow-hidden bg-gradient-to-br ${mentorGradients[outreach.mentor_type] || 'from-primary/10 to-accent/10'} border-primary/20`}>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-6 w-6 opacity-60 hover:opacity-100"
            onClick={onDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
          
          <div className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-background/50">
                <MessageCircle className="w-5 h-5 text-primary" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold">
                    {mentorNames[outreach.mentor_type] || outreach.mentor_type}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                    {messageTypeLabels[outreach.message_type] || outreach.message_type}
                  </span>
                </div>
                
                <div className="text-sm text-foreground/90 mb-3">
                  <HighlightedText text={outreach.message} />
                </div>
                
                <Button 
                  size="sm" 
                  onClick={handleRespond}
                  className="gap-2"
                >
                  Respond
                  <ArrowRight className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};
