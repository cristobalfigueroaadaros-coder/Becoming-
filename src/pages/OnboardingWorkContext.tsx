import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Briefcase, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const OnboardingWorkContext = () => {
  const navigate = useNavigate();
  const [workContext, setWorkContext] = useState("");
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (!workContext.trim()) {
      toast.error("Please share a bit about your work or experience");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("profiles")
        .update({ work_context: workContext.trim() })
        .eq("id", user.id);

      if (error) throw error;

      navigate("/gravity/council-introduction");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    navigate("/gravity/council-introduction");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4 py-12 flex items-center justify-center">
      <motion.div 
        className="max-w-xl w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="border-border/50 shadow-xl">
          <CardHeader className="text-center space-y-4 pb-2">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto">
              <Briefcase className="w-8 h-8 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-2xl">One more thing...</CardTitle>
              <CardDescription className="text-base mt-2">
                This helps us understand your professional background
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">
                What kind of work have you done? Do you have any degrees, certifications, or specialized training?
              </label>
              <Textarea
                value={workContext}
                onChange={(e) => setWorkContext(e.target.value)}
                placeholder="e.g., I've worked in marketing for 5 years. I have a degree in engineering. I've built and launched SaaS products. I've taken courses in UX design or coaching."
                className="min-h-[120px] resize-none"
              />
              <p className="text-xs text-muted-foreground">
                This isn't about your current project. It's about your experience and skills.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <Button
                size="lg"
                onClick={handleContinue}
                disabled={loading || !workContext.trim()}
                className="w-full gap-2"
              >
                {loading ? "Saving..." : "Continue"}
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkip}
                className="w-full text-muted-foreground"
              >
                Skip for now
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default OnboardingWorkContext;
