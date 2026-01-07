import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";

const GravityOrientation = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({ gravity_orientation_completed: true })
          .eq('id', user.id);
      }
      navigate('/onboarding');
    } catch (error) {
      console.error('Error updating orientation status:', error);
      navigate('/onboarding');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
      <div className="text-center space-y-12 p-8 max-w-2xl">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="text-2xl md:text-3xl lg:text-4xl text-foreground/90 font-light leading-relaxed"
        >
          Clarity, growth, and success emerge through action.
        </motion.p>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
        >
          <Button 
            size="lg" 
            onClick={handleContinue}
            disabled={isLoading}
            className="text-lg px-10 py-6"
          >
            {isLoading ? "..." : "Let the journey begin"}
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default GravityOrientation;
