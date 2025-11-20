import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Lightbulb, Zap, Trees, Heart, Sparkles, Users, BookOpen, Crown, LogOut, CheckSquare, Briefcase, Palette, Compass, Target, Flag } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const mentorIcons = {
  mamba_mentor: Brain,
  creative_visionary: Lightbulb,
  quantum_inventor: Zap,
  ancient_sage: Trees,
  compassionate_elder: Heart,
  future_self: Sparkles,
  business_mentor: Briefcase,
  creator_mentor: Palette,
  mystic_mentor: Compass,
  heart_mentor: Heart,
  strategist_mentor: Target,
  explorer_mentor: Flag,
};

const mentorColors = {
  mamba_mentor: "bg-mentor-mamba",
  creative_visionary: "bg-mentor-creative",
  quantum_inventor: "bg-mentor-quantum",
  ancient_sage: "bg-mentor-sage",
  compassionate_elder: "bg-mentor-elder",
  future_self: "bg-mentor-future",
  business_mentor: "bg-primary",
  creator_mentor: "bg-accent",
  mystic_mentor: "bg-secondary",
  heart_mentor: "bg-mentor-elder",
  strategist_mentor: "bg-mentor-quantum",
  explorer_mentor: "bg-mentor-sage",
};

const mentorNames = {
  mamba_mentor: "Mamba Mentor",
  creative_visionary: "Creative Visionary",
  quantum_inventor: "Quantum Inventor",
  ancient_sage: "Ancient Sage",
  compassionate_elder: "Compassionate Elder",
  future_self: "Future Self",
  business_mentor: "Business Mentor",
  creator_mentor: "Creator Mentor",
  mystic_mentor: "Mystic Mentor",
  heart_mentor: "Heart Mentor",
  strategist_mentor: "Strategist Mentor",
  explorer_mentor: "Explorer Mentor",
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [mentors, setMentors] = useState<any[]>([]);
  const [latestWhisper, setLatestWhisper] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Load user's mentors
      const { data: mentorsData, error: mentorsError } = await supabase
        .from("user_mentors")
        .select("*")
        .eq("user_id", user.id);

      if (mentorsError) throw mentorsError;
      setMentors(mentorsData || []);

      // Load latest whisper
      const { data: whisperData, error: whisperError } = await supabase
        .from("daily_whispers")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (whisperError && whisperError.code !== "PGRST116") throw whisperError;
      setLatestWhisper(whisperData);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading your council...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4 py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">Your AI Council</h1>
            <p className="text-muted-foreground mt-2">Your personal mentors await</p>
          </div>
          <Button variant="ghost" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>

        {/* Mentors Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {mentors.map((mentor) => {
            const Icon = mentorIcons[mentor.mentor_type as keyof typeof mentorIcons];
            const color = mentorColors[mentor.mentor_type as keyof typeof mentorColors];
            const name = mentorNames[mentor.mentor_type as keyof typeof mentorNames];

            return (
              <Card
                key={mentor.id}
                className="cursor-pointer hover:shadow-lg transition-all"
                onClick={() => navigate(`/chat/${mentor.mentor_type}`)}
              >
                <CardContent className="pt-6 text-center space-y-4">
                  <div className={cn("w-16 h-16 mx-auto rounded-2xl flex items-center justify-center", color)}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <p className="font-semibold">{name}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Council Meeting Button */}
        <Card className="bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-xl">
          <CardContent className="p-8 text-center space-y-4">
            <Users className="w-12 h-12 mx-auto" />
            <h2 className="text-2xl font-bold">Ask the Council</h2>
            <p className="opacity-90">Get wisdom from all your mentors at once</p>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => navigate("/council-meeting")}
              className="mt-4"
            >
              Start Council Meeting
            </Button>
          </CardContent>
        </Card>

        {/* Daily Whisper */}
        {latestWhisper && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Daily Whisper
              </CardTitle>
              <CardDescription>
                From {mentorNames[latestWhisper.mentor_type as keyof typeof mentorNames]}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-lg italic">{latestWhisper.message}</p>
            </CardContent>
          </Card>
        )}

        {/* Navigation Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card
            className="cursor-pointer hover:shadow-lg transition-all"
            onClick={() => navigate("/my-tasks")}
          >
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                <CheckSquare className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold">My Tasks</h3>
                <p className="text-sm text-muted-foreground">Track your progress</p>
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg transition-all"
            onClick={() => navigate("/council-log")}
          >
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-accent-foreground" />
              </div>
              <div>
                <h3 className="font-semibold">Council Log</h3>
                <p className="text-sm text-muted-foreground">View your history</p>
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg transition-all"
            onClick={() => navigate("/premium")}
          >
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center">
                <Crown className="w-6 h-6 text-secondary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold">Unlock Premium</h3>
                <p className="text-sm text-muted-foreground">Get unlimited access</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
