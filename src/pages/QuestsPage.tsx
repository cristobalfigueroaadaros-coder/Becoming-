import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import FutureSelfBackground from "@/components/FutureSelfBackground";
import { SelfDiscoveryQuest } from "@/components/SelfDiscoveryQuest";
import { UnlockQuest } from "@/components/UnlockQuest";
import { supabase } from "@/integrations/supabase/client";

const QuestsPage = () => {
  const navigate = useNavigate();
  const [showUnlockQuest, setShowUnlockQuest] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkQuestStatus();
  }, []);

  const checkQuestStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("self_discovery_completed")
        .eq("id", user.id)
        .single();

      setShowUnlockQuest(!profile?.self_discovery_completed);
    } catch (error) {
      console.error("Error checking quest status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlockComplete = () => {
    setShowUnlockQuest(false);
    navigate("/dashboard");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <motion.div 
      className="min-h-screen relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <FutureSelfBackground />
      
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card/50 backdrop-blur-lg border-b border-border/30">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/creation-lab?type=becoming")}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </div>
      </div>

      {/* Content */}
      <motion.div 
        className="max-w-7xl mx-auto px-4 py-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        {showUnlockQuest ? (
          <>
            <h1 className="text-4xl md:text-5xl font-bold text-center text-foreground mb-4">
              Unlock Your Council
            </h1>
            <p className="text-center text-muted-foreground mb-12 max-w-md mx-auto">
              Answer 5 quick questions so your mentors can guide you better
            </p>
            <UnlockQuest onComplete={handleUnlockComplete} />
          </>
        ) : (
          <>
            <h1 className="text-5xl md:text-6xl font-bold text-center text-foreground mb-12">
              Self-Discovery Quests
            </h1>
            <SelfDiscoveryQuest />
          </>
        )}
      </motion.div>
    </motion.div>
  );
};

export default QuestsPage;
