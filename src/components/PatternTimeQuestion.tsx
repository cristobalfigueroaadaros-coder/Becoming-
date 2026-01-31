import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Baby, GraduationCap, Briefcase, User, SkipForward } from "lucide-react";
import type { TimePeriod } from "@/hooks/useLifetimeEvents";

interface PatternTimeQuestionProps {
  patternName: string;
  onSelect: (timePeriod: TimePeriod) => void;
  onSkip: () => void;
}

const TIME_PERIOD_OPTIONS: Array<{
  id: TimePeriod;
  label: string;
  icon: React.ReactNode;
}> = [
  { id: "childhood", label: "Childhood", icon: <Baby className="w-4 h-4" /> },
  { id: "teen", label: "Teen years", icon: <GraduationCap className="w-4 h-4" /> },
  { id: "early_20s", label: "Early adulthood (20s)", icon: <User className="w-4 h-4" /> },
  { id: "30s", label: "Adulthood (30s+)", icon: <Briefcase className="w-4 h-4" /> },
  { id: "current", label: "Current life", icon: <Clock className="w-4 h-4" /> },
];

export const PatternTimeQuestion = ({
  patternName,
  onSelect,
  onSkip,
}: PatternTimeQuestionProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="border-indigo-500/30 bg-gradient-to-r from-indigo-500/5 to-purple-500/5">
        <CardContent className="pt-6 space-y-4">
          <div className="text-center space-y-2">
            <h3 className="font-semibold text-lg">
              When did this pattern first show up?
            </h3>
            <p className="text-sm text-muted-foreground">
              This helps us map "<span className="text-indigo-400">{patternName}</span>" to your life timeline.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {TIME_PERIOD_OPTIONS.map((option) => (
              <motion.button
                key={option.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelect(option.id)}
                className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all text-left group"
              >
                <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center group-hover:bg-indigo-500/20 transition-colors">
                  {option.icon}
                </div>
                <span className="text-sm font-medium">{option.label}</span>
              </motion.button>
            ))}
          </div>

          <Button
            variant="ghost"
            onClick={onSkip}
            className="w-full text-muted-foreground hover:text-foreground gap-2"
          >
            <SkipForward className="w-4 h-4" />
            I'm not sure — decide later
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default PatternTimeQuestion;
