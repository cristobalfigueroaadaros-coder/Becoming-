import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Trophy, Flame, Target, Zap, Award, Calendar, Ghost, Users, BookOpen, Settings, Compass, Edit2, Check, X } from "lucide-react";
import { AchievementBadge } from "@/components/AchievementBadge";
import { ThemeCustomizationModal } from "@/components/ThemeCustomizationModal";
import { ProfileBadges } from "@/components/ProfileBadges";
import { BirthInfoEditor } from "@/components/BirthInfoEditor";
import { BodygraphChart } from "@/components/human-design/BodygraphChart";
import { useProfileBadges } from "@/hooks/useProfileBadges";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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

interface PurposeHistoryEntry {
  id: string;
  purpose_text: string;
  created_at: string;
}

interface ThemePreferences {
  theme_color: string;
  background_style: string;
  card_style: string;
  accent_color: string;
  show_stats_publicly: boolean;
  show_timeline_publicly: boolean;
  show_achievements_publicly: boolean;
}

interface BirthInfo {
  birth_date: string | null;
  birth_time: string | null;
  birth_location: string | null;
  birth_time_unknown: boolean | null;
}

interface HumanDesignData {
  type: string;
  strategy: string;
  authority: string;
  profile: string;
  defined_centers: string[];
  undefined_centers: string[];
  key_gates?: Array<{ gate: number; description: string }>;
  incarnation_cross?: string;
  is_approximate: boolean;
}

const themeColorMap: Record<string, string> = {
  purple: "from-purple-500/10 via-background to-purple-500/5",
  blue: "from-blue-500/10 via-background to-blue-500/5",
  green: "from-green-500/10 via-background to-green-500/5",
  orange: "from-orange-500/10 via-background to-orange-500/5",
  pink: "from-pink-500/10 via-background to-pink-500/5",
  teal: "from-teal-500/10 via-background to-teal-500/5",
};

const backgroundStyleMap: Record<string, string> = {
  gradient: "bg-gradient-to-br",
  solid: "bg-background",
  pattern: "bg-background bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]",
  minimal: "bg-background/50",
};

const Profile = () => {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [themePreferences, setThemePreferences] = useState<ThemePreferences | null>(null);
  const [customizeModalOpen, setCustomizeModalOpen] = useState(false);
  const [purpose, setPurpose] = useState<string>("");
  const [editingPurpose, setEditingPurpose] = useState(false);
  const [purposeText, setPurposeText] = useState("");
  const [savingPurpose, setSavingPurpose] = useState(false);
  const [purposeHistory, setPurposeHistory] = useState<PurposeHistoryEntry[]>([]);
  const [showPurposeHistory, setShowPurposeHistory] = useState(false);
  const [birthInfo, setBirthInfo] = useState<BirthInfo | null>(null);
  const [humanDesignData, setHumanDesignData] = useState<HumanDesignData | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const { getUserBadgesWithDetails, loading: badgesLoading } = useProfileBadges(userId);
  const userBadges = getUserBadgesWithDetails();

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

      setCurrentUserId(targetUserId);
      setIsOwnProfile(user?.id === targetUserId);

      // Load profile stats
      const { data: profileData, error: profileError } = await supabase
        .from("leaderboard_stats")
        .select("*")
        .eq("user_id", targetUserId)
        .maybeSingle();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Load user purpose and birth info from profiles table
      const { data: profileDetails } = await supabase
        .from("profiles")
        .select("main_mission, birth_date, birth_time, birth_location, birth_time_unknown, human_design_data")
        .eq("id", targetUserId)
        .maybeSingle();

      if (profileDetails?.main_mission) {
        setPurpose(profileDetails.main_mission);
        setPurposeText(profileDetails.main_mission);
      }

      if (profileDetails) {
        setBirthInfo({
          birth_date: profileDetails.birth_date,
          birth_time: profileDetails.birth_time,
          birth_location: profileDetails.birth_location,
          birth_time_unknown: profileDetails.birth_time_unknown,
        });
        
        // Set Human Design data if it exists
        if (profileDetails.human_design_data && typeof profileDetails.human_design_data === 'object') {
          setHumanDesignData(profileDetails.human_design_data as unknown as HumanDesignData);
        }
      }

      // Load purpose history (only for own profile)
      if (user?.id === targetUserId) {
        const { data: historyData } = await supabase
          .from("purpose_history")
          .select("*")
          .eq("user_id", targetUserId)
          .order("created_at", { ascending: false })
          .limit(20);

        setPurposeHistory(historyData || []);
      }

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

      // Load theme preferences
      const { data: themeData } = await supabase
        .from("user_theme_preferences")
        .select("*")
        .eq("user_id", targetUserId)
        .maybeSingle();

      setThemePreferences(themeData);

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

  // Get theme styling
  const themeColor = themePreferences?.theme_color || "purple";
  const backgroundStyle = themePreferences?.background_style || "gradient";
  const cardStyle = themePreferences?.card_style || "default";
  
  const backgroundClass = `${backgroundStyleMap[backgroundStyle]} ${
    backgroundStyle === "gradient" ? themeColorMap[themeColor] : ""
  }`;

  const getCardClass = () => {
    const base = "transition-all";
    switch (cardStyle) {
      case "elevated":
        return `${base} shadow-lg hover:shadow-xl`;
      case "bordered":
        return `${base} border-2`;
      case "glass":
        return `${base} bg-background/50 backdrop-blur-sm`;
      default:
        return base;
    }
  };

  const handleSavePurpose = async () => {
    if (!purposeText.trim()) {
      toast.error("Purpose cannot be empty");
      return;
    }

    // Check if purpose has actually changed
    if (purposeText.trim() === purpose) {
      setEditingPurpose(false);
      return;
    }

    setSavingPurpose(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Update current purpose
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ main_mission: purposeText.trim() })
        .eq("id", user.id);

      if (updateError) throw updateError;

      // Add to purpose history
      const { error: historyError } = await supabase
        .from("purpose_history")
        .insert({
          user_id: user.id,
          purpose_text: purposeText.trim(),
        });

      if (historyError) throw historyError;

      setPurpose(purposeText.trim());
      setEditingPurpose(false);
      
      // Reload history
      const { data: historyData } = await supabase
        .from("purpose_history")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      setPurposeHistory(historyData || []);

      toast.success("Purpose updated and saved to history!");
    } catch (error: any) {
      toast.error("Failed to update purpose", { description: error.message });
    } finally {
      setSavingPurpose(false);
    }
  };

  const handleCancelEdit = () => {
    setPurposeText(purpose);
    setEditingPurpose(false);
  };

  // Privacy checks
  const canShowStats = isOwnProfile || (themePreferences?.show_stats_publicly ?? true);
  const canShowAchievements = isOwnProfile || (themePreferences?.show_achievements_publicly ?? true);
  const canShowTimeline = isOwnProfile || (themePreferences?.show_timeline_publicly ?? false);

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
    <div className={cn("min-h-screen p-4 py-8", backgroundClass)}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header - simplified since bottom nav handles navigation */}
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-3xl font-bold">
            {isOwnProfile ? "Your Profile" : `${profile.display_name}'s Profile`}
          </h1>
          {isOwnProfile && (
            <Button
              variant="outline"
              onClick={() => setCustomizeModalOpen(true)}
            >
              <Settings className="w-4 h-4 mr-2" />
              Customize
            </Button>
          )}
        </div>

        {/* Profile Overview */}
        <Card className={cn("border-2 border-primary/20", getCardClass())}>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <Avatar className="w-24 h-24 text-4xl">
                <AvatarFallback>{profile.avatar}</AvatarFallback>
              </Avatar>

              <div className="flex-1 text-center md:text-left space-y-3">
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold">{profile.display_name}</h2>
                  <p className="text-muted-foreground">
                    Member since {new Date(profile.joined_at).toLocaleDateString()}
                  </p>
                  {!badgesLoading && userBadges && userBadges.length > 0 && (
                    <ProfileBadges badges={userBadges as any} maxDisplay={5} size="medium" />
                  )}
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

        {/* Life Purpose */}
        {(isOwnProfile || purpose) && (
          <Card className={cn("border-2 border-accent/20", getCardClass())}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Compass className="w-5 h-5 text-accent" />
                  Life Purpose
                </CardTitle>
                {isOwnProfile && !editingPurpose && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingPurpose(true)}
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {editingPurpose ? (
                <div className="space-y-4">
                  <Textarea
                    value={purposeText}
                    onChange={(e) => setPurposeText(e.target.value)}
                    placeholder="Describe your life's purpose or mission..."
                    rows={5}
                    className="resize-none"
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSavePurpose}
                      disabled={!purposeText.trim() || savingPurpose}
                      className="flex-1"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      {savingPurpose ? "Saving..." : "Save Purpose"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleCancelEdit}
                      disabled={savingPurpose}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : purpose ? (
                <div className="space-y-4">
                  <p className="text-base leading-relaxed">{purpose}</p>
                  
                  {isOwnProfile && (
                    <>
                      <div className="bg-accent/10 border border-accent/20 rounded-lg p-3">
                        <p className="text-sm text-muted-foreground">
                          💡 <strong className="text-foreground">Tip:</strong> Your purpose will guide your journey and help the AI connect insights back to your mission. Update this as you evolve.
                        </p>
                      </div>

                      {purposeHistory.length > 0 && (
                        <div className="pt-2 border-t border-border">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowPurposeHistory(!showPurposeHistory)}
                            className="w-full justify-between"
                          >
                            <span className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              Purpose History ({purposeHistory.length} versions)
                            </span>
                            <span>{showPurposeHistory ? "−" : "+"}</span>
                          </Button>

                          {showPurposeHistory && (
                            <div className="mt-4 space-y-4">
                              <p className="text-sm text-muted-foreground">
                                Track how your purpose has evolved over time:
                              </p>
                              <div className="space-y-3">
                                {purposeHistory.map((entry, index) => (
                                  <div
                                    key={entry.id}
                                    className="relative pl-6 pb-4 border-l-2 border-accent/30 last:border-l-0 last:pb-0"
                                  >
                                    <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-accent border-2 border-background" />
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2">
                                        <Badge variant={index === 0 ? "default" : "secondary"} className="text-xs">
                                          {index === 0 ? "Current" : `Version ${purposeHistory.length - index}`}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">
                                          {new Date(entry.created_at).toLocaleDateString(undefined, {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                          })}
                                        </span>
                                      </div>
                                      <p className="text-sm leading-relaxed bg-muted/30 rounded-lg p-3">
                                        {entry.purpose_text}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-accent/10 mx-auto flex items-center justify-center">
                    <Compass className="w-8 h-8 text-accent" />
                  </div>
                  {isOwnProfile ? (
                    <>
                      <p className="text-muted-foreground">
                        Define your life's purpose to guide your transformation journey
                      </p>
                      <Button onClick={() => setEditingPurpose(true)}>
                        <Edit2 className="w-4 h-4 mr-2" />
                        Add Purpose
                      </Button>
                    </>
                  ) : (
                    <p className="text-muted-foreground">
                      This user hasn't shared their purpose yet
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Birth Info Editor - Only for own profile */}
        {isOwnProfile && currentUserId && (
          <BirthInfoEditor
            userId={currentUserId}
            initialData={birthInfo || undefined}
            onUpdate={loadProfile}
          />
        )}

        {/* Human Design Section */}
        {humanDesignData && humanDesignData.defined_centers && humanDesignData.defined_centers.length > 0 ? (
          <BodygraphChart data={humanDesignData} showLabels={true} />
        ) : isOwnProfile && (
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-mentor-future/5">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Compass className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">Discover Your Human Design</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Unlock insights into your unique energy blueprint
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Human Design combines ancient wisdom with modern science to reveal your authentic self. 
                Complete your birth information above to generate your personalized bodygraph chart.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 p-4 rounded-lg bg-card/50 border border-border/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold">Your Type</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Discover your energetic blueprint
                  </p>
                </div>
                <div className="flex-1 p-4 rounded-lg bg-card/50 border border-border/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold">Your Strategy</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Learn how to make aligned decisions
                  </p>
                </div>
                <div className="flex-1 p-4 rounded-lg bg-card/50 border border-border/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold">Your Centers</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Understand your energy centers
                  </p>
                </div>
              </div>
              {!birthInfo?.birth_date && (
                <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <p className="text-sm text-foreground">
                    👆 <strong>Get started:</strong> Fill in your birth information in the editor above, 
                    then save to generate your Human Design chart.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Stats Grid */}
        {canShowStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className={getCardClass()}>
              <CardContent className="pt-6 text-center space-y-2">
              <Trophy className="w-8 h-8 mx-auto text-primary" />
              <div>
                <p className="text-2xl font-bold">{profile.achievement_count}</p>
                <p className="text-sm text-muted-foreground">Achievements</p>
              </div>
            </CardContent>
          </Card>

          <Card className={getCardClass()}>
            <CardContent className="pt-6 text-center space-y-2">
              <Flame className="w-8 h-8 mx-auto text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{profile.max_streak}</p>
                <p className="text-sm text-muted-foreground">Max Streak</p>
              </div>
            </CardContent>
          </Card>

          <Card className={getCardClass()}>
            <CardContent className="pt-6 text-center space-y-2">
              <Target className="w-8 h-8 mx-auto text-green-500" />
              <div>
                <p className="text-2xl font-bold">{profile.completed_tasks}</p>
                <p className="text-sm text-muted-foreground">Tasks Done</p>
              </div>
            </CardContent>
          </Card>

          <Card className={getCardClass()}>
            <CardContent className="pt-6 text-center space-y-2">
              <Ghost className="w-8 h-8 mx-auto text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{profile.shadows_faced}</p>
                <p className="text-sm text-muted-foreground">Shadows Faced</p>
              </div>
            </CardContent>
          </Card>
        </div>
        )}

        {/* Achievements Showcase */}
        {canShowAchievements && (
          <Card className={getCardClass()}>
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
        )}

        {/* Transformation Timeline */}
        {canShowTimeline && (
          <Card className={getCardClass()}>
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

      <ThemeCustomizationModal
        open={customizeModalOpen}
        onClose={() => setCustomizeModalOpen(false)}
        onUpdate={loadProfile}
      />
    </div>
  );
};

export default Profile;
