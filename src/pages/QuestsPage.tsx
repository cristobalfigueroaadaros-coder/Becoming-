import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import FutureSelfBackground from "@/components/FutureSelfBackground";
import { SelfDiscoveryQuest } from "@/components/SelfDiscoveryQuest";

const QuestsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen relative">
      <FutureSelfBackground />
      
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card/50 backdrop-blur-lg border-b border-border/30">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/future-self")}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-5xl md:text-6xl font-bold text-center text-foreground mb-12">
          Self-Discovery Quests
        </h1>
        <SelfDiscoveryQuest />
      </div>
    </div>
  );
};

export default QuestsPage;
