import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const OnboardingRouter = () => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          navigate("/");
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("birth_name, gravity_orientation_completed, gravity_transition_completed, council_introduction_completed, first_project_created_at, onboarding_completion_seen, console_intake_completed")
          .eq("id", user.id)
          .single();

        // Separate query for quest completion (may not be in generated types yet)
        const { data: questCheck } = await supabase
          .from("profiles")
          .select("onboarding_quest_completed" as any)
          .eq("id", user.id)
          .single();
        const questCompleted = (questCheck as any)?.onboarding_quest_completed;

        // Route to the correct step based on completion status
        // Follow the exact onboarding flow order:
        // 1. Gravity Orientation (Screen 2)
        // 2. Onboarding Steps 1-4 (Identity, Direction, Mentors)
        // 3. Gravity Transition
        // 4. Council Introduction
        // 5. First Project
        // 6. Dashboard

        if (!profile?.gravity_orientation_completed) {
          navigate("/gravity/orientation");
        } else if (!profile?.birth_name) {
          navigate("/onboarding");
        } else {
          // Quest completed or in progress — always go to dashboard
          // Legacy gravity pages are bypassed; console thread handles intake
          navigate("/dashboard");
        }
      } catch (error) {
        console.error("Error checking onboarding status:", error);
        // On error, default to orientation to be safe
        navigate("/gravity/orientation");
      } finally {
        setChecking(false);
      }
    };

    checkOnboardingStatus();
  }, [navigate]);

  // Show loading while checking
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-muted-foreground">Loading your journey...</p>
      </div>
    </div>
  );
};

export default OnboardingRouter;
