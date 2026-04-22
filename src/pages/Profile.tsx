import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Trophy, Flame, Target, Zap, Award, Calendar, Ghost, Users, BookOpen, Settings, Edit2, Check, X, Crown, Heart, Sparkles } from "lucide-react";
import { AchievementBadge } from "@/components/AchievementBadge";
import { ThemeCustomizationModal } from "@/components/ThemeCustomizationModal";
import { ProfileBadges } from "@/components/ProfileBadges";
import { useProfileBadges } from "@/hooks/useProfileBadges";
import { PaymentModal } from "@/components/PaymentModal";
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

interface PurposeHistoryEntry {
  id: string;
  purpose_text: string;
  created_at: string;
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
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<string>("free");
  const [purpose, setPurpose] = useState<string>("");
  const [purposeHistory, setPurposeHistory] = useState<PurposeHistoryEntry[]>([]);
  const [birthInfo, setBirthInfo] = useState<BirthInfo | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameText, setNameText] = useState("");
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
        .select("main_mission, birth_date, birth_time, birth_location, birth_time_unknown, payment_status")
        .eq("id", targetUserId)
        .maybeSingle();

      if (profileDetails?.payment_status) {
        setPaymentStatus(profileDetails.payment_status);
      }

      if (profileDetails?.main_mission) {
        setPurpose(profileDetails.main_mission);
      }

      if (profileDetails) {
        setBirthInfo({
          birth_date: profileDetails.birth_date,
          birth_time: profileDetails.birth_time,
          birth_location: profileDetails.birth_location,
          birth_time_unknown: profileDetails.birth_time_unknown,
        });
        
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

  const handleSaveName = async () => {
    if (!nameText.trim()) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: nameText.trim() })
        .eq("id", user.id);
      if (error) throw error;
      setProfile(prev => prev ? { ...prev, display_name: nameText.trim() } : prev);
      setEditingName(false);
      toast.success("Name updated");
    } catch (error: any) {
      toast.error("Failed to update name", { description: error.message });
    }
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
                  {isOwnProfile && editingName ? (
                    <div className="flex items-center gap-2">
                      <input
                        autoFocus
                        value={nameText}
                        onChange={e => setNameText(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") handleSaveName(); if (e.key === "Escape") setEditingName(false); }}
                        className="text-2xl font-bold bg-transparent border-b border-primary outline-none w-full"
                      />
                      <Button size="icon" variant="ghost" onClick={handleSaveName}><Check className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => setEditingName(false)}><X className="w-4 h-4" /></Button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { if (isOwnProfile) { setNameText(profile.display_name); setEditingName(true); } }}
                      className={cn("flex items-center gap-2 group", isOwnProfile && "cursor-pointer")}
                    >
                      <h2 className="text-2xl font-bold">{profile.display_name}</h2>
                      {isOwnProfile && <Edit2 className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-60 transition-opacity" />}
                    </button>
                  )}
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

        {/* Membership / Plan */}
        {isOwnProfile && (
          <Card className={cn("border-2 border-primary/20", getCardClass())}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-accent" />
                Membership
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Current plan */}
                <div className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center",
                      paymentStatus === "free"
                        ? "bg-muted"
                        : "bg-gradient-to-br from-primary to-accent"
                    )}>
                      {paymentStatus === "free" ? (
                        <Sparkles className="w-5 h-5 text-muted-foreground" />
                      ) : paymentStatus === "supporter" ? (
                        <Heart className="w-5 h-5 text-foreground" />
                      ) : (
                        <Crown className="w-5 h-5 text-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">
                        {paymentStatus === "free" && "Free Plan"}
                        {paymentStatus === "supporter" && "Early Supporter"}
                        {paymentStatus === "subscriber_monthly" && "Monthly Subscriber"}
                        {paymentStatus === "subscriber_yearly" && "Yearly Subscriber"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {paymentStatus === "free"
                          ? "You're exploring for free. Support the journey anytime."
                          : "Thank you for supporting Bcoming! 🙏"}
                      </p>
                    </div>
                  </div>
                  {paymentStatus !== "free" && (
                    <Badge className="bg-accent/20 text-accent border-accent/30">Active</Badge>
                  )}
                </div>

                {/* Upgrade options */}
                {paymentStatus === "free" && (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Bcoming is free to use. If this journey resonates with you, consider supporting the vision.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { label: "Early Supporter", price: "$10", period: "one-time", icon: Heart, color: "from-accent to-[hsl(28,95%,52%)]" },
                        { label: "Monthly", price: "$12.99", period: "/month", icon: Zap, color: "from-primary to-[hsl(265,90%,50%)]" },
                        { label: "Yearly", price: "$99", period: "/year", icon: Crown, color: "from-secondary to-[hsl(220,95%,45%)]", badge: "Save 36%" },
                      ].map((tier) => {
                        const Icon = tier.icon;
                        return (
                          <button
                            key={tier.label}
                            onClick={() => setPaymentModalOpen(true)}
                            className="relative p-4 rounded-xl border border-border/50 bg-card/30 hover:border-primary/30 hover:bg-card/60 transition-all text-left group"
                          >
                            {tier.badge && (
                              <span className="absolute -top-2 right-3 text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
                                {tier.badge}
                              </span>
                            )}
                            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${tier.color} flex items-center justify-center mb-2`}>
                              <Icon className="w-4 h-4 text-foreground" />
                            </div>
                            <p className="font-semibold text-foreground text-sm">{tier.label}</p>
                            <p className="text-foreground">
                              <span className="text-lg font-bold">{tier.price}</span>
                              <span className="text-xs text-muted-foreground ml-1">{tier.period}</span>
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Already a supporter — option to change */}
                {paymentStatus === "supporter" && (
                  <p className="text-sm text-muted-foreground">
                    Want more? You can upgrade to a monthly or yearly plan anytime.{" "}
                    <button onClick={() => setPaymentModalOpen(true)} className="text-primary hover:underline">
                      View plans →
                    </button>
                  </p>
                )}

                {(paymentStatus === "subscriber_monthly" || paymentStatus === "subscriber_yearly") && (
                  <p className="text-sm text-muted-foreground">
                    Your subscription is active. Thank you for believing in what we're building together.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
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

      <PaymentModal
        open={paymentModalOpen}
        onClose={() => {
          setPaymentModalOpen(false);
          loadProfile();
        }}
      />
    </div>
  );
};

export default Profile;
