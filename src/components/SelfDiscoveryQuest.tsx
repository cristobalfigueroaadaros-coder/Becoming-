import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BookOpen, CheckCircle2, Lock, Sparkles, Heart, Target, Brain, Compass, Star } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type QuestType = "values" | "strengths" | "ikigai" | "purpose" | "fears" | "vision";

interface Quest {
  id: QuestType;
  title: string;
  description: string;
  icon: any;
  xpReward: number;
  color: string;
  unlockLevel: number;
}

interface QuestData {
  id?: string;
  quest_type: QuestType;
  quest_data: any;
  completed_at?: string;
  insights_generated?: string;
}

const quests: Quest[] = [
  {
    id: "values",
    title: "Core Values Discovery",
    description: "Identify and rank your top 10 core values that guide your life",
    icon: Heart,
    xpReward: 100,
    color: "text-red-500",
    unlockLevel: 1,
  },
  {
    id: "strengths",
    title: "Strengths Assessment",
    description: "Discover your natural talents and how to leverage them",
    icon: Star,
    xpReward: 100,
    color: "text-yellow-500",
    unlockLevel: 1,
  },
  {
    id: "ikigai",
    title: "Ikigai Mapping",
    description: "Find your reason for being at the intersection of passion and purpose",
    icon: Compass,
    xpReward: 150,
    color: "text-blue-500",
    unlockLevel: 2,
  },
  {
    id: "purpose",
    title: "Life Purpose Exploration",
    description: "Uncover your deeper calling and what brings meaning to your existence",
    icon: Target,
    xpReward: 150,
    color: "text-purple-500",
    unlockLevel: 2,
  },
  {
    id: "fears",
    title: "Shadow Integration",
    description: "Explore your fears and limiting beliefs with compassion",
    icon: Brain,
    xpReward: 200,
    color: "text-gray-500",
    unlockLevel: 3,
  },
  {
    id: "vision",
    title: "Vision Board Creation",
    description: "Design your ideal life across all dimensions in vivid detail",
    icon: Sparkles,
    xpReward: 200,
    color: "text-mentor-future",
    unlockLevel: 3,
  },
];

const coreValues = [
  "Authenticity", "Adventure", "Balance", "Compassion", "Courage",
  "Creativity", "Curiosity", "Freedom", "Growth", "Health",
  "Honesty", "Humor", "Independence", "Integrity", "Joy",
  "Kindness", "Knowledge", "Love", "Loyalty", "Peace",
  "Purpose", "Security", "Service", "Spirituality", "Wisdom"
];

const strengthAreas = [
  "Strategic Thinking", "Creativity", "Empathy", "Communication",
  "Leadership", "Problem Solving", "Adaptability", "Discipline",
  "Intuition", "Analysis", "Innovation", "Collaboration"
];

export const SelfDiscoveryQuest = () => {
  const [completedQuests, setCompletedQuests] = useState<Set<QuestType>>(new Set());
  const [currentQuest, setCurrentQuest] = useState<QuestType | null>(null);
  const [questAnswers, setQuestAnswers] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentLevel, setCurrentLevel] = useState(1);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load completed quests
      const { data: questData } = await supabase
        .from("self_discovery_quests")
        .select("*")
        .eq("user_id", user.id);

      if (questData) {
        const completed = new Set(questData.map(q => q.quest_type as QuestType));
        setCompletedQuests(completed);
        
        // Calculate level based on completed quests
        setCurrentLevel(Math.floor(completed.size / 2) + 1);
      }

      // Load future self progress for level
      const { data: progress } = await supabase
        .from("future_self_progress")
        .select("evolution_level")
        .eq("user_id", user.id)
        .maybeSingle();

      if (progress) {
        setCurrentLevel(progress.evolution_level);
      }
    } catch (error) {
      console.error("Error loading progress:", error);
    } finally {
      setLoading(false);
    }
  };

  const startQuest = (questId: QuestType) => {
    setCurrentQuest(questId);
    setQuestAnswers({});
  };

  const saveQuest = async () => {
    if (!currentQuest) return;
    
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const quest = quests.find(q => q.id === currentQuest);
      if (!quest) return;

      // Save quest data
      const { error } = await supabase
        .from("self_discovery_quests")
        .insert({
          user_id: user.id,
          quest_type: currentQuest,
          quest_data: questAnswers,
          completed_at: new Date().toISOString(),
        });

      if (error) throw error;

      // Award XP
      const { data: progressData } = await supabase
        .from("future_self_progress")
        .select("global_xp, evolution_level")
        .eq("user_id", user.id)
        .maybeSingle();

      if (progressData) {
        const newXP = progressData.global_xp + quest.xpReward;
        const levelThresholds = [0, 100, 300, 700, 1500];
        let newLevel = progressData.evolution_level;
        
        for (let i = levelThresholds.length - 1; i >= 0; i--) {
          if (newXP >= levelThresholds[i]) {
            newLevel = i + 1;
            break;
          }
        }

        await supabase
          .from("future_self_progress")
          .update({
            global_xp: newXP,
            evolution_level: newLevel,
          })
          .eq("user_id", user.id);
      }

      toast.success(`Quest completed! +${quest.xpReward} XP`, {
        description: "Your insights have been saved",
      });

      setCurrentQuest(null);
      setQuestAnswers({});
      loadProgress();
    } catch (error: any) {
      toast.error("Failed to save quest", { description: error.message });
    } finally {
      setSaving(false);
    }
  };

  const renderQuestContent = () => {
    if (!currentQuest) return null;

    const quest = quests.find(q => q.id === currentQuest);
    if (!quest) return null;

    switch (currentQuest) {
      case "values":
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-lg mb-4 block">
                Select and rank your top 10 core values
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                {coreValues.map((value) => (
                  <Button
                    key={value}
                    variant={questAnswers.values?.includes(value) ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      const current = questAnswers.values || [];
                      if (current.includes(value)) {
                        setQuestAnswers({
                          ...questAnswers,
                          values: current.filter((v: string) => v !== value)
                        });
                      } else if (current.length < 10) {
                        setQuestAnswers({
                          ...questAnswers,
                          values: [...current, value]
                        });
                      }
                    }}
                    disabled={!questAnswers.values?.includes(value) && (questAnswers.values?.length >= 10)}
                  >
                    {value}
                  </Button>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                Selected: {questAnswers.values?.length || 0} / 10
              </p>
            </div>
            <div>
              <Label htmlFor="values-why">Why are these values important to you?</Label>
              <Textarea
                id="values-why"
                placeholder="Reflect on how these values guide your decisions and life..."
                value={questAnswers.valuesWhy || ""}
                onChange={(e) => setQuestAnswers({ ...questAnswers, valuesWhy: e.target.value })}
                rows={4}
              />
            </div>
          </div>
        );

      case "strengths":
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-lg mb-4 block">
                Select your top 5 strengths
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                {strengthAreas.map((strength) => (
                  <Button
                    key={strength}
                    variant={questAnswers.strengths?.includes(strength) ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      const current = questAnswers.strengths || [];
                      if (current.includes(strength)) {
                        setQuestAnswers({
                          ...questAnswers,
                          strengths: current.filter((s: string) => s !== strength)
                        });
                      } else if (current.length < 5) {
                        setQuestAnswers({
                          ...questAnswers,
                          strengths: [...current, strength]
                        });
                      }
                    }}
                    disabled={!questAnswers.strengths?.includes(strength) && (questAnswers.strengths?.length >= 5)}
                  >
                    {strength}
                  </Button>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                Selected: {questAnswers.strengths?.length || 0} / 5
              </p>
            </div>
            <div>
              <Label htmlFor="strengths-examples">Give examples of how you've used these strengths</Label>
              <Textarea
                id="strengths-examples"
                placeholder="Share specific moments when these strengths showed up..."
                value={questAnswers.strengthsExamples || ""}
                onChange={(e) => setQuestAnswers({ ...questAnswers, strengthsExamples: e.target.value })}
                rows={4}
              />
            </div>
          </div>
        );

      case "ikigai":
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="ikigai-love">What do you love?</Label>
              <Textarea
                id="ikigai-love"
                placeholder="What brings you joy and energy..."
                value={questAnswers.ikigaiLove || ""}
                onChange={(e) => setQuestAnswers({ ...questAnswers, ikigaiLove: e.target.value })}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="ikigai-good">What are you good at?</Label>
              <Textarea
                id="ikigai-good"
                placeholder="Your natural talents and developed skills..."
                value={questAnswers.ikigaiGood || ""}
                onChange={(e) => setQuestAnswers({ ...questAnswers, ikigaiGood: e.target.value })}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="ikigai-needs">What does the world need?</Label>
              <Textarea
                id="ikigai-needs"
                placeholder="Problems you see that need solving..."
                value={questAnswers.ikigaiNeeds || ""}
                onChange={(e) => setQuestAnswers({ ...questAnswers, ikigaiNeeds: e.target.value })}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="ikigai-paid">What can you be paid for?</Label>
              <Textarea
                id="ikigai-paid"
                placeholder="How could this create value for others..."
                value={questAnswers.ikigaiPaid || ""}
                onChange={(e) => setQuestAnswers({ ...questAnswers, ikigaiPaid: e.target.value })}
                rows={3}
              />
            </div>
          </div>
        );

      case "purpose":
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="purpose-impact">What impact do you want to have on the world?</Label>
              <Textarea
                id="purpose-impact"
                placeholder="The legacy you want to leave..."
                value={questAnswers.purposeImpact || ""}
                onChange={(e) => setQuestAnswers({ ...questAnswers, purposeImpact: e.target.value })}
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="purpose-fulfilled">What makes you feel most alive and fulfilled?</Label>
              <Textarea
                id="purpose-fulfilled"
                placeholder="Moments when you feel truly in flow..."
                value={questAnswers.purposeFulfilled || ""}
                onChange={(e) => setQuestAnswers({ ...questAnswers, purposeFulfilled: e.target.value })}
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="purpose-serve">Who do you most want to serve or help?</Label>
              <Textarea
                id="purpose-serve"
                placeholder="The people or causes that call to you..."
                value={questAnswers.purposeServe || ""}
                onChange={(e) => setQuestAnswers({ ...questAnswers, purposeServe: e.target.value })}
                rows={4}
              />
            </div>
          </div>
        );

      case "fears":
        return (
          <div className="space-y-6">
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                This is a safe space to explore your shadows with compassion. 
                What you write here is private and for your growth.
              </p>
            </div>
            <div>
              <Label htmlFor="fears-main">What fears hold you back most?</Label>
              <Textarea
                id="fears-main"
                placeholder="Be honest with yourself..."
                value={questAnswers.fearsMain || ""}
                onChange={(e) => setQuestAnswers({ ...questAnswers, fearsMain: e.target.value })}
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="fears-beliefs">What limiting beliefs about yourself do you carry?</Label>
              <Textarea
                id="fears-beliefs"
                placeholder="I'm not enough, I'm too much, I don't deserve..."
                value={questAnswers.fearsBelief || ""}
                onChange={(e) => setQuestAnswers({ ...questAnswers, fearsBelief: e.target.value })}
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="fears-reframe">How could these fears be protecting you or teaching you?</Label>
              <Textarea
                id="fears-reframe"
                placeholder="Find the wisdom in your shadows..."
                value={questAnswers.fearsReframe || ""}
                onChange={(e) => setQuestAnswers({ ...questAnswers, fearsReframe: e.target.value })}
                rows={4}
              />
            </div>
          </div>
        );

      case "vision":
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="vision-life">Describe your ideal day, 5 years from now</Label>
              <Textarea
                id="vision-life"
                placeholder="Where are you? What do you do? Who are you with? How do you feel?"
                value={questAnswers.visionLife || ""}
                onChange={(e) => setQuestAnswers({ ...questAnswers, visionLife: e.target.value })}
                rows={5}
              />
            </div>
            <div>
              <Label htmlFor="vision-career">Your ideal work or creative expression</Label>
              <Textarea
                id="vision-career"
                placeholder="What does your work look like in this vision?"
                value={questAnswers.visionCareer || ""}
                onChange={(e) => setQuestAnswers({ ...questAnswers, visionCareer: e.target.value })}
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="vision-relationships">Your ideal relationships and community</Label>
              <Textarea
                id="vision-relationships"
                placeholder="Who surrounds you? What do these connections feel like?"
                value={questAnswers.visionRelationships || ""}
                onChange={(e) => setQuestAnswers({ ...questAnswers, visionRelationships: e.target.value })}
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="vision-growth">How you've grown as a person</Label>
              <Textarea
                id="vision-growth"
                placeholder="What have you overcome? What have you mastered?"
                value={questAnswers.visionGrowth || ""}
                onChange={(e) => setQuestAnswers({ ...questAnswers, visionGrowth: e.target.value })}
                rows={4}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const canSaveQuest = () => {
    if (!currentQuest) return false;
    
    switch (currentQuest) {
      case "values":
        return questAnswers.values?.length === 10 && questAnswers.valuesWhy?.trim();
      case "strengths":
        return questAnswers.strengths?.length === 5 && questAnswers.strengthsExamples?.trim();
      case "ikigai":
        return questAnswers.ikigaiLove?.trim() && questAnswers.ikigaiGood?.trim() &&
               questAnswers.ikigaiNeeds?.trim() && questAnswers.ikigaiPaid?.trim();
      case "purpose":
        return questAnswers.purposeImpact?.trim() && questAnswers.purposeFulfilled?.trim() &&
               questAnswers.purposeServe?.trim();
      case "fears":
        return questAnswers.fearsMain?.trim() && questAnswers.fearsBelief?.trim() &&
               questAnswers.fearsReframe?.trim();
      case "vision":
        return questAnswers.visionLife?.trim() && questAnswers.visionCareer?.trim() &&
               questAnswers.visionRelationships?.trim() && questAnswers.visionGrowth?.trim();
      default:
        return false;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Loading your quest progress...</p>
        </CardContent>
      </Card>
    );
  }

  // Quest detail view
  if (currentQuest) {
    const quest = quests.find(q => q.id === currentQuest);
    if (!quest) return null;

    const Icon = quest.icon;

    return (
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={cn("w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center", quest.color)}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <CardTitle>{quest.title}</CardTitle>
                <CardDescription>{quest.description}</CardDescription>
              </div>
            </div>
            <Badge variant="secondary">+{quest.xpReward} XP</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {renderQuestContent()}
          
          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setCurrentQuest(null);
                setQuestAnswers({});
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={saveQuest}
              disabled={!canSaveQuest() || saving}
              className="flex-1"
            >
              {saving ? "Saving..." : "Complete Quest"}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Quest selection view
  const completedCount = completedQuests.size;
  const totalQuests = quests.length;
  const progressPercent = (completedCount / totalQuests) * 100;

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Quest Progress
              </CardTitle>
              <CardDescription>
                Complete quests to unlock deeper self-understanding
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {completedCount} / {totalQuests}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={progressPercent} className="h-3" />
        </CardContent>
      </Card>

      {/* Quest Cards */}
      <div className="grid gap-4">
        {quests.map((quest) => {
          const Icon = quest.icon;
          const isCompleted = completedQuests.has(quest.id);
          const isLocked = quest.unlockLevel > currentLevel;

          return (
            <Card
              key={quest.id}
              className={cn(
                "transition-all",
                isCompleted && "border-green-500/50 bg-green-500/5",
                isLocked && "opacity-60",
                !isCompleted && !isLocked && "hover:shadow-lg cursor-pointer"
              )}
              onClick={() => !isCompleted && !isLocked && startQuest(quest.id)}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0",
                    isCompleted ? "bg-green-500/20" : "bg-gradient-to-br from-primary/20 to-accent/20"
                  )}>
                    {isLocked ? (
                      <Lock className="w-7 h-7 text-muted-foreground" />
                    ) : isCompleted ? (
                      <CheckCircle2 className="w-7 h-7 text-green-500" />
                    ) : (
                      <Icon className={cn("w-7 h-7", quest.color)} />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-lg">{quest.title}</h3>
                      <Badge variant={isCompleted ? "default" : "secondary"}>
                        +{quest.xpReward} XP
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {quest.description}
                    </p>
                    
                    {isLocked && (
                      <p className="text-xs text-muted-foreground">
                        🔒 Unlocks at Evolution Level {quest.unlockLevel}
                      </p>
                    )}
                    
                    {isCompleted && (
                      <p className="text-xs text-green-600 font-medium">
                        ✓ Quest Completed
                      </p>
                    )}
                    
                    {!isCompleted && !isLocked && (
                      <Button size="sm" className="mt-2">
                        Begin Quest →
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
