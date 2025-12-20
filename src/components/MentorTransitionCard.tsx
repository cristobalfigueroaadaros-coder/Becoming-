import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, X, Sparkles } from "lucide-react";

interface MentorTransitionCardProps {
  currentMentor: string;
  suggestedMentor: string;
  suggestedMentorName: string;
  reason: string;
  onAccept: () => void;
  onDismiss: () => void;
}

// Mentor colors for visual identity
const mentorColors: Record<string, string> = {
  discipline_mentor: "#EF4444",
  strategist_mentor: "#3B82F6",
  business_mentor: "#10B981",
  creative_visionary: "#F59E0B",
  marketing_mentor: "#EC4899",
  quantum_inventor: "#8B5CF6",
  scientific_mentor: "#6366F1",
  mystic_mentor: "#A855F7",
  ancient_sage: "#78716C",
  alignment_mentor: "#14B8A6",
  oracle_mother: "#F97316",
  heart_mentor: "#E11D48",
  future_self: "#0EA5E9",
};

export const MentorTransitionCard = ({
  currentMentor,
  suggestedMentor,
  suggestedMentorName,
  reason,
  onAccept,
  onDismiss,
}: MentorTransitionCardProps) => {
  const mentorColor = mentorColors[suggestedMentor] || "#8B5CF6";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.98 }}
      transition={{ duration: 0.3 }}
      className="my-4"
    >
      <Card className="border-accent/20 bg-gradient-to-r from-muted/50 to-accent/5 overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${mentorColor}20` }}
            >
              <Sparkles className="w-5 h-5" style={{ color: mentorColor }} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground mb-1">
                A different perspective might help
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {reason}
              </p>
              
              {/* Actions */}
              <div className="flex items-center gap-2 mt-3">
                <Button
                  size="sm"
                  onClick={onAccept}
                  className="gap-2"
                  style={{ 
                    backgroundColor: mentorColor,
                    color: 'white'
                  }}
                >
                  <ArrowRight className="w-3 h-3" />
                  Talk to {suggestedMentorName}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onDismiss}
                  className="text-muted-foreground"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};