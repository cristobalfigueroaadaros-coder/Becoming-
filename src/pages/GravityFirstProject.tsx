import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "sonner";

const GravityFirstProject = () => {
  const navigate = useNavigate();
  const [projectIdea, setProjectIdea] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleStartBuilding = async () => {
    if (!projectIdea.trim()) {
      toast.error("Please describe your idea or project");
      return;
    }

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to continue");
        navigate('/');
        return;
      }

      // Call integrator-setup to create the first project
      const { data, error } = await supabase.functions.invoke('integrator-setup', {
        body: {
          projectTitle: "My First Project",
          projectDescription: projectIdea,
          timeframeDays: 14,
          whyThisMatters: "This is my first step toward becoming who I want to be."
        }
      });

      if (error) {
        console.error('Error creating project:', error);
        toast.error("Failed to create project. Please try again.");
        setIsLoading(false);
        return;
      }

      // Update profile with first project info
      await supabase
        .from('profiles')
        .update({ 
          first_project_created_at: new Date().toISOString(),
          first_project_id: data?.projectId || null,
          council_unlocked: true,
          council_unlocked_at: new Date().toISOString()
        })
        .eq('id', user.id);

      toast.success("Your journey begins now!");
      navigate('/dashboard');
    } catch (error) {
      console.error('Error in first project creation:', error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="w-full max-w-2xl space-y-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-6 text-center"
        >
          <p className="text-lg text-muted-foreground">We hear you.</p>
          
          <div className="space-y-4">
            <p className="text-xl text-foreground/90 leading-relaxed">
              Becoming is here to support your growth, but growth happens through movement.
            </p>
            <p className="text-xl text-foreground leading-relaxed font-medium">
              We believe the fastest way to understand yourself is to work toward something real.
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="space-y-6"
        >
          <div className="text-center space-y-2">
            <p className="text-lg text-foreground">Tell us:</p>
            <p className="text-xl text-foreground font-medium">
              Is there an idea, a project, an experiment, or something unfinished that you'd like to bring to life?
            </p>
          </div>

          <Textarea
            value={projectIdea}
            onChange={(e) => setProjectIdea(e.target.value)}
            placeholder="Describe your idea, project, or something you want to explore..."
            className="min-h-[150px] text-lg p-4 resize-none"
          />

          <p className="text-sm text-muted-foreground text-center">
            There are no expectations. Only movement.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="space-y-4"
        >
          <Button 
            size="lg" 
            onClick={handleStartBuilding}
            disabled={isLoading || !projectIdea.trim()}
            className="w-full text-lg py-6"
          >
            {isLoading ? "Creating your project..." : "Start building"}
          </Button>
          
          <p className="text-sm text-muted-foreground text-center italic">
            If nothing comes to mind yet, you can start small. A habit, a question, or something you're curious to explore is enough.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default GravityFirstProject;
