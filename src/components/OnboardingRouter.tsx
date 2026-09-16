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
          .select("birth_name, gravity_orientation_completed, gravity_transition_completed, council_introduction_completed, first_project_created_at, onboarding_completion_seen, console_intake_completed, entry_state, action_patterns")
          .eq("id", user.id)
          .single();

        // Required pre-Home onboarding steps:
        // 1. Gravity Orientation
        // 2. Profile / phase onboarding (birth_name + entry_state)
        // 3. Dashboard (Home) — Atlas + Cris's Map walkthrough is launched FROM Home,
        //    not from this router, to follow the required flow:
        //    Home -> Cris Map -> founder card -> My Atlas -> walkthrough -> first quest.
        if (!profile?.gravity_orientation_completed) {
          navigate("/gravity/orientation");
        } else if (!profile?.birth_name) {
          navigate("/onboarding");
        } else if (!(profile as any)?.entry_state) {
          // User has profile but never picked their phase — finish step 2
          navigate("/onboarding/step2");
        } else if (!profile?.action_patterns || Object.keys(profile.action_patterns as Record<string, unknown>).length === 0) {
          navigate("/onboarding/quest");
        } else {
          navigate("/atlas");
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
