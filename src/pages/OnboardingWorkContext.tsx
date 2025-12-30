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

      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    navigate("/dashboard");
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
                This helps your mentors understand your world
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">
                What are you currently working on, or what kind of work have you done that feels most relevant now?
              </label>
              <Textarea
                value={workContext}
                onChange={(e) => setWorkContext(e.target.value)}
                placeholder="e.g., I'm a freelance designer exploring how to build a personal brand, or I've worked in tech for 10 years and I'm considering a career pivot..."
                className="min-h-[120px] resize-none"
              />
              <p className="text-xs text-muted-foreground">
                1–2 lines is enough. No need to explain everything.
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
