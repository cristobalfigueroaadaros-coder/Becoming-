import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Brain, Lightbulb, Zap, Trees, Heart, Sparkles, Target, TrendingUp, Megaphone, FlaskConical, Scale, Moon, User, Compass } from "lucide-react";
import { cn } from "@/lib/utils";

const mentors = [
  // 🔥 Action & Discipline
  {
    id: "discipline_mentor",
    name: "The Discipline Mentor",
    description: "Relentless focus, ownership, and mastery",
    icon: Target,
    color: "bg-mentor-mamba",
    category: "Action & Discipline",
  },
  {
    id: "strategist_mentor",
    name: "The Strategist Mentor",
    description: "Frameworks, clarity, and systematic planning",
    icon: TrendingUp,
    color: "bg-mentor-quantum",
    category: "Action & Discipline",
  },
  {
    id: "business_mentor",
    name: "The Business Mentor",
    description: "Strategy, leverage, and execution",
    icon: Brain,
    color: "bg-primary",
    category: "Action & Discipline",
  },
  // 💡 Creativity & Expression
  {
    id: "creative_visionary",
    name: "The Creative Visionary",
    description: "Imagination, wonder, and creative expansion",
    icon: Lightbulb,
    color: "bg-mentor-creative",
    category: "Creativity & Expression",
  },
  {
    id: "marketing_mentor",
    name: "The Marketing Mentor",
    description: "Storytelling, virality, and message craft",
    icon: Megaphone,
    color: "bg-accent",
    category: "Creativity & Expression",
  },
  // 🔬 Knowledge & Insight
  {
    id: "quantum_inventor",
    name: "The Quantum Inventor",
    description: "Pattern recognition and systems thinking",
    icon: Zap,
    color: "bg-mentor-quantum",
    category: "Knowledge & Insight",
  },
  {
    id: "scientific_mentor",
    name: "The Scientific Mentor",
    description: "Evidence-based methods and neuroscience",
    icon: FlaskConical,
    color: "bg-blue-600",
    category: "Knowledge & Insight",
  },
  // 💜 Emotional & Spiritual
  {
    id: "mystic_mentor",
    name: "The Mystic Mentor",
    description: "Spiritual insight and inner truth",
    icon: Sparkles,
    color: "bg-secondary",
    category: "Emotional & Spiritual",
  },
  {
    id: "ancient_sage",
    name: "The Ancient Sage",
    description: "Timeless wisdom, patience, and grounding",
    icon: Trees,
    color: "bg-mentor-sage",
    category: "Emotional & Spiritual",
  },
  {
    id: "alignment_mentor",
    name: "The Alignment Mentor",
    description: "Internal coherence and resolving inner conflict",
    icon: Scale,
    color: "bg-green-600",
    category: "Emotional & Spiritual",
  },
  {
    id: "oracle_mother",
    name: "The Oracle Mother",
    description: "Nurturing wisdom, validation, and deep empathy",
    icon: Moon,
    color: "bg-purple-600",
    category: "Emotional & Spiritual",
  },
  {
    id: "heart_mentor",
    name: "The Heart Mentor",
    description: "Emotional truth, connection, and softness",
    icon: Heart,
    color: "bg-rose-600",
    category: "Emotional & Spiritual",
  },
  // ✨ Personal
  {
    id: "future_self",
    name: "Your Future Self",
    description: "Your evolved self, ten years ahead",
    icon: User,
    color: "bg-mentor-future",
    category: "Personal",
  },
];

const OnboardingStep4 = () => {
  const navigate = useNavigate();
  const [selectedMentors, setSelectedMentors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const toggleMentor = (mentorId: string) => {
    if (selectedMentors.includes(mentorId)) {
      setSelectedMentors(selectedMentors.filter((id) => id !== mentorId));
    } else {
      setSelectedMentors([...selectedMentors, mentorId]);
    }
  };

  const handleContinue = async () => {
    if (selectedMentors.length === 0) {
      toast.error("Please select at least one mentor");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("user_mentors")
        .insert(
          selectedMentors.map((mentorType) => ({
            user_id: user.id,
            mentor_type: mentorType as any,
          }))
        );

      if (error) throw error;

      toast.success("Mentor Council assembled! 🎯");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4 py-12">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">Choose Your Mentor Council</h1>
          <p className="text-muted-foreground text-lg">Select the mentors who will guide your journey</p>
          <p className="text-sm text-accent font-medium">
            {selectedMentors.length} selected
          </p>
        </div>

        <div className="space-y-8">
          {["Action & Discipline", "Creativity & Expression", "Knowledge & Insight", "Emotional & Spiritual", "Personal"].map((category) => {
            const categoryMentors = mentors.filter((m) => m.category === category);
            return (
              <div key={category}>
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  {category === "Action & Discipline" && "🔥"}
                  {category === "Creativity & Expression" && "💡"}
                  {category === "Knowledge & Insight" && "🔬"}
                  {category === "Emotional & Spiritual" && "💜"}
                  {category === "Personal" && "✨"}
                  {category}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryMentors.map((mentor) => {
                    const Icon = mentor.icon;
                    const isSelected = selectedMentors.includes(mentor.id);

                    return (
                      <Card
                        key={mentor.id}
                        className={cn(
                          "cursor-pointer transition-all hover:shadow-lg",
                          isSelected && "ring-2 ring-primary shadow-xl"
                        )}
                        onClick={() => toggleMentor(mentor.id)}
                      >
                        <CardHeader>
                          <div
                            className={cn(
                              "w-12 h-12 rounded-xl flex items-center justify-center mb-4",
                              mentor.color
                            )}
                          >
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          <CardTitle className="text-xl">{mentor.name}</CardTitle>
                          <CardDescription>{mentor.description}</CardDescription>
                        </CardHeader>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-center">
          <Button
            size="lg"
            onClick={handleContinue}
            disabled={loading || selectedMentors.length === 0}
            className="px-12"
          >
            {loading ? "Assembling Council..." : "Enter Dashboard →"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingStep4;
