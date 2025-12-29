import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sunrise, Flame, ChevronRight, Check } from "lucide-react";
import { motion } from "framer-motion";

interface DailyRitualCardProps {
  hasCompletedToday: boolean;
  currentStreak: number;
  todayGoal: string | null;
  onStartRitual: () => void;
}

const DailyRitualCard = ({ 
  hasCompletedToday, 
  currentStreak, 
  todayGoal,
  onStartRitual 
}: DailyRitualCardProps) => {
  if (hasCompletedToday) {
    return (
      <Card className="bg-gradient-to-r from-card to-muted/30 border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <Check className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Daily Ritual Complete</span>
                  <span className="text-green-500">✨</span>
                </div>
                {todayGoal && (
                  <p className="text-sm text-muted-foreground line-clamp-1">{todayGoal}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 text-orange-500">
              <Flame className="w-4 h-4" />
              <span className="text-sm font-bold">{currentStreak}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-all bg-gradient-to-r from-card to-muted/30 border-border/50 hover:border-primary/30"
      onClick={onStartRitual}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div 
              className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Sunrise className="w-5 h-5 text-primary" />
            </motion.div>
            <div>
              <span className="font-medium">Daily Ritual</span>
              <p className="text-sm text-muted-foreground">Start your day with intention</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {currentStreak > 0 && (
              <div className="flex items-center gap-1 text-orange-500 mr-2">
                <Flame className="w-4 h-4" />
                <span className="text-sm font-bold">{currentStreak}</span>
              </div>
            )}
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DailyRitualCard;
