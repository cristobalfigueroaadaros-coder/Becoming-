import { useAchievements } from "@/hooks/useAchievements";
import { AchievementBadge } from "@/components/AchievementBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Award } from "lucide-react";

export const AchievementsDisplay = () => {
  const { achievements, userAchievements } = useAchievements();

  const unlockedKeys = new Set(userAchievements.map((ua) => ua.achievement_key));
  const unlockedCount = unlockedKeys.size;
  const totalCount = achievements.length;

  const getProgress = (achievementKey: string) => {
    const userAch = userAchievements.find((ua) => ua.achievement_key === achievementKey);
    return userAch?.progress ?? 0;
  };

  const filterByTier = (tier: string) => {
    return achievements.filter((a) => a.tier === tier);
  };

  const allTiers = ["bronze", "silver", "gold", "diamond"];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            <span>Achievements</span>
          </div>
          <div className="text-sm font-normal text-muted-foreground">
            {unlockedCount}/{totalCount} Unlocked
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="bronze">Bronze</TabsTrigger>
            <TabsTrigger value="silver">Silver</TabsTrigger>
            <TabsTrigger value="gold">Gold</TabsTrigger>
            <TabsTrigger value="diamond">Diamond</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {achievements.map((achievement) => (
                <AchievementBadge
                  key={achievement.id}
                  icon={achievement.icon}
                  title={achievement.title}
                  description={achievement.description}
                  tier={achievement.tier}
                  unlocked={unlockedKeys.has(achievement.achievement_key)}
                  progress={getProgress(achievement.achievement_key)}
                  requirementValue={achievement.requirement_value}
                />
              ))}
            </div>
          </TabsContent>

          {allTiers.map((tier) => (
            <TabsContent key={tier} value={tier} className="mt-4">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filterByTier(tier).map((achievement) => (
                  <AchievementBadge
                    key={achievement.id}
                    icon={achievement.icon}
                    title={achievement.title}
                    description={achievement.description}
                    tier={achievement.tier}
                    unlocked={unlockedKeys.has(achievement.achievement_key)}
                    progress={getProgress(achievement.achievement_key)}
                    requirementValue={achievement.requirement_value}
                  />
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};
