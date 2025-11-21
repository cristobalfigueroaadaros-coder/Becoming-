import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Trophy, Flame, Target, Zap, Award, Calendar, Ghost, Users, BookOpen } from "lucide-react";
import { AchievementBadge } from "@/components/AchievementBadge";
import { toast } from "sonner";

interface ProfileData {
  display_name: string;
  avatar: string;
  total_xp: number;
  level: number;
  achievement_count: number;
  max_streak: number;
  completed_tasks: number;
  shadows_faced: number;
  joined_at: string;
}

interface Achievement {
  id: string;
  achievement_key: string;
  title: string;
  description: string;
  icon: string;
  tier: string;
  xp_reward: number;
  requirement_value: number;
}

interface UserAchievement {
  achievement_key: string;
  unlocked_at: string;
  progress: number;
}

interface TimelineEvent {
  id: string;
  event_type: string;
  event_data: any;
  created_at: string;
}

const Profile = () => {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const targetUserId = userId || user?.id;
      
      if (!targetUserId) {
        navigate("/auth");
        return;
      }

      setIsOwnProfile(user?.id === targetUserId);

      // Load profile stats
      const { data: profileData, error: profileError } = await supabase
        .from("leaderboard_stats")
        .select("*")
        .eq("user_id", targetUserId)
        .maybeSingle();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Load all achievements
      const { data: allAchievements } = await supabase
        .from("achievements")
        .select("*")
        .order("tier", { ascending: true })
        .order("requirement_value", { ascending: true });

      setAchievements(allAchievements || []);

      // Load user achievements
      const { data: userAchs } = await supabase
        .from("user_achievements")
        .select("*")
        .eq("user_id", targetUserId)
        .order("unlocked_at", { ascending: false });

      setUserAchievements(userAchs || []);

      // Load transformation timeline (only if own profile)
      if (user?.id === targetUserId) {
        const { data: timelineData } = await supabase
          .from("transformation_timeline")
          .select("*")
          .eq("user_id", targetUserId)
          .order("created_at", { ascending: false })
          .limit(20);

        setTimeline(timelineData || []);
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case "task_completed": return Target;
      case "level_up": return Zap;
      case "achievement_unlocked": return Award;
      case "ritual_completed": return Calendar;
      case "shadow_faced": return Ghost;
      case "council_meeting": return Users;
      default: return BookOpen;
    }
  };

  const getEventDescription = (event: TimelineEvent) => {
    const data = event.event_data;
    switch (event.event_type) {
      case "task_completed":
        return `Completed task: ${data.task_title || "Unknown task"}`;
      case "level_up":
        return `Reached Level ${data.new_level}!`;
      case "achievement_unlocked":
        return `Unlocked: ${data.achievement_title}`;
      case "ritual_completed":
        return `Completed morning ritual (${data.streak || 1}-day streak)`;
      case "shadow_faced":
        return `Faced shadow: ${data.shadow_name}`;
      case "council_meeting":
        return "Attended council meeting";
      default:
        return "Transformation milestone reached";
    }
  };

  const unlockedKeys = new Set(userAchievements.map((ua) => ua.achievement_key));
  const unlockedAchievements = achievements.filter((a) => unlockedKeys.has(a.achievement_key));
  const xpToNextLevel = profile ? (profile.level * 100) : 100;
  const xpProgress = profile ? ((profile.total_xp % 100) / xpToNextLevel) * 100 : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Profile not found</p>
          <Button onClick={() => navigate("/dashboard")}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4 py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-3xl font-bold">
            {isOwnProfile ? "Your Profile" : `${profile.display_name}'s Profile`}
          </h1>
        </div>

        {/* Profile Overview */}
        <Card className="border-2 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <Avatar className="w-24 h-24 text-4xl">
                <AvatarFallback>{profile.avatar}</AvatarFallback>
              </Avatar>

              <div className="flex-1 text-center md:text-left space-y-3">
                <div>
                  <h2 className="text-2xl font-bold">{profile.display_name}</h2>
                  <p className="text-muted-foreground">
                    Member since {new Date(profile.joined_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                  <Badge variant="default" className="text-lg px-4 py-1">
                    Level {profile.level}
                  </Badge>
                  <Badge variant="secondary" className="px-4 py-1">
                    {profile.total_xp.toLocaleString()} XP
                  </Badge>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progress to Level {profile.level + 1}</span>
                    <span className="font-medium">{Math.round(xpProgress)}%</span>
                  </div>
                  <Progress value={xpProgress} className="h-2" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6 text-center space-y-2">
              <Trophy className="w-8 h-8 mx-auto text-primary" />
              <div>
                <p className="text-2xl font-bold">{profile.achievement_count}</p>
                <p className="text-sm text-muted-foreground">Achievements</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center space-y-2">
              <Flame className="w-8 h-8 mx-auto text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{profile.max_streak}</p>
                <p className="text-sm text-muted-foreground">Max Streak</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center space-y-2">
              <Target className="w-8 h-8 mx-auto text-green-500" />
              <div>
                <p className="text-2xl font-bold">{profile.completed_tasks}</p>
                <p className="text-sm text-muted-foreground">Tasks Done</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center space-y-2">
              <Ghost className="w-8 h-8 mx-auto text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{profile.shadows_faced}</p>
                <p className="text-sm text-muted-foreground">Shadows Faced</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Achievements Showcase */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              Achievement Showcase
              <Badge variant="secondary" className="ml-auto">
                {unlockedAchievements.length}/{achievements.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {unlockedAchievements.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No achievements unlocked yet
              </p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {unlockedAchievements.map((achievement) => (
                  <AchievementBadge
                    key={achievement.id}
                    icon={achievement.icon}
                    title={achievement.title}
                    description={achievement.description}
                    tier={achievement.tier}
                    unlocked={true}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transformation Timeline (only for own profile) */}
        {isOwnProfile && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Transformation Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              {timeline.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Your transformation journey begins now...
                </p>
              ) : (
                <div className="space-y-4">
                  {timeline.map((event) => {
                    const Icon = getEventIcon(event.event_type);
                    return (
                      <div key={event.id} className="flex gap-4 items-start">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{getEventDescription(event)}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(event.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Profile;
