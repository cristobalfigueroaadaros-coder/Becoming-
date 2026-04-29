import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Mentor assignment now happens silently in OnboardingStep2.
// This route is kept as a fallback redirect.
const OnboardingStep4 = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/onboarding/quest", { replace: true });
  }, [navigate]);

  return null;
};

export default OnboardingStep4;
