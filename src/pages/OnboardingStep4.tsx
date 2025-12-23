import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Brain, Lightbulb, Zap, Trees, Heart, Sparkles, Target, TrendingUp, Megaphone, FlaskConical, Scale, Moon, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

// Mandatory mentors - always selected and cannot be removed
const MANDATORY_MENTORS = ["creative_visionary", "strategist_mentor"];
const SUGGESTED_MENTOR = "business_mentor";

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
    mandatory: true,
  },
  {
    id: "business_mentor",
    name: "The Business Mentor",
    description: "Strategy, leverage, and execution",
    icon: Brain,
    color: "bg-primary",
    category: "Action & Discipline",
    suggested: true,
  },
  // 💡 Creativity & Expression
  {
    id: "creative_visionary",
    name: "The Creative Visionary",
    description: "Imagination, wonder, and creative expansion",
    icon: Lightbulb,
    color: "bg-mentor-creative",
    category: "Creativity & Expression",
    mandatory: true,
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
];

const OnboardingStep4 = () => {
  const navigate = useNavigate();
  // Start with mandatory mentors already selected
  const [selectedMentors, setSelectedMentors] = useState<string[]>(MANDATORY_MENTORS);
  const [loading, setLoading] = useState(false);

  const toggleMentor = (mentorId: string) => {
    // Don't allow deselecting mandatory mentors
    if (MANDATORY_MENTORS.includes(mentorId)) {
      toast.info("This mentor is required for your journey");
      return;
    }

    if (selectedMentors.includes(mentorId)) {
      setSelectedMentors(selectedMentors.filter((id) => id !== mentorId));
    } else {
      setSelectedMentors([...selectedMentors, mentorId]);
    }
  };

  const handleContinue = async () => {
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
            {selectedMentors.length} selected ({MANDATORY_MENTORS.length} required)
          </p>
        </div>

        {/* Mandatory Mentors Notice */}
        <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-center">
          <p className="text-sm text-foreground">
            <Lock className="w-4 h-4 inline mr-2" />
            <strong>Creative Visionary</strong> and <strong>Strategist Mentor</strong> are required for your journey.
            They ensure you take action and create something real.
          </p>
        </div>

        <div className="space-y-8">
          {["Action & Discipline", "Creativity & Expression", "Knowledge & Insight", "Emotional & Spiritual"].map((category) => {
            const categoryMentors = mentors.filter((m) => m.category === category);
            return (
              <div key={category}>
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  {category === "Action & Discipline" && "🔥"}
                  {category === "Creativity & Expression" && "💡"}
                  {category === "Knowledge & Insight" && "🔬"}
                  {category === "Emotional & Spiritual" && "💜"}
                  {category}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryMentors.map((mentor) => {
                    const Icon = mentor.icon;
                    const isSelected = selectedMentors.includes(mentor.id);
                    const isMandatory = MANDATORY_MENTORS.includes(mentor.id);
                    const isSuggested = mentor.id === SUGGESTED_MENTOR;

                    return (
                      <Card
                        key={mentor.id}
                        className={cn(
                          "cursor-pointer transition-all hover:shadow-lg relative",
                          isSelected && "ring-2 ring-primary shadow-xl",
                          isMandatory && "bg-primary/5 border-primary/30"
                        )}
                        onClick={() => toggleMentor(mentor.id)}
                      >
                        {/* Badges */}
                        <div className="absolute top-2 right-2 flex gap-1">
                          {isMandatory && (
                            <Badge variant="default" className="bg-primary text-primary-foreground text-xs">
                              <Lock className="w-3 h-3 mr-1" />
                              Required
                            </Badge>
                          )}
                          {isSuggested && !isMandatory && (
                            <Badge variant="secondary" className="text-xs">
                              ⭐ Recommended
                            </Badge>
                          )}
                        </div>

                        <CardHeader className="pt-8">
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
            disabled={loading}
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
