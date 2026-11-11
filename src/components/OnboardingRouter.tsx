import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const OnboardingRouter = ({ userId }: { userId: string }) => {
  const navigate = useNavigate();
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutFailed, setSignOutFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const checkOnboardingStatus = async () => {
      try {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("birth_name, gravity_orientation_completed, entry_state")
          .eq("id", userId)
          .abortSignal(controller.signal)
          .single();

        if (controller.signal.aborted) return;
        if (profileError) throw profileError;

        // Required pre-Atlas onboarding steps:
        // 1. Gravity Orientation
        // 2. Profile / phase onboarding (birth_name + entry_state)
        // 3. Atlas owns the first-run experience:
        //    Conversation -> saved Dots -> Cris Map -> relevant life moment.
        if (!profile?.gravity_orientation_completed) {
          navigate("/gravity/orientation", { replace: true });
        } else if (!profile?.birth_name) {
          navigate("/onboarding", { replace: true });
        } else if (!profile?.entry_state) {
          // User has profile but never picked their phase — finish step 2
          navigate("/onboarding/step2", { replace: true });
        } else {
          navigate("/atlas", { replace: true });
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("Error checking onboarding status:", error);
        // A failed read is not evidence of a new account.
        setFailed(true);
      }
    };

    checkOnboardingStatus();
    return () => controller.abort();
  }, [attempt, navigate, userId]);

  const signOut = async () => {
    setSigningOut(true);
    setSignOutFailed(false);
    try {
      const { error } = await supabase.auth.signOut({ scope: "local" });
      if (error) throw error;
    } catch {
      setSignOutFailed(true);
    } finally {
      setSigningOut(false);
    }
  };

  if (failed) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <p>We could not load your progress. Your journey has not been reset.</p>
      <button disabled={signingOut} onClick={() => { setFailed(false); setAttempt((value) => value + 1); }}>Try again</button>
      <button disabled={signingOut} onClick={() => void signOut()}>{signingOut ? "Signing out..." : "Sign out"}</button>
      {signOutFailed && <p role="alert">Could not sign out. Check your connection and try again.</p>}
    </div>
  );

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
