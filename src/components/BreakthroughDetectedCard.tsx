import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Target, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface Breakthrough {
  id: string;
  breakthrough_title: string;
  breakthrough_description: string;
  actionable_next_step?: string;
  mentor_type: string;
}

interface BreakthroughDetectedCardProps {
  breakthrough: Breakthrough;
  onDismiss: () => void;
  onConvertToGoal: () => void;
}

export const BreakthroughDetectedCard = ({
  breakthrough,
  onDismiss,
  onConvertToGoal,
}: BreakthroughDetectedCardProps) => {
  const navigate = useNavigate();
  const [converting, setConverting] = useState(false);

  const handleMakeGoal = async () => {
    setConverting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Create a yearly goal from the breakthrough
      const currentYear = new Date().getFullYear();
      const { data: goalData, error: goalError } = await supabase
        .from("yearly_goals")
        .insert({
          user_id: user.id,
          goal_text: breakthrough.breakthrough_title,
          year: currentYear,
        })
        .select()
        .single();

      if (goalError) throw goalError;

      // Mark breakthrough as converted
      await supabase
        .from("conversation_breakthroughs")
        .update({ 
          converted_to_goal: true,
          goal_id: goalData.id
        })
        .eq("id", breakthrough.id);

      // Create a council notification about the new goal
      await supabase
        .from("council_notifications")
        .insert({
          user_id: user.id,
          notification_type: "goal_created",
          title: "New Goal Created!",
          message: `You've turned "${breakthrough.breakthrough_title}" into a goal. The council is ready to help you break it down into actionable steps.`,
          breakthrough_id: breakthrough.id,
          context_data: {
            goal_id: goalData.id,
            description: breakthrough.breakthrough_description,
            next_step: breakthrough.actionable_next_step
          }
        });

      toast.success("Breakthrough converted to goal!");
      onConvertToGoal();
      
      // Navigate to goal structure page
      navigate("/goal-structure");
    } catch (error: any) {
      console.error("Error converting breakthrough to goal:", error);
      toast.error("Failed to create goal");
    } finally {
      setConverting(false);
    }
  };

  const handleDismiss = async () => {
    try {
      await supabase
        .from("conversation_breakthroughs")
        .update({ dismissed: true })
        .eq("id", breakthrough.id);
      onDismiss();
    } catch (error) {
      console.error("Error dismissing breakthrough:", error);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="border-2 border-primary/40 bg-gradient-to-br from-primary/10 via-accent/5 to-transparent shadow-lg shadow-primary/10">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                      ✨ Breakthrough Detected
                    </span>
                  </div>
                  <h3 className="font-bold text-foreground">
                    {breakthrough.breakthrough_title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {breakthrough.breakthrough_description}
                  </p>
                  {breakthrough.actionable_next_step && (
                    <div className="mt-2 p-2 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium">Next step: </span>
                        {breakthrough.actionable_next_step}
                      </p>
                    </div>
                  )}
                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      size="sm"
                      onClick={handleMakeGoal}
                      disabled={converting}
                      className="gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90"
                    >
                      {converting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Target className="w-4 h-4" />
                      )}
                      Make this my goal
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleDismiss}
                      className="text-muted-foreground"
                    >
                      Keep exploring
                    </Button>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={handleDismiss}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};
