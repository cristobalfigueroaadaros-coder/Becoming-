import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { AchievementsDisplay } from "@/components/AchievementsDisplay";
import { Leaderboard } from "@/components/Leaderboard";

const CommunityHub = () => {
  const navigate = useNavigate();

  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4 py-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Button
              variant="ghost"
              onClick={() => navigate("/dashboard")}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-4xl font-bold">Community Hub</h1>
            <p className="text-muted-foreground">
              Celebrate your achievements and see how you compare with the community
            </p>
          </div>
        </div>

        {/* Community & Achievements Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          <AchievementsDisplay />
          <Leaderboard />
        </div>
      </div>
    </motion.div>
  );
};

export default CommunityHub;
