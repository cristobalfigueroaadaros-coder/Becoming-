import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Rocket, ChevronRight } from "lucide-react";
import { useMomentumData } from "@/hooks/useMomentumData";
import { motion } from "framer-motion";

const MomentumCard = () => {
  const navigate = useNavigate();
  const { weeklyData, pastReports, loading } = useMomentumData();

  const completionRate = weeklyData?.completionRate ?? 0;
  const streak = pastReports.length > 0 ? pastReports[0].streak_weeks : 0;

  // Simple circular progress
  const size = 56;
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (completionRate / 100) * circumference;

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow border-primary/10"
      onClick={() => navigate("/momentum")}
    >
      <CardContent className="py-4 flex items-center gap-4">
        <div className="relative shrink-0">
          <svg width={size} height={size} className="transform -rotate-90">
            <circle
              cx={size / 2} cy={size / 2} r={radius}
              fill="none" stroke="hsl(var(--muted))" strokeWidth={strokeWidth}
            />
            <motion.circle
              cx={size / 2} cy={size / 2} r={radius}
              fill="none" stroke="hsl(var(--primary))" strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold">{completionRate}%</span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Rocket className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">Momentum</h3>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {loading ? "Loading..." : `${weeklyData?.tasksCompleted ?? 0} tasks this week · ${streak} week streak`}
          </p>
        </div>

        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
      </CardContent>
    </Card>
  );
};

export default MomentumCard;
