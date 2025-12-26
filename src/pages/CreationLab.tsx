import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Lightbulb, Target, Rocket, Check } from "lucide-react";
import { motion } from "framer-motion";
import { useCreationLabData } from "@/hooks/useCreationLabData";
import { ModeSelector, type CreationLabMode } from "@/components/creation-lab/ModeSelector";
import { FocusMode } from "@/components/creation-lab/FocusMode";
import { LivingConstellation } from "@/components/creation-lab/LivingConstellation";
import { PurposeToValueMap } from "@/components/creation-lab/PurposeToValueMap";
import { PurposeOnboardingModal } from "@/components/PurposeOnboardingModal";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const modeConfig: Record<CreationLabMode, { title: string; description: string; color: string }> = {
  focus: {
    title: "Creation Lab • Focus",
    description: "Execute your current project with daily micro-steps",
    color: "from-primary/20 to-primary/5",
  },
  constellation: {
    title: "Creation Lab • Living Constellation",
    description: "Visualize patterns and connections in your journey",
    color: "from-accent/20 to-accent/5",
  },
  purpose: {
    title: "Creation Lab • Purpose to Value",
    description: "Translate your purpose into sustainable creation",
    color: "from-violet-500/20 to-violet-500/5",
  },
};

const timeframeOptions = [
  { days: 7, label: "7 days", description: "Quick sprint" },
  { days: 14, label: "14 days", description: "Focused push" },
  { days: 21, label: "21 days", description: "Build a habit" },
  { days: 30, label: "30 days", description: "Deep work" },
];

interface ProjectSetupState {
  projectName: string;
  projectDescription: string;
}

const CreationLab = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showPurposeModal, setShowPurposeModal] = useState(false);
  
  // PDR v2.1: Accept project info from navigation state (from Commitment Card)
  const navState = location.state as ProjectSetupState | null;
  const [showProjectSetup, setShowProjectSetup] = useState(!!navState?.projectName);
  const [projectName, setProjectName] = useState(navState?.projectName || "");
  const [projectDescription, setProjectDescription] = useState(navState?.projectDescription || "");
  const [selectedTimeframe, setSelectedTimeframe] = useState<number | null>(null);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  
  // Get mode from URL or default to 'focus'
  const modeParam = searchParams.get("mode") as CreationLabMode | null;
  const [currentMode, setCurrentMode] = useState<CreationLabMode>(
    modeParam && ["focus", "constellation", "purpose"].includes(modeParam) 
      ? modeParam 
      : "focus"
  );

  // Shared data layer
  const {
    // Focus Mode data
    activeProject,
    setActiveProject,
    phases,
    steps,
    completeStep,
    skipStep,
    editStep,
    rescheduleStep,
    getTodaysStep,
    getCurrentPhase,
    getMissedSteps,
    skipMissedSteps,
    
    // Constellation data
    insightDots,
    dotConnections,
    
    // Purpose
    userPurpose,
    
    // State
    loading,
    refreshData,
  } = useCreationLabData();

  const todaysStep = getTodaysStep();
  const currentPhase = getCurrentPhase();
  const config = modeConfig[currentMode];

  // Update URL when mode changes
  const handleModeChange = (mode: CreationLabMode) => {
    setCurrentMode(mode);
    setSearchParams({ mode });
  };

  // Sync mode from URL on mount
  useEffect(() => {
    if (modeParam && ["focus", "constellation", "purpose"].includes(modeParam)) {
      setCurrentMode(modeParam as CreationLabMode);
    }
  }, [modeParam]);

  // Clear navigation state after reading it
  useEffect(() => {
    if (navState?.projectName) {
      // Clear state to prevent re-showing on refresh
      window.history.replaceState({}, document.title);
    }
  }, [navState]);

  const handleCompleteStep = async (stepId: string, insight?: string) => {
    await completeStep(stepId, insight);
  };

  // PDR v2.1: Create project with selected timeframe
  const handleCreateProject = async () => {
    if (!projectName.trim() || !selectedTimeframe) {
      toast.error("Please enter a project name and select a timeframe");
      return;
    }

    setIsCreatingProject(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Call integrator-setup to generate phases and steps
      const { data, error } = await supabase.functions.invoke("integrator-setup", {
        body: {
          projectTitle: projectName.trim(),
          projectDescription: projectDescription.trim(),
          timeframeDays: selectedTimeframe,
        },
      });

      if (error) throw error;

      // Wait for data refresh to complete BEFORE hiding setup
      // This ensures activeProject is populated when Focus Mode renders
      await refreshData();
      
      toast.success("Project created! Let's build this.");
      setShowProjectSetup(false);
    } catch (error: any) {
      console.error("Error creating project:", error);
      toast.error("Failed to create project");
    } finally {
      setIsCreatingProject(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // PDR v2.1: Show project setup if coming from Commitment Card
  if (showProjectSetup) {
    return (
      <motion.div 
        className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4 sm:p-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowProjectSetup(false);
                navigate("/dashboard");
              }}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </div>

          {/* Project Setup Card */}
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-card to-card/80">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Rocket className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Let's build this.</CardTitle>
              <CardDescription className="text-base">
                Confirm your project and choose your timeframe
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
              {/* Project Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Project Name</label>
                <Input
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="What are you building?"
                  className="text-lg"
                />
              </div>

              {/* Project Description */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Intention Statement</label>
                <Textarea
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="What's the intention behind this project?"
                  rows={3}
                />
              </div>

              {/* Timeframe Selector */}
              <div className="space-y-3">
                <label className="text-sm font-medium">Choose your timeframe</label>
                <div className="grid grid-cols-2 gap-3">
                  {timeframeOptions.map((option) => (
                    <Button
                      key={option.days}
                      variant={selectedTimeframe === option.days ? "default" : "outline"}
                      className="h-auto py-4 flex flex-col gap-1"
                      onClick={() => setSelectedTimeframe(option.days)}
                    >
                      <span className="text-lg font-bold">{option.label}</span>
                      <span className="text-xs opacity-80">{option.description}</span>
                      {selectedTimeframe === option.days && (
                        <Check className="w-4 h-4 absolute top-2 right-2" />
                      )}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Create Button */}
              <Button
                className="w-full h-12 text-lg"
                onClick={handleCreateProject}
                disabled={!projectName.trim() || !selectedTimeframe || isCreatingProject}
              >
                {isCreatingProject ? "Creating..." : "Start Building"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className={`min-h-screen bg-gradient-to-br ${config.color} from-background via-background p-4 sm:p-8`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <PurposeOnboardingModal 
        open={showPurposeModal}
        onClose={() => {
          setShowPurposeModal(false);
          refreshData();
        }}
        existingPurpose={userPurpose}
      />

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/dashboard")}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPurposeModal(true)}
            className="gap-2"
          >
            <Target className="w-4 h-4" />
            {userPurpose ? "Edit Purpose" : "Set Purpose"}
          </Button>
        </div>

        {/* Hero Section */}
        <Card className="border-2 border-border/50 bg-gradient-to-br from-card/80 to-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-3xl bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text flex items-center gap-3">
              <Lightbulb className="w-8 h-8 text-accent" />
              {config.title}
            </CardTitle>
            <CardDescription className="text-base">
              {config.description}
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Mode Selector */}
        <ModeSelector
          currentMode={currentMode}
          onModeChange={handleModeChange}
          hasActiveProject={!!activeProject}
          dotCount={insightDots.length}
        />

        {/* Mode Content */}
        <motion.div
          key={currentMode}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {currentMode === "focus" && (
            <FocusMode
              activeProject={activeProject}
              phases={phases}
              steps={steps}
              todaysStep={todaysStep}
              currentPhase={currentPhase}
              missedSteps={getMissedSteps()}
              onCompleteStep={handleCompleteStep}
              onSkipStep={skipStep}
              onEditStep={editStep}
              onRescheduleStep={rescheduleStep}
              onSkipMissedSteps={skipMissedSteps}
              onProjectUpdate={(updates) => setActiveProject(prev => prev ? { ...prev, ...updates } : null)}
            />
          )}

          {currentMode === "constellation" && (
            <LivingConstellation
              dots={insightDots}
              connections={dotConnections}
              userPurpose={userPurpose}
              onDataChange={refreshData}
              onEditPurpose={() => setShowPurposeModal(true)}
            />
          )}

          {currentMode === "purpose" && (
            <PurposeToValueMap userPurpose={userPurpose} />
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default CreationLab;