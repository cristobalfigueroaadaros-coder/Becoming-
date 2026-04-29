import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";

const GravityTransition = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({ gravity_transition_completed: true })
          .eq('id', user.id);
      }
      navigate('/gravity/council-intro');
    } catch (error) {
      console.error('Error updating transition status:', error);
      navigate('/gravity/council-welcome');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-accent/5">
      <div className="text-center space-y-12 p-8 max-w-2xl">
        <div className="space-y-6">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="text-2xl md:text-3xl text-foreground/90 font-light leading-relaxed"
          >
            Becoming is a place to think, reflect, and explore.
          </motion.p>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 1, ease: "easeOut" }}
            className="text-2xl md:text-3xl text-foreground font-medium leading-relaxed"
          >
            But more importantly, it is a place to move something forward.
          </motion.p>
        </div>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 0.8 }}
        >
          <Button 
            size="lg" 
            onClick={handleContinue}
            disabled={isLoading}
            className="text-lg px-10 py-6"
          >
            {isLoading ? "..." : "Continue"}
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default GravityTransition;
