import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Brain, Lightbulb, Zap, Trees, Heart, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const mentors = [
  {
    id: "mamba_mentor",
    name: "The Mamba Mentor",
    description: "Discipline, mastery, and relentless focus",
    icon: Brain,
    color: "bg-mentor-mamba",
  },
  {
    id: "creative_visionary",
    name: "The Creative Visionary",
    description: "Imagination, wonder, and creative expansion",
    icon: Lightbulb,
    color: "bg-mentor-creative",
  },
  {
    id: "quantum_inventor",
    name: "The Quantum Inventor",
    description: "Future insight and pattern recognition",
    icon: Zap,
    color: "bg-mentor-quantum",
  },
  {
    id: "ancient_sage",
    name: "The Ancient Sage",
    description: "Calm clarity and timeless wisdom",
    icon: Trees,
    color: "bg-mentor-sage",
  },
  {
    id: "compassionate_elder",
    name: "The Compassionate Elder",
    description: "Warmth and emotional wisdom",
    icon: Heart,
    color: "bg-mentor-elder",
  },
  {
    id: "future_self",
    name: "Future Self",
    description: "Your evolved self, ten years ahead",
    icon: Sparkles,
    color: "bg-mentor-future",
  },
  {
    id: "business_mentor",
    name: "Business Mentor",
    description: "Strategy, entrepreneurship, and execution",
    icon: Brain,
    color: "bg-primary",
  },
  {
    id: "creator_mentor",
    name: "Creator Mentor",
    description: "Content creation and personal brand",
    icon: Lightbulb,
    color: "bg-accent",
  },
  {
    id: "mystic_mentor",
    name: "Mystic Mentor",
    description: "Spirituality and inner guidance",
    icon: Sparkles,
    color: "bg-secondary",
  },
  {
    id: "heart_mentor",
    name: "Heart Mentor",
    description: "Relationships and emotional intelligence",
    icon: Heart,
    color: "bg-mentor-elder",
  },
  {
    id: "strategist_mentor",
    name: "Strategist Mentor",
    description: "Planning and decision frameworks",
    icon: Zap,
    color: "bg-mentor-quantum",
  },
  {
    id: "explorer_mentor",
    name: "Explorer Mentor",
    description: "Courage and experimentation",
    icon: Trees,
    color: "bg-mentor-sage",
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mentors.map((mentor) => {
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
