import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Compass, Heart, Target, Zap, MessageCircle, Lock, CheckCircle2, Lightbulb, ChevronRight, Sparkles, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface QuestConfig {
  key: string;
  label: string;
  description: string;
  longDescription: string;
  icon: any;
  color: string;
  bgColor: string;
  elements: string[];
  locked: boolean;
}

const quests: QuestConfig[] = [
  {
    key: "core_values",
    label: "Core Values",
    description: "Discover your non-negotiable principles",
    longDescription: "Identify the fundamental beliefs and principles that guide your decisions and define who you are at your core.",
    icon: Heart,
    color: "text-rose-500",
    bgColor: "bg-rose-500/10 border-rose-500/20 hover:bg-rose-500/20",
    elements: ["values_list"],
    locked: false,
  },
  {
    key: "ikigai",
    label: "Ikigai",
    description: "Find your reason for being",
    longDescription: "Explore the Japanese concept of Ikigai — the intersection of what you love, what you're good at, what the world needs, and what you can be paid for.",
    icon: Compass,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/20",
    elements: ["love", "good_at", "needs", "paid_for"],
    locked: false,
  },
  {
    key: "strengths",
    label: "Strengths",
    description: "Identify your natural talents",
    longDescription: "Uncover the abilities that come naturally to you — the things others find difficult but feel effortless to you.",
    icon: Zap,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20",
    elements: ["strengths_list"],
    locked: false,
  },
  {
    key: "my_why",
    label: "My Why",
    description: "Articulate your purpose statement",
    longDescription: "Inspired by Simon Sinek's work, discover the 'why' behind everything you do — your deeper motivation and purpose.",
    icon: Target,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/20",
    elements: ["why_statement"],
    locked: false,
  },
  {
    key: "identity",
    label: "Identity Statement",
    description: "Define who you are becoming",
    longDescription: "Craft a clear statement of the person you are becoming — your future identity crystallized into words.",
    icon: Sparkles,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10 border-purple-500/20 hover:bg-purple-500/20",
    elements: ["identity_statement"],
    locked: true,
  },
];

interface QuestProgress {
  discovery_type: string;
  element_key: string;
}

export const SelfDiscoveryQuests = () => {
  const navigate = useNavigate();
  const [progress, setProgress] = useState<QuestProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuest, setSelectedQuest] = useState<QuestConfig | null>(null);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("becoming_discoveries")
        .select("discovery_type, element_key")
        .eq("user_id", user.id);

      if (error) throw error;
      setProgress(data || []);
    } catch (error) {
      console.error("Error loading progress:", error);
    } finally {
      setLoading(false);
    }
  };

  const getQuestProgress = (quest: QuestConfig) => {
    const completed = quest.elements.filter((el) =>
      progress.some((p) => p.discovery_type === quest.key && p.element_key === el)
    );
    return {
      completed: completed.length,
      total: quest.elements.length,
      percentage: Math.round((completed.length / quest.elements.length) * 100),
    };
  };

  const handleCompleteWithFutureSelf = (quest: QuestConfig) => {
    setSelectedQuest(null);
    navigate(`/chat/future_self?quest=${quest.key}`);
  };

  const handleBeginQuest = (quest: QuestConfig) => {
    setSelectedQuest(null);
    // Navigate to quest page or open inline form - for now redirect to chat as well
    navigate(`/chat/future_self?quest=${quest.key}`);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="animate-pulse text-muted-foreground">Loading quests...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Compass className="w-5 h-5 text-violet-500" />
            Self-Discovery Quests
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Explore who you are through guided quests
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {quests.map((quest) => {
              const Icon = quest.icon;
              const questProgress = getQuestProgress(quest);
              const isComplete = questProgress.percentage === 100;

              return (
                <motion.button
                  key={quest.key}
                  onClick={() => !quest.locked && setSelectedQuest(quest)}
                  disabled={quest.locked}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={!quest.locked ? { scale: 1.02 } : undefined}
                  whileTap={!quest.locked ? { scale: 0.98 } : undefined}
                  className={cn(
                    "relative p-4 rounded-xl border text-left transition-all",
                    quest.locked ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
                    quest.bgColor
                  )}
                >
                  {/* Status Badge */}
                  {quest.locked ? (
                    <Badge 
                      variant="outline" 
                      className="absolute top-2 right-2 text-[10px] px-1.5 py-0"
                    >
                      Soon
                    </Badge>
                  ) : isComplete ? (
                    <Badge 
                      className="absolute top-2 right-2 text-[10px] px-1.5 py-0 bg-emerald-500/20 text-emerald-600 border-0"
                    >
                      ✓
                    </Badge>
                  ) : questProgress.completed > 0 ? (
                    <Badge 
                      variant="secondary" 
                      className="absolute top-2 right-2 text-[10px] px-1.5 py-0"
                    >
                      {questProgress.completed}/{questProgress.total}
                    </Badge>
                  ) : null}

                  {/* Icon */}
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center mb-3",
                    quest.bgColor,
                    quest.color
                  )}>
                    {quest.locked ? (
                      <Lock className="w-5 h-5" />
                    ) : isComplete ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>

                  {/* Label */}
                  <h4 className="font-medium text-sm mb-1">{quest.label}</h4>
                  
                  {/* Progress Bar (only for non-locked, non-complete) */}
                  {!quest.locked && !isComplete && (
                    <Progress 
                      value={questProgress.percentage} 
                      className="h-1 mt-2" 
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quest Detail Modal */}
      <Dialog open={!!selectedQuest} onOpenChange={() => setSelectedQuest(null)}>
        <DialogContent className="sm:max-w-md">
          {selectedQuest && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center",
                    selectedQuest.bgColor,
                    selectedQuest.color
                  )}>
                    <selectedQuest.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <DialogTitle className="text-xl">{selectedQuest.label}</DialogTitle>
                    <DialogDescription className="text-sm">
                      {selectedQuest.description}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-4 pt-4">
                {/* Long Description */}
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {selectedQuest.longDescription}
                </p>

                {/* Progress */}
                {(() => {
                  const questProgress = getQuestProgress(selectedQuest);
                  return (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{questProgress.percentage}%</span>
                      </div>
                      <Progress value={questProgress.percentage} className="h-2" />
                    </div>
                  );
                })()}

                {/* Action Buttons */}
                <div className="flex flex-col gap-2 pt-2">
                  <Button
                    onClick={() => handleBeginQuest(selectedQuest)}
                    className="w-full"
                    variant="outline"
                  >
                    <Lightbulb className="w-4 h-4 mr-2" />
                    Begin Quest
                    <ChevronRight className="w-4 h-4 ml-auto" />
                  </Button>
                  
                  <Button
                    onClick={() => handleCompleteWithFutureSelf(selectedQuest)}
                    className="w-full bg-violet-500 hover:bg-violet-600"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Complete with Future Self
                    <ChevronRight className="w-4 h-4 ml-auto" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};