import { History, TrendingUp } from "lucide-react";

const ChallengeHistoryCard = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[200px] gap-4">
      <div className="relative">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
          <History className="w-10 h-10 text-primary" />
        </div>
        <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
          <TrendingUp className="w-3 h-3 text-primary-foreground" />
        </div>
      </div>

      <div className="text-center space-y-2">
        <h3 className="font-semibold text-lg">Challenge Timeline</h3>
        <p className="text-sm text-muted-foreground px-4">
          View completed challenges, patterns, and growth insights
        </p>
      </div>

      <div className="flex gap-2 text-xs text-muted-foreground">
        <span>📊 Stats</span>
        <span>•</span>
        <span>🎯 Patterns</span>
        <span>•</span>
        <span>💡 Insights</span>
      </div>
    </div>
  );
};

export default ChallengeHistoryCard;