import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface NarrativeSystemCardProps {
  projectTitle?: string;
  projectId?: string;
}

const NarrativeSystemCard = ({ projectTitle, projectId }: NarrativeSystemCardProps) => {
  const [narrative, setNarrative] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateNarrative();
  }, [projectTitle, projectId]);

  const generateNarrative = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Fetch user's values from value_map_blocks
      const { data: valueBlocks } = await supabase
        .from("value_map_blocks")
        .select("block_key, content")
        .eq("user_id", user.id)
        .eq("is_unlocked", true)
        .in("block_key", ["core_values", "gifts", "passions"]);

      // Fetch recent completed steps from active project
      const { data: recentSteps } = await supabase
        .from("integrator_daily_steps")
        .select("step_title, insight_text")
        .eq("user_id", user.id)
        .eq("status", "completed")
        .order("completed_at", { ascending: false })
        .limit(3);

      // Fetch active project info
      const { data: activeProject } = await supabase
        .from("integrator_projects")
        .select("project_title, why_this_matters")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      // If we have enough context, generate narrative
      if (valueBlocks && valueBlocks.length > 0 && activeProject) {
        const values = valueBlocks
          .map(b => b.content)
          .filter(Boolean)
          .join(", ");
        
        const recentActions = recentSteps
          ?.map(s => s.step_title)
          .filter(Boolean)
          .slice(0, 2)
          .join(" and ") || "taking steps";

        // Call the narrative bridge function
        const { data, error } = await supabase.functions.invoke("generate-narrative-bridge", {
          body: {
            values,
            currentAction: recentActions,
            projectTitle: activeProject.project_title,
            whyItMatters: activeProject.why_this_matters,
          },
        });

        if (!error && data?.narrative) {
          setNarrative(data.narrative);
        } else {
          // Fallback narrative if API fails
          const valuesText = valueBlocks.find(b => b.block_key === "core_values")?.content || "";
          if (valuesText && activeProject) {
            setNarrative(
              `Your values are showing up here. As you work on "${activeProject.project_title}", you're practicing what matters most to you.`
            );
          }
        }
      } else if (activeProject) {
        // Simple fallback when we have a project but no values yet
        setNarrative(
          `You're actively building "${activeProject.project_title}". Each step is shaping who you're becoming.`
        );
      }
    } catch (error) {
      console.error("Error generating narrative:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5">
        <CardContent className="py-4">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Connecting the dots...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!narrative) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-primary/30 bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10 overflow-hidden">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <p className="text-sm leading-relaxed text-foreground/90 italic">
              {narrative}
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default NarrativeSystemCard;
