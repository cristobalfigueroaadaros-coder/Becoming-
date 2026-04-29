import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Users } from "lucide-react";

const GravityCouncilWelcome = () => {
  const navigate = useNavigate();

  const handleEnter = () => {
    navigate('/gravity/onboarding-complete');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-accent/5">
      <div className="text-center space-y-12 p-8 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mx-auto w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center shadow-lg"
        >
          <Users className="w-10 h-10 text-primary-foreground" />
        </motion.div>

        <div className="space-y-6">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-3xl md:text-4xl font-semibold text-foreground"
          >
            The Council welcomes you.
          </motion.h1>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="space-y-4"
          >
            <p className="text-xl text-muted-foreground leading-relaxed">
              You've told us where you've been.
            </p>
            <p className="text-xl text-foreground/90 leading-relaxed">
              Now, we'll guide you toward what you're building.
            </p>
          </motion.div>
        </div>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
        >
          <Button 
            size="lg" 
            onClick={handleEnter}
            className="text-lg px-12 py-6"
          >
            Enter
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default GravityCouncilWelcome;
