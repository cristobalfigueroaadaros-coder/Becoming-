import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Target, Sparkles } from "lucide-react";
import FutureSelfBackground from "@/components/FutureSelfBackground";
import { GoalHierarchy } from "@/components/GoalHierarchy";

const GoalStructurePage = () => {
  const navigate = useNavigate();

  return (
    <motion.div 
      className="min-h-screen relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <FutureSelfBackground />
      
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card/50 backdrop-blur-lg border-b border-border/30">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate("/future-self")}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Target className="w-4 h-4" />
            <span>Goal Hierarchy</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <motion.div 
        className="max-w-4xl mx-auto px-4 py-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        {/* Hero Section */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4"
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">Transform Your Future</span>
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-3">
            Your Goals & Milestones
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Break down your vision into actionable daily tasks, weekly milestones, and monthly objectives.
          </p>
        </div>

        {/* Goal Hierarchy Component */}
        <GoalHierarchy />
      </motion.div>
    </motion.div>
  );
};

export default GoalStructurePage;
