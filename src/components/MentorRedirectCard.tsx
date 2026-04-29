import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, User } from "lucide-react";

interface MentorRedirectCardProps {
  mentorName?: string;
  mentorIcon?: string;
  message?: string;
  onContinue: () => void;
  onNotNow: () => void;
}

export const MentorRedirectCard = ({
  mentorName = "Inner Clarity Mentor",
  mentorIcon = "🪞",
  message = "This feels like something we can understand more clearly together. Would you like to explore this one-on-one?",
  onContinue,
  onNotNow,
}: MentorRedirectCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card className="border-2 border-indigo-500/40 bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-xl">{mentorIcon}</span>
            </div>
            <div className="space-y-2 flex-1">
              <p className="text-sm text-muted-foreground">
                Council suggestion
              </p>
              <p className="text-foreground">
                {message}
              </p>
              <p className="text-sm text-muted-foreground">
                Continue with <strong>{mentorName}</strong>
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              onClick={onContinue}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 gap-2"
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              onClick={onNotNow}
              className="flex-1"
            >
              Not now
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default MentorRedirectCard;
