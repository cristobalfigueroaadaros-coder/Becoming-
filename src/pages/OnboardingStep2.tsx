import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";

const OnboardingStep2 = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    future_age: "",
    future_location: "",
    future_lifestyle: "",
    main_mission: "",
    emotional_tone: "",
    strength1: "",
    strength2: "",
    strength3: "",
    priority_growth_area: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("profiles").insert({
        id: user.id,
        future_age: parseInt(formData.future_age),
        future_location: formData.future_location,
        future_lifestyle: formData.future_lifestyle,
        main_mission: formData.main_mission,
        emotional_tone: formData.emotional_tone,
        main_strengths: [formData.strength1, formData.strength2, formData.strength3],
        priority_growth_area: formData.priority_growth_area,
      });

      // Initialize future_self_progress for the user
      await supabase.from("future_self_progress").insert({
        user_id: user.id,
        global_xp: 0,
        evolution_level: 1,
      });

      if (error) throw error;

      toast.success("Future Self created!");
      navigate("/onboarding-step-3");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4 py-12">
      <div className="max-w-2xl mx-auto">
        <div className="text-center space-y-4 mb-8">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-mentor-future to-accent rounded-2xl flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold">Create Your Future Self</h1>
          <p className="text-muted-foreground text-lg">
            Imagine yourself 10 years from now, living your dream life
          </p>
        </div>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle>Future Self Profile</CardTitle>
            <CardDescription>
              This information will shape how your Future Self mentor speaks to you
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="age">Future Age</Label>
                <Input
                  id="age"
                  type="number"
                  placeholder="45"
                  value={formData.future_age}
                  onChange={(e) => setFormData({ ...formData, future_age: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="Living in Bali, traveling frequently"
                  value={formData.future_location}
                  onChange={(e) => setFormData({ ...formData, future_location: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lifestyle">Lifestyle</Label>
                <Textarea
                  id="lifestyle"
                  placeholder="Describe your daily life, routines, and how you spend your time..."
                  value={formData.future_lifestyle}
                  onChange={(e) => setFormData({ ...formData, future_lifestyle: e.target.value })}
                  required
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mission">Main Mission</Label>
                <Textarea
                  id="mission"
                  placeholder="What are you dedicating your life to? What impact are you making?"
                  value={formData.main_mission}
                  onChange={(e) => setFormData({ ...formData, main_mission: e.target.value })}
                  required
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tone">Emotional Tone</Label>
                <Input
                  id="tone"
                  placeholder="Calm, confident, joyful, purposeful..."
                  value={formData.emotional_tone}
                  onChange={(e) => setFormData({ ...formData, emotional_tone: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-4">
                <Label>Three Main Strengths</Label>
                <Input
                  placeholder="First strength..."
                  value={formData.strength1}
                  onChange={(e) => setFormData({ ...formData, strength1: e.target.value })}
                  required
                />
                <Input
                  placeholder="Second strength..."
                  value={formData.strength2}
                  onChange={(e) => setFormData({ ...formData, strength2: e.target.value })}
                  required
                />
                <Input
                  placeholder="Third strength..."
                  value={formData.strength3}
                  onChange={(e) => setFormData({ ...formData, strength3: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority_growth_area">Priority Growth Area</Label>
                <select
                  id="priority_growth_area"
                  value={formData.priority_growth_area}
                  onChange={(e) => setFormData({ ...formData, priority_growth_area: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  required
                >
                  <option value="">Select your priority...</option>
                  <option value="Health and Energy">Health and Energy</option>
                  <option value="Career and Impact">Career and Impact</option>
                  <option value="Relationships and Love">Relationships and Love</option>
                  <option value="Friends and Community">Friends and Community</option>
                  <option value="Creativity and Learning">Creativity and Learning</option>
                  <option value="Spiritual Growth">Spiritual Growth</option>
                </select>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? "Creating..." : "Complete Onboarding"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OnboardingStep2;
